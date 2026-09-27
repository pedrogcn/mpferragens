/*
 * Camada de nuvem (Firebase Auth + Firestore). Só é ativada quando js/firebase-config.js define MP_FIREBASE.
 * Estratégia: cada coleção é espelhada em memória por listeners em tempo real; leituras continuam síncronas
 * (MP.data.*.all()) e as gravações vão para o Firestore sem mudar o restante do código.
 *
 *  - catálogo (produtos, categorias, banners, promoções, cupons, loja): leitura pública, escrita só do admin
 *  - users:  cada cliente lê/grava o próprio cadastro; o admin lê todos
 *  - orders: qualquer visitante cria; o cliente lê os seus; o admin lê e altera todos (status)
 *  - admin = usuário que possui o documento admins/{uid} (criado à mão no console do Firebase)
 */
(function (MP) {
  const U = MP.util;
  const cfg = window.MP_FIREBASE;
  const enabled = !!(cfg && cfg.apiKey && cfg.projectId);

  /*
   * SDK do Firebase hospedado no próprio site (js/vendor/firebase/), em vez de baixar do gstatic.com.
   * Isso evita que o celular precise abrir uma conexão nova com outro endereço só para 3 arquivos:
   * a conexão com o próprio site já está aberta, então eles chegam mais rápido. Versão: 10.14.1.
   * Para atualizar a versão um dia, baixe os 3 arquivos de https://www.gstatic.com/firebasejs/<versão>/
   * e substitua os arquivos em js/vendor/firebase/.
   */
  const SDK = 'js/vendor/firebase/';
  const PUBLIC = ['products', 'categories', 'banners', 'promotions', 'coupons'];
  const OWNED = PUBLIC.concat(['users', 'orders']);
  const MAX_DOC = 900 * 1024; // limite do Firestore é 1 MiB por documento

  const state = { user: null, isAdmin: false, activeUid: undefined, activePromise: null, newProfile: null, userSubs: [], booted: false, seenOrders: null };
  let fb, auth, db;

  const cloud = (MP.cloud = {
    enabled,
    mem: { users: [], orders: [] }, // espelho em memória (nunca vai para o localStorage)
    settings: {},
    owns: (name) => enabled && OWNED.includes(name),
    isAdmin: () => state.isAdmin,
    uid: () => (state.user ? state.user.uid : null)
  });
  PUBLIC.forEach((n) => (cloud.mem[n] = []));

  const clean = (o) => JSON.parse(JSON.stringify(o)); // Firestore rejeita undefined
  const toast = (msg, kind) => MP.ui && MP.ui.toast(msg, kind || 'error');
  const fail = (what) => (e) => {
    console.error('[nuvem]', what, e);
    toast(e && e.code === 'permission-denied' ? 'Sem permissão para essa ação. Verifique se você está logado como administrador.' : 'Não foi possível salvar no servidor. Verifique a conexão e tente de novo.');
  };

  const loadScript = (src) =>
    new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = () => rej(new Error('Não foi possível carregar ' + src));
      document.head.appendChild(s);
    });

  const docs = (snap) => snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));

  /* Retorna uma Promise que resolve no 1º retorno (dados ou erro) e mantém o listener ativo. */
  const listen = (query, onData, subs) =>
    new Promise((resolve, reject) => {
      let first = true;
      const unsub = query.onSnapshot(
        (snap) => {
          onData(snap);
          if (first) {
            first = false;
            resolve();
          }
        },
        (err) => {
          console.error('[nuvem] listener', err);
          if (first) {
            first = false;
            reject(err);
          }
        }
      );
      if (subs) subs.push(unsub);
    });

  /* ---------- gravação ---------- */
  cloud.fits = (item) => JSON.stringify(item).length < MAX_DOC;
  cloud.push = (name, item) => db.collection(name).doc(item.id).set(clean(item)).catch(fail('gravar ' + name));
  cloud.drop = (name, id) => db.collection(name).doc(id).delete().catch(fail('apagar ' + name));
  cloud.pushSettings = (obj) => db.doc('config/settings').set(clean(obj)).catch(fail('gravar configurações'));

  cloud.newOrderNumber = () => {
    // sem contador central (não dá para abrir o WhatsApp de forma assíncrona): tempo em base 36 + 1 caractere aleatório
    const t = Math.floor((Date.now() - 1735689600000) / 1000).toString(36).toUpperCase();
    return t + Math.floor(Math.random() * 36).toString(36).toUpperCase();
  };

  /* publica o catálogo de demonstração (categorias, produtos, banners, cupons) no Firestore */
  cloud.seedCatalog = async () => {
    const sets = [['categories', MP.seed.categories], ['products', MP.seed.products], ['banners', MP.seed.banners], ['coupons', MP.seed.coupons]];
    let batch = db.batch();
    let n = 0;
    for (const [name, arr] of sets) {
      for (const item of arr) {
        batch.set(db.collection(name).doc(item.id), clean(item));
        if (++n % 400 === 0) {
          await batch.commit();
          batch = db.batch();
        }
      }
    }
    await batch.commit();
  };

  /* ---------- sessão do usuário ---------- */
  const detachUser = () => {
    state.userSubs.forEach((u) => u());
    state.userSubs = [];
  };

  const ensureProfile = async (user) => {
    const ref = db.doc('users/' + user.uid);
    const snap = await ref.get();
    if (snap.exists) return;
    const base = state.newProfile && U.norm(state.newProfile.email) === U.norm(user.email) ? state.newProfile : {};
    const profile = Object.assign(
      { name: (user.email || '').split('@')[0], type: 'pf', company: '', doc: '', phone: '', addresses: [] },
      base,
      { id: user.uid, email: user.email, createdAt: new Date().toISOString() }
    );
    await ref.set(clean(profile));
    cloud.mem.users = [profile];
  };

  const activate = (user) => {
    const uid = user ? user.uid : null;
    if (state.activeUid === uid) return state.activePromise;
    state.activeUid = uid;
    const run = (async () => {
      detachUser();
      state.seenOrders = null;
      state.user = user;
      state.isAdmin = false;
      cloud.mem.users = [];
      cloud.mem.orders = [];
      if (user) {
        try {
          const a = await db.doc('admins/' + uid).get();
          state.isAdmin = a.exists;
        } catch (e) {
          console.error('[nuvem] admins', e);
        }
        await ensureProfile(user);
        const subs = state.userSubs;
        const set = (name) => (snap) => {
          const list = docs(snap);
          if (name === 'orders' && state.isAdmin) {
            // a 1ª carga só memoriza; depois, todo pedido inédito dispara o aviso
            const seen = state.seenOrders;
            state.seenOrders = new Set(list.map((o) => o.id));
            if (seen) list.filter((o) => !seen.has(o.id)).forEach((o) => MP.bus.emit('order:new', o));
          }
          cloud.mem[name] = list;
          MP.bus.emit('data:' + name, null);
          MP.bus.emit('cloud:update', name);
        };
        const jobs = [];
        if (state.isAdmin) {
          jobs.push(listen(db.collection('users'), set('users'), subs));
          jobs.push(listen(db.collection('orders'), set('orders'), subs));
        } else {
          // não sobrescreve com "documento inexistente" enquanto o cadastro acabou de ser criado
          jobs.push(listen(db.doc('users/' + uid), (s) => s.exists && (cloud.mem.users = [Object.assign({ id: uid }, s.data())]), subs));
          jobs.push(listen(db.collection('orders').where('userId', '==', uid), set('orders'), subs));
        }
        await Promise.all(jobs);
      }
      MP.bus.emit('auth');
    })();
    state.activePromise = run;
    run.catch(() => {
      if (state.activeUid === uid && state.activePromise === run) state.activeUid = undefined; // permite nova tentativa
    });
    return run;
  };

  const friendly = (e) => {
    const map = {
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/wrong-password': 'E-mail ou senha incorretos.',
      'auth/user-not-found': 'E-mail ou senha incorretos.',
      'auth/invalid-email': 'E-mail inválido.',
      'auth/email-already-in-use': 'Já existe uma conta com este e-mail.',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
      'auth/network-request-failed': 'Sem conexão com o servidor. Verifique a internet.',
      'auth/requires-recent-login': 'Por segurança, saia e entre novamente antes de trocar a senha.',
      'auth/unauthorized-domain': 'Este endereço do site ainda não foi autorizado no Firebase (Authentication > Configurações > Domínios autorizados).',
      'unavailable': 'Sem conexão com o servidor. Verifique a internet e tente de novo.',
      'deadline-exceeded': 'O servidor demorou para responder. Tente de novo.',
      'permission-denied': 'O servidor recusou a operação. Avise o responsável pelo site (regras do banco).'
    };
    const code = e && e.code;
    return map[code] || 'Não foi possível concluir. Tente novamente.' + (code ? ' (código: ' + code + ')' : '');
  };

  cloud.login = async (email, password) => {
    try {
      const cred = await auth.signInWithEmailAndPassword(String(email).trim(), password);
      await activate(cred.user);
    } catch (e) {
      console.warn('[nuvem] login', (e && (e.code || e.name)) || '', (e && e.message) || e);
      return { ok: false, error: friendly(e) };
    }
    return { ok: true, user: MP.auth.current() };
  };

  cloud.register = async (d) => {
    const profile = {
      name: d.name.trim(), type: d.type, company: d.company || '', doc: U.digits(d.doc), phone: d.phone, email: d.email.trim(),
      addresses: d.address && d.address.street ? [Object.assign({ id: U.uid('a'), label: 'Principal', main: true }, d.address)] : []
    };
    state.newProfile = profile;
    try {
      const cred = await auth.createUserWithEmailAndPassword(profile.email, d.password);
      await activate(cred.user);
    } catch (e) {
      return { ok: false, error: friendly(e) };
    } finally {
      state.newProfile = null;
    }
    return { ok: true, user: MP.auth.current() };
  };

  cloud.logout = () => {
    activate(null); // limpa a sessão local na hora
    auth.signOut().catch(() => {});
  };

  cloud.resetPassword = async (email) => {
    try {
      await auth.sendPasswordResetEmail(String(email).trim());
      return { ok: true };
    } catch (e) {
      // e-mail inexistente não é revelado (evita descobrir quem tem conta)
      return e && e.code === 'auth/user-not-found' ? { ok: true } : { ok: false, error: friendly(e) };
    }
  };

  cloud.changePassword = async (oldPw, newPw) => {
    const user = auth.currentUser;
    if (!user) return { ok: false, error: 'Faça login novamente.' };
    try {
      await user.reauthenticateWithCredential(fb.auth.EmailAuthProvider.credential(user.email, oldPw));
    } catch (e) {
      return { ok: false, error: e && (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') ? 'Senha atual incorreta.' : friendly(e) };
    }
    try {
      await user.updatePassword(newPw);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: friendly(e) };
    }
  };

  cloud.profile = () => (state.user ? cloud.mem.users.find((u) => u.id === state.user.uid) || null : null);

  /* ---------- inicialização (chamada por app.js antes de desenhar o site) ---------- */
  cloud.boot = () => {
    const run = async () => {
      // baixa os 3 arquivos do Firebase em paralelo; a ordem de EXECUÇÃO continua sendo app → auth/firestore
      ['firebase-auth-compat.js', 'firebase-firestore-compat.js'].forEach((f) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = SDK + f;
        document.head.appendChild(link);
      });
      await loadScript(SDK + 'firebase-app-compat.js');
      await Promise.all([loadScript(SDK + 'firebase-auth-compat.js'), loadScript(SDK + 'firebase-firestore-compat.js')]);
      fb = window.firebase;
      fb.initializeApp(cfg);
      auth = fb.auth();
      db = fb.firestore();
      cloud.db = db;
      // cache no aparelho (IndexedDB): nas visitas seguintes o catálogo aparece na hora, sem baixar tudo de novo
      try {
        await db.enablePersistence({ synchronizeTabs: true });
      } catch (e) {
        console.warn('[nuvem] sem cache no aparelho:', (e && e.code) || e);
      }

      const jobs = PUBLIC.map((name) =>
        listen(db.collection(name), (snap) => {
          const list = docs(snap);
          const changed = state.booted && JSON.stringify(list) !== JSON.stringify(cloud.mem[name]);
          cloud.mem[name] = list;
          if (state.booted) MP.bus.emit('data:' + name, null);
          if (changed) MP.bus.emit('cloud:update', name); // ex.: o cache mostrou o catálogo antigo e o servidor trouxe preço novo
        })
      );
      jobs.push(
        listen(db.doc('config/settings'), (snap) => {
          const next = snap.exists ? snap.data() : {};
          const changed = state.booted && JSON.stringify(next) !== JSON.stringify(cloud.settings);
          cloud.settings = next;
          if (state.booted) MP.bus.emit('settings');
          if (changed) MP.bus.emit('cloud:update', 'settings');
        })
      );
      jobs.push(
        new Promise((resolve, reject) => {
          let first = true;
          auth.onAuthStateChanged((user) => {
            const p = activate(user);
            if (first) {
              first = false;
              p.then(resolve, reject);
            }
          });
        })
      );
      await Promise.all(jobs);
      state.booted = true;
    };
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Tempo esgotado ao conectar ao servidor.')), 15000));
    return Promise.race([run(), timeout]);
  };
})(window.MP);
