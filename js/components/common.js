/* Componentes reutilizáveis: Logo, Botões, Stepper, ProductCard, CategoryCard, ProductGallery, Forms, Breadcrumb... */
(function (MP) {
  const U = MP.util;
  const { esc, brl } = U;
  const C = MP.components;

  /* A logo vem SEMPRE de MP.settings().logo (arquivo oficial enviado pelo cliente: assets/logo.jpg).
     Nunca é recriada nem alterada: só o tamanho muda por CSS, preservando a proporção. */
  C.logo = (cls = '') => {
    const s = MP.settings.get();
    return `<img class="logo ${cls}" src="${esc(s.logo)}" alt="${esc(s.storeName)}" width="150" height="150" decoding="async">`;
  };

  C.stars = (rating, count) => {
    const full = Math.round(rating);
    let s = '';
    for (let i = 1; i <= 5; i++) s += `<span class="${i <= full ? 'on' : ''}">${MP.icon('star', 16)}</span>`;
    return `<span class="stars" role="img" aria-label="Avaliação ${rating} de 5">${s}</span>${count != null ? `<span class="stars-count">(${count} avaliações)</span>` : ''}`;
  };

  C.stepper = ({ value = 1, min = 1, max = 9999, name = 'qty', attrs = '', label = 'Quantidade' } = {}) =>
    `<div class="stepper"><button type="button" data-action="step" data-dir="-1" aria-label="Diminuir">${MP.icon('minus', 14)}</button>` +
    `<input type="number" name="${esc(name)}" value="${value}" min="${min}" max="${max}" inputmode="numeric" aria-label="${esc(label)}" ${attrs}>` +
    `<button type="button" data-action="step" data-dir="1" aria-label="Aumentar">${MP.icon('plus', 14)}</button></div>`;

  C.breadcrumb = (items) =>
    `<nav class="breadcrumb" aria-label="Você está em">${items
      .map((it, i) => (it.href && i < items.length - 1 ? `<a href="${esc(it.href)}">${esc(it.label)}</a>` : `<span aria-current="page">${esc(it.label)}</span>`))
      .join(`<span class="sep">${MP.icon('right', 12)}</span>`)}</nav>`;

  C.emptyState = ({ icon = 'box', title, text, action }) =>
    `<div class="empty"><span class="empty-ic">${MP.icon(icon, 40)}</span><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}${action || ''}</div>`;

  C.favButton = (id) => {
    const on = MP.favorites.has(id);
    return `<button class="fav-btn ${on ? 'is-on' : ''}" data-action="fav-toggle" data-id="${id}" aria-pressed="${on}" aria-label="${on ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">${MP.icon('heart', 18)}</button>`;
  };

  C.productImg = (p, cls = '') => `<img class="${cls}" src="${esc(MP.art.main(p))}" alt="${esc(p.name + ' ' + p.variant)}" loading="lazy" decoding="async">`;

  C.productCard = (p, view = 'grid') => {
    const off = MP.catalog.discount(p);
    const out = p.stock <= 0;
    return `<article class="pcard pcard-${view}" data-id="${p.id}">
      <a class="pcard-img" href="#/produto/${esc(p.slug)}" aria-label="${esc(p.name + ' ' + p.variant)}">${C.productImg(p)}${off ? `<span class="badge-off">-${off}%</span>` : ''}${p.stock > 0 && p.stock <= 5 ? '<span class="badge-low">Últimas unidades</span>' : ''}</a>
      ${C.favButton(p.id)}
      <div class="pcard-body">
        <a class="pcard-title" href="#/produto/${esc(p.slug)}"><strong>${esc(p.name)}</strong><span>${esc(p.variant)}</span></a>
        <p class="pcard-desc">${esc(p.desc)}</p>
        <div class="pcard-price">
          ${p.oldPrice && p.oldPrice > p.price ? `<s>${brl(p.oldPrice)}</s>` : ''}
          <span class="price">${brl(p.price)}</span>
          <small>à vista no PIX</small>
        </div>
        ${MP.wholesaleOf(p) ? `<p class="pcard-wholesale">Atacado: <b>${brl(MP.wholesaleOf(p).price)}</b> a partir de ${MP.wholesaleOf(p).min} un.</p>` : ''}
        <div class="pcard-actions">
          ${out ? '<span class="pcard-out">Indisponível</span>' : `${C.stepper({ name: 'qty', label: 'Quantidade de ' + p.name })}<button class="btn btn-primary btn-sm" data-action="add-to-cart" data-id="${p.id}">Adicionar</button>`}
        </div>
      </div>
    </article>`;
  };

  C.categoryCard = (c) =>
    `<a class="ccard" href="#/categoria/${esc(c.slug)}"><span class="ccard-img"><img src="${esc(c.image || MP.art.url(c.art || MP.art.fallback(c.slug), 0))}" alt="" loading="lazy"></span><span class="ccard-name">${esc(c.short || c.name)}</span></a>`;

  C.moreCard = () =>
    `<a class="ccard ccard-more" href="#/categorias"><span class="ccard-img"><span class="plus-box">${MP.icon('plus', 26)}</span></span><span class="ccard-name">Mais<br>categorias</span></a>`;

  C.gallery = (p) => {
    const imgs = MP.art.images(p);
    return `<div class="gallery" data-gallery>
      <button class="gallery-main" data-action="lightbox" aria-label="Ampliar imagem"><img id="gallery-main-img" src="${esc(imgs[0])}" alt="${esc(p.name + ' ' + p.variant)}"><span class="zoom-hint">${MP.icon('search', 16)} Ampliar</span></button>
      <div class="gallery-thumbs">${imgs.map((src, i) => `<button class="thumb ${i === 0 ? 'is-on' : ''}" data-action="gallery-set" data-src="${esc(src)}" aria-label="Ver imagem ${i + 1}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}</div>
    </div>`;
  };

  /* ---------- formulários ---------- */
  C.field = ({ label, name, type = 'text', value = '', required, placeholder = '', mask, autocomplete, hint, attrs = '', options, rows = 3, cls = '', id }) => {
    const fid = id || 'f-' + name + '-' + Math.random().toString(36).slice(2, 6);
    const req = required ? ' required' : '';
    const common = `id="${fid}" name="${esc(name)}"${req} ${autocomplete ? `autocomplete="${autocomplete}"` : ''} ${attrs}`;
    let input;
    if (type === 'select') {
      input = `<select ${common}>${options
        .map((o) => {
          const [v, l] = Array.isArray(o) ? o : [o, o];
          return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`;
        })
        .join('')}</select>`;
    } else if (type === 'textarea') {
      input = `<textarea ${common} rows="${rows}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`;
    } else if (type === 'checkbox') {
      return `<label class="check ${cls}"><input type="checkbox" ${common} ${value ? 'checked' : ''}><span>${label}</span></label>`;
    } else {
      input = `<input type="${type}" ${common} value="${esc(value)}" placeholder="${esc(placeholder)}" ${mask ? `data-mask="${mask}"` : ''}>`;
    }
    return `<div class="field ${cls}"><label for="${fid}">${esc(label)}${required ? ' <i aria-hidden="true">*</i>' : ''}</label>${input}${hint ? `<small class="hint">${hint}</small>` : ''}<small class="err" data-err="${esc(name)}"></small></div>`;
  };

  C.formError = (form, name, msg) => {
    const e = form.querySelector(`[data-err="${name}"]`);
    if (e) e.textContent = msg || '';
    const i = form.querySelector(`[name="${name}"]`);
    if (i) i.classList.toggle('is-invalid', !!msg);
  };
  C.clearErrors = (form) => {
    U.$$('[data-err]', form).forEach((e) => (e.textContent = ''));
    U.$$('.is-invalid', form).forEach((e) => e.classList.remove('is-invalid'));
  };

  /* endereço: CEP com preenchimento automático (ViaCEP, opcional) */
  C.addressFields = (a = {}, prefix = '') =>
    `<div class="grid-2">${C.field({ label: 'CEP', name: prefix + 'cep', value: a.cep || '', mask: 'cep', autocomplete: 'postal-code', attrs: 'data-input="cep-lookup" inputmode="numeric" maxlength="9"' })}<div></div></div>
    <div class="grid-2-1">${C.field({ label: 'Rua / Avenida', name: prefix + 'street', value: a.street || '', autocomplete: 'address-line1' })}${C.field({ label: 'Número', name: prefix + 'number', value: a.number || '' })}</div>
    <div class="grid-2">${C.field({ label: 'Complemento', name: prefix + 'complement', value: a.complement || '' })}${C.field({ label: 'Bairro', name: prefix + 'district', value: a.district || '' })}</div>
    <div class="grid-2-1">${C.field({ label: 'Cidade', name: prefix + 'city', value: a.city || '' })}${C.field({ label: 'UF', name: prefix + 'state', value: a.state || 'AM', attrs: 'maxlength="2"' })}</div>`;

  C.readAddress = (fd, prefix = '') => {
    const g = (k) => String(fd.get(prefix + k) || '').trim();
    return { cep: g('cep'), street: g('street'), number: g('number'), complement: g('complement'), district: g('district'), city: g('city'), state: g('state').toUpperCase() };
  };

  MP.on.input('cep-lookup', async (el) => {
    if (U.digits(el.value).length !== 8) return;
    const form = el.closest('form');
    const prefix = el.name.replace(/cep$/, '');
    const r = await U.lookupCep(el.value);
    if (!r) return;
    const set = (k, v) => {
      const i = form.querySelector(`[name="${prefix}${k}"]`);
      if (i && v && !i.value) i.value = v;
    };
    set('street', r.street);
    set('district', r.district);
    set('city', r.city);
    set('state', r.state);
  });

  /* ---------- ações globais de componentes ---------- */
  MP.on.click('step', (el) => {
    const input = el.parentElement.querySelector('input');
    const min = Number(input.min) || 1;
    const max = Number(input.max) || 9999;
    const v = Math.max(min, Math.min(max, (Number(input.value) || min) + Number(el.dataset.dir)));
    input.value = v;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  MP.on.click('fav-toggle', (el) => {
    const id = el.dataset.id;
    const on = MP.favorites.toggle(id);
    U.$$(`[data-action="fav-toggle"][data-id="${id}"]`).forEach((b) => {
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on);
      b.setAttribute('aria-label', on ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
    });
    MP.ui.toast(on ? 'Adicionado aos favoritos' : 'Removido dos favoritos', 'info', on ? { label: 'Ver favoritos', href: '#/conta/favoritos' } : null);
  });

  MP.on.click('add-to-cart', (el) => {
    const p = MP.catalog.byId(el.dataset.id);
    if (!p) return;
    const scope = el.closest('[data-id]') || document;
    const qtyInput = el.closest('.pcard, .buybox') && el.closest('.pcard, .buybox').querySelector('input[name="qty"]');
    const qty = Math.max(1, Math.floor(Number(qtyInput && qtyInput.value) || 1));
    const unitSel = el.closest('.buybox') && el.closest('.buybox').querySelector('select[name="unit"]');
    MP.cart.add(p.id, qty, unitSel ? unitSel.value : '');
    if (!el.dataset.label) el.dataset.label = el.innerHTML;
    el.classList.add('is-added');
    el.innerHTML = `${MP.icon('check', 16)} Adicionado`;
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.classList.remove('is-added');
      el.innerHTML = el.dataset.label;
    }, 1400);
    MP.ui.toast(`${qty}x ${p.name} adicionado ao orçamento`, 'ok', { label: 'Ver orçamento', href: '#/orcamento' });
    void scope;
  });

  MP.on.click('gallery-set', (el) => {
    const g = el.closest('[data-gallery]');
    g.querySelector('#gallery-main-img').src = el.dataset.src;
    U.$$('.thumb', g).forEach((t) => t.classList.toggle('is-on', t === el));
  });
  MP.on.click('lightbox', (el) => {
    const img = el.querySelector('img');
    MP.ui.lightbox(img.src, img.alt);
  });

  MP.on.click('scroll-x', (el) => {
    const t = document.getElementById(el.dataset.target);
    if (t) t.scrollBy({ left: Number(el.dataset.dir) * (t.clientWidth * 0.8), behavior: 'smooth' });
  });
})(window.MP);
