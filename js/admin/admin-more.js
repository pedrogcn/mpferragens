/* Painel: promoções, pedidos, clientes e configurações da loja. */
(function (MP) {
  const U = MP.util;
  const { esc, brl } = U;
  const C = MP.components;
  const A = MP.admin;
  const page = A.page;

  /* ================= PROMOÇÕES ================= */
  const activePromoIds = () => {
    const ids = new Set();
    MP.data.promotions.all().filter((p) => p.active).forEach((p) => p.items.forEach((i) => ids.add(i.id)));
    return ids;
  };

  page.promocoes = () => {
    const list = MP.data.promotions.all().slice().reverse();
    return A.shell('promocoes', 'Promoções', `<div class="card admin-card">
      <p class="muted pad">Uma promoção aplica um desconto percentual nos produtos escolhidos: o preço atual vira “preço anterior” (riscado) e o novo preço passa a valer. Ao encerrar, os preços originais voltam.</p>
      <div class="table-scroll"><table class="admin-table"><thead><tr><th>Promoção</th><th>Desconto</th><th>Produtos</th><th>Status</th><th class="td-act">Ações</th></tr></thead><tbody>${list
        .map((p) => `<tr><td data-label="Promoção"><b>${esc(p.name)}</b><small class="block">${U.fmtDate(p.createdAt)}</small></td><td data-label="Desconto">${p.percent}%</td><td data-label="Produtos">${p.items.length}</td><td data-label="Status">${A.chip(p.active, 'Ativa', 'Encerrada')}</td><td class="td-act">${p.active ? `<button class="btn btn-outline btn-sm" data-action="promo-end" data-id="${p.id}">Encerrar</button>` : `<button class="icon-btn" data-action="promo-del" data-id="${p.id}" aria-label="Excluir">${MP.icon('trash', 18)}</button>`}</td></tr>`)
        .join('') || '<tr><td colspan="5" class="muted center">Nenhuma promoção criada.</td></tr>'}</tbody></table></div></div>`,
    `<button class="btn btn-primary" data-action="promo-new">${MP.icon('plus', 16)} Nova promoção</button>`);
  };

  MP.on.click('promo-new', () => {
    const busy = activePromoIds();
    const prods = MP.data.products.all().filter((p) => p.active !== false);
    MP.ui.modal({
      title: 'Nova promoção',
      wide: true,
      body: `<form data-submit="promo-save" novalidate>
        <div class="grid-2">${C.field({ label: 'Nome da promoção', name: 'name', required: true, placeholder: 'Ex.: Semana do Construtor' })}${C.field({ label: 'Desconto (%)', name: 'percent', type: 'number', required: true, attrs: 'min="1" max="90" step="1"', value: 10 })}</div>
        ${C.field({ label: 'Aplicar em', name: 'target', type: 'select', options: [['all', 'Todos os produtos'], ...MP.catalog.categories().map((c) => ['cat:' + c.slug, 'Categoria: ' + c.name]), ['custom', 'Produtos selecionados…']], attrs: 'data-change="promo-target"' })}
        <div class="promo-pick" hidden><div class="pick-list">${prods.map((p) => `<label class="check"><input type="checkbox" name="pick" value="${p.id}" ${busy.has(p.id) ? 'disabled' : ''}><span>${esc(p.name)} <em>${esc(p.variant)}</em> — ${brl(p.price)}${busy.has(p.id) ? ' (já em promoção)' : ''}</span></label>`).join('')}</div></div>
        <p class="form-error" data-err="form" role="alert"></p>
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">Cancelar</button><button class="btn btn-primary">Criar promoção</button></div></form>`
    });
  });
  MP.on.change('promo-target', (el) => (el.closest('form').querySelector('.promo-pick').hidden = el.value !== 'custom'));
  MP.on.submit('promo-save', (form, fd) => {
    C.clearErrors(form);
    const name = String(fd.get('name') || '').trim();
    const pct = Number(fd.get('percent'));
    if (!name) return C.formError(form, 'name', 'Dê um nome à promoção.');
    if (!(pct >= 1 && pct <= 90)) return C.formError(form, 'percent', 'Use um percentual entre 1 e 90.');
    const target = String(fd.get('target'));
    const busy = activePromoIds();
    let prods = MP.data.products.all().filter((p) => p.active !== false && !busy.has(p.id));
    if (target.startsWith('cat:')) prods = prods.filter((p) => p.category === target.slice(4));
    else if (target === 'custom') {
      const picks = fd.getAll('pick');
      prods = prods.filter((p) => picks.includes(p.id));
    }
    if (!prods.length) return C.formError(form, 'form', 'Nenhum produto disponível para esta promoção.');
    const items = [];
    prods.forEach((p) => {
      const np = U.round2(p.price * (1 - pct / 100));
      const nc = p.cardPrice ? U.round2(p.cardPrice * (1 - pct / 100)) : null;
      items.push({ id: p.id, price: p.price, oldPrice: p.oldPrice, cardPrice: p.cardPrice, appliedPrice: np });
      MP.data.products.save(Object.assign({}, p, { oldPrice: p.price, price: np, cardPrice: nc }));
    });
    MP.data.promotions.save({ id: U.uid('promo'), name, percent: pct, active: true, createdAt: new Date().toISOString(), items });
    MP.ui.closeAll();
    MP.ui.toast(`Promoção criada em ${items.length} produtos.`);
    MP.router.render(false);
  });
  MP.on.click('promo-end', async (el) => {
    if (!(await MP.ui.confirm('Encerrar a promoção e restaurar os preços originais?', { ok: 'Encerrar' }))) return;
    const promo = MP.data.promotions.get(el.dataset.id);
    promo.items.forEach((i) => {
      const p = MP.data.products.get(i.id);
      if (p && p.price === i.appliedPrice) MP.data.products.save(Object.assign({}, p, { price: i.price, oldPrice: i.oldPrice, cardPrice: i.cardPrice }));
    });
    promo.active = false;
    MP.data.promotions.save(promo);
    MP.ui.toast('Promoção encerrada.', 'info');
    MP.router.render(false);
  });
  MP.on.click('promo-del', (el) => {
    MP.data.promotions.remove(el.dataset.id);
    MP.router.render(false);
  });

  /* ================= PEDIDOS ================= */
  const waCustomer = (o, text) => {
    let d = U.digits(o.customer.phone);
    if (d.length <= 11) d = '55' + d;
    return MP.orders.waLink(text, d);
  };

  page.pedidos = (ctx) => {
    const st = ctx.query.status || '';
    const all = MP.data.orders.all().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const list = st ? all.filter((o) => o.status === st) : all;
    return A.shell('pedidos', 'Pedidos', `<div class="card admin-card">
      <div class="admin-tools"><label class="sort">Status <select data-change="admin-orders-filter"><option value="">Todos</option>${MP.ORDER_STATUS.map((s) => `<option ${st === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label><span class="muted">${list.length} pedidos</span></div>
      <div class="table-scroll"><table class="admin-table"><thead><tr><th>Pedido</th><th>Data</th><th>Cliente</th><th>Total</th><th>Status</th><th class="td-act">Ações</th></tr></thead><tbody>${list
        .map((o) => `<tr><td data-label="Pedido"><b>#${esc(o.id)}</b></td><td data-label="Data">${U.fmtDateTime(o.createdAt)}</td><td data-label="Cliente">${esc(o.customer.name)}<small class="block">${esc(o.customer.phone || '')}</small></td><td data-label="Total">${brl(o.total)}</td>
          <td data-label="Status"><select class="status-select status-${MP.statusClass(o.status)}" data-change="admin-order-status" data-id="${esc(o.id)}" aria-label="Status do pedido ${esc(o.id)}">${MP.ORDER_STATUS.map((s) => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
          <td class="td-act"><button class="icon-btn" data-action="admin-order-view" data-id="${esc(o.id)}" aria-label="Ver pedido">${MP.icon('eye', 18)}</button><button class="icon-btn" data-action="admin-order-del" data-id="${esc(o.id)}" aria-label="Excluir pedido ${esc(o.id)}">${MP.icon('trash', 18)}</button></td></tr>`)
        .join('') || '<tr><td colspan="6" class="muted center">Nenhum pedido.</td></tr>'}</tbody></table></div></div>`);
  };
  MP.on.change('admin-orders-filter', (el) => MP.router.setQuery({ status: el.value }));
  MP.on.change('admin-order-status', (el) => {
    const o = MP.data.orders.get(el.dataset.id);
    o.status = el.value;
    o.history = (o.history || []).concat({ status: el.value, at: new Date().toISOString() });
    MP.data.orders.save(o);
    el.className = 'status-select status-' + MP.statusClass(o.status);
    MP.ui.toast(`Pedido #${o.id}: ${o.status}`);
  });
  MP.on.click('admin-order-del', async (el) => {
    const o = MP.data.orders.get(el.dataset.id);
    if (!o) return;
    if (!(await MP.ui.confirm(`Excluir o pedido #${o.id} de ${o.customer.name}? Esta ação não pode ser desfeita e o cliente deixa de ver este pedido.`, { ok: 'Excluir pedido', danger: true }))) return;
    MP.data.orders.remove(o.id);
    MP.ui.toast(`Pedido #${o.id} excluído.`, 'info');
    MP.router.render(false);
  });
  MP.on.click('admin-order-view', (el) => {
    const o = MP.data.orders.get(el.dataset.id);
    MP.ui.modal({
      title: `Pedido #${o.id}`,
      wide: true,
      body: `<p>${MP.statusBadge(o.status)} · ${U.fmtDateTime(o.createdAt)}</p>
        <p><b>${esc(o.customer.name)}</b> · ${esc(o.customer.phone || '')} ${o.customer.email ? '· ' + esc(o.customer.email) : ''}<br>${o.delivery.mode === 'retirada' ? 'Retirada na loja' : 'Entrega · CEP ' + esc(o.delivery.cep || 'a combinar')}</p>
        <table class="admin-table"><thead><tr><th>Produto</th><th>Qtd.</th><th>Preço</th><th>Valor</th></tr></thead><tbody>${o.items.map((i) => `<tr><td>${esc(i.name)} <small>${esc(i.variant || '')}</small></td><td>${i.qty}</td><td>${brl(i.price)}</td><td>${brl(U.round2(i.price * i.qty))}</td></tr>`).join('')}</tbody></table>
        <dl class="totals"><div><dt>Subtotal</dt><dd>${brl(o.subtotal)}</dd></div>${o.discount ? `<div class="disc"><dt>Desconto ${o.coupon ? '(' + esc(o.coupon) + ')' : ''}</dt><dd>- ${brl(o.discount)}</dd></div>` : ''}<div><dt>Frete</dt><dd>${o.shipping ? brl(o.shipping) : 'Grátis'}</dd></div><div class="grand"><dt>Total</dt><dd>${brl(o.total)}</dd></div></dl>`,
      footer: `<a class="btn btn-wa" target="_blank" rel="noopener" href="${esc(waCustomer(o, `Olá, ${o.customer.name}! Sobre o seu pedido #${o.id} na ${MP.settings.get().storeName}:`))}">${MP.icon('whatsapp', 16)} Falar com o cliente</a><button class="btn btn-ghost" data-action="modal-close">Fechar</button>`
    });
  });

  /* ================= CLIENTES ================= */
  page.clientes = () => {
    const orders = MP.data.orders.all();
    const users = MP.data.users.all().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const guests = {};
    orders.filter((o) => !o.userId).forEach((o) => {
      const k = U.digits(o.customer.phone) || o.customer.name;
      guests[k] = guests[k] || { name: o.customer.name, phone: o.customer.phone, n: 0, total: 0 };
      guests[k].n++;
      guests[k].total += o.total;
    });
    return A.shell('clientes', 'Clientes', `<div class="card admin-card"><div class="admin-tools"><input type="search" placeholder="Filtrar…" data-input="admin-filter" aria-label="Filtrar clientes"></div>
      <div class="table-scroll"><table class="admin-table"><thead><tr><th>Cliente</th><th>Documento</th><th>Contato</th><th>Cadastro</th><th>Pedidos</th><th>Total comprado</th></tr></thead><tbody>${users
        .map((u) => {
          const mine = orders.filter((o) => o.userId === u.id && o.status !== 'Cancelado');
          return `<tr><td data-label="Cliente"><b>${esc(u.name)}</b><small class="block">${u.type === 'pj' ? 'Pessoa jurídica' : 'Pessoa física'}</small></td><td data-label="Documento">${esc(U.maskDoc(u.doc))}</td><td data-label="Contato">${esc(u.phone)}<small class="block">${esc(u.email)}</small></td><td data-label="Cadastro">${U.fmtDate(u.createdAt)}</td><td data-label="Pedidos">${mine.length}</td><td data-label="Total comprado">${brl(mine.reduce((a, o) => a + o.total, 0))}</td></tr>`;
        })
        .join('')}${Object.values(guests)
        .map((g) => `<tr><td data-label="Cliente"><b>${esc(g.name)}</b><small class="block">Visitante (sem conta)</small></td><td data-label="Documento">—</td><td data-label="Contato">${esc(g.phone || '')}</td><td data-label="Cadastro">—</td><td data-label="Pedidos">${g.n}</td><td data-label="Total comprado">${brl(g.total)}</td></tr>`)
        .join('')}</tbody></table></div></div>`);
  };

  /* ================= LOJA ================= */
  page.loja = () => {
    const s = MP.settings.get();
    const f = (label, name, val, extra = {}) => C.field(Object.assign({ label, name, value: val }, extra));
    return A.shell('loja', 'Informações da loja', `
      <form class="card" data-submit="admin-store-save" novalidate>
        <h2>Identidade</h2>
        <div class="grid-2">${f('Nome da loja', 'storeName', s.storeName, { required: true })}${f('Slogan', 'tagline', s.tagline)}</div>
        ${A.imgField('logo', 'Logo oficial (aparece no topo, rodapé, painel e impressão)', s.logo ? [s.logo] : [], false, true)}
        <h2>Contato e WhatsApp</h2>
        <div class="grid-3">${f('Número do WhatsApp (só dígitos, com 55 + DDD)', 'whatsapp', s.whatsapp, { required: true, hint: 'É para este número que os orçamentos são enviados. Ex.: 5592999999999', attrs: 'inputmode="numeric"' })}${f('WhatsApp (como aparece no site)', 'whatsappDisplay', s.whatsappDisplay)}${f('Telefone', 'phone', s.phone)}</div>
        ${f('E-mail', 'email', s.email, { type: 'email' })}
        <h2>Endereço e horário</h2>
        <div class="grid-2-1">${f('Rua / Avenida e número', 'address.street', s.address.street)}${f('CEP', 'address.cep', s.address.cep, { mask: 'cep' })}</div>
        <div class="grid-3">${f('Bairro', 'address.district', s.address.district)}${f('Cidade', 'address.city', s.address.city)}${f('UF', 'address.state', s.address.state, { attrs: 'maxlength="2"' })}</div>
        ${C.field({ label: 'Horário de funcionamento (um por linha)', name: 'hours', type: 'textarea', rows: 3, value: s.hours.join('\n') })}
        <h2>Redes sociais</h2>
        <div class="grid-2">${f('@ do Instagram', 'handle', s.handle)}${f('Instagram (link)', 'social.instagram', s.social.instagram)}${f('Facebook (link)', 'social.facebook', s.social.facebook)}${f('TikTok (link)', 'social.tiktok', s.social.tiktok)}${f('YouTube (link)', 'social.youtube', s.social.youtube)}</div>
        <h2>Frete</h2>
        <div class="grid-3">${f('Manaus: valor (R$)', 'shipping.manausPrice', s.shipping.manausPrice, { type: 'number', attrs: 'step="0.01" min="0"' })}${f('Manaus: prazo', 'shipping.manausDays', s.shipping.manausDays)}${f('Interior do AM: valor (R$)', 'shipping.interiorPrice', s.shipping.interiorPrice, { type: 'number', attrs: 'step="0.01" min="0"' })}
        ${f('Interior do AM: prazo', 'shipping.interiorDays', s.shipping.interiorDays)}${f('Texto da retirada na loja', 'pickupText', s.pickupText)}</div>
        <div class="grid-2">${f('Frete grátis acima de (R$)', 'shipping.freeAbove', s.shipping.freeAbove, { type: 'number', attrs: 'step="0.01" min="0"', hint: 'Vale para Manaus e Interior, exceto quando o pedido tem telha.' })}${f('Com telha no pedido, frete grátis acima de (R$)', 'shipping.freeAboveTelha', s.shipping.freeAboveTelha, { type: 'number', attrs: 'step="0.01" min="0"' })}</div>
        <p class="muted small">Outras regiões aparecem como “frete a combinar pelo WhatsApp”.</p>
        <h2>Segurança do painel</h2>
        ${MP.cloud.enabled ? '<p class="muted small">O acesso ao painel é feito com o e-mail e a senha da sua conta. Para trocar a senha, use “Meus dados” na área do cliente ou o link “Esqueci minha senha”.</p>' : `<div class="grid-2">${f('Nova senha do painel (deixe vazio para manter)', 'newAdminPassword', '', { type: 'password', autocomplete: 'new-password' })}</div>`}
        <p class="form-error" data-err="form" role="alert"></p>
        <div class="form-actions"><button class="btn btn-primary btn-lg">Salvar alterações</button></div>
      </form>
      ${MP.cloud.enabled
        ? `<div class="card"><h2>Dados na nuvem</h2>
        <p class="muted">Produtos, pedidos, clientes e configurações ficam salvos no Firebase e aparecem para todos em tempo real. O Google mantém o banco replicado, mas o plano gratuito não faz cópias programadas: cuidado ao apagar produtos ou pedidos, pois não dá para desfazer.</p>
        <div class="row-actions wrap"><button class="btn btn-outline" data-action="admin-optimize">${MP.icon('refresh', 16)} Otimizar fotos do site</button></div>
        <p class="muted small">“Otimizar fotos” reduz as fotos já cadastradas (produtos e categorias) para o site abrir mais rápido no celular. Pode rodar quando quiser; fotos já pequenas não são alteradas.</p></div>`
        : `<div class="card"><h2>Dados e backup</h2>
        <p class="muted">Os dados do site ficam salvos neste navegador. Faça backup para levar para outro computador ou antes de limpar o navegador.</p>
        <div class="row-actions wrap"><button class="btn btn-outline" data-action="admin-export">${MP.icon('download', 16)} Exportar backup (JSON)</button>
        <label class="btn btn-outline file-btn">${MP.icon('upload', 16)} Importar backup<input type="file" accept="application/json" data-change="admin-import" hidden></label>
        <button class="btn btn-ghost link-danger" data-action="admin-reset">${MP.icon('refresh', 16)} Restaurar dados de demonstração</button></div></div>`}`);
  };

  const setPath = (obj, path, val) => {
    const ks = path.split('.');
    let o = obj;
    ks.slice(0, -1).forEach((k) => (o = o[k] = o[k] || {}));
    o[ks[ks.length - 1]] = val;
  };
  MP.on.submit('admin-store-save', (form, fd) => {
    C.clearErrors(form);
    const patch = {};
    ['storeName', 'tagline', 'whatsappDisplay', 'phone', 'email', 'handle', 'pickupText', 'address.street', 'address.cep', 'address.district', 'address.city', 'address.state', 'social.instagram', 'social.facebook', 'social.tiktok', 'social.youtube', 'shipping.manausDays', 'shipping.interiorDays'].forEach((k) => setPath(patch, k, String(fd.get(k) || '').trim()));
    ['shipping.manausPrice', 'shipping.interiorPrice', 'shipping.freeAbove', 'shipping.freeAboveTelha'].forEach((k) => setPath(patch, k, Number(String(fd.get(k) || '0').replace(',', '.')) || 0));
    if (!patch.storeName) return C.formError(form, 'storeName', 'Informe o nome da loja.');
    const wa = U.digits(fd.get('whatsapp'));
    if (wa.length < 12 || wa.length > 13) return C.formError(form, 'whatsapp', 'Use o formato 55 + DDD + número (12 ou 13 dígitos).');
    patch.whatsapp = wa;
    patch.hours = String(fd.get('hours') || '').split('\n').map((x) => x.trim()).filter(Boolean);
    const logo = JSON.parse(fd.get('logo') || '[]')[0];
    patch.logo = logo || 'assets/logo.jpg';
    const np = String(fd.get('newAdminPassword') || '');
    if (np) {
      if (np.length < 6) return C.formError(form, 'newAdminPassword', 'Mínimo de 6 caracteres.');
      patch.adminPasswordHash = U.sha256(`${np}:mp-admin`);
    }
    MP.settings.set(patch);
    MP.ui.toast('Informações salvas.');
    // atualiza header/rodapé com a nova logo e dados
    MP.app.renderChrome();
    MP.router.render(false);
  });
  MP.on.click('admin-seed', async (el) => {
    if (!(await MP.ui.confirm('Publicar o catálogo de demonstração na nuvem? Itens com o mesmo código interno serão sobrescritos.', { ok: 'Publicar' }))) return;
    el.disabled = true;
    try {
      await MP.cloud.seedCatalog();
      MP.ui.toast('Catálogo publicado! Ele já aparece no site.', 'ok');
    } catch (e) {
      console.error(e);
      MP.ui.toast('Não foi possível publicar. Confira as regras do Firestore e se sua conta é administradora.', 'error');
    }
    el.disabled = false;
  });
  MP.on.click('admin-optimize', async (el) => {
    if (!(await MP.ui.confirm('Reduzir o tamanho das fotos de produtos, categorias e banners? Ficam com no máximo 600 px (produtos), 320 px (categorias) e 1920/800 px (banners, computador/celular), sem perder a nitidez na loja.', { ok: 'Otimizar' }))) return;
    el.disabled = true;
    let items = 0;
    let before = 0;
    let after = 0;
    const shrink = async (src, dim, quality = 0.72) => {
      const out = await U.shrinkDataUrl(src, dim, quality);
      before += String(src).length;
      after += out.length;
      return out;
    };
    const allProducts = MP.data.products.all();
    if (MP.cloud.enabled) await MP.cloud.fetchImages(allProducts.map((pr) => pr.id)); // fotos ficam à parte; busca todas de uma vez aqui
    for (const pr of allProducts) {
      // se o produto ainda não tem foto no lugar novo (salvo antes desta atualização do site), usa a que
      // já vier junto dele, em vez de tratar como "sem foto"
      const cached = MP.cloud.enabled ? MP.cloud.imagesFor(pr.id) : null;
      const list = (cached && cached.length ? cached : pr.images) || [];
      const out = [];
      for (const src of list) out.push(await shrink(src, 600));
      if (out.some((x, i) => x !== list[i])) {
        MP.data.products.save(Object.assign({}, pr, { images: out }));
        items++;
      }
    }
    for (const c of MP.data.categories.all()) {
      if (!c.image) continue;
      const out = await shrink(c.image, 320);
      if (out !== c.image) {
        MP.data.categories.save(Object.assign({}, c, { image: out }));
        items++;
      }
    }
    // banners: qualidade mais alta (0.9) que fotos de produto, para manter o design nítido
    for (const b of MP.data.banners.all()) {
      const patch = {};
      if (b.image) {
        const out = await shrink(b.image, 1920, 0.9);
        if (out !== b.image) patch.image = out;
      }
      if (b.imageMobile) {
        const out = await shrink(b.imageMobile, 800, 0.9);
        if (out !== b.imageMobile) patch.imageMobile = out;
      }
      if (Object.keys(patch).length) {
        MP.data.banners.save(Object.assign({}, b, patch));
        items++;
      }
    }
    el.disabled = false;
    const kb = (n) => Math.round(n / 1024);
    MP.ui.toast(items ? `${items} itens otimizados: de ${kb(before)} KB para ${kb(after)} KB de fotos.` : 'As fotos já estão leves. Nada a alterar.', items ? 'ok' : 'info');
  });
  MP.on.click('admin-export', () => U.download(`mp-ferragens-backup-${new Date().toISOString().slice(0, 10)}.json`, MP.store.exportAll()));
  MP.on.change('admin-import', async (el) => {
    const f = el.files[0];
    if (!f) return;
    try {
      MP.store.importAll(await f.text());
      MP.ui.toast('Backup importado.');
      MP.app.renderChrome();
      MP.router.render(false);
    } catch (e) {
      MP.ui.toast(e.message || 'Arquivo inválido.', 'error');
    }
    el.value = '';
  });
  MP.on.click('admin-reset', async () => {
    if (!(await MP.ui.confirm('Isto apaga TODOS os dados atuais (produtos, pedidos, clientes) e restaura a demonstração. Continuar?', { ok: 'Restaurar', danger: true }))) return;
    MP.store.resetDemo();
    MP.ui.toast('Dados de demonstração restaurados.', 'info');
    MP.app.renderChrome();
    MP.router.render(false);
  });
})(window.MP);
