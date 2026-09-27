/* Página individual do produto. */
(function (MP) {
  const U = MP.util;
  const { esc, brl } = U;
  const C = MP.components;

  const updatePrice = (root) => {
    const p = MP.catalog.byId(root.dataset.id);
    const sel = root.querySelector('select[name="unit"]');
    const key = sel ? sel.value : '';
    U.$('[data-price-pix]', root).textContent = brl(MP.priceOf(p, key));
    U.$('[data-price-card]', root).textContent = brl(MP.cardPriceOf(p, key));
  };
  MP.on.change('unit-change', (el) => updatePrice(el.closest('.buybox')));

  MP.on.click('wish-toggle', (el) => {
    const on = MP.wishlist.toggle(el.dataset.id);
    el.classList.toggle('is-on', on);
    el.querySelector('span').textContent = on ? 'Na lista de desejos' : 'Lista de desejos';
    MP.ui.toast(on ? 'Salvo na lista de desejos' : 'Removido da lista de desejos', 'info', on ? { label: 'Ver lista', href: '#/conta/desejos' } : null);
  });

  MP.on.click('ship-toggle', (el) => {
    const box = el.closest('.buybox').querySelector('.ship-box');
    box.hidden = !box.hidden;
    if (!box.hidden) box.querySelector('input').focus();
  });
  MP.on.submit('ship-calc', (form, fd) => {
    const p = MP.catalog.byId(form.dataset.id);
    const out = form.parentElement.querySelector('.ship-result');
    const q = MP.shipping.quote(fd.get('cep'), p.price);
    if (!q.ok) {
      out.innerHTML = `<span class="text-err">${esc(q.msg)}</span>`;
      return;
    }
    MP.cart.setCep(fd.get('cep'));
    out.innerHTML = q.consult
      ? `<b>${esc(q.zone)}</b>: ${esc(q.msg)}`
      : `<b>${esc(q.zone)}</b>: ${q.cost === 0 ? 'frete grátis' : brl(q.cost)} · prazo ${esc(q.days)}${q.freeAbove && q.cost ? `<br><small>Frete grátis em compras acima de ${brl(q.freeAbove)}.</small>` : ''}`;
  });
  MP.on.click('pickup-toggle', (el) => {
    const box = el.closest('.buybox').querySelector('.pickup-box');
    box.hidden = !box.hidden;
  });
  MP.on.click('pickup-choose', () => {
    MP.cart.setMode('retirada');
    MP.ui.toast('Retirada na loja selecionada no seu orçamento', 'ok', { label: 'Ver orçamento', href: '#/orcamento' });
  });

  MP.on.click('ptab', (el) => {
    const wrap = el.closest('[data-tabs]');
    U.$$('[role=tab]', wrap).forEach((t) => {
      t.classList.toggle('is-on', t === el);
      t.setAttribute('aria-selected', t === el);
    });
    U.$$('[data-panel]', wrap).forEach((x) => (x.hidden = x.dataset.panel !== el.dataset.tab));
  });

  MP.pages.product = (ctx) => {
    const p = MP.catalog.bySlug(ctx.params.slug);
    if (!p || p.active === false) return MP.pages.notFound();
    const cat = MP.catalog.category(p.category);
    const s = MP.settings.get();
    const off = MP.catalog.discount(p);
    const wished = MP.wishlist.has(p.id);
    const defUnit = p.units && p.units[0] ? p.units[0].key : '';
    const out = p.stock <= 0;
    const rel = MP.catalog.related(p, 4);
    const addr = s.address;
    const brandLogo = p.brand ? `<div class="brand-tag"><span>${esc(p.brand)}</span></div>` : '';

    const html = `<div class="container page-pad product-page">
      ${C.breadcrumb([
        { label: 'Início', href: '#/' },
        { label: cat ? cat.name : 'Produtos', href: cat ? '#/categoria/' + cat.slug : '#/busca' },
        { label: p.type, href: `#/categoria/${p.category}?tipo=${encodeURIComponent(p.type)}` },
        { label: p.name }
      ])}
      <div class="product-top">
        ${C.gallery(p)}
        <div class="buybox" data-id="${p.id}">
          <div class="buybox-head">
            <div><h1 class="ptitle">${esc(p.name)}<br><span>${esc(p.variant)}</span></h1>
              <div class="rating">${p.reviews ? C.stars(p.rating, p.reviews) : ''}</div></div>
            ${brandLogo}
          </div>
          <p class="plead">${esc(p.desc)}</p>
          <div class="price-boxes">
            <div class="price-box pix"><strong data-price-pix>${brl(p.price)}</strong><small>à vista no PIX</small>${p.oldPrice && p.oldPrice > p.price ? `<s>${brl(p.oldPrice)}</s><span class="badge-off inline">-${off}%</span>` : ''}</div>
            <div class="price-box"><strong data-price-card>${brl(p.cardPrice || p.price)}</strong><small>no cartão de crédito</small></div>
          </div>
          ${MP.wholesaleOf(p) ? `<p class="wholesale-note"><b>Atacado:</b> ${brl(MP.wholesaleOf(p).price)} por unidade a partir de ${MP.wholesaleOf(p).min} unidades</p>` : ''}
          ${out ? '<p class="text-err"><b>Produto indisponível no momento.</b> Fale com a loja pelo WhatsApp para consultar reposição.</p>' : ''}
          <div class="buy-row">
            ${C.stepper({ name: 'qty', label: 'Quantidade' })}
            ${p.units && p.units.length > 1 ? `<select name="unit" class="unit-select" data-change="unit-change" aria-label="Unidade de venda">${p.units.map((u) => `<option value="${esc(u.key)}" ${u.key === defUnit ? 'selected' : ''}>${esc(u.label)}</option>`).join('')}</select>` : `<span class="unit-fixed">${esc(p.specs['Unidade de venda'] || 'Unidade')}</span>`}
          </div>
          <button class="btn btn-primary btn-xl btn-block" data-action="add-to-cart" data-id="${p.id}" ${out ? 'disabled' : ''}>${MP.icon('cart', 20)} Adicionar ao carrinho</button>
          <div class="buy-links">
            <button class="link-ic" data-action="ship-toggle">${MP.icon('truck', 20)} Calcule o frete e prazo</button>
            <button class="link-ic" data-action="pickup-toggle">${MP.icon('store', 20)} Retire na loja</button>
            <span class="link-ic">${MP.icon('shield', 20)} Garantia do fabricante</span>
            <button class="link-ic wish ${wished ? 'is-on' : ''}" data-action="wish-toggle" data-id="${p.id}">${MP.icon('bookmark', 20)} <span>${wished ? 'Na lista de desejos' : 'Lista de desejos'}</span></button>
          </div>
          <div class="ship-box" hidden>
            <form data-submit="ship-calc" data-id="${p.id}" class="inline-form"><input name="cep" data-mask="cep" inputmode="numeric" maxlength="9" placeholder="Seu CEP" aria-label="CEP" value="${esc(MP.cart.state().cep)}"><button class="btn btn-dark btn-sm">Calcular</button></form>
            <p class="ship-result"></p>
          </div>
          <div class="pickup-box" hidden>
            <p><b>${esc(s.storeName)}</b><br>${esc(U.addrLine(addr))}<br>${esc(s.pickupText)}</p>
            <button class="btn btn-outline btn-sm" data-action="pickup-choose">Usar retirada no meu orçamento</button>
          </div>
          <button class="btn btn-wa btn-block" data-action="ask-product" data-id="${p.id}">${MP.icon('whatsapp', 18)} Tirar dúvida pelo WhatsApp</button>
          <button class="btn btn-outline btn-block share-btn" data-action="share-product" data-id="${p.id}">${MP.icon('external', 16)} Compartilhar este produto</button>
        </div>
      </div>

      <section class="ptabs" data-tabs>
        <div class="tabs" role="tablist">
          <button role="tab" class="tab is-on" aria-selected="true" data-action="ptab" data-tab="desc">Descrição</button>
          <button role="tab" class="tab" aria-selected="false" data-action="ptab" data-tab="spec">Descrição técnica</button>
        </div>
        <div data-panel="desc" class="ptab-panel"><p>${esc(p.longDesc)}</p></div>
        <div data-panel="spec" class="ptab-panel" hidden>
          <table class="spec-table"><tbody>${Object.keys(p.specs).map((k) => `<tr><th scope="row">${esc(k)}</th><td>${esc(p.specs[k])}</td></tr>`).join('')}</tbody></table>
        </div>
      </section>

      ${rel.length ? `<section class="section"><h2 class="section-title left">PRODUTOS RELACIONADOS</h2><div class="pgrid">${rel.map((r) => C.productCard(r)).join('')}</div></section>` : ''}
    </div>`;
    return { title: `${p.name} ${p.variant}`.trim(), description: `${p.name} ${p.variant}`.trim() + ` por ${brl(p.price)}. ${p.desc || ''}`.slice(0, 200), html };
  };

  /* link "limpo" da página do produto: mostra foto, nome e preço na prévia do WhatsApp (depois de rodar npm run seo e publicar) */
  MP.on.click('share-product', async (el) => {
    const p = MP.catalog.byId(el.dataset.id);
    if (!p) return;
    const url = `${location.origin}/produto/${p.slug}/`;
    const name = `${p.name} ${p.variant}`.trim();
    const text = `${name} — ${brl(p.price)} na ${MP.settings.get().storeName}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text, url });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank', 'noopener');
  });
  MP.on.click('ask-product', (el) => {
    const p = MP.catalog.byId(el.dataset.id);
    const msg = `Olá! Tenho interesse no produto: ${p.name} - ${p.variant} (${brl(p.price)}). Poderia me passar mais informações e a disponibilidade?`;
    window.open(MP.orders.waLink(msg), '_blank', 'noopener');
  });
})(window.MP);
