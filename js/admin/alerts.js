/*
 * Avisos de pedido novo dentro do painel: som, notificação do navegador, aviso na tela e contador no menu.
 * Funciona enquanto o painel estiver aberto (em qualquer aba/celular). Para receber com o painel fechado,
 * use também o aviso por e-mail (js/core/notify.js e AVISOS.md).
 */
(function (MP) {
  const U = MP.util;
  const KEY = 'mp:alerts';
  const isOn = () => {
    try {
      return localStorage.getItem(KEY) !== 'off';
    } catch (e) {
      return true;
    }
  };
  const setOn = (v) => {
    try {
      localStorage.setItem(KEY, v ? 'on' : 'off');
    } catch (e) {}
  };
  const canNotify = () => 'Notification' in window;

  let ctx;
  const beep = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = ctx || new AC();
      if (ctx.state === 'suspended') ctx.resume();
      [[880, 0], [1175, 0.2], [880, 0.4]].forEach(([freq, t]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const at = ctx.currentTime + t;
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(at);
        osc.stop(at + 0.2);
      });
    } catch (e) {}
  };

  const pending = () => MP.data.orders.all().filter((o) => o.status === 'Aguardando').length;

  const label = () => `Avisos: ${isOn() ? 'ligados' : 'desligados'}`;

  /* atualiza o contador do menu sem redesenhar a página */
  const refreshBadge = () => {
    const a = U.$('.admin-side nav a[href="#/admin/pedidos"]');
    if (!a) return;
    const n = pending();
    let b = a.querySelector('.nav-badge');
    if (!n) return b && b.remove();
    if (!b) {
      b = document.createElement('span');
      b.className = 'nav-badge';
      a.appendChild(b);
    }
    b.textContent = n;
  };

  MP.alerts = {
    pending,
    beep,
    isOn,
    button: () => `<button class="btn btn-outline btn-sm" data-action="admin-alerts" title="Som e notificação quando chegar pedido novo">${label()}</button>`
  };

  MP.on.click('admin-alerts', async (el) => {
    const turnOn = !isOn();
    setOn(turnOn);
    el.textContent = label();
    if (!turnOn) return MP.ui.toast('Avisos de pedido novo desligados.', 'info');
    beep();
    let extra = '';
    if (canNotify() && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {}
    }
    if (canNotify() && Notification.permission === 'denied') extra = ' (notificações do navegador bloqueadas: libere nas configurações do site)';
    MP.ui.toast('Avisos ligados: você ouvirá um som quando chegar pedido novo.' + extra, 'ok');
  });

  /* título da aba: fica avisando até você olhar a lista de pedidos */
  let titleAlert = false;
  const PREFIX = '🔔 Novo pedido! | ';
  const seenNow = () => !document.hidden && MP.router.current.path.startsWith('/admin/pedidos');
  MP.bus.on('route', () => {
    if (!titleAlert) return;
    if (seenNow()) titleAlert = false;
    else if (!document.title.startsWith(PREFIX)) document.title = PREFIX + document.title;
  });
  document.addEventListener('visibilitychange', () => {
    if (titleAlert && seenNow()) {
      titleAlert = false;
      document.title = document.title.replace(PREFIX, '');
    }
  });

  MP.bus.on('order:new', (o) => {
    if (!MP.admin.isLogged()) return;
    refreshBadge();
    const total = U.brl(o.total);
    MP.ui.toast(`Novo pedido #${o.id} — ${total} (${o.customer.name})`, 'ok', { label: 'Ver pedidos', href: '#/admin/pedidos' });
    if (!isOn()) return;
    beep();
    if (!seenNow()) {
      titleAlert = true;
      if (!document.title.startsWith(PREFIX)) document.title = PREFIX + document.title;
    }
    if (canNotify() && Notification.permission === 'granted') {
      try {
        const n = new Notification('Novo pedido #' + o.id, { body: `${o.customer.name} · ${total}`, icon: MP.settings.get().logo, tag: 'order-' + o.id });
        n.onclick = () => {
          window.focus();
          MP.router.go('/admin/pedidos');
          n.close();
        };
      } catch (e) {}
    }
  });

  /* mudou o status de um pedido: o contador acompanha */
  MP.bus.on('data:orders', refreshBadge);
})(window.MP);
