/* Carrinho/orçamento, frete, cupons, pedidos e mensagem de WhatsApp. */
(function (MP) {
  const U = MP.util;
  const empty = () => ({ lines: [], coupon: null, mode: 'entrega', cep: '' });

  MP.ORDER_STATUS = ['Aguardando', 'Em separação', 'A caminho', 'Entregue', 'Cancelado'];
  MP.statusClass = (s) => ({ Aguardando: 'wait', 'Em separação': 'pick', 'A caminho': 'ship', Entregue: 'done', Cancelado: 'cancel' }[s] || 'wait');

  const unitOf = (p, key) => (p.units && p.units.length ? p.units.find((u) => u.key === key) || p.units[0] : null);
  /* atacado: p.wholesalePrice (preço por unidade) vale a partir de p.wholesaleMin unidades (padrão 10) */
  const wholesaleOf = (p) => (Number(p.wholesalePrice) > 0 && Number(p.wholesalePrice) < p.price ? { price: Number(p.wholesalePrice), min: Math.max(2, Math.floor(p.wholesaleMin) || 10) } : null);
  const isWholesale = (p, qty) => {
    const w = wholesaleOf(p);
    return !!w && qty != null && qty >= w.min;
  };
  const priceOf = (p, key, qty) => {
    const u = unitOf(p, key);
    return U.round2((isWholesale(p, qty) ? wholesaleOf(p).price : p.price) * (u ? u.factor : 1));
  };
  const cardPriceOf = (p, key) => {
    const u = unitOf(p, key);
    return U.round2((p.cardPrice || p.price) * (u ? u.factor : 1));
  };
  MP.priceOf = priceOf;
  MP.wholesaleOf = wholesaleOf;
  MP.isWholesale = isWholesale;
  MP.cardPriceOf = cardPriceOf;
  MP.unitOf = unitOf;

  /* ---------- frete ---------- */
  MP.shipping = {
    /* hasTelha: true se o carrinho/produto tem telha — aí o limite de frete grátis é o maior (freeAboveTelha) */
    quote(cep, subtotal, hasTelha) {
      const d = U.digits(cep);
      if (d.length !== 8) return { ok: false, msg: 'Informe um CEP válido com 8 dígitos.' };
      const n = Number(d.slice(0, 5));
      const s = MP.settings.get().shipping;
      const limit = Number(hasTelha ? s.freeAboveTelha : s.freeAbove);
      const free = limit > 0 && subtotal >= limit;
      if (n >= 69000 && n <= 69099) {
        return { ok: true, zone: 'Manaus', cost: free ? 0 : Number(s.manausPrice), free, days: s.manausDays, freeAbove: limit };
      }
      if ((n >= 69100 && n <= 69299) || (n >= 69400 && n <= 69899)) {
        return { ok: true, zone: 'Interior do Amazonas', cost: free ? 0 : Number(s.interiorPrice), free, days: s.interiorDays, freeAbove: limit };
      }
      return { ok: true, zone: 'Outras regiões', cost: null, consult: true, msg: 'Para este CEP o frete é combinado pelo WhatsApp.' };
    }
  };

  /* ---------- carrinho ---------- */
  const cart = (MP.cart = {
    state() {
      return Object.assign(empty(), MP.db.get('cart', null) || {});
    },
    save(s) {
      MP.db.set('cart', s);
      MP.bus.emit('cart');
    },
    key: (pid, unit) => `${pid}|${unit || ''}`,
    lines() {
      const out = [];
      this.state().lines.forEach((l) => {
        const p = MP.catalog.byId(l.pid);
        if (!p) return;
        const unit = unitOf(p, l.unit);
        const price = priceOf(p, l.unit, l.qty);
        out.push({ wholesale: isWholesale(p, l.qty), key: this.key(l.pid, l.unit), product: p, unitKey: unit ? unit.key : '', unitLabel: unit ? unit.label : p.specs['Unidade de venda'] || '', qty: l.qty, price, total: U.round2(price * l.qty) });
      });
      return out;
    },
    count() {
      return this.state().lines.reduce((a, l) => a + l.qty, 0);
    },
    add(pid, qty = 1, unit = '') {
      const p = MP.catalog.byId(pid);
      if (!p) return;
      const u = unitOf(p, unit);
      const unitKey = u ? u.key : '';
      const s = this.state();
      const l = s.lines.find((x) => x.pid === pid && (x.unit || '') === unitKey);
      if (l) l.qty = Math.min(9999, l.qty + qty);
      else s.lines.push({ pid, unit: unitKey, qty: Math.min(9999, qty) });
      this.save(s);
    },
    setQty(key, qty) {
      const s = this.state();
      const l = s.lines.find((x) => this.key(x.pid, x.unit) === key);
      if (!l) return;
      l.qty = Math.max(1, Math.min(9999, Math.floor(qty) || 1));
      this.save(s);
    },
    remove(key) {
      const s = this.state();
      s.lines = s.lines.filter((x) => this.key(x.pid, x.unit) !== key);
      this.save(s);
    },
    clear() {
      this.save(Object.assign(empty(), { mode: this.state().mode, cep: this.state().cep }));
    },
    setMode(mode) {
      const s = this.state();
      s.mode = mode;
      this.save(s);
    },
    setCep(cep) {
      const s = this.state();
      s.cep = U.maskCep(cep);
      this.save(s);
    },
    applyCoupon(code) {
      code = String(code || '').trim().toUpperCase();
      if (!code) return { ok: false, msg: 'Digite o código do cupom.' };
      const c = MP.data.coupons.find((x) => x.code.toUpperCase() === code && x.active);
      if (!c) return { ok: false, msg: 'Cupom inválido ou expirado.' };
      const s = this.state();
      s.coupon = c.code;
      this.save(s);
      const info = this.couponInfo(this.totals().subtotal);
      return info.valid ? { ok: true, msg: `Cupom ${c.code} aplicado!` } : { ok: false, msg: info.msg };
    },
    removeCoupon() {
      const s = this.state();
      s.coupon = null;
      this.save(s);
    },
    couponInfo(subtotal) {
      const code = this.state().coupon;
      if (!code) return { valid: false, code: null, discount: 0 };
      const c = MP.data.coupons.find((x) => x.code.toUpperCase() === code.toUpperCase() && x.active);
      if (!c) return { valid: false, code, discount: 0, msg: 'Cupom inválido ou expirado.' };
      if (c.expires && new Date(c.expires + 'T23:59:59') < new Date()) return { valid: false, code, discount: 0, msg: 'Cupom expirado.' };
      if (c.min && subtotal < c.min) return { valid: false, code, discount: 0, msg: `Cupom válido para compras acima de ${U.brl(c.min)}.` };
      const discount = c.type === 'percent' ? U.round2((subtotal * c.value) / 100) : Math.min(Number(c.value), subtotal);
      return { valid: true, code: c.code, discount, coupon: c };
    },
    totals() {
      const s = this.state();
      const lines = this.lines();
      const subtotal = U.round2(lines.reduce((a, l) => a + l.total, 0));
      const coupon = this.couponInfo(subtotal);
      const discount = coupon.valid ? coupon.discount : 0;
      let ship;
      if (s.mode === 'retirada') ship = { mode: 'retirada', cost: 0, label: 'Retirada na loja', days: 'Sem custo' };
      else {
        const q = MP.shipping.quote(s.cep, subtotal - discount, lines.some((l) => l.product.type === 'Telhas'));
        ship = q.ok ? Object.assign({ mode: 'entrega', label: q.zone }, q) : { mode: 'entrega', cost: null, pending: true };
      }
      const total = U.round2(subtotal - discount + (ship.cost || 0));
      return { lines, subtotal, discount, coupon, shipping: ship, total, count: lines.reduce((a, l) => a + l.qty, 0) };
    }
  });

  /* ---------- pedidos / mensagem de WhatsApp ---------- */
  MP.orders = {
    waLink(text, number) {
      const n = U.digits(number != null ? number : MP.settings.get().whatsapp);
      return `https://wa.me/${n ? n : ''}?text=${encodeURIComponent(text)}`;
    },
    /* Texto do orçamento. Aceita um pedido salvo ou o carrinho atual (t = MP.cart.totals()). */
    message({ customer, items, subtotal, discount, coupon, shipping, delivery, total, number }) {
      const L = [];
      L.push('Olá! Gostaria de solicitar um orçamento.');
      if (number) L.push(`(Referência: #MP${number})`);
      L.push('');
      if (customer && customer.name) L.push(`Cliente: ${customer.name}`);
      if (customer && customer.phone) L.push(`Telefone: ${customer.phone}`);
      L.push('');
      L.push('Produtos:');
      items.forEach((i) => {
        const unit = i.unitLabel ? ` [${i.unitLabel}]` : '';
        L.push(`${i.qty}x ${i.name}${i.variant ? ' - ' + i.variant : ''}${unit} — ${U.brl(i.price)} un. = ${U.brl(U.round2(i.price * i.qty))}`);
      });
      L.push('');
      L.push(`Subtotal: ${U.brl(subtotal)}`);
      if (discount > 0) L.push(`Desconto${coupon ? ' (' + coupon + ')' : ''}: - ${U.brl(discount)}`);
      if (delivery && delivery.mode === 'retirada') L.push('Entrega: Retirada na loja');
      else {
        L.push(`Entrega: ${delivery && delivery.cep ? 'CEP ' + delivery.cep : 'a combinar'}`);
        if (shipping != null) L.push(`Frete: ${shipping === 0 ? 'Grátis' : U.brl(shipping)}`);
        else L.push('Frete: a calcular');
      }
      L.push(`Total aproximado: ${U.brl(total)}`);
      L.push('');
      L.push('Gostaria de confirmar disponibilidade, prazo e forma de pagamento.');
      return L.join('\n');
    },
    messageFromCart(customer, number) {
      const t = MP.cart.totals();
      const s = MP.cart.state();
      return this.message({
        customer, number,
        items: t.lines.map((l) => ({ name: l.product.name, variant: l.product.variant, unitLabel: l.product.units ? l.unitLabel : '', qty: l.qty, price: l.price })),
        subtotal: t.subtotal, discount: t.discount, coupon: t.coupon.valid ? t.coupon.code : '',
        shipping: t.shipping.cost, delivery: { mode: s.mode, cep: s.cep }, total: t.total
      });
    },
    messageFromOrder(o) {
      return this.message({
        customer: o.customer, number: o.number,
        items: o.items, subtotal: o.subtotal, discount: o.discount, coupon: o.coupon,
        shipping: o.delivery.mode === 'retirada' ? 0 : o.shipping, delivery: o.delivery, total: o.total
      });
    },
    createFromCart(customer) {
      const t = MP.cart.totals();
      const s = MP.cart.state();
      const user = MP.auth.current();
      const number = MP.store.nextOrderNumber();
      const now = new Date().toISOString();
      const order = {
        id: 'MP' + number, number, userId: user ? user.id : null, customer,
        items: t.lines.map((l) => ({ productId: l.product.id, name: l.product.name, variant: l.product.variant, unitLabel: l.product.units ? l.unitLabel : '', qty: l.qty, price: l.price })),
        subtotal: t.subtotal, discount: t.discount, shipping: t.shipping.cost || 0, total: t.total,
        coupon: t.coupon.valid ? t.coupon.code : null, delivery: { mode: s.mode, cep: s.cep },
        status: 'Aguardando', history: [{ status: 'Aguardando', at: now }], createdAt: now
      };
      MP.data.orders.save(order);
      if (MP.notify) MP.notify.newOrder(order);
      return order;
    }
  };

  /* ---------- orçamentos salvos ---------- */
  MP.quotes = {
    all() {
      const u = MP.auth.current();
      const uid = u ? u.id : 'guest';
      return MP.data.quotes.all().filter((q) => q.owner === uid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    saveCurrent(title) {
      const s = MP.cart.state();
      if (!s.lines.length) return null;
      const u = MP.auth.current();
      const q = {
        id: U.uid('q'), owner: u ? u.id : 'guest', createdAt: new Date().toISOString(),
        title: title || 'Orçamento de ' + U.fmtDate(new Date().toISOString()),
        lines: s.lines, coupon: s.coupon, mode: s.mode, cep: s.cep, total: MP.cart.totals().total
      };
      MP.data.quotes.save(q);
      return q;
    },
    load(id) {
      const q = MP.data.quotes.get(id);
      if (!q) return false;
      MP.cart.save({ lines: q.lines, coupon: q.coupon, mode: q.mode, cep: q.cep });
      return true;
    }
  };
})(window.MP);
