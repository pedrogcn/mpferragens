/* Header, menu, busca com sugestões, rodapé e faixa promocional final. */
(function (MP) {
  const U = MP.util;
  const { esc } = U;
  const C = MP.components;

  C.searchBar = (value = '') =>
    `<form class="searchbar" data-submit="search" role="search" autocomplete="off">
      <input type="search" name="q" value="${esc(value)}" placeholder="O que você procura?" aria-label="Buscar produtos" data-input="suggest" autocomplete="off">
      <button type="submit" aria-label="Buscar">${MP.icon('search', 20)}</button>
      <div class="suggest" hidden></div>
    </form>`;

  C.header = {
    render() {
      const cats = MP.catalog.categories();
      return `<header class="site-header no-print">
        <div class="hdr-top container">
          <button class="icon-btn hdr-burger" data-action="menu-open" aria-label="Abrir menu">${MP.icon('menu', 26)}</button>
          <a class="brand" href="#/" aria-label="${esc(MP.settings.get().storeName)} — início">${C.logo('logo-header')}</a>
          ${C.searchBar()}
          <a class="hdr-link hdr-user" href="#/entrar" data-user-link>${MP.icon('user', 22)}<span data-user-label>Entrar</span></a>
          <a class="hdr-link hdr-cart" href="#/orcamento" aria-label="Ver orçamento">${MP.icon('cart', 24)}<span class="cart-badge" data-cart-badge hidden>0</span></a>
        </div>
        <nav class="hdr-nav" aria-label="Categorias">
          <ul class="container">
            <li><a href="#/" data-nav="/">${MP.icon('home', 16)} Início</a></li>
            ${cats.map((c) => `<li><a href="#/categoria/${esc(c.slug)}" data-nav="/categoria/${esc(c.slug)}">${MP.icon(c.icon || 'box', 16)} ${esc(c.short || c.name)}</a></li>`).join('')}
          </ul>
        </nav>
      </header>`;
    },
    update() {
      const n = MP.cart.count();
      const b = U.$('[data-cart-badge]');
      if (b) {
        b.textContent = n > 99 ? '99+' : n;
        b.hidden = n === 0;
        b.classList.remove('bump');
        void b.offsetWidth;
        if (n) b.classList.add('bump');
      }
      const u = MP.auth.current();
      const link = U.$('[data-user-link]');
      if (link) {
        link.setAttribute('href', u ? '#/conta/pedidos' : '#/entrar');
        U.$('[data-user-label]').textContent = u ? MP.auth.firstName(u) : 'Entrar';
      }
    },
    highlight() {
      const path = MP.router.current.path;
      U.$$('.hdr-nav [data-nav]').forEach((a) => {
        const p = a.dataset.nav;
        const on = p === '/' ? path === '/' : path.startsWith(p);
        a.classList.toggle('is-on', on);
        on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
      });
    }
  };

  /* ---------- menu mobile ---------- */
  MP.on.click('menu-open', () => {
    const u = MP.auth.current();
    MP.ui.drawer({
      title: 'Menu',
      className: 'drawer-menu',
      body: `<nav class="mmenu">
        <a href="#/">${MP.icon('home', 20)} Início</a>
        ${MP.catalog.categories().map((c) => `<a href="#/categoria/${esc(c.slug)}">${MP.icon(c.icon || 'box', 20)} ${esc(c.name)}</a>`).join('')}
        <a href="#/promocoes">${MP.icon('percent', 20)} Promoções</a>
        <hr>
        <a href="#/orcamento">${MP.icon('cart', 20)} Meu orçamento</a>
        ${u ? `<a href="#/conta/pedidos">${MP.icon('user', 20)} Minha conta</a><a href="#/conta/favoritos">${MP.icon('heart', 20)} Favoritos</a>` : `<a href="#/entrar">${MP.icon('user', 20)} Entrar</a><a href="#/cadastro">${MP.icon('plus', 20)} Criar conta</a>`}
        <a href="#/contato">${MP.icon('pin', 20)} Onde estamos</a>
      </nav>`
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.searchbar')) U.$$('.suggest').forEach((s) => (s.hidden = true));
  });

  /* ---------- busca ---------- */
  MP.on.submit('search', (form, fd) => {
    const q = String(fd.get('q') || '').trim();
    U.$$('.suggest').forEach((s) => (s.hidden = true));
    if (!q) return;
    MP.router.go('/busca?q=' + encodeURIComponent(q));
  });
  MP.on.input('suggest', (el) => {
    const box = el.parentElement.querySelector('.suggest');
    const q = el.value.trim();
    if (q.length < 2) {
      box.hidden = true;
      return;
    }
    const res = MP.catalog.search(q, MP.catalog.products()).slice(0, 6);
    box.innerHTML = res.length
      ? res.map((p) => `<a href="#/produto/${esc(p.slug)}" data-id="${p.id}"><img src="${esc(MP.art.main(p))}" alt="" loading="lazy"><span>${esc(p.name)} <em>${esc(p.variant)}</em></span><b>${U.brl(p.price)}</b></a>`).join('') +
        `<a class="suggest-all" href="#/busca?q=${encodeURIComponent(q)}">Ver todos os resultados para “${esc(q)}”</a>`
      : `<div class="suggest-empty">Nenhum produto encontrado para “${esc(q)}”.</div>`;
    box.hidden = false;
    // as fichas já estavam em memória; busca só a foto dos até 6 produtos sugeridos aqui
    if (res.length && MP.cloud.enabled) {
      MP.cloud.fetchImages(res.map((p) => p.id)).then(() => {
        box.querySelectorAll('a[data-id]').forEach((a) => {
          const p = MP.catalog.byId(a.dataset.id);
          const img = a.querySelector('img');
          if (p && img) img.src = MP.art.main(p);
        });
      });
    }
  });

  /* ---------- faixa final + rodapé ---------- */
  C.promoStrip = () =>
    `<section class="promo-strip no-print" aria-label="Destaques da loja">
      <div class="container promo-in">
        <ul class="promo-points">
          <li>${MP.icon('tag', 36)}<b>MAIS<br>PRODUTOS</b></li>
          <li>${MP.icon('percent', 36)}<b>MAIS<br>OFERTAS</b></li>
          <li>${MP.icon('bolt', 36)}<b>MAIS<br>AGILIDADE</b></li>
          <li>${MP.icon('chart', 36)}<b>MAIS<br>RESULTADOS</b></li>
        </ul>
        <div class="promo-cta"><strong>${esc(MP.settings.get().storeName.toUpperCase())}</strong><span>SEMPRE COM VOCÊ NA SUA OBRA E PROJETO!</span></div>
      </div>
    </section>`;

  C.socialLinks = (size = 20) => {
    const s = MP.settings.get();
    const wa = MP.orders.waLink('Olá! Vim pelo site e gostaria de mais informações.');
    const item = (icon, href, label) => !href ? '' : `<a class="social-a" href="${esc(href)}" target="_blank" rel="noopener" aria-label="${label}">${MP.icon(icon, size)}</a>`;
    return item('instagram', s.social.instagram, 'Instagram') + item('facebook', s.social.facebook, 'Facebook') + item('tiktok', s.social.tiktok, 'TikTok') + item('youtube', s.social.youtube, 'YouTube') + item('whatsapp', wa, 'WhatsApp');
  };

  C.footer = {
    render() {
      const s = MP.settings.get();
      const a = s.address;
      const year = new Date().getFullYear();
      const wa = MP.orders.waLink('Olá! Vim pelo site e gostaria de atendimento.');
      return `${C.promoStrip()}
      <footer class="site-footer no-print">
        <div class="container foot-grid">
          <div class="foot-brand">
            <a href="#/" aria-label="${esc(s.storeName)}">${C.logo('logo-footer')}</a>
            <p>${esc(s.tagline)}</p>
            <div class="social-row">${C.socialLinks(20)}</div>
          </div>
          <div><h3>Institucional</h3><ul>
            <li><a href="#/institucional/quem-somos">Quem Somos</a></li>
            <li><a href="#/institucional/privacidade">Política de Privacidade</a></li>
            <li><a href="#/institucional/termos">Termos de Uso</a></li>
            <li><a href="#/contato">Fale Conosco</a></li></ul></div>
          <div><h3>Atendimento</h3><ul class="foot-contact">
            <li>${MP.icon('whatsapp', 16)} <a href="${esc(wa)}" target="_blank" rel="noopener">${esc(s.whatsappDisplay)}</a></li>
            <li>${MP.icon('phone', 16)} <a href="tel:${U.digits(s.phone)}">${esc(s.phone)}</a></li>
            <li>${MP.icon('mail', 16)} <a href="mailto:${esc(s.email)}">${esc(s.email)}</a></li>
            <li>${MP.icon('clock', 16)} <span>${s.hours.map(esc).join('<br>')}</span></li></ul></div>
          <div><h3>Redes sociais</h3><ul>
            ${[['instagram', s.social.instagram, s.handle || 'Instagram'], ['facebook', s.social.facebook, 'Facebook'], ['tiktok', s.social.tiktok, 'TikTok'], ['youtube', s.social.youtube, 'YouTube']]
              .filter(([, href]) => href)
              .map(([icon, href, label]) => `<li><a href="${esc(href)}" target="_blank" rel="noopener">${MP.icon(icon, 16)} ${esc(label)}</a></li>`)
              .join('')}</ul></div>
          <div><h3>Categorias</h3><ul>${MP.catalog.categories().slice(0, 6).map((c) => `<li><a href="#/categoria/${esc(c.slug)}">${esc(c.name)}</a></li>`).join('')}</ul></div>
        </div>
        <div class="foot-bottom"><div class="container">
          <span>© ${year} ${esc(s.storeName)}. Todos os direitos reservados.</span>
          <span>${esc(a.city)} - ${esc(a.state)} · <a href="#/admin">Área administrativa</a></span>
        </div></div>
      </footer>`;
    }
  };

  C.whatsFloat = () => {
    const wa = MP.orders.waLink('Olá! Vim pelo site e gostaria de atendimento.');
    return `<a class="wa-float no-print" href="${esc(wa)}" target="_blank" rel="noopener" aria-label="Falar pelo WhatsApp">${MP.icon('whatsapp', 30)}</a>`;
  };
})(window.MP);
