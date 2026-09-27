/*
 * Contas de clientes e acesso ao painel.
 * Com o Firebase ligado (js/firebase-config.js), o login é feito no servidor (MP.cloud) e o painel
 * só abre para contas listadas em admins/{uid}. Sem Firebase, funciona em modo demonstração:
 * contas no navegador de quem usa o site e senha do painel apenas visual.
 * login/register/changePassword devolvem Promise nos dois modos.
 */
(function (MP) {
  const U = MP.util;
  const cloud = () => MP.cloud.enabled;

  const local = {
    login(email, password) {
      const user = MP.data.users.find((u) => U.norm(u.email) === U.norm(email));
      if (!user || user.passwordHash !== U.hashPassword(user.email, password)) {
        return { ok: false, error: 'E-mail ou senha incorretos.' };
      }
      MP.db.set('session', user.id);
      MP.bus.emit('auth');
      return { ok: true, user };
    },
    register(d) {
      if (MP.data.users.find((u) => U.norm(u.email) === U.norm(d.email))) {
        return { ok: false, error: 'Já existe uma conta com este e-mail.' };
      }
      const user = {
        id: U.uid('u'),
        name: d.name.trim(),
        type: d.type,
        company: d.company || '',
        doc: U.digits(d.doc),
        phone: d.phone,
        email: d.email.trim(),
        passwordHash: U.hashPassword(d.email, d.password),
        createdAt: new Date().toISOString(),
        addresses: d.address && d.address.street ? [Object.assign({ id: U.uid('a'), label: 'Principal', main: true }, d.address)] : []
      };
      MP.data.users.save(user);
      MP.db.set('session', user.id);
      MP.bus.emit('auth');
      return { ok: true, user };
    },
    changePassword(oldPw, newPw) {
      const u = MP.auth.current();
      if (!u || u.passwordHash !== U.hashPassword(u.email, oldPw)) return { ok: false, error: 'Senha atual incorreta.' };
      MP.data.users.save(Object.assign({}, u, { passwordHash: U.hashPassword(u.email, newPw) }));
      return { ok: true };
    }
  };

  /* ao entrar na conta, junta favoritos/desejos salvos como visitante */
  const merge = (r) => {
    if (r.ok && r.user) {
      MP.favorites.mergeGuest(r.user.id);
      MP.wishlist.mergeGuest(r.user.id);
      MP.bus.emit('lists');
    }
    return r;
  };

  MP.auth = {
    current() {
      if (cloud()) return MP.cloud.profile();
      const id = MP.db.get('session');
      return id ? MP.data.users.get(id) : null;
    },
    login(email, password) {
      return (cloud() ? MP.cloud.login(email, password) : Promise.resolve(local.login(email, password))).then(merge);
    },
    register(d) {
      return (cloud() ? MP.cloud.register(d) : Promise.resolve(local.register(d))).then(merge);
    },
    logout() {
      if (cloud()) return MP.cloud.logout();
      MP.db.remove('session');
      MP.bus.emit('auth');
    },
    update(patch) {
      const u = this.current();
      if (!u) return null;
      const next = Object.assign({}, u, patch);
      MP.data.users.save(next);
      MP.bus.emit('auth');
      return next;
    },
    changePassword(oldPw, newPw) {
      return cloud() ? MP.cloud.changePassword(oldPw, newPw) : Promise.resolve(local.changePassword(oldPw, newPw));
    },
    /* Recuperação de senha por e-mail (só com a nuvem ligada). */
    resetPassword(email) {
      return MP.cloud.resetPassword(email);
    },
    /* Redireciona para o login quando a página exige conta. Retorna o usuário ou null. */
    require() {
      const u = this.current();
      if (!u) MP.router.go('/entrar?next=' + encodeURIComponent(MP.router.current.fullPath));
      return u;
    },
    firstName(u) {
      return String((u && (u.name || u.company)) || '').trim().split(/\s+/)[0] || 'Cliente';
    }
  };

  /* ---------- painel administrativo ---------- */
  MP.admin = MP.admin || {};
  MP.admin.isLogged = () => (cloud() ? MP.cloud.isAdmin() : sessionStorage.getItem('mp:adminSession') === '1');
  /* Nuvem: (email, senha) -> Promise<{ok, error}>. Demonstração: (senha) -> boolean. */
  MP.admin.login = (a, b) => {
    if (cloud()) {
      return MP.cloud.login(a, b).then((r) => {
        if (r.ok && !MP.cloud.isAdmin()) {
          MP.cloud.logout();
          return { ok: false, error: 'Esta conta não tem acesso ao painel administrativo.' };
        }
        return r;
      });
    }
    if (U.sha256(`${a}:mp-admin`) === MP.settings.get().adminPasswordHash) {
      sessionStorage.setItem('mp:adminSession', '1');
      return true;
    }
    return false;
  };
  MP.admin.logout = () => {
    if (cloud()) return MP.cloud.logout();
    sessionStorage.removeItem('mp:adminSession');
  };
})(window.MP);
