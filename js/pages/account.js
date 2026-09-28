/* Área do cliente: pedidos, detalhe do pedido, endereços, dados, favoritos, desejos e orçamentos salvos. */
(function (MP) {
  const U = MP.util;
  const { esc, brl } = U;
  const C = MP.components;

  const MENU = [
    ['pedidos', 'clipboard', 'Meus Pedidos'],
    ['orcamentos', 'filetext', 'Orçamentos Salvos'],
    ['enderecos', 'pin', 'Meus Endereços'],
    ['dados', 'user', 'Meus Dados'],
    ['favoritos', 'heart', 'Favoritos'],
    ['desejos', 'bookmark', 'Lista de Desejos']
  ];

  const badge = (s) => `<span class="status status-${MP.statusClass(s)}">${esc(s)}</span>`;
  MP.statusBadge = badge;

  const layout = (u, active, title, inner, sub) => ({
    title,
    html: `<div class="container page-pad"><div class="account">
      <aside class="account-menu no-print" aria-label="Menu da conta">
        <nav>${MENU.map(([k, ic, l]) => `<a href="#/conta/${k}" class="${active === k ? 'is-on' : ''}" ${active === k ? 'aria-current="page"' : ''}>${MP.icon(ic, 18)} ${l}</a>`).join('')}
        <button data-action="logout">${MP.icon('logout', 18)} Sair</button></nav>
      </aside>
      <section class="account-main">
        <header class="account-head"><h1 class="page-title left">Olá, ${esc(MP.auth.firstName(u))}!</h1><p class="muted">${esc(sub || 'Acompanhe seus pedidos, consulte seus dados e muito mais.')}</p></header>
        ${inner}
      </section></div></div>`
  });

  MP.on.click('logout', () => {
    MP.auth.logout();
    MP.ui.toast('Você saiu da conta.', 'info');
    MP.router.go('/');
  });

  /* ---------- pedidos ---------- */
  const userOrders = (u) => MP.data.orders.all().filter((o) => o.userId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  MP.on.change('orders-filter', (el) => MP.router.setQuery({ status: el.value }));

  MP.pages.orders = (ctx) => {
    const u = MP.auth.require();
    if (!u) return { redirected: true };
    const st = ctx.query.status || '';
    const all = userOrders(u);
    const list = st ? all.filter((o) => o.status === st) : all;
    const inner = `<div class="card">
      <div class="card-head"><h2>Meus Pedidos</h2>
        <label class="sort">Status <select data-change="orders-filter" aria-label="Filtrar por status"><option value="">Ver todos</option>${MP.ORDER_STATUS.map((s) => `<option ${st === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label></div>
      ${list.length
        ? `<table class="orders-table"><thead><tr><th>Pedido</th><th>Status</th><th>Valor</th><th>Data</th></tr></thead><tbody>${list
            .map((o) => `<tr><td data-label="Pedido"><a href="#/conta/pedidos/${o.id}"><b>#${esc(o.id)}</b></a></td><td data-label="Status">${badge(o.status)}</td><td data-label="Valor">${brl(o.total)}</td><td data-label="Data">${U.fmtDateTime(o.createdAt)}</td></tr>`)
            .join('')}</tbody></table>`
        : C.emptyState({ icon: 'clipboard', title: 'Nenhum pedido por aqui', text: st ? 'Nenhum pedido com este status.' : 'Quando você enviar um orçamento pelo WhatsApp, ele aparece aqui.', action: '<a class="btn btn-primary" href="#/busca">Ver produtos</a>' })}
    </div>`;
    return layout(u, 'pedidos', 'Meus pedidos', inner);
  };

  const TIMELINE = ['Aguardando', 'Em separação', 'A caminho', 'Entregue'];
  const orderBody = (o) => {
    const cancelled = o.status === 'Cancelado';
    const idx = TIMELINE.indexOf(o.status);
    const at = (s) => {
      const h = (o.history || []).find((x) => x.status === s);
      return h ? U.fmtDateTime(h.at) : '';
    };
    const steps = cancelled
      ? `<li class="tl-step done">${MP.icon('check', 14)}<b>Aguardando</b><small>${at('Aguardando')}</small></li><li class="tl-step cancel">${MP.icon('x', 14)}<b>Cancelado</b><small>${at('Cancelado')}</small></li>`
      : TIMELINE.map((s, i) => `<li class="tl-step ${i <= idx ? 'done' : ''} ${i === idx ? 'now' : ''}">${MP.icon(i <= idx ? 'check' : 'clock', 14)}<b>${s}</b><small>${at(s)}</small></li>`).join('');
    return `<div class="card order-card">
      <div class="card-head"><h2>Pedido #${esc(o.id)}</h2>${badge(o.status)}</div>
      <ol class="timeline">${steps}</ol>
      <table class="cart-table order-items"><thead><tr><th>Produto</th><th>Preço</th><th>Qtd.</th><th>Valor</th></tr></thead><tbody>${o.items
        .map((i) => {
          const p = MP.catalog.byId(i.productId);
          return `<tr><td data-label="Produto">${p ? `<a class="cart-prod" href="#/produto/${esc(p.slug)}"><img src="${esc(MP.art.main(p))}" alt=""><span><b>${esc(i.name)}</b><small>${esc(i.variant || '')}${i.unitLabel ? ' · ' + esc(i.unitLabel) : ''}</small></span></a>` : `<b>${esc(i.name)}</b> <small>${esc(i.variant || '')}</small>`}</td><td data-label="Preço">${brl(i.price)}</td><td data-label="Qtd.">${i.qty}</td><td data-label="Valor"><b>${brl(U.round2(i.price * i.qty))}</b></td></tr>`;
        })
        .join('')}</tbody></table>
      <div class="order-foot">
        <div class="order-info"><h3>Entrega</h3><p>${o.delivery.mode === 'retirada' ? 'Retirada na loja' : 'Entrega' + (o.delivery.cep ? ' · CEP ' + esc(o.delivery.cep) : ' · a combinar')}</p>
          <h3>Cliente</h3><p>${esc(o.customer.name)}${o.customer.phone ? '<br>' + esc(o.customer.phone) : ''}</p></div>
        <dl class="totals"><div><dt>Subtotal</dt><dd>${brl(o.subtotal)}</dd></div>${o.discount > 0 ? `<div class="disc"><dt>Desconto${o.coupon ? ' (' + esc(o.coupon) + ')' : ''}</dt><dd>- ${brl(o.discount)}</dd></div>` : ''}<div><dt>Frete</dt><dd>${o.delivery.mode === 'retirada' || !o.shipping ? 'Grátis' : brl(o.shipping)}</dd></div><div class="grand"><dt>Total</dt><dd>${brl(o.total)}</dd></div></dl>
      </div>
      <div class="order-actions no-print">
        <button class="btn btn-outline" data-action="order-reorder" data-id="${esc(o.id)}">${MP.icon('refresh', 16)} Refazer pedido</button>
        <button class="btn btn-wa" data-action="order-wa" data-id="${esc(o.id)}">${MP.icon('whatsapp', 16)} Falar sobre este pedido</button>
        <button class="btn btn-ghost" data-action="quote-print">${MP.icon('printer', 16)} Imprimir</button>
        ${o.status === 'Aguardando' || o.status === 'Em separação' ? `<button class="btn btn-ghost link-danger" data-action="order-cancel" data-id="${esc(o.id)}">Cancelar pedido</button>` : ''}
      </div></div>`;
  };

  MP.on.click('order-reorder', (el) => {
    const o = MP.data.orders.get(el.dataset.id);
    if (!o) return;
    let n = 0;
    o.items.forEach((i) => {
      const p = MP.catalog.byId(i.productId);
      if (p && p.active !== false) {
        MP.cart.add(p.id, i.qty, '');
        n++;
      }
    });
    MP.ui.toast(n ? 'Itens adicionados ao orçamento.' : 'Estes produtos não estão mais disponíveis.', n ? 'ok' : 'error', n ? { label: 'Ver orçamento', href: '#/orcamento' } : null);
  });
  MP.on.click('order-wa', (el) => {
    const o = MP.data.orders.get(el.dataset.id);
    if (o) window.open(MP.orders.waLink(`Olá! Gostaria de falar sobre o pedido #${o.id} (${brl(o.total)}, status: ${o.status}).`), '_blank', 'noopener');
  });
  MP.on.click('order-cancel', async (el) => {
    if (!(await MP.ui.confirm('Deseja cancelar este pedido?', { ok: 'Cancelar pedido', danger: true }))) return;
    const o = MP.data.orders.get(el.dataset.id);
    o.status = 'Cancelado';
    o.history = (o.history || []).concat({ status: 'Cancelado', at: new Date().toISOString() });
    MP.data.orders.save(o);
    MP.ui.toast('Pedido cancelado.', 'info');
    MP.router.render(false);
  });

  /* detalhe dentro da conta */
  MP.pages.orderDetail = (ctx) => {
    const u = MP.auth.require();
    if (!u) return { redirected: true };
    const o = MP.data.orders.get(ctx.params.id);
    if (!o || o.userId !== u.id) return MP.pages.notFound();
    return layout(u, 'pedidos', `Pedido #${o.id}`, `<p><a class="link-ic" href="#/conta/pedidos">${MP.icon('arrowl', 16)} Voltar para meus pedidos</a></p>${orderBody(o)}`);
  };

  /* confirmação / consulta pública (visitante ou dono do pedido) */
  MP.pages.orderPublic = (ctx) => {
    const o = MP.data.orders.get(ctx.params.id);
    const u = MP.auth.current();
    if (!o || (o.userId && (!u || u.id !== o.userId))) return MP.pages.notFound();
    const sent = ctx.query.enviado;
    const url = MP.db.get('lastWaUrl:' + o.id, '');
    return {
      title: `Pedido #${o.id}`,
      html: `<div class="container page-pad narrow">
        ${sent != null ? `<div class="success-box">${MP.icon('check', 28)}<div><h1>Orçamento enviado!</h1><p>${sent === '1' ? 'Abrimos o WhatsApp da loja com o seu orçamento. Basta enviar a mensagem para falar com nosso atendimento.' : 'Não conseguimos abrir o WhatsApp automaticamente. Use o botão abaixo para enviar o orçamento.'}</p>
          ${url ? `<a class="btn btn-wa" href="${esc(url)}" target="_blank" rel="noopener">${MP.icon('whatsapp', 18)} ${sent === '1' ? 'Abrir o WhatsApp novamente' : 'Enviar pelo WhatsApp'}</a>` : ''}</div></div>` : ''}
        ${orderBody(o)}
        <p class="center mt"><a class="btn btn-outline" href="#/">Continuar comprando</a> ${u ? '<a class="btn btn-ghost" href="#/conta/pedidos">Meus pedidos</a>' : ''}</p></div>`
    };
  };

  /* ---------- endereços ---------- */
  const addressCard = (a) => `<li class="addr ${a.main ? 'is-main' : ''}">
      <div><b>${esc(a.label || 'Endereço')}</b>${a.main ? '<span class="tag">Principal</span>' : ''}
      <p>${esc(a.street)}, ${esc(a.number)}${a.complement ? ' — ' + esc(a.complement) : ''}<br>${esc(a.district)} · ${esc(a.city)}/${esc(a.state)}<br>CEP ${esc(a.cep)}</p></div>
      <div class="row-actions">${a.main ? '' : `<button class="btn btn-ghost btn-sm" data-action="addr-main" data-id="${a.id}">Tornar principal</button>`}<button class="btn btn-outline btn-sm" data-action="addr-edit" data-id="${a.id}">Editar</button><button class="icon-btn" data-action="addr-del" data-id="${a.id}" aria-label="Excluir endereço">${MP.icon('trash', 18)}</button></div></li>`;

  MP.pages.addresses = () => {
    const u = MP.auth.require();
    if (!u) return { redirected: true };
    const list = u.addresses || [];
    return layout(u, 'enderecos', 'Meus endereços', `<div class="card"><div class="card-head"><h2>Meus Endereços</h2><button class="btn btn-primary btn-sm" data-action="addr-edit">${MP.icon('plus', 16)} Novo endereço</button></div>
      ${list.length ? `<ul class="addr-list">${list.map(addressCard).join('')}</ul>` : C.emptyState({ icon: 'pin', title: 'Nenhum endereço salvo', text: 'Cadastre os endereços das suas obras para agilizar seus pedidos.' })}</div>`);
  };

  MP.on.click('addr-edit', (el) => {
    const u = MP.auth.current();
    const a = (u.addresses || []).find((x) => x.id === el.dataset.id) || {};
    MP.ui.modal({
      title: a.id ? 'Editar endereço' : 'Novo endereço',
      body: `<form data-submit="addr-save" data-id="${esc(a.id || '')}" novalidate>${C.field({ label: 'Apelido (Casa, Obra...)', name: 'label', value: a.label || '' })}${C.addressFields(a, '')}
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">Cancelar</button><button class="btn btn-primary">Salvar</button></div></form>`
    });
  });
  MP.on.submit('addr-save', (form, fd) => {
    C.clearErrors(form);
    const a = C.readAddress(fd, '');
    if (U.digits(a.cep).length !== 8) return C.formError(form, 'cep', 'Informe um CEP válido.');
    if (!a.street) return C.formError(form, 'street', 'Informe a rua.');
    if (!a.number) return C.formError(form, 'number', 'Informe o número.');
    const u = MP.auth.current();
    const list = (u.addresses || []).slice();
    const id = form.dataset.id;
    const rec = Object.assign({ id: id || U.uid('a'), label: String(fd.get('label') || '').trim() || 'Endereço', main: !list.length }, a);
    if (id) {
      const i = list.findIndex((x) => x.id === id);
      rec.main = list[i].main;
      list[i] = rec;
    } else list.push(rec);
    MP.auth.update({ addresses: list });
    MP.ui.closeAll();
    MP.ui.toast('Endereço salvo.');
    MP.router.render(false);
  });
  MP.on.click('addr-main', (el) => {
    const u = MP.auth.current();
    MP.auth.update({ addresses: u.addresses.map((a) => Object.assign({}, a, { main: a.id === el.dataset.id })) });
    MP.router.render(false);
  });
  MP.on.click('addr-del', async (el) => {
    if (!(await MP.ui.confirm('Excluir este endereço?', { ok: 'Excluir', danger: true }))) return;
    const u = MP.auth.current();
    let list = u.addresses.filter((a) => a.id !== el.dataset.id);
    if (list.length && !list.some((a) => a.main)) list[0].main = true;
    MP.auth.update({ addresses: list });
    MP.router.render(false);
  });

  /* ---------- dados ---------- */
  MP.pages.profile = () => {
    const u = MP.auth.require();
    if (!u) return { redirected: true };
    const pj = u.type === 'pj';
    return layout(u, 'dados', 'Meus dados', `<div class="card"><div class="card-head"><h2>Meus Dados</h2></div>
      <form data-submit="profile-save" novalidate>
        <div class="grid-2">${C.field({ label: pj ? 'Razão social' : 'Nome completo', name: 'name', value: u.name, required: true })}${C.field({ label: pj ? 'CNPJ' : 'CPF', name: 'doc', value: U.maskDoc(u.doc), attrs: 'readonly', hint: 'Para alterar o documento, fale com a loja.' })}</div>
        <div class="grid-2">${C.field({ label: 'Telefone', name: 'phone', value: u.phone, required: true, mask: 'phone' })}${C.field({ label: 'E-mail', name: 'email', value: u.email, attrs: 'readonly' })}</div>
        <div class="form-actions"><button class="btn btn-primary">Salvar alterações</button></div></form></div>
      <div class="card"><div class="card-head"><h2>Alterar senha</h2></div>
      <form data-submit="password-save" novalidate><div class="grid-3">${C.field({ label: 'Senha atual', name: 'old', type: 'password', autocomplete: 'current-password' })}${C.field({ label: 'Nova senha', name: 'new1', type: 'password', autocomplete: 'new-password' })}${C.field({ label: 'Confirmar nova senha', name: 'new2', type: 'password', autocomplete: 'new-password' })}</div>
      <div class="form-actions"><button class="btn btn-dark">Alterar senha</button></div></form></div>`);
  };
  MP.on.submit('profile-save', (form, fd) => {
    C.clearErrors(form);
    const name = String(fd.get('name') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    if (name.length < 2) return C.formError(form, 'name', 'Informe o nome.');
    if (U.digits(phone).length < 10) return C.formError(form, 'phone', 'Informe um telefone com DDD.');
    MP.auth.update({ name, phone });
    MP.ui.toast('Dados atualizados.');
  });
  MP.on.submit('password-save', async (form, fd) => {
    C.clearErrors(form);
    const n1 = String(fd.get('new1') || '');
    if (n1.length < 6) return C.formError(form, 'new1', 'Mínimo de 6 caracteres.');
    if (n1 !== fd.get('new2')) return C.formError(form, 'new2', 'As senhas não conferem.');
    const r = await MP.auth.changePassword(String(fd.get('old') || ''), n1);
    if (!r.ok) return C.formError(form, 'old', r.error);
    form.reset();
    MP.ui.toast('Senha alterada.');
  });

  /* ---------- favoritos / desejos / orçamentos ---------- */
  MP.pages.favorites = () => {
    const u = MP.auth.require();
    if (!u) return { redirected: true };
    const items = MP.favorites.all().map((id) => MP.catalog.byId(id)).filter((p) => p && p.active !== false);
    return layout(u, 'favoritos', 'Favoritos', `<div class="card"><div class="card-head"><h2>Favoritos</h2></div>${items.length ? `<div class="pgrid pgrid-3">${items.map((p) => C.productCard(p)).join('')}</div>` : C.emptyState({ icon: 'heart', title: 'Você ainda não tem favoritos', text: 'Toque no coração dos produtos para guardá-los aqui.', action: '<a class="btn btn-primary" href="#/busca">Ver produtos</a>' })}</div>`);
  };
  MP.bus.on('lists', () => {
    const p = MP.router.current.path;
    if (p === '/conta/favoritos' || p === '/conta/desejos') MP.router.render(false);
  });

  MP.on.click('wish-remove', (el) => MP.wishlist.remove(el.dataset.id));
  MP.on.click('wish-add', (el) => {
    const p = MP.catalog.byId(el.dataset.id);
    MP.cart.add(p.id, 1, '');
    MP.ui.toast(`${p.name} adicionado ao orçamento`, 'ok', { label: 'Ver orçamento', href: '#/orcamento' });
  });
  MP.pages.wishlist = () => {
    const u = MP.auth.require();
    if (!u) return { redirected: true };
    const items = MP.wishlist.all().map((id) => MP.catalog.byId(id)).filter((p) => p && p.active !== false);
    return layout(u, 'desejos', 'Lista de desejos', `<div class="card"><div class="card-head"><h2>Lista de Desejos</h2></div>${items.length
      ? `<ul class="wish-list">${items.map((p) => `<li><a class="cart-prod" href="#/produto/${esc(p.slug)}"><img src="${esc(MP.art.main(p))}" alt=""><span><b>${esc(p.name)}</b><small>${esc(p.variant)}</small></span></a><b class="price">${brl(p.price)}</b><div class="row-actions"><button class="btn btn-primary btn-sm" data-action="wish-add" data-id="${p.id}">Adicionar</button><button class="icon-btn" data-action="wish-remove" data-id="${p.id}" aria-label="Remover da lista">${MP.icon('trash', 18)}</button></div></li>`).join('')}</ul>`
      : C.emptyState({ icon: 'bookmark', title: 'Sua lista de desejos está vazia', text: 'Na página do produto, use “Lista de desejos” para salvar itens para depois.', action: '<a class="btn btn-primary" href="#/busca">Ver produtos</a>' })}</div>`);
  };

  MP.pages.accountQuotes = () => {
    const u = MP.auth.require();
    if (!u) return { redirected: true };
    return layout(u, 'orcamentos', 'Orçamentos salvos', `<div class="card"><div class="card-head"><h2>Orçamentos Salvos</h2></div>${MP.pages.savedQuotes()}</div>`);
  };
})(window.MP);
