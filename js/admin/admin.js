/*
 * Painel administrativo (#/admin).
 * Cadastro de produtos, categorias, promoções, cupons, banners, pedidos, clientes e dados da loja.
 * Tudo grava nas coleções de MP.data (hoje localStorage) — trocando store.js por uma API, o painel continua igual.
 */
(function (MP) {
  const U = MP.util;
  const { esc, brl } = U;
  const C = MP.components;
  const A = (MP.admin = MP.admin || {});

  const NAV = [
    ['', 'dashboard', 'Painel'],
    ['produtos', 'box', 'Produtos'],
    ['categorias', 'grid', 'Categorias'],
    ['promocoes', 'percent', 'Promoções'],
    ['cupons', 'ticket', 'Cupons'],
    ['pedidos', 'clipboard', 'Pedidos'],
    ['clientes', 'users', 'Clientes'],
    ['banners', 'image', 'Banners'],
    ['loja', 'settings', 'Loja']
  ];

  A.shell = (active, title, inner, actions = '') => ({
    title: 'Admin · ' + title,
    layout: 'admin',
    html: `<div class="admin">
      <aside class="admin-side">
        <a class="admin-brand" href="#/admin">${C.logo('logo-admin')}<span>Painel<br>administrativo</span></a>
        <nav>${NAV.map(([k, ic, l]) => `<a href="#/admin${k ? '/' + k : ''}" class="${active === k ? 'is-on' : ''}">${MP.icon(ic, 18)} ${l}${k === 'pedidos' && MP.alerts && MP.alerts.pending() ? `<span class="nav-badge">${MP.alerts.pending()}</span>` : ''}</a>`).join('')}</nav>
        <div class="admin-side-foot"><a href="#/">${MP.icon('external', 16)} Ver o site</a><button data-action="admin-logout">${MP.icon('logout', 16)} Sair</button></div>
      </aside>
      <div class="admin-main"><header class="admin-top"><h1>${esc(title)}</h1><div class="admin-actions">${actions}${MP.alerts ? MP.alerts.button() : ''}</div></header>${inner}</div></div>`
  });

  MP.on.click('admin-logout', async () => {
    await MP.admin.logout();
    MP.router.go('/admin');
  });

  /* ---------- login do painel ---------- */
  const gate = () => {
    const cloud = MP.cloud.enabled;
    const def = !cloud && MP.settings.get().adminPasswordHash === U.sha256('admin123:mp-admin');
    return {
      title: 'Admin',
      layout: 'admin',
      html: `<div class="admin-gate"><form class="card" data-submit="admin-login" novalidate>
        <div class="center">${C.logo('logo-admin big')}</div><h1>Painel administrativo</h1>
        ${cloud ? C.field({ label: 'E-mail do administrador', name: 'email', type: 'email', required: true, autocomplete: 'username' }) : ''}
        ${C.field({ label: cloud ? 'Senha' : 'Senha do painel', name: 'password', type: 'password', required: true, autocomplete: 'current-password' })}
        <p class="form-error" data-err="form" role="alert"></p>
        <button class="btn btn-primary btn-block btn-lg">Entrar</button>
        ${def ? '<p class="demo-hint">Senha padrão de demonstração: <b>admin123</b>. Troque em Loja › Segurança.</p>' : ''}
        <p class="center"><a href="#/">← Voltar ao site</a></p></form></div>`
    };
  };
  MP.on.submit('admin-login', async (form, fd) => {
    C.clearErrors(form);
    const pw = String(fd.get('password') || '');
    if (MP.cloud.enabled) {
      const btn = form.querySelector('button');
      btn.disabled = true;
      const r = await MP.admin.login(String(fd.get('email') || ''), pw);
      btn.disabled = false;
      if (r.ok) MP.router.render(false);
      else C.formError(form, 'form', r.error);
      return;
    }
    if (MP.admin.login(pw)) MP.router.render(false);
    else C.formError(form, 'form', 'Senha incorreta.');
  });

  /* ---------- upload de imagens ---------- */
  const imgField = (name, label, values, multiple, raw, maxKB, dim) => {
    const vals = (values || []).filter(Boolean);
    return `<div class="field imgfield" data-imgfield data-multiple="${multiple ? 1 : 0}" data-raw="${raw ? 1 : 0}" data-max="${maxKB || 0}" data-dim="${dim || 0}">
      <label>${esc(label)}</label>
      <div class="img-previews">${previews(vals)}</div>
      <input type="hidden" name="${esc(name)}" value="${esc(JSON.stringify(vals))}">
      <label class="btn btn-outline btn-sm file-btn">${MP.icon('upload', 16)} Enviar ${multiple ? 'fotos' : 'imagem'}<input type="file" accept="image/*" ${multiple ? 'multiple' : ''} data-change="admin-img-add" hidden></label>
      <small class="hint">${raw ? `A imagem é usada exatamente como enviada (sem recompressão, máx. ${maxKB ? maxKB + ' KB' : MP.cloud.enabled ? '500 KB' : '1,5 MB'}).` : `As fotos são reduzidas para no máx. ${dim || (MP.cloud.enabled ? 600 : 900)} px para o site abrir rápido.`}</small></div>`;
  };
  const previews = (vals) => vals.map((src, i) => `<div class="img-prev"><img src="${esc(src)}" alt=""><button type="button" data-action="admin-img-del" data-i="${i}" aria-label="Remover imagem">${MP.icon('x', 12)}</button></div>`).join('');
  const readImgs = (wrap) => JSON.parse(wrap.querySelector('input[type=hidden]').value || '[]');
  const writeImgs = (wrap, vals) => {
    wrap.querySelector('input[type=hidden]').value = JSON.stringify(vals);
    wrap.querySelector('.img-previews').innerHTML = previews(vals);
  };
  MP.on.change('admin-img-add', async (el) => {
    const wrap = el.closest('[data-imgfield]');
    const multiple = wrap.dataset.multiple === '1';
    const raw = wrap.dataset.raw === '1';
    let vals = multiple ? readImgs(wrap) : [];
    for (const f of Array.from(el.files)) {
      if (!/^image\//.test(f.type)) continue;
      const maxKB = Number(wrap.dataset.max) || 0;
      const rawMax = maxKB ? maxKB * 1024 : MP.cloud.enabled ? 500 * 1024 : 1.5 * 1024 * 1024;
      if (raw && f.size > rawMax) {
        MP.ui.toast(`Imagem muito grande (máx. ${maxKB ? maxKB + ' KB' : MP.cloud.enabled ? '500 KB' : '1,5 MB'}).`, 'error');
        continue;
      }
      try {
        vals.push(raw ? await U.readFile(f) : MP.cloud.enabled ? await U.resizeImage(f, Number(wrap.dataset.dim) || 600, 0.72) : await U.resizeImage(f, Number(wrap.dataset.dim) || 900));
      } catch (e) {
        MP.ui.toast('Não foi possível ler a imagem.', 'error');
      }
    }
    writeImgs(wrap, vals.slice(0, 8));
    el.value = '';
  });
  MP.on.click('admin-img-del', (el) => {
    const wrap = el.closest('[data-imgfield]');
    const vals = readImgs(wrap);
    vals.splice(Number(el.dataset.i), 1);
    writeImgs(wrap, vals);
  });

  /* ---------- CRUD genérico ---------- */
  const RES = (A.resources = {});
  A.uniqueSlug = (coll, base, id) => {
    let s = U.slugify(base) || 'item';
    let n = 1;
    while (coll.all().some((x) => x.slug === s && x.id !== id)) s = U.slugify(base) + '-' + ++n;
    return s;
  };

  const fieldHtml = (f, val) => {
    if (f.type === 'images') return imgField(f.name, f.label, val, true, false, 0, f.dim);
    if (f.type === 'image') return imgField(f.name, f.label, val ? [val] : [], false, !!f.raw, f.max, f.dim);
    if (f.type === 'checkbox') return C.field({ label: f.label, name: f.name, type: 'checkbox', value: !!val, cls: f.cls });
    return C.field({ label: f.label, name: f.name, type: f.type || 'text', value: val == null ? '' : val, required: f.required, options: f.options && f.options(), hint: f.help, rows: f.rows, attrs: f.attrs || '', cls: f.cls });
  };
  const readField = (f, fd, form) => {
    if (f.type === 'checkbox') return !!form.querySelector(`[name="${f.name}"]`).checked;
    if (f.type === 'images') return JSON.parse(fd.get(f.name) || '[]');
    if (f.type === 'image') return JSON.parse(fd.get(f.name) || '[]')[0] || '';
    const v = String(fd.get(f.name) == null ? '' : fd.get(f.name));
    if (f.type === 'number') return v === '' ? null : Number(v.replace(',', '.'));
    return v.trim();
  };

  A.openForm = async (key, id) => {
    const r = RES[key];
    let item = id ? r.coll.get(id) : r.blank();
    // ex.: produtos — a foto não vem junto de r.coll.get() (fica à parte); busca antes de abrir o formulário,
    // senão o formulário abriria "sem foto" e salvar sem reenviar uma nova apagaria a foto do produto.
    if (id && r.hydrate) item = await r.hydrate(item);
    const vals = r.toForm ? r.toForm(item) : item;
    MP.ui.modal({
      title: (id ? 'Editar ' : 'Novo(a) ') + r.singular,
      wide: true,
      body: `<form data-submit="admin-save" data-res="${key}" data-id="${esc(id || '')}" novalidate>
        <div class="form-grid">${r.fields.map((f) => `<div class="${f.full ? 'full' : ''} ${f.type === 'checkbox' ? 'chk' : ''}">${fieldHtml(f, vals[f.name])}</div>`).join('')}</div>
        <p class="form-error" data-err="form" role="alert"></p>
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">Cancelar</button><button class="btn btn-primary">Salvar</button></div></form>`
    });
  };
  MP.on.click('admin-new', (el) => A.openForm(el.dataset.res));
  MP.on.click('admin-edit', (el) => A.openForm(el.dataset.res, el.dataset.id));
  MP.on.click('admin-del', async (el) => {
    const r = RES[el.dataset.res];
    const item = r.coll.get(el.dataset.id);
    if (r.canDelete) {
      const why = r.canDelete(item);
      if (why) return MP.ui.toast(why, 'error');
    }
    if (!(await MP.ui.confirm(`Excluir “${r.label(item)}”? Esta ação não pode ser desfeita.`, { ok: 'Excluir', danger: true }))) return;
    r.coll.remove(item.id);
    MP.ui.toast('Excluído.', 'info');
    MP.router.render(false);
  });
  MP.on.submit('admin-save', (form, fd) => {
    C.clearErrors(form);
    const r = RES[form.dataset.res];
    const id = form.dataset.id;
    const existing = id ? r.coll.get(id) : null;
    const vals = {};
    r.fields.forEach((f) => (vals[f.name] = readField(f, fd, form)));
    for (const f of r.fields) {
      if (f.required && (vals[f.name] === '' || vals[f.name] == null || Number.isNaN(vals[f.name]))) return C.formError(form, f.name, 'Campo obrigatório.');
      if (f.type === 'number' && vals[f.name] != null && (Number.isNaN(vals[f.name]) || vals[f.name] < 0)) return C.formError(form, f.name, 'Valor inválido.');
    }
    let item;
    try {
      item = r.fromForm(vals, existing || r.blank(), existing);
    } catch (e) {
      return C.formError(form, 'form', e.message);
    }
    if (!r.coll.save(item)) return C.formError(form, 'form', 'Não foi possível salvar (armazenamento cheio?).');
    MP.ui.closeAll();
    MP.ui.toast('Salvo com sucesso.');
    MP.router.render(false);
  });

  MP.on.input('admin-filter', (el) => {
    const q = U.norm(el.value);
    U.$$('.admin-table tbody tr').forEach((tr) => (tr.hidden = q && !U.norm(tr.textContent).includes(q)));
  });

  const table = (key, cols, rows, opts = {}) => {
    const r = RES[key];
    return `<div class="card admin-card">${opts.search ? `<div class="admin-tools"><input type="search" placeholder="Filtrar…" data-input="admin-filter" aria-label="Filtrar lista"></div>` : ''}
      <div class="table-scroll"><table class="admin-table"><thead><tr>${cols.map((c) => `<th>${c.h}</th>`).join('')}<th class="td-act">Ações</th></tr></thead><tbody>${rows
        .map(
          (it) => `<tr data-id="${esc(it.id)}">${cols.map((c) => `<td data-label="${esc(c.h)}">${c.r(it)}</td>`).join('')}<td class="td-act"><button class="icon-btn" data-action="admin-edit" data-res="${key}" data-id="${esc(it.id)}" aria-label="Editar">${MP.icon('edit', 18)}</button><button class="icon-btn" data-action="admin-del" data-res="${key}" data-id="${esc(it.id)}" aria-label="Excluir">${MP.icon('trash', 18)}</button></td></tr>`
        )
        .join('')}${rows.length ? '' : `<tr><td colspan="${cols.length + 1}" class="muted center">Nada cadastrado ainda.</td></tr>`}</tbody></table></div></div>`;
  };
  const addBtn = (key, label) => `<button class="btn btn-primary" data-action="admin-new" data-res="${key}">${MP.icon('plus', 16)} ${label}</button>`;
  const chip = (on, yes = 'Ativo', no = 'Inativo') => `<span class="status ${on ? 'status-done' : 'status-cancel'}">${on ? yes : no}</span>`;
  const thumb = (src) => `<img class="thumb-sm" src="${esc(src)}" alt="">`;

  /* ---------- produtos ---------- */
  const catOptions = () => MP.catalog.categories().map((c) => [c.slug, c.name]);
  RES.produtos = {
    coll: MP.data.products, singular: 'produto', label: (p) => p.name + ' ' + p.variant,
    blank: () => ({ id: U.uid('p'), name: '', variant: '', category: (MP.catalog.categories()[0] || {}).slug || '', type: '', brand: '', price: 0, oldPrice: null, cardPrice: null, wholesalePrice: null, wholesaleMin: 10, desc: '', longDesc: '', units: null, specs: {}, images: [], art: null, rating: 5, reviews: 0, sold: 0, createdAt: new Date().toISOString().slice(0, 10), stock: 0, featured: false, active: true }),
    hydrate: async (item) => {
      if (!MP.cloud.enabled) return item;
      await MP.cloud.fetchImages([item.id]);
      const cached = MP.cloud.imagesFor(item.id);
      // se ainda não existir foto no lugar novo (produto salvo antes desta atualização do site), usa a
      // que já vier junto do produto, em vez de apagar a foto sem querer.
      return Object.assign({}, item, { images: (cached && cached.length ? cached : item.images) || [] });
    },
    fields: [
      { name: 'name', label: 'Nome', required: true },
      { name: 'variant', label: 'Variação / medida', help: 'Ex.: 12 metros - Gerdau' },
      { name: 'category', label: 'Categoria', type: 'select', options: catOptions, required: true },
      { name: 'type', label: 'Tipo (filtro)', help: 'Ex.: Vergalhão, Tubo, Perfil…', required: true },
      { name: 'brand', label: 'Marca', required: true },
      { name: 'price', label: 'Preço à vista / PIX (R$)', type: 'number', attrs: 'step="0.01" min="0"', required: true },
      { name: 'oldPrice', label: 'Preço anterior (R$)', type: 'number', attrs: 'step="0.01" min="0"', help: 'Preencha para mostrar “de/por” e selo de desconto.' },
      { name: 'cardPrice', label: 'Preço no cartão (R$)', type: 'number', attrs: 'step="0.01" min="0"' },
      { name: 'wholesalePrice', label: 'Preço de atacado por unidade (R$)', type: 'number', attrs: 'step="0.01" min="0"', help: 'Opcional. Vale sozinho no orçamento quando o cliente pedir a quantidade mínima abaixo.' },
      { name: 'wholesaleMin', label: 'Atacado a partir de (unidades)', type: 'number', attrs: 'step="1" min="2"', help: 'Padrão: 10 unidades.' },
      { name: 'stock', label: 'Estoque (unidades)', type: 'number', attrs: 'step="1" min="0"', required: true },
      { name: 'unit', label: 'Unidade de venda', help: 'Ex.: Barra, Saco 50 kg, Unidade' },
      { name: 'desc', label: 'Descrição curta', type: 'textarea', rows: 2, full: true, required: true },
      { name: 'longDesc', label: 'Descrição completa', type: 'textarea', rows: 4, full: true },
      { name: 'specsText', label: 'Descrição técnica (uma por linha: Chave: valor)', type: 'textarea', rows: 6, full: true },
      { name: 'unitsText', label: 'Unidades alternativas (opcional; uma por linha: Nome | fator do preço)', type: 'textarea', rows: 3, full: true, help: 'Ex.: “Barra (12 m) | 1” e “Metro | 0.0917”. A primeira linha é a unidade padrão.' },
      { name: 'images', label: 'Fotos do produto', type: 'images', dim: 600, full: true },
      { name: 'featured', label: 'Mostrar em destaque na página inicial', type: 'checkbox' },
      { name: 'active', label: 'Produto ativo (visível na loja)', type: 'checkbox' }
    ],
    toForm(p) {
      return Object.assign({}, p, {
        unit: p.specs && p.specs['Unidade de venda'],
        specsText: Object.keys(p.specs || {}).filter((k) => k !== 'Unidade de venda').map((k) => `${k}: ${p.specs[k]}`).join('\n'),
        unitsText: (p.units || []).map((u) => `${u.label} | ${u.factor}`).join('\n')
      });
    },
    fromForm(v, base, existing) {
      const specs = {};
      v.specsText.split('\n').forEach((line) => {
        const i = line.indexOf(':');
        if (i > 0) specs[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      });
      if (v.unit) specs['Unidade de venda'] = v.unit;
      const units = v.unitsText
        ? v.unitsText.split('\n').map((l) => l.split('|')).filter((a) => a[0] && a[0].trim()).map((a, i) => ({ key: U.slugify(a[0]) || 'u' + i, label: a[0].trim(), factor: Number(String(a[1] || '1').replace(',', '.')) || 1 }))
        : null;
      if (!Number.isFinite(v.price) || v.price <= 0) throw new Error('Informe um preço maior que zero.');
      if (v.wholesalePrice && v.wholesalePrice >= v.price) throw new Error('O preço de atacado precisa ser menor que o preço à vista.');
      const p = Object.assign({}, base, {
        wholesalePrice: v.wholesalePrice ? U.round2(v.wholesalePrice) : null, wholesaleMin: Math.max(2, Math.floor(v.wholesaleMin) || 10),
        name: v.name, variant: v.variant, category: v.category, type: v.type, brand: v.brand,
        price: U.round2(v.price), oldPrice: v.oldPrice ? U.round2(v.oldPrice) : null, cardPrice: v.cardPrice ? U.round2(v.cardPrice) : U.round2(v.price * 1.05),
        stock: Math.floor(v.stock || 0), desc: v.desc, longDesc: v.longDesc || v.desc, specs, units: units && units.length ? units : null,
        images: v.images, featured: v.featured, active: v.active
      });
      p.slug = A.uniqueSlug(MP.data.products, `${p.name} ${p.variant}`, p.id);
      if (!existing && !p.images.length) p.art = MP.art.fallback(p.category);
      return p;
    },
    canDelete: () => null
  };

  /* ---------- categorias ---------- */
  RES.categorias = {
    coll: MP.data.categories, singular: 'categoria', label: (c) => c.name,
    blank: () => ({ id: U.uid('c'), slug: '', name: '', short: '', icon: 'box', order: MP.data.categories.all().length + 1, desc: '', image: '' }),
    fields: [
      { name: 'name', label: 'Nome', required: true },
      { name: 'short', label: 'Nome curto no menu', help: 'Opcional. Ex.: “Aço e Metais”.' },
      { name: 'icon', label: 'Ícone do menu', type: 'select', options: () => ['box', 'layers', 'nut', 'bolt', 'drop', 'roller', 'hardhat', 'wrench', 'tag', 'store'].map((i) => [i, i]) },
      { name: 'order', label: 'Ordem', type: 'number', attrs: 'step="1" min="1"', help: 'Define a ordem das categorias no menu do topo.' },
      { name: 'desc', label: 'Descrição', type: 'textarea', rows: 2, full: true },
      { name: 'image', label: 'Imagem da categoria (opcional)', type: 'image', dim: 320, full: true }
    ],
    fromForm(v, base, existing) {
      const c = Object.assign({}, base, { name: v.name, short: v.short, icon: v.icon, order: v.order || 99, desc: v.desc, image: v.image });
      if (!existing) c.slug = A.uniqueSlug(MP.data.categories, v.name, c.id);
      return c;
    },
    canDelete: (c) => (MP.data.products.all().some((p) => p.category === c.slug) ? 'Existem produtos nesta categoria. Mova ou exclua os produtos primeiro.' : null)
  };

  /* ---------- cupons ---------- */
  RES.cupons = {
    coll: MP.data.coupons, singular: 'cupom', label: (c) => c.code,
    blank: () => ({ id: U.uid('c'), code: '', type: 'percent', value: 10, min: 0, active: true, desc: '', expires: '' }),
    fields: [
      { name: 'code', label: 'Código', required: true },
      { name: 'type', label: 'Tipo', type: 'select', options: () => [['percent', 'Percentual (%)'], ['fixed', 'Valor fixo (R$)']] },
      { name: 'value', label: 'Valor', type: 'number', attrs: 'step="0.01" min="0"', required: true },
      { name: 'min', label: 'Compra mínima (R$)', type: 'number', attrs: 'step="0.01" min="0"' },
      { name: 'expires', label: 'Válido até', type: 'date' },
      { name: 'desc', label: 'Descrição interna' },
      { name: 'active', label: 'Cupom ativo', type: 'checkbox' }
    ],
    fromForm(v, base) {
      const code = v.code.toUpperCase().replace(/\s+/g, '');
      if (MP.data.coupons.all().some((c) => c.code === code && c.id !== base.id)) throw new Error('Já existe um cupom com este código.');
      if (v.type === 'percent' && v.value > 100) throw new Error('O percentual não pode passar de 100.');
      return Object.assign({}, base, { code, type: v.type, value: v.value, min: v.min || 0, expires: v.expires, desc: v.desc, active: v.active });
    }
  };

  /* ---------- banners ---------- */
  RES.banners = {
    coll: MP.data.banners, singular: 'banner', label: (b) => b.title,
    blank: () => ({ id: U.uid('b'), active: true, order: MP.data.banners.all().length + 1, hero: 'steel', theme: 'dark', kicker: '', title: '', brand: '', text: '', cta: 'COMPRAR AGORA', link: '#/busca', badge: '', image: '', imageMobile: '' }),
    fields: [
      { name: 'title', label: 'Título principal', required: true },
      { name: 'kicker', label: 'Linha acima do título' },
      { name: 'brand', label: 'Linha destacada (amarelo)' },
      { name: 'cta', label: 'Texto do botão' },
      { name: 'link', label: 'Link do botão', help: 'Ex.: #/categoria/eletrica' },
      { name: 'hero', label: 'Ilustração padrão', type: 'select', options: () => [['steel', 'Aço e metais'], ['eletro', 'Elétrica e hidráulica'], ['tools', 'Ferramentas']] },
      { name: 'order', label: 'Ordem (0 = primeiro)', type: 'number', attrs: 'step="1" min="0"' },
      { name: 'image', label: 'Imagem do banner no computador (ideal: 1920 × 600 px)', type: 'image', raw: true, max: MP.cloud.enabled ? 350 : 0, full: true },
      { name: 'imageMobile', label: 'Imagem do banner no celular (opcional, ideal: 800 × 500 px)', type: 'image', raw: true, max: MP.cloud.enabled ? 350 : 0, full: true },
      { name: 'full', label: 'Banner só com imagem (arte pronta: não mostra título, texto e botão do site)', type: 'checkbox' },
      { name: 'active', label: 'Banner ativo', type: 'checkbox' }
    ],
    fromForm: (v, base) => {
      if (v.full && !v.image) throw new Error('Envie a imagem do banner para usar “só com imagem”.');
      return Object.assign({}, base, v, { order: v.order === '' || v.order == null ? 1 : v.order });
    }
  };

  /* ---------- páginas ---------- */
  const page = {};

  page.produtos = () => {
    const rows = MP.data.products.all().slice().sort((a, b) => a.name.localeCompare(b.name));
    return Object.assign(A.shell('produtos', 'Produtos', table('produtos', [
      { h: 'Produto', r: (p) => `<div class="cell-prod">${thumb(MP.art.main(p))}<span><b>${esc(p.name)}</b><small>${esc(p.variant)}</small></span></div>` },
      { h: 'Categoria', r: (p) => esc((MP.catalog.category(p.category) || {}).name || '—') },
      { h: 'Preço', r: (p) => brl(p.price) },
      { h: 'Estoque', r: (p) => `<span class="${p.stock <= 5 ? 'text-err' : ''}">${p.stock}</span>` },
      { h: 'Status', r: (p) => chip(p.active !== false) }
    ], rows, { search: true }),
    (MP.data.products.get('mp001') ? '' : `<button class="btn btn-outline" data-action="admin-import-mp">${MP.icon('upload', 16)} Importar produtos dos folhetos</button> `) + addBtn('produtos', 'Novo produto')), {
      mount: (app) => {
        if (!MP.cloud.enabled) return;
        MP.cloud.fetchImages(rows.map((p) => p.id)).then(() => {
          U.$$('.admin-table tbody tr[data-id]', app).forEach((tr) => {
            const p = MP.catalog.byId(tr.dataset.id);
            const img = tr.querySelector('.thumb-sm');
            if (p && img) img.src = MP.art.main(p);
          });
        });
      }
    });
  };

  /* Importa os produtos reais (seed-mp.js) e, se quiser, apaga os de demonstração. */
  MP.on.click('admin-import-mp', async (el) => {
    const prods = MP.seed.mpProducts;
    const cats = MP.seed.mpCategories;
    if (!(await MP.ui.confirm(`Importar ${prods.length} produtos dos folhetos (com os preços) e as categorias “Telhado e Calhas” e “Solda”?`, { ok: 'Importar' }))) return;
    el.disabled = true;
    const okAll = cats.concat(prods).every((x) => (x.category ? MP.data.products : MP.data.categories).save(Object.assign({}, x)));
    if (!okAll) {
      el.disabled = false;
      return MP.ui.toast('Não foi possível salvar todos os produtos. Tente de novo.', 'error');
    }
    const demo = MP.seed.products.map((x) => x.id).filter((id) => MP.data.products.get(id));
    if (demo.length && (await MP.ui.confirm(`Produtos importados! Deseja apagar agora os ${demo.length} produtos de demonstração que vieram com o site?`, { ok: 'Apagar demonstração', danger: true }))) {
      demo.forEach((id) => MP.data.products.remove(id));
    }
    MP.ui.toast(`${prods.length} produtos importados.`);
    MP.router.render(false);
  });
  page.categorias = () => A.shell('categorias', 'Categorias', table('categorias', [
    { h: 'Categoria', r: (c) => `<div class="cell-prod">${thumb(c.image || MP.art.url(c.art || MP.art.fallback(c.slug), 0))}<span><b>${esc(c.name)}</b><small>#/categoria/${esc(c.slug)}</small></span></div>` },
    { h: 'Ordem', r: (c) => c.order },
    { h: 'Produtos', r: (c) => MP.data.products.all().filter((p) => p.category === c.slug).length }
  ], MP.catalog.categories()), addBtn('categorias', 'Nova categoria'));
  page.cupons = () => A.shell('cupons', 'Cupons de desconto', table('cupons', [
    { h: 'Código', r: (c) => `<b>${esc(c.code)}</b><small class="block">${esc(c.desc || '')}</small>` },
    { h: 'Desconto', r: (c) => (c.type === 'percent' ? c.value + '%' : brl(c.value)) },
    { h: 'Mínimo', r: (c) => (c.min ? brl(c.min) : '—') },
    { h: 'Validade', r: (c) => (c.expires ? U.fmtDate(c.expires) : 'Sem prazo') },
    { h: 'Status', r: (c) => chip(c.active) }
  ], MP.data.coupons.all()), addBtn('cupons', 'Novo cupom'));
  const storeBanners = () => MP.seed.banners.filter((b) => /^b0/.test(b.id));
  page.banners = () => A.shell('banners', 'Banners da página inicial', table('banners', [
    { h: 'Banner', r: (b) => `<b>${esc(b.title)}</b><small class="block">${esc(b.kicker || '')} ${esc(b.brand || '')}</small>` },
    { h: 'Botão / link', r: (b) => (b.full ? '<small class="block">Só imagem</small>' : `${esc(b.cta || '—')} <small class="block">${esc(b.link || '')}</small>`) },
    { h: 'Ordem', r: (b) => b.order },
    { h: 'Status', r: (b) => chip(b.active !== false) }
  ], MP.data.banners.all().slice().sort((a, b) => a.order - b.order)),
    (storeBanners().some((b) => !MP.data.banners.get(b.id)) ? `<button class="btn btn-outline" data-action="admin-brand-banner">${MP.icon('image', 16)} Adicionar banners da MP Ferragens</button> ` : '') + addBtn('banners', 'Novo banner'));
  MP.on.click('admin-brand-banner', () => {
    const faltam = storeBanners().filter((b) => !MP.data.banners.get(b.id));
    if (!faltam.length || !faltam.every((b) => MP.data.banners.save(Object.assign({}, b)))) return;
    MP.ui.toast(faltam.length > 1 ? `${faltam.length} banners da loja adicionados ao carrossel.` : 'Banner da loja adicionado ao carrossel.');
    MP.router.render(false);
  });

  /* ---------- painel (dashboard) ---------- */
  page[''] = () => {
    const orders = MP.data.orders.all();
    const valid = orders.filter((o) => o.status !== 'Cancelado');
    const revenue = valid.reduce((a, o) => a + o.total, 0);
    const prods = MP.data.products.all();
    const low = prods.filter((p) => p.stock <= 5 && p.active !== false).sort((a, b) => a.stock - b.stock);
    const by = {};
    MP.ORDER_STATUS.forEach((s) => (by[s] = orders.filter((o) => o.status === s).length));
    const max = Math.max(1, ...Object.values(by));
    const recent = orders.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
    const stat = (ic, label, val, sub) => `<div class="stat">${MP.icon(ic, 24)}<div><small>${label}</small><b>${val}</b>${sub ? `<em>${sub}</em>` : ''}</div></div>`;
    const empty = MP.cloud.enabled && !prods.length && !MP.data.categories.all().length;
    return A.shell('', 'Painel', `
      ${empty ? `<div class="card admin-card"><h2>Seu catálogo na nuvem está vazio</h2><p class="muted">Publique o catálogo de demonstração (categorias, produtos, banners e cupons) para ter um ponto de partida. Depois é só editar tudo por aqui.</p><button class="btn btn-primary" data-action="admin-seed">${MP.icon('upload', 16)} Publicar catálogo de demonstração</button></div>` : ''}
      <div class="stats">${stat('clipboard', 'Pedidos', orders.length, `${by['Aguardando'] + by['Em separação']} em andamento`)}${stat('coin', 'Faturamento (sem cancelados)', brl(revenue))}${stat('users', 'Clientes', MP.data.users.all().length)}${stat('box', 'Produtos ativos', prods.filter((p) => p.active !== false).length, `${low.length} com estoque baixo`)}</div>
      <div class="admin-cols">
        <div class="card admin-card"><div class="card-head"><h2>Últimos pedidos</h2><a href="#/admin/pedidos" class="link-ic">Ver todos</a></div>
          <table class="admin-table"><tbody>${recent.map((o) => `<tr><td><b>#${esc(o.id)}</b></td><td>${esc(o.customer.name)}</td><td>${brl(o.total)}</td><td>${MP.statusBadge(o.status)}</td></tr>`).join('') || '<tr><td class="muted">Sem pedidos.</td></tr>'}</tbody></table></div>
        <div class="card admin-card"><div class="card-head"><h2>Pedidos por status</h2></div>
          <ul class="bars">${MP.ORDER_STATUS.map((s) => `<li><span>${s}</span><div class="bar"><i class="bar-${MP.statusClass(s)}" style="width:${(by[s] / max) * 100}%"></i></div><b>${by[s]}</b></li>`).join('')}</ul>
          <div class="card-head"><h2>Estoque baixo</h2></div>
          <ul class="low-list">${low.slice(0, 6).map((p) => `<li><span>${esc(p.name)} <small>${esc(p.variant)}</small></span><b class="text-err">${p.stock}</b></li>`).join('') || '<li class="muted">Tudo em ordem.</li>'}</ul></div>
      </div>`);
  };

  /* roteamento */
  const handler = (ctx) => {
    if (!MP.admin.isLogged()) return gate();
    const sec = ctx.params.section || '';
    const fn = page[sec];
    if (!fn) return A.shell('', 'Não encontrado', '<div class="card"><p>Seção não encontrada.</p></div>');
    return fn(ctx);
  };
  A.page = page;
  A.table = table;
  A.chip = chip;
  A.imgField = imgField;
  A.handler = handler;
})(window.MP);
