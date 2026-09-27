/* Inicialização: rotas, header/rodapé e eventos globais. */
(function (MP) {
  const U = MP.util;
  const R = MP.router;

  MP.app = {
    renderChrome() {
      U.$('#header-root').innerHTML = MP.components.header.render();
      U.$('#footer-root').innerHTML = MP.components.footer.render() + MP.components.whatsFloat();
      MP.components.header.update();
      MP.components.header.highlight();
      const link = U.$('link[rel=icon]');
      if (link) link.href = MP.settings.get().logo;
    }
  };

  /* ---- rotas ---- */
  R.add('/', () => MP.pages.home(), { skeleton: 'home' });
  R.add('/categorias', () => MP.pages.allCategories());
  R.add('/categoria/:slug', (c) => MP.pages.category(c), { skeleton: 'grid' });
  R.add('/busca', (c) => MP.pages.search(c), { skeleton: 'grid' });
  R.add('/promocoes', (c) => MP.pages.deals(c), { skeleton: 'grid' });
  R.add('/produto/:slug', (c) => MP.pages.product(c), { skeleton: 'product' });
  R.add('/orcamento', () => MP.pages.cart());
  R.add('/entrar', (c) => MP.pages.login(c));
  R.add('/cadastro', (c) => MP.pages.register(c));
  R.add('/recuperar-senha', () => MP.pages.forgot());
  R.add('/conta', () => {
    R.go('/conta/pedidos');
    return { redirected: true };
  });
  R.add('/conta/pedidos', (c) => MP.pages.orders(c));
  R.add('/conta/pedidos/:id', (c) => MP.pages.orderDetail(c));
  R.add('/conta/enderecos', () => MP.pages.addresses());
  R.add('/conta/dados', () => MP.pages.profile());
  R.add('/conta/favoritos', () => MP.pages.favorites());
  R.add('/conta/desejos', () => MP.pages.wishlist());
  R.add('/conta/orcamentos', () => MP.pages.accountQuotes());
  R.add('/pedido/:id', (c) => MP.pages.orderPublic(c));
  R.add('/contato', () => MP.pages.contact());
  R.add('/institucional/:page', (c) => MP.pages.institutional(c));
  R.add('/admin', (c) => MP.admin.handler(c));
  R.add('/admin/:section', (c) => MP.admin.handler(c));

  /* ---- eventos globais ---- */
  MP.bus.on('cart', () => MP.components.header.update());
  MP.bus.on('auth', () => MP.components.header.update());
  MP.bus.on('route', () => {
    MP.components.header.update();
    MP.components.header.highlight();
    const input = U.$('.hdr-top .searchbar input');
    if (input && document.activeElement !== input) input.value = R.current.path === '/busca' ? R.current.query.q || '' : '';
  });

  /* ---- atualização em tempo real (nuvem): pedidos novos / mudança de status aparecem sem recarregar ---- */
  let refreshTimer;
  MP.bus.on('cloud:update', (name) => {
    const priv = name === 'orders' || name === 'users';
    const pub = ['products', 'categories', 'banners', 'coupons', 'promotions', 'settings'].includes(name);
    if (!MP.app.started || (!priv && !pub)) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      const p = R.current.path || '';
      if (priv && p !== '/admin' && !p.startsWith('/admin/pedidos') && !p.startsWith('/admin/clientes') && !p.startsWith('/conta/pedidos')) return;
      if (pub && (name === 'settings' || name === 'categories')) MP.app.renderChrome();
      const ae = document.activeElement;
      if (ae && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName) && ae.closest('#app')) return; // não interrompe quem está digitando/escolhendo
      if (U.$('#overlay-root').children.length) return; // nem janelas abertas
      R.render(false);
    }, 150);
  });

  const start = () => {
    MP.store.init();
    MP.app.renderChrome();
    R.start();
    MP.app.started = true;
  };

  if (MP.cloud.enabled) {
    U.$('#app').innerHTML = '<p class="boot-msg" style="padding:80px 16px;text-align:center">Carregando…</p>';
    MP.cloud.boot().then(start, (e) => {
      console.error(e);
      const perm = e && e.code === 'permission-denied';
      U.$('#app').innerHTML = `<div class="container page-pad narrow" style="text-align:center"><h1>Não foi possível conectar</h1>
        <p class="muted">${perm ? 'O servidor recusou a leitura dos dados. Publique as regras do Firestore (arquivo firestore.rules) e tente de novo.' : 'Verifique sua conexão com a internet e tente novamente.'}</p>
        <p class="muted small">${U.esc((e && (e.code || e.message)) || '')}</p>
        <p><button class="btn btn-primary" onclick="location.reload()">Tentar novamente</button></p></div>`;
    });
  } else start();
})(window.MP);
