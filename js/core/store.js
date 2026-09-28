/*
 * Camada de dados. Hoje persiste no localStorage do navegador; toda a leitura/escrita passa por
 * MP.db e pelas coleções abaixo, então trocar por uma API/banco real significa reimplementar só este arquivo.
 */
(function (MP) {
  /* ---------- barramento de eventos ---------- */
  const handlers = {};
  MP.bus = {
    on(evt, fn) {
      (handlers[evt] = handlers[evt] || []).push(fn);
    },
    emit(evt, data) {
      (handlers[evt] || []).forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.error(e);
        }
      });
    }
  };

  /* ---------- armazenamento ---------- */
  const mem = {};
  let lsOk = true;
  try {
    localStorage.setItem('mp:__t', '1');
    localStorage.removeItem('mp:__t');
  } catch (e) {
    lsOk = false;
  }
  const cache = {};
  MP.db = {
    get(key, def) {
      if (key in cache) return cache[key] === undefined ? def : JSON.parse(cache[key]);
      let raw = null;
      try {
        raw = lsOk ? localStorage.getItem('mp:' + key) : mem[key] == null ? null : mem[key];
      } catch (e) {}
      cache[key] = raw == null ? undefined : raw;
      if (raw == null) return def;
      try {
        return JSON.parse(raw);
      } catch (e) {
        return def;
      }
    },
    set(key, val) {
      const raw = JSON.stringify(val);
      cache[key] = raw;
      try {
        if (lsOk) localStorage.setItem('mp:' + key, raw);
        else mem[key] = raw;
        return true;
      } catch (e) {
        if (MP.ui) MP.ui.toast('Armazenamento do navegador cheio. Use fotos menores ou remova itens.', 'error');
        return false;
      }
    },
    remove(key) {
      delete cache[key];
      try {
        if (lsOk) localStorage.removeItem('mp:' + key);
        else delete mem[key];
      } catch (e) {}
    },
    keys() {
      const out = [];
      if (!lsOk) return Object.keys(mem);
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('mp:')) out.push(k.slice(3));
      }
      return out;
    },
    clearCache() {
      Object.keys(cache).forEach((k) => delete cache[k]);
    }
  };
  window.addEventListener('storage', () => MP.db.clearCache());

  /* ---------- coleções ---------- */
  /* Com a nuvem ligada, as coleções compartilhadas vivem em MP.cloud.mem e são gravadas no Firestore. */
  const collection = (name) => {
    const cloudOn = () => MP.cloud.owns(name);
    return {
      name,
      all() {
        return cloudOn() ? MP.cloud.mem[name].slice() : MP.db.get(name, []);
      },
      get(id) {
        return this.all().find((x) => x.id === id) || null;
      },
      find(fn) {
        return this.all().find(fn) || null;
      },
      save(item) {
        if (cloudOn()) {
          if (!MP.cloud.fits(name, item)) {
            if (MP.ui) MP.ui.toast('Registro grande demais para salvar (limite de 1 MB por documento). Use fotos menores/menos fotos, ou reduza a quantidade de itens.', 'error');
            return null;
          }
          const a = MP.cloud.mem[name];
          const i = a.findIndex((x) => x.id === item.id);
          if (i >= 0) a[i] = item;
          else a.push(item);
          MP.cloud.push(name, item);
          MP.bus.emit('data:' + name, item);
          return item;
        }
        const a = this.all().slice();
        const i = a.findIndex((x) => x.id === item.id);
        if (i >= 0) a[i] = item;
        else a.push(item);
        const ok = MP.db.set(name, a);
        if (ok) MP.bus.emit('data:' + name, item);
        return ok ? item : null;
      },
      remove(id) {
        if (cloudOn()) {
          MP.cloud.mem[name] = MP.cloud.mem[name].filter((x) => x.id !== id);
          MP.cloud.drop(name, id);
        } else MP.db.set(name, this.all().filter((x) => x.id !== id));
        MP.bus.emit('data:' + name, null);
      },
      setAll(arr) {
        if (cloudOn()) return console.warn('setAll não é usado com a nuvem ligada');
        MP.db.set(name, arr);
        MP.bus.emit('data:' + name, null);
      }
    };
  };

  MP.data = {
    products: collection('products'),
    categories: collection('categories'),
    users: collection('users'),
    orders: collection('orders'),
    coupons: collection('coupons'),
    banners: collection('banners'),
    promotions: collection('promotions'),
    quotes: collection('quotes'),
    messages: collection('messages')
  };

  MP.settings = {
    get() {
      const d = MP.seed.settings;
      const s = MP.cloud.enabled ? MP.cloud.settings : MP.db.get('settings', {});
      return Object.assign({}, d, s, {
        address: Object.assign({}, d.address, s.address),
        social: Object.assign({}, d.social, s.social),
        shipping: Object.assign({}, d.shipping, s.shipping)
      });
    },
    set(patch) {
      if (MP.cloud.enabled) {
        delete patch.adminPasswordHash; // a senha do painel é a da conta no Firebase
        MP.cloud.settings = Object.assign({}, MP.cloud.settings, patch);
        MP.cloud.pushSettings(MP.cloud.settings);
      } else MP.db.set('settings', Object.assign({}, MP.db.get('settings', {}), patch));
      MP.bus.emit('settings');
    }
  };

  MP.store = {
    SEED_VERSION: 1,
    init() {
      if (MP.cloud.enabled) return; // os dados vêm do servidor
      if (MP.db.get('seeded') !== this.SEED_VERSION) {
        this.resetDemo();
      }
    },
    resetDemo() {
      MP.db.keys().forEach((k) => MP.db.remove(k));
      MP.db.clearCache();
      MP.data.categories.setAll(MP.seed.categories);
      MP.data.products.setAll(MP.seed.products);
      MP.data.users.setAll(MP.seed.users);
      MP.data.orders.setAll(MP.seed.orders);
      MP.data.coupons.setAll(MP.seed.coupons);
      MP.data.banners.setAll(MP.seed.banners);
      MP.db.set('orderSeq', MP.seed.orderSeq);
      MP.db.set('seeded', this.SEED_VERSION);
    },
    nextOrderNumber() {
      if (MP.cloud.enabled) return MP.cloud.newOrderNumber();
      const n = MP.db.get('orderSeq', 6000);
      MP.db.set('orderSeq', n + 1);
      return n;
    },
    exportAll() {
      const out = {};
      MP.db.keys().forEach((k) => {
        if (k !== 'session' && k !== 'adminSession') out[k] = MP.db.get(k);
      });
      return JSON.stringify({ app: 'mp-ferragens', exportedAt: new Date().toISOString(), data: out }, null, 2);
    },
    importAll(text) {
      const j = JSON.parse(text);
      if (!j || j.app !== 'mp-ferragens' || !j.data) throw new Error('Arquivo de backup inválido.');
      MP.db.keys().forEach((k) => MP.db.remove(k));
      MP.db.clearCache();
      Object.keys(j.data).forEach((k) => MP.db.set(k, j.data[k]));
    }
  };

  /* ---------- helpers de catálogo ---------- */
  MP.catalog = {
    categories() {
      return MP.data.categories.all().slice().sort((a, b) => (a.order || 99) - (b.order || 99));
    },
    category(slug) {
      return MP.data.categories.find((c) => c.slug === slug || c.id === slug);
    },
    products(includeInactive) {
      const a = MP.data.products.all();
      return includeInactive ? a : a.filter((p) => p.active !== false);
    },
    bySlug(slug) {
      return MP.data.products.find((p) => p.slug === slug);
    },
    byId(id) {
      return MP.data.products.get(id);
    },
    discount(p) {
      return p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    },
    related(p, n = 4) {
      return this.products()
        .filter((x) => x.id !== p.id && x.category === p.category)
        .sort((a, b) => (b.type === p.type) - (a.type === p.type) || b.sold - a.sold)
        .slice(0, n);
    },
    /* busca sem acento, todos os termos precisam aparecer */
    search(q, list) {
      const terms = MP.util.norm(q).split(/\s+/).filter(Boolean);
      if (!terms.length) return list;
      const cats = {};
      MP.data.categories.all().forEach((c) => (cats[c.slug] = c.name));
      const scored = [];
      list.forEach((p) => {
        const name = MP.util.norm(p.name + ' ' + p.variant);
        const hay = name + ' ' + MP.util.norm([p.brand, p.type, cats[p.category], p.desc].join(' '));
        let score = 0;
        for (const t of terms) {
          if (!hay.includes(t)) return;
          score += name.includes(t) ? 3 : 1;
          if (name.startsWith(t)) score += 2;
        }
        scored.push([score, p]);
      });
      return scored.sort((a, b) => b[0] - a[0] || b[1].sold - a[1].sold).map((x) => x[1]);
    }
  };

  /* ---------- favoritos e lista de desejos (por usuário; visitante usa "guest") ---------- */
  const listApi = (base) => {
    const key = () => `${base}:${(MP.auth && MP.auth.current() && MP.auth.current().id) || 'guest'}`;
    return {
      all() {
        return MP.db.get(key(), []);
      },
      has(id) {
        return this.all().includes(id);
      },
      toggle(id) {
        const a = this.all();
        const i = a.indexOf(id);
        if (i >= 0) a.splice(i, 1);
        else a.unshift(id);
        MP.db.set(key(), a);
        MP.bus.emit('lists');
        return i < 0;
      },
      remove(id) {
        MP.db.set(key(), this.all().filter((x) => x !== id));
        MP.bus.emit('lists');
      },
      /* ao entrar na conta, junta o que foi salvo como visitante */
      mergeGuest(userId) {
        const g = MP.db.get(`${base}:guest`, []);
        if (!g.length) return;
        const uk = `${base}:${userId}`;
        const merged = Array.from(new Set([...g, ...MP.db.get(uk, [])]));
        MP.db.set(uk, merged);
        MP.db.remove(`${base}:guest`);
      }
    };
  };
  MP.favorites = listApi('favorites');
  MP.wishlist = listApi('wishlist');
})(window.MP);
