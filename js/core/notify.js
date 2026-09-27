/*
 * Aviso de pedido novo por e-mail, via Web3Forms (serviço gratuito; a chave é pública e fica em js/firebase-config.js).
 * É chamado pelo navegador do cliente logo depois de gravar o pedido. Falha em silêncio: o pedido já está salvo.
 */
(function (MP) {
  const U = MP.util;
  const cfg = () => window.MP_NOTIFY || {};

  MP.notify = {
    enabled: () => !!(MP.cloud && MP.cloud.enabled && cfg().web3formsKey),
    text(o) {
      const L = [];
      L.push(`Pedido #${o.id} — ${U.brl(o.total)}`);
      L.push('');
      L.push(`Cliente: ${o.customer.name}`);
      if (o.customer.phone) L.push(`Telefone: ${o.customer.phone}`);
      if (o.customer.email) L.push(`E-mail: ${o.customer.email}`);
      L.push(o.delivery && o.delivery.mode === 'retirada' ? 'Retirada na loja' : `Entrega — CEP ${(o.delivery && o.delivery.cep) || 'a combinar'}`);
      L.push('');
      L.push('Itens:');
      o.items.forEach((i) => L.push(`${i.qty}x ${i.name}${i.variant ? ' - ' + i.variant : ''} — ${U.brl(i.price)} un. = ${U.brl(U.round2(i.price * i.qty))}`));
      L.push('');
      if (o.discount > 0) L.push(`Desconto${o.coupon ? ' (' + o.coupon + ')' : ''}: - ${U.brl(o.discount)}`);
      L.push(`Frete: ${o.shipping ? U.brl(o.shipping) : 'grátis / a combinar'}`);
      L.push(`Total: ${U.brl(o.total)}`);
      L.push('');
      L.push(`Ver no painel: ${location.origin}/#/admin/pedidos`);
      return L.join('\n');
    },
    newOrder(o) {
      if (!this.enabled()) return;
      const body = {
        access_key: cfg().web3formsKey,
        subject: `Novo pedido #${o.id} — ${U.brl(o.total)}`,
        from_name: MP.settings.get().storeName,
        name: o.customer.name,
        message: this.text(o)
      };
      try {
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body),
          keepalive: true // termina de enviar mesmo se o cliente fechar a aba
        }).catch((e) => console.warn('[aviso por e-mail]', e));
      } catch (e) {
        console.warn('[aviso por e-mail]', e);
      }
    }
  };
})(window.MP);
