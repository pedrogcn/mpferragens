/* Página inicial: carrossel de banners, benefícios, categorias e produtos em destaque. */
(function (MP) {
  const U = MP.util;
  const { esc } = U;
  const C = MP.components;

  const slide = (b, i) => {
    if (b.full && b.image) {
      const lazy = i === 0 ? '' : 'loading="lazy"';
      const mob = b.imageMobile ? `<source media="(max-width: 860px)" srcset="${esc(b.imageMobile)}">` : '';
      const pic = `<picture>${mob}<img class="fs-main" src="${esc(b.image)}" alt="${esc(b.title || 'Banner')}" ${lazy}></picture>`;
      return `<div class="hero-slide is-fullimg ${i === 0 ? 'is-on' : ''}" role="group" aria-roledescription="slide" aria-label="${i + 1}" ${i === 0 ? '' : 'aria-hidden="true"'}><img class="fs-bg" src="${esc(b.image)}" alt="" aria-hidden="true" ${lazy}>${b.link ? `<a class="fs-link" href="${esc(b.link)}">${pic}</a>` : pic}</div>`;
    }
    const img = b.image || MP.art.hero(b.hero || 'steel');
    return `<div class="hero-slide theme-${esc(b.theme || 'dark')} ${i === 0 ? 'is-on' : ''}" role="group" aria-roledescription="slide" aria-label="${i + 1}" ${i === 0 ? '' : 'aria-hidden="true"'}>
      <div class="container hero-in">
        <div class="hero-copy">
          ${b.kicker ? `<span class="hero-kicker">${esc(b.kicker)}</span>` : ''}
          <h1 class="hero-title">${esc(b.title)}</h1>
          ${b.brand ? `<div class="hero-brand">${esc(b.brand)}</div>` : ''}
          ${b.text ? `<p class="hero-text">${esc(b.text)}</p>` : ''}
          ${b.cta ? `<a class="btn btn-primary btn-lg" href="${esc(b.link || '#/')}" ${i === 0 ? '' : 'tabindex="-1"'}>${esc(b.cta)}</a>` : ''}
        </div>
        <div class="hero-art"><img src="${esc(img)}" alt="" ${i === 0 ? '' : 'loading="lazy"'}></div>
        ${b.badge ? `<div class="hero-badge"><span>${esc(b.badge)}</span></div>` : ''}
      </div>
    </div>`;
  };

  const goSlide = (root, n) => {
    const slides = U.$$('.hero-slide', root);
    const dots = U.$$('.hero-dot', root);
    n = (n + slides.length) % slides.length;
    slides.forEach((s, i) => {
      s.classList.toggle('is-on', i === n);
      s.setAttribute('aria-hidden', i === n ? 'false' : 'true');
      U.$$('a', s).forEach((a) => (i === n ? a.removeAttribute('tabindex') : a.setAttribute('tabindex', '-1')));
    });
    dots.forEach((d, i) => d.classList.toggle('is-on', i === n));
    root.dataset.i = n;
  };

  const initCarousel = (root) => {
    if (!root) return;
    const count = U.$$('.hero-slide', root).length;
    if (count < 2) return;
    let timer = null; // próprio deste carrossel (não global): evita conflito com outras instâncias/páginas
    const next = () => {
      // a página pode ter mudado enquanto o timer esperava; se este banner não existe mais, o timer se desliga sozinho
      if (!root.isConnected) return clearInterval(timer);
      goSlide(root, Number(root.dataset.i || 0) + 1);
    };
    const start = () => {
      clearInterval(timer);
      timer = setInterval(next, 5000);
    };
    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', () => clearInterval(timer));
    root.addEventListener('focusout', start);
    let x0 = null;
    root.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
    root.addEventListener('touchend', (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) goSlide(root, Number(root.dataset.i || 0) + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    start();
  };

  MP.on.click('hero-go', (el) => {
    const root = el.closest('.hero');
    goSlide(root, el.dataset.n != null ? Number(el.dataset.n) : Number(root.dataset.i || 0) + Number(el.dataset.dir));
  });

  MP.on.click('tab', (el) => {
    const wrap = el.closest('[data-tabs]');
    U.$$('[role=tab]', wrap).forEach((t) => {
      t.classList.toggle('is-on', t === el);
      t.setAttribute('aria-selected', t === el);
    });
    U.$$('[data-panel]', wrap).forEach((p) => (p.hidden = p.dataset.panel !== el.dataset.tab));
  });

  const benefits = () => `<section class="benefits no-print" aria-label="Benefícios">
      <ul class="container">
      <li>${MP.icon('truck', 38)}<div><b>Entrega rápida</b><span>em Manaus</span></div></li>
      <li>${MP.icon('coin', 38)}<div><b>Melhores</b><span>preços</span></div></li>
      <li>${MP.icon('card', 38)}<div><b>Pagamento facilitado</b><span>cartão, PIX e Crediário Bemol</span></div></li>
      <li>${MP.icon('headset', 38)}<div><b>Atendimento</b><span>especializado</span></div></li></ul>
    </section>`;

  /* no celular, a faixa de benefícios vira um carrossel (1 por vez) e passa sozinha a cada 7s;
     arrastar com o dedo pausa a troca automática por um instante, para não brigar com o gesto */
  const initBenefits = (root) => {
    if (!root) return;
    const list = U.$('ul', root);
    if (!list) return;
    const count = list.children.length;
    let benefitsTimer = null; // próprio desta faixa (não global)
    const next = () => {
      if (!list.isConnected) return clearInterval(benefitsTimer);
      const w = list.clientWidth || 1;
      const i = (Math.round(list.scrollLeft / w) + 1) % count;
      list.scrollTo({ left: w * i, behavior: 'smooth' });
    };
    const start = () => {
      clearInterval(benefitsTimer);
      benefitsTimer = setInterval(next, 7000);
    };
    list.addEventListener('touchstart', () => clearInterval(benefitsTimer), { passive: true });
    list.addEventListener('touchend', () => { clearInterval(benefitsTimer); start(); }, { passive: true });
    start();
  };

  MP.pages.home = () => {
    const banners = MP.data.banners.all().filter((b) => b.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
    const cats = MP.catalog.categories();
    const prods = MP.catalog.products();
    const featured = prods.filter((p) => p.featured).slice(0, 8);
    const best = prods.slice().sort((a, b) => b.sold - a.sold).slice(0, 8);
    const deals = prods.filter((p) => MP.catalog.discount(p) > 0).sort((a, b) => MP.catalog.discount(b) - MP.catalog.discount(a)).slice(0, 8);
    const fresh = prods.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
    const panel = (key, list, on) => `<div data-panel="${key}" ${on ? '' : 'hidden'}><div class="pgrid">${list.length ? list.map((p) => C.productCard(p)).join('') : '<p class="muted">Nenhum produto nesta seleção.</p>'}</div></div>`;

    const html = `
      ${banners.length ? `<section class="hero no-print" data-i="0" aria-roledescription="carousel" aria-label="Destaques">
        <div class="hero-track">${banners.map(slide).join('')}</div>
        ${banners.length > 1 ? `<button class="hero-nav hero-prev" data-action="hero-go" data-dir="-1" aria-label="Banner anterior">${MP.icon('left', 24)}</button>
        <button class="hero-nav hero-next" data-action="hero-go" data-dir="1" aria-label="Próximo banner">${MP.icon('right', 24)}</button>
        <div class="hero-dots">${banners.map((_, i) => `<button class="hero-dot ${i === 0 ? 'is-on' : ''}" data-action="hero-go" data-n="${i}" aria-label="Ir para o banner ${i + 1}"></button>`).join('')}</div>` : ''}
      </section>` : ''}
      ${benefits()}
      <section class="section container">
        <h2 class="section-title">CATEGORIAS EM DESTAQUE</h2>
        <div class="cat-row">${cats.slice(0, 6).map(C.categoryCard).join('')}${C.moreCard()}</div>
      </section>
      <section class="section container" data-tabs>
        <div class="section-head">
          <h2 class="section-title left">PRODUTOS EM DESTAQUE</h2>
          <div class="tabs" role="tablist">
            <button role="tab" class="tab is-on" aria-selected="true" data-action="tab" data-tab="feat">Destaques</button>
            <button role="tab" class="tab" aria-selected="false" data-action="tab" data-tab="best">Mais vendidos</button>
            <button role="tab" class="tab" aria-selected="false" data-action="tab" data-tab="deals">Ofertas</button>
            <button role="tab" class="tab" aria-selected="false" data-action="tab" data-tab="new">Lançamentos</button>
          </div>
        </div>
        ${panel('feat', featured, true)}${panel('best', best)}${panel('deals', deals)}${panel('new', fresh)}
        <div class="center mt"><a class="btn btn-outline" href="#/busca">Ver todos os produtos ${MP.icon('arrowr', 16)}</a></div>
      </section>
      <section class="section container">
        <h2 class="section-title">ONDE ESTAMOS</h2>
        ${MP.pages.locationBlock()}
      </section>`;
    const shown = Array.from(new Set([].concat(featured, best, deals, fresh).map((p) => p.id)));
    return {
      title: 'Materiais de construção e ferragens',
      html,
      mount: (app) => {
        initCarousel(U.$('.hero', app));
        initBenefits(U.$('.benefits', app));
        // as fichas dos produtos já chegaram; as fotos são buscadas à parte, só das que aparecem aqui
        if (MP.cloud.enabled) MP.cloud.fetchImages(shown).then(() => C.refreshCards(app));
      }
    };
  };
})(window.MP);
