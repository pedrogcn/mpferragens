/* Carrinho = "Seu Orçamento": itens, cupom, frete, salvar, imprimir, compartilhar e finalizar no WhatsApp. */
(function (MP) {
  const U = MP.util;
  const { esc, brl } = U;
  const C = MP.components;

  const onCartPage = () => MP.router.current.path === '/orcamento';

  /* re-renderiza mantendo o foco no controle que o cliente estava usando */
  const rerender = () => {
    const ae = document.activeElement;
    let restore = null;
    const row = ae && ae.closest && ae.closest('tr[data-key],[data-key]');
    if (row) {
      restore = { key: row.dataset.key, sel: ae.matches('input') ? 'input' : ae.dataset.dir ? `button[data-dir="${ae.dataset.dir}"]` : null };
    }
    MP.router.render(false);
    if (restore && restore.sel) {
      const r = U.$$('[data-key]').find((e) => e.dataset.key === restore.key);
      const t = r && r.querySelector(restore.sel);
      if (t) t.focus();
    }
  };
  MP.bus.on('cart', () => onCartPage() && rerender());

  MP.on.change('cart-qty', (el) => {
    const key = el.closest('[data-key]').dataset.key;
    MP.cart.setQty(key, Number(el.value));
  });
  MP.on.click('cart-remove', (el) => {
    const key = el.closest('[data-key]').dataset.key;
    const line = MP.cart.lines().find((l) => l.key === key);
    MP.cart.remove(key);
    if (line) {
      MP.ui.toast(`${line.product.name} removido`, 'info');
    }
  });
  MP.on.click('cart-clear', async () => {
    if (await MP.ui.confirm('Remover todos os itens do orçamento?', { ok: 'Limpar', danger: true })) MP.cart.clear();
  });
  MP.on.change('cart-mode', (el) => MP.cart.setMode(el.value));
  MP.on.submit('cart-cep', (form, fd) => {
    const cep = String(fd.get('cep') || '');
    if (U.digits(cep).length !== 8) {
      MP.ui.toast('Informe um CEP com 8 dígitos.', 'error');
      return;
    }
    MP.cart.setCep(cep);
  });
  MP.on.submit('cart-coupon', (form, fd) => {
    const r = MP.cart.applyCoupon(fd.get('code'));
    MP.ui.toast(r.msg, r.ok ? 'ok' : 'error');
  });
  MP.on.click('coupon-remove', () => MP.cart.removeCoupon());

  /* ---------- salvar / compartilhar / imprimir ---------- */
  MP.on.click('quote-save', () => {
    if (!MP.cart.count()) return;
    const m = MP.ui.modal({
      title: 'Salvar orçamento',
      body: `<form data-submit="quote-save-do">${C.field({ label: 'Nome do orçamento', name: 'title', value: 'Orçamento de ' + U.fmtDate(new Date().toISOString()), required: true })}
        <p class="muted small">Você poderá abrir este orçamento novamente depois, neste navegador.</p>
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">Cancelar</button><button class="btn btn-primary">Salvar</button></div></form>`
    });
    void m;
  });
  MP.on.submit('quote-save-do', (form, fd) => {
    const q = MP.quotes.saveCurrent(String(fd.get('title')).trim());
    MP.ui.closeAll();
    if (q) MP.ui.toast('Orçamento salvo!', 'ok');
    rerender();
  });
  MP.on.click('quote-open', async (el) => {
    if (MP.cart.count() && !(await MP.ui.confirm('Abrir este orçamento substituirá os itens atuais do carrinho. Continuar?', { ok: 'Abrir' }))) return;
    MP.quotes.load(el.dataset.id);
    MP.router.go('/orcamento');
  });
  MP.on.click('quote-del', async (el) => {
    if (!(await MP.ui.confirm('Excluir este orçamento salvo?', { ok: 'Excluir', danger: true }))) return;
    MP.data.quotes.remove(el.dataset.id);
    MP.router.render(false);
  });
  MP.on.click('quote-print', () => window.print());
  MP.on.click('quote-share', async () => {
    if (!MP.cart.count()) return;
    const u = MP.auth.current();
    const text = MP.orders.messageFromCart(u ? { name: u.name, phone: u.phone } : null);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Orçamento ' + MP.settings.get().storeName, text });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    window.open(MP.orders.waLink(text, ''), '_blank', 'noopener');
  });

  /* ---------- finalizar no WhatsApp ---------- */
  const sendOrder = (customer) => {
    if (!MP.cart.count()) return;
    const order = MP.orders.createFromCart(customer);
    const url = MP.orders.waLink(MP.orders.messageFromOrder(order));
    MP.db.set('lastWaUrl:' + order.id, url);
    const w = window.open(url, '_blank', 'noopener');
    MP.cart.clear();
    MP.router.go('/pedido/' + order.id + '?enviado=' + (w ? '1' : '0'));
  };

  MP.on.click('wa-checkout', () => {
    if (!MP.cart.count()) return;
    const t = MP.cart.totals();
    if (t.shipping.mode === 'entrega' && t.shipping.pending) {
      MP.ui.toast('Dica: informe o CEP para incluir o frete. Você também pode enviar assim e combinar pelo WhatsApp.', 'info');
    }
    const u = MP.auth.current();
    if (u && u.name && u.phone) return sendOrder({ name: u.name, phone: u.phone, email: u.email });
    const g = MP.db.get('guestCustomer', {});
    MP.ui.modal({
      title: 'Para quem é o orçamento?',
      body: `<form data-submit="wa-send" novalidate>
        <p class="muted">Vamos abrir o WhatsApp da loja com o seu orçamento pronto. Informe seus dados para o atendimento.</p>
        ${C.field({ label: 'Seu nome', name: 'name', value: g.name || (u ? u.name : ''), required: true, autocomplete: 'name' })}
        ${C.field({ label: 'Telefone / WhatsApp', name: 'phone', value: g.phone || (u ? u.phone : ''), required: true, mask: 'phone', autocomplete: 'tel', attrs: 'inputmode="tel"' })}
        <div class="form-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">Cancelar</button><button class="btn btn-wa">${MP.icon('whatsapp', 18)} Enviar no WhatsApp</button></div>
        ${u ? '' : '<p class="muted small">Já tem conta? <a href="#/entrar?next=/orcamento">Entre</a> para acompanhar o pedido depois.</p>'}
      </form>`
    });
  });
  MP.on.submit('wa-send', (form, fd) => {
    C.clearErrors(form);
    const name = String(fd.get('name') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    let bad = false;
    if (name.length < 2) (C.formError(form, 'name', 'Informe seu nome.'), (bad = true));
    if (U.digits(phone).length < 10) (C.formError(form, 'phone', 'Informe um telefone com DDD.'), (bad = true));
    if (bad) return;
    MP.db.set('guestCustomer', { name, phone });
    MP.ui.closeAll();
    sendOrder({ name, phone });
  });

  /* ---------- lista de orçamentos salvos ---------- */
  MP.pages.savedQuotes = () => {
    const qs = MP.quotes.all();
    if (!qs.length) return C.emptyState({ icon: 'filetext', title: 'Nenhum orçamento salvo', text: 'Monte seu orçamento e clique em “Salvar orçamento” para guardá-lo aqui.', action: '<a class="btn btn-primary" href="#/busca">Ver produtos</a>' });
    return `<ul class="quote-list">${qs
      .map((q) => {
        const n = q.lines.reduce((a, l) => a + l.qty, 0);
        return `<li><div><b>${esc(q.title)}</b><small>${U.fmtDate(q.createdAt)} · ${n} ${U.plural(n, 'item', 'itens')} · ${brl(q.total)}</small></div>
          <div class="row-actions"><button class="btn btn-outline btn-sm" data-action="quote-open" data-id="${q.id}">Abrir</button><button class="icon-btn" data-action="quote-del" data-id="${q.id}" aria-label="Excluir orçamento">${MP.icon('trash', 18)}</button></div></li>`;
      })
      .join('')}</ul>`;
  };

  /* ---------- página ---------- */
  MP.pages.cart = () => {
    const t = MP.cart.totals();
    const s = MP.cart.state();
    const st = MP.settings.get();
    const u = MP.auth.current();
    const saved = MP.quotes.all();

    if (!t.lines.length) {
      return {
        title: 'Seu orçamento',
        html: `<div class="container page-pad"><h1 class="page-title left">Seu Orçamento</h1>
          ${C.emptyState({ icon: 'cart', title: 'Seu orçamento está vazio', text: 'Adicione produtos para montar seu orçamento e enviar pelo WhatsApp.', action: '<a class="btn btn-primary" href="#/busca">Ver produtos</a>' })}
          ${saved.length ? `<section class="section"><h2 class="section-title left">ORÇAMENTOS SALVOS</h2>${MP.pages.savedQuotes()}</section>` : ''}</div>`
      };
    }

    const ship = t.shipping;
    let shipCell;
    if (s.mode === 'retirada') shipCell = '<span class="ok">Grátis</span>';
    else if (ship.pending) shipCell = '<span class="muted">Informe o CEP</span>';
    else if (ship.consult) shipCell = '<span class="muted">A combinar</span>';
    else shipCell = ship.cost === 0 ? '<span class="ok">Grátis</span>' : brl(ship.cost);

    const rows = t.lines
      .map(
        (l) => `<tr data-key="${esc(l.key)}">
        <td data-label="Produto"><a class="cart-prod" href="#/produto/${esc(l.product.slug)}"><img src="${esc(MP.art.main(l.product))}" alt=""><span><b>${esc(l.product.name)}</b><small>${esc(l.product.variant)}${l.product.units ? ' · ' + esc(l.unitLabel) : ''}</small></span></a></td>
        <td data-label="Preço">${brl(l.price)}${l.wholesale ? '<small class="wholesale-on">Preço de atacado</small>' : ''}</td>
        <td data-label="Quantidade">${C.stepper({ value: l.qty, attrs: 'data-change="cart-qty"', label: 'Quantidade de ' + l.product.name })}</td>
        <td data-label="Valor"><b>${brl(l.total)}</b></td>
        <td data-label="Excluir" class="td-del"><button class="icon-btn" data-action="cart-remove" aria-label="Remover ${esc(l.product.name)}">${MP.icon('trash', 18)}</button></td></tr>`
      )
      .join('');

    const printRows = t.lines.map((l) => `<tr><td>${esc(l.product.name)} — ${esc(l.product.variant)}${l.product.units ? ' (' + esc(l.unitLabel) + ')' : ''}</td><td>${l.qty}</td><td>${brl(l.price)}</td><td>${brl(l.total)}</td></tr>`).join('');

    const html = `<div class="container page-pad cart-page">
      <div class="no-print">
        <h1 class="page-title left">Seu Orçamento</h1>
        <p class="muted">Confira os itens selecionados e o valor total do seu pedido.</p>
      </div>
      <div class="cart-layout no-print">
        <div class="cart-main">
          <table class="cart-table"><thead><tr><th>Produto</th><th>Preço</th><th>Quantidade</th><th>Valor</th><th class="td-del">Excluir</th></tr></thead><tbody>${rows}</tbody></table>
          <div class="cart-tools">
            <a class="link-ic" href="#/busca">${MP.icon('arrowl', 16)} Continuar comprando</a>
            <button class="link-ic" data-action="quote-save">${MP.icon('save', 18)} Salvar orçamento</button>
            <button class="link-ic" data-action="quote-share">${MP.icon('share', 18)} Compartilhar</button>
            <button class="link-ic" data-action="quote-print">${MP.icon('printer', 18)} Imprimir</button>
            <button class="link-ic link-danger" data-action="cart-clear">${MP.icon('trash', 18)} Limpar</button>
          </div>
        </div>
        <aside class="cart-summary" aria-label="Resumo do orçamento">
          <form class="coupon-form" data-submit="cart-coupon"><label for="cp">Cupom de desconto</label>
            <div class="inline-form"><input id="cp" name="code" placeholder="Digite o código" value="${t.coupon.code && !t.coupon.valid ? esc(t.coupon.code) : ''}" autocomplete="off"><button class="btn btn-dark btn-sm">Aplicar</button></div>
            ${t.coupon.valid ? `<p class="coupon-ok">${MP.icon('check', 14)} Cupom <b>${esc(t.coupon.code)}</b> aplicado <button type="button" class="link-btn" data-action="coupon-remove">remover</button></p>` : t.coupon.code ? `<p class="text-err small">${esc(t.coupon.msg)} <button type="button" class="link-btn" data-action="coupon-remove">remover</button></p>` : ''}
          </form>
          <fieldset class="delivery"><legend>Entrega</legend>
            <label class="radio"><input type="radio" name="mode" value="entrega" data-change="cart-mode" ${s.mode === 'entrega' ? 'checked' : ''}><span>Receber em casa/obra</span></label>
            <label class="radio"><input type="radio" name="mode" value="retirada" data-change="cart-mode" ${s.mode === 'retirada' ? 'checked' : ''}><span>Retirar na loja</span></label>
            ${s.mode === 'entrega' ? `<form class="inline-form" data-submit="cart-cep"><input name="cep" data-mask="cep" inputmode="numeric" maxlength="9" placeholder="CEP" aria-label="CEP" value="${esc(s.cep)}"><button class="btn btn-outline btn-sm">Calcular</button></form>
              ${ship.ok && !ship.pending ? `<p class="small muted">${esc(ship.label)}${ship.days ? ' · prazo ' + esc(ship.days) : ''}${ship.consult ? ' — ' + esc(ship.msg) : ''}</p>` : ''}` : `<p class="small muted">${esc(st.pickupText)}</p>`}
          </fieldset>
          <dl class="totals">
            <div><dt>Subtotal</dt><dd>${brl(t.subtotal)}</dd></div>
            ${t.discount > 0 ? `<div class="disc"><dt>Desconto</dt><dd>- ${brl(t.discount)}</dd></div>` : ''}
            <div><dt>Frete</dt><dd>${shipCell}</dd></div>
            <div class="grand"><dt>Total</dt><dd>${brl(t.total)}</dd></div>
          </dl>
          ${s.mode === 'entrega' && (ship.pending || ship.consult) ? '<p class="small muted">O frete será confirmado no atendimento.</p>' : ''}
          <button class="btn btn-wa btn-xl btn-block" data-action="wa-checkout">${MP.icon('whatsapp', 24)}<span>Finalizar no WhatsApp<small>Conclua seu pedido de forma rápida</small></span></button>
        </aside>
      </div>
      ${saved.length ? `<section class="section no-print"><h2 class="section-title left">ORÇAMENTOS SALVOS</h2>${MP.pages.savedQuotes()}</section>` : ''}

      <div class="print-sheet">
        <div class="ps-head">${C.logo('logo-print')}<div><h2>${esc(st.storeName)} — Orçamento</h2><p>${esc(U.addrLine(st.address))} · ${esc(st.whatsappDisplay)} · ${esc(st.email)}</p><p>Emitido em ${U.fmtDateTime(new Date().toISOString())}${u ? ' · Cliente: ' + esc(u.name) : ''}</p></div></div>
        <table class="ps-table"><thead><tr><th>Produto</th><th>Qtd.</th><th>Preço</th><th>Valor</th></tr></thead><tbody>${printRows}</tbody></table>
        <dl class="ps-totals"><div><dt>Subtotal</dt><dd>${brl(t.subtotal)}</dd></div>${t.discount > 0 ? `<div><dt>Desconto (${esc(t.coupon.code)})</dt><dd>- ${brl(t.discount)}</dd></div>` : ''}<div><dt>Frete</dt><dd>${s.mode === 'retirada' ? 'Retirada na loja' : ship.cost == null ? 'A combinar' : ship.cost === 0 ? 'Grátis' : brl(ship.cost)}</dd></div><div class="grand"><dt>Total aproximado</dt><dd>${brl(t.total)}</dd></div></dl>
        <p class="ps-note">Orçamento sujeito à confirmação de disponibilidade, prazo e forma de pagamento. Validade: 3 dias.</p>
      </div>
    </div>`;
    return { title: 'Seu orçamento', html };
  };
})(window.MP);
