/* Categorias, busca e promoções: filtros, ordenação, grade/lista e paginação (estado na URL). */
(function (MP) {
  const U = MP.util;
  const { esc } = U;
  const C = MP.components;
  const PER_PAGE = 12;

  const BANDS = [
    { k: 'ate50', label: 'Até R$ 50,00', min: 0, max: 50 },
    { k: '50-100', label: 'R$ 50,01 - R$ 100,00', min: 50.005, max: 100 },
    { k: '100-200', label: 'R$ 100,01 - R$ 200,00', min: 100.005, max: 200 },
    { k: '200+', label: 'Acima de R$ 200,00', min: 200.005, max: Infinity }
  ];
  const SORTS = [
    ['mais-vendidos', 'Mais vendidos'],
    ['menor', 'Menor preço'],
    ['maior', 'Maior preço'],
    ['recentes', 'Mais recentes']
  ];

  const list = (v) => (v ? String(v).split(',').filter(Boolean) : []);

  const readState = (q) => ({
    q: q.q || '',
    marca: list(q.marca),
    tipo: list(q.tipo),
    preco: list(q.preco),
    ord: q.ord || (q.q ? 'relevancia' : 'mais-vendidos'),
    vista: q.vista === 'lista' ? 'lista' : 'grade',
    pg: Math.max(1, Number(q.pg) || 1)
  });

  const applyFilters = (base, st) => {
    let out = base;
    if (st.marca.length) out = out.filter((p) => st.marca.includes(p.brand));
    if (st.tipo.length) out = out.filter((p) => st.tipo.includes(p.type));
    if (st.preco.length) {
      const bands = BANDS.filter((b) => st.preco.includes(b.k));
      out = out.filter((p) => bands.some((b) => p.price >= b.min && p.price <= b.max));
    }
    const sorted = out.slice();
    if (st.ord === 'menor') sorted.sort((a, b) => a.price - b.price);
    else if (st.ord === 'maior') sorted.sort((a, b) => b.price - a.price);
    else if (st.ord === 'recentes') sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else if (st.ord === 'mais-vendidos') sorted.sort((a, b) => b.sold - a.sold);
    return sorted;
  };

  const facet = (base, key) => {
    const m = {};
    base.forEach((p) => (m[p[key]] = (m[p[key]] || 0) + 1));
    return Object.keys(m).sort((a, b) => (a === 'Outras' ? 1 : b === 'Outras' ? -1 : m[b] - m[a] || a.localeCompare(b))).map((k) => [k, m[k]]);
  };

  const group = (title, name, items, selected, draft) =>
    items.length
      ? `<fieldset class="fgroup"><legend>${title}</legend>${items
          .map(
            ([val, label, n]) =>
              `<label class="check"><input type="checkbox" data-group="${name}" value="${esc(val)}" ${selected.includes(val) ? 'checked' : ''} ${draft ? '' : 'data-change="catalog-filter"'}><span>${esc(label)}${n != null ? ` <em>(${n})</em>` : ''}</span></label>`
          )
          .join('')}</fieldset>`
      : '';

  const sidebar = (ctx, draft) => {
    const { base, st, catSlug } = ctx;
    const cats = MP.catalog.categories();
    const brands = facet(base, 'brand').filter(([b]) => b).map(([b, n]) => [b, b, n]);
    const types = facet(base, 'type').map(([t, n]) => [t, t, n]);
    const prices = BANDS.map((b) => [b.k, b.label, null]);
    const active = st.marca.length + st.tipo.length + st.preco.length;
    return `<div class="fside" ${draft ? 'data-filters-draft' : 'data-filters'}>
      <h3 class="fside-title">Categorias</h3>
      <ul class="cat-list">${cats.map((c) => `<li><a href="#/categoria/${esc(c.slug)}" class="${c.slug === catSlug ? 'is-on' : ''}">${MP.icon('right', 12)} ${esc(c.name)}</a></li>`).join('')}</ul>
      <h3 class="fside-title">Filtrar por</h3>
      ${group('Marca', 'marca', brands, st.marca, draft)}
      ${group('Tipo', 'tipo', types, st.tipo, draft)}
      ${group('Preço', 'preco', prices, st.preco, draft)}
      ${draft ? '' : `<button class="btn btn-ghost btn-sm" data-action="filters-clear" ${active ? '' : 'disabled'}>Limpar filtros</button>`}
    </div>`;
  };

  const readGroups = (root) => {
    const out = { marca: [], tipo: [], preco: [] };
    U.$$('input[data-group]:checked', root).forEach((i) => out[i.dataset.group].push(i.value));
    return { marca: out.marca.join(','), tipo: out.tipo.join(','), preco: out.preco.join(',') };
  };

  MP.on.change('catalog-filter', (el) => MP.router.setQuery(readGroups(el.closest('[data-filters]'))));
  MP.on.click('filters-apply', (el) => {
    const q = readGroups(el.closest('.drawer'));
    MP.ui.closeAll();
    MP.router.setQuery(q);
  });
  MP.on.click('filters-clear', () => {
    MP.ui.closeAll();
    MP.router.setQuery({ marca: '', tipo: '', preco: '' });
  });
  MP.on.click('chip-remove', (el) => {
    const st = readState(MP.router.current.query);
    const g = el.dataset.group;
    MP.router.setQuery({ [g]: st[g].filter((v) => v !== el.dataset.val).join(',') });
  });
  MP.on.change('catalog-sort', (el) => MP.router.setQuery({ ord: el.value }));
  MP.on.click('catalog-view', (el) => MP.router.setQuery({ vista: el.dataset.v === 'lista' ? 'lista' : '' }));
  MP.on.click('page', (el) => {
    MP.router.setQuery({ pg: el.dataset.pg }, {});
    const top = U.$('.catalog-main');
    if (top) window.scrollTo({ top: top.getBoundingClientRect().top + window.scrollY - 150, behavior: 'smooth' });
  });
  MP.on.click('filters-open', () => {
    const ctx = MP.pages._catalogCtx;
    MP.ui.drawer({
      title: 'Filtrar',
      side: 'left',
      className: 'drawer-filters',
      body: `${sidebar(ctx, true)}<div class="drawer-foot"><button class="btn btn-ghost" data-action="filters-clear">Limpar</button><button class="btn btn-primary" data-action="filters-apply">Ver ${ctx.total} ${U.plural(ctx.total, 'produto', 'produtos')}</button></div>`
    });
  });

  const pagination = (page, pages) => {
    if (pages <= 1) return '';
    const btn = (n, label, cls = '', dis) => `<button class="pg ${cls}" data-action="page" data-pg="${n}" ${dis ? 'disabled' : ''} ${cls === 'is-on' ? 'aria-current="page"' : ''}>${label}</button>`;
    let out = btn(page - 1, MP.icon('left', 16), '', page === 1);
    for (let i = 1; i <= pages; i++) out += btn(i, i, i === page ? 'is-on' : '');
    return `<nav class="pagination" aria-label="Paginação">${out + btn(page + 1, MP.icon('right', 16), '', page === pages)}</nav>`;
  };

  /* renderiza qualquer listagem */
  const catalogPage = (ctx, { title, sub, crumbs, base, catSlug, docTitle, showCount = true }) => {
    const st = readState(ctx.query);
    const filtered = applyFilters(
      st.q ? MP.catalog.search(st.q, base) : base,
      st
    );
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));
    const page = Math.min(st.pg, pages);
    const items = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const baseForFacets = st.q ? MP.catalog.search(st.q, base) : base;
    const c = { base: baseForFacets, st, catSlug, total };
    MP.pages._catalogCtx = c;

    const sorts = st.q ? [['relevancia', 'Mais relevantes'], ...SORTS] : SORTS;
    const chips = [
      ...st.marca.map((v) => ['marca', v, v]),
      ...st.tipo.map((v) => ['tipo', v, v]),
      ...st.preco.map((v) => ['preco', v, (BANDS.find((b) => b.k === v) || {}).label])
    ];

    const html = `<div class="container page-pad">
      ${C.breadcrumb(crumbs)}
      <div class="catalog">
        <aside class="catalog-side no-print" aria-label="Filtros">${sidebar(c, false)}</aside>
        <section class="catalog-main">
          <header class="catalog-head">
            <div><h1 class="page-title">${esc(title)}</h1>${sub ? `<p class="muted">${esc(sub)}</p>` : ''}</div>
          </header>
          <div class="catalog-bar no-print">
            <button class="btn btn-outline btn-sm filters-btn" data-action="filters-open">${MP.icon('filter', 16)} Filtrar${chips.length ? ` (${chips.length})` : ''}</button>
            <span class="count">${showCount ? `${total} ${U.plural(total, 'produto', 'produtos')}` : ''}</span>
            <label class="sort">Ordenar por
              <select data-change="catalog-sort" aria-label="Ordenar por">${sorts.map(([v, l]) => `<option value="${v}" ${st.ord === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
            </label>
            <div class="view-toggle" role="group" aria-label="Modo de exibição">
              <button class="${st.vista === 'grade' ? 'is-on' : ''}" data-action="catalog-view" data-v="grade" aria-label="Grade" aria-pressed="${st.vista === 'grade'}">${MP.icon('grid', 18)}</button>
              <button class="${st.vista === 'lista' ? 'is-on' : ''}" data-action="catalog-view" data-v="lista" aria-label="Lista" aria-pressed="${st.vista === 'lista'}">${MP.icon('list', 18)}</button>
            </div>
          </div>
          ${chips.length ? `<div class="chips">${chips.map(([g, v, l]) => `<button class="chip" data-action="chip-remove" data-group="${g}" data-val="${esc(v)}">${esc(l)} ${MP.icon('x', 12)}</button>`).join('')}<button class="chip chip-clear" data-action="filters-clear">Limpar tudo</button></div>` : ''}
          ${items.length
            ? `<div class="pgrid pgrid-${st.vista}">${items.map((p) => C.productCard(p, st.vista === 'lista' ? 'list' : 'grid')).join('')}</div>${pagination(page, pages)}`
            : C.emptyState({ icon: 'search', title: 'Nenhum produto encontrado', text: 'Tente remover alguns filtros ou buscar por outro termo.', action: '<button class="btn btn-primary" data-action="filters-clear">Limpar filtros</button>' })}
        </section>
      </div>
    </div>`;
    return {
      title: docTitle || title,
      html,
      mount: (app) => {
        // só busca a foto dos produtos desta página (até 12) — não do catálogo inteiro
        if (MP.cloud.enabled) MP.cloud.fetchImages(items.map((p) => p.id)).then(() => C.refreshCards(app));
      }
    };
  };

  MP.pages.category = (ctx) => {
    const cat = MP.catalog.category(ctx.params.slug);
    if (!cat) return MP.pages.notFound();
    const base = MP.catalog.products().filter((p) => p.category === cat.slug);
    return catalogPage(ctx, {
      title: cat.name, sub: cat.desc, base, catSlug: cat.slug,
      crumbs: [{ label: 'Início', href: '#/' }, { label: cat.name }]
    });
  };

  MP.pages.search = (ctx) => {
    const q = ctx.query.q || '';
    return catalogPage(ctx, {
      title: q ? `Resultados para “${q}”` : 'Todos os produtos',
      sub: q ? '' : 'Confira todo o nosso catálogo.',
      docTitle: q ? `Busca: ${q}` : 'Todos os produtos',
      base: MP.catalog.products(),
      crumbs: [{ label: 'Início', href: '#/' }, { label: q ? 'Busca' : 'Produtos' }]
    });
  };

  MP.pages.deals = (ctx) =>
    catalogPage(ctx, {
      title: 'Promoções', sub: 'Ofertas por tempo limitado. Aproveite!',
      base: MP.catalog.products().filter((p) => MP.catalog.discount(p) > 0),
      crumbs: [{ label: 'Início', href: '#/' }, { label: 'Promoções' }]
    });

  MP.pages.allCategories = () => {
    const cats = MP.catalog.categories();
    const prods = MP.catalog.products();
    return {
      title: 'Todas as categorias',
      html: `<div class="container page-pad">${C.breadcrumb([{ label: 'Início', href: '#/' }, { label: 'Categorias' }])}
        <h1 class="page-title">Todas as categorias</h1>
        <div class="cat-grid">${cats.map((c) => `<a class="cat-big" href="#/categoria/${esc(c.slug)}"><span class="cat-big-img"><img src="${esc(c.image || MP.art.url(c.art || MP.art.fallback(c.slug), 0))}" alt="" loading="lazy"></span><span><b>${esc(c.name)}</b><small>${prods.filter((p) => p.category === c.slug).length} produtos</small></span></a>`).join('')}</div></div>`
    };
  };
})(window.MP);
