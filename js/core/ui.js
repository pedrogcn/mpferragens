/* Interface compartilhada: roteador por hash, ações delegadas, toast, modal, drawer e lightbox. */
(function (MP) {
  const U = MP.util;
  const { esc } = U;

  /* ================= AÇÕES DELEGADAS ================= */
  const reg = { click: {}, change: {}, input: {}, submit: {} };
  MP.on = {
    click: (n, fn) => (reg.click[n] = fn),
    change: (n, fn) => (reg.change[n] = fn),
    input: (n, fn) => (reg.input[n] = fn),
    submit: (n, fn) => (reg.submit[n] = fn)
  };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = reg.click[el.dataset.action];
    if (fn) fn(el, e);
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (el && reg.change[el.dataset.change]) reg.change[el.dataset.change](el, e);
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-input]');
    if (el && reg.input[el.dataset.input]) reg.input[el.dataset.input](el, e);
    if (e.target.dataset && e.target.dataset.mask) {
      const m = { phone: U.maskPhone, cep: U.maskCep, doc: U.maskDoc }[e.target.dataset.mask];
      if (m) e.target.value = m(e.target.value);
    }
  });
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-submit]');
    if (!form) return;
    e.preventDefault();
    const fn = reg.submit[form.dataset.submit];
    if (fn) fn(form, new FormData(form), e);
  });

  /* ================= TOAST ================= */
  const ui = (MP.ui = {});
  ui.toast = (msg, type = 'ok', action) => {
    const root = U.$('#toast-root');
    if (!root) return;
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.setAttribute('role', type === 'error' ? 'alert' : 'status');
    t.innerHTML = `<span class="toast-ic">${MP.icon(type === 'error' ? 'alert' : type === 'info' ? 'info' : 'check', 18)}</span><span class="toast-msg">${esc(msg)}</span>${
      action ? `<a class="toast-act" href="${esc(action.href)}">${esc(action.label)}</a>` : ''
    }<button class="toast-x" aria-label="Fechar">${MP.icon('x', 14)}</button>`;
    root.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    const kill = () => {
      t.classList.remove('in');
      setTimeout(() => t.remove(), 250);
    };
    t.querySelector('.toast-x').onclick = kill;
    t.querySelector('.toast-act') && (t.querySelector('.toast-act').onclick = kill);
    setTimeout(kill, type === 'error' ? 6000 : 3800);
  };

  /* ================= MODAL / DRAWER ================= */
  let lastFocus = null;
  const overlay = () => U.$('#overlay-root');
  ui.closeAll = () => {
    const o = overlay();
    if (!o) return;
    o.innerHTML = '';
    document.body.classList.remove('no-scroll');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  };
  ui.modal = ({ title, body, wide, footer, onOpen, className = '' }) => {
    lastFocus = document.activeElement;
    const o = overlay();
    o.innerHTML = `<div class="modal-back" data-action="modal-close-bg"><div class="modal ${wide ? 'modal-wide' : ''} ${className}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn" data-action="modal-close" aria-label="Fechar">${MP.icon('x', 20)}</button></header>
      <div class="modal-body">${body}</div>${footer ? `<footer class="modal-foot">${footer}</footer>` : ''}</div></div>`;
    document.body.classList.add('no-scroll');
    const m = o.querySelector('.modal');
    const first = m.querySelector('input:not([type=hidden]),select,textarea,button.btn');
    setTimeout(() => first && first.focus(), 30);
    if (onOpen) onOpen(m);
    return m;
  };
  MP.on.click('modal-close', () => ui.closeAll());
  MP.on.click('modal-close-bg', (el, e) => {
    if (e.target === el) ui.closeAll();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay() && overlay().firstChild) ui.closeAll();
  });

  ui.confirm = (message, { ok = 'Confirmar', danger = false, title = 'Confirmação' } = {}) =>
    new Promise((resolve) => {
      const m = ui.modal({
        title,
        body: `<p>${esc(message)}</p>`,
        footer: `<button class="btn btn-ghost" data-cf="0">Cancelar</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-cf="1">${esc(ok)}</button>`
      });
      m.addEventListener('click', (e) => {
        const b = e.target.closest('[data-cf]');
        if (!b) return;
        ui.closeAll();
        resolve(b.dataset.cf === '1');
      });
    });

  ui.lightbox = (src, alt) => {
    lastFocus = document.activeElement;
    overlay().innerHTML = `<div class="modal-back lightbox" data-action="modal-close-bg"><button class="icon-btn lb-x" data-action="modal-close" aria-label="Fechar">${MP.icon('x', 26)}</button><img src="${esc(src)}" alt="${esc(alt || '')}"></div>`;
    document.body.classList.add('no-scroll');
  };

  /* drawer lateral (menu mobile e filtros) */
  ui.drawer = ({ title, body, side = 'left', className = '' }) => {
    lastFocus = document.activeElement;
    overlay().innerHTML = `<div class="drawer-back" data-action="modal-close-bg"><aside class="drawer drawer-${side} ${className}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="drawer-head"><strong>${esc(title)}</strong><button class="icon-btn" data-action="modal-close" aria-label="Fechar">${MP.icon('x', 22)}</button></header>
      <div class="drawer-body">${body}</div></aside></div>`;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => overlay().querySelector('.drawer').classList.add('in'));
  };

  /* fechar drawer ao navegar */
  MP.bus.on('route', () => {
    if (overlay() && overlay().firstChild && !overlay().querySelector('.modal')) ui.closeAll();
  });

  /* ================= ROTEADOR (hash) ================= */
  const routes = [];
  const router = (MP.router = {
    current: { path: '/', query: {}, params: {}, fullPath: '/' },
    add(pattern, handler, opts = {}) {
      const keys = [];
      const re = new RegExp('^' + pattern.replace(/:([a-z]+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '/?$');
      routes.push({ re, keys, handler, opts });
    },
    parse() {
      const raw = location.hash.replace(/^#/, '') || '/';
      const [path, qs] = raw.split('?');
      return { path: path || '/', query: U.parseQuery(qs), fullPath: raw };
    },
    go(path) {
      location.hash = '#' + path;
    },
    /* atualiza só a query (filtros/ordenação) sem empilhar histórico */
    setQuery(patch, { replace = true } = {}) {
      const q = Object.assign({}, router.current.query, patch);
      if (!('pg' in patch)) delete q.pg;
      const url = '#' + router.current.path + U.buildQuery(q);
      if (replace) history.replaceState(null, '', url);
      else location.hash = url;
      router.render(false);
    },
    start() {
      window.addEventListener('hashchange', () => router.render(true));
      router.render(true);
    },
    render(isNav) {
      const cur = router.parse();
      const prevPath = router.current.path;
      let match = null;
      for (const r of routes) {
        const m = r.re.exec(cur.path);
        if (m) {
          const params = {};
          r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
          match = { r, params };
          break;
        }
      }
      router.current = Object.assign(cur, { params: match ? match.params : {} });
      const app = U.$('#app');
      const samePath = prevPath === cur.path;
      const y = window.scrollY;
      const paint = () => {
        if (router.current !== cur) return; // outra navegação aconteceu durante o skeleton
        let out;
        try {
          out = match ? match.r.handler(router.current) : MP.pages.notFound();
        } catch (err) {
          console.error(err);
          out = { title: 'Erro', html: `<div class="container page-pad"><h1>Algo deu errado</h1><p>${esc(err.message)}</p><a class="btn btn-primary" href="#/">Voltar ao início</a></div>` };
        }
        if (typeof out === 'string') out = { html: out };
        if (out.redirected) return;
        document.title = (out.title ? out.title + ' | ' : '') + MP.settings.get().storeName;
        const md = U.$('meta[name="description"]');
        if (md) {
          if (!md.dataset.def) md.dataset.def = md.content;
          md.content = out.description || md.dataset.def;
        }
        document.body.classList.toggle('is-admin', out.layout === 'admin');
        app.innerHTML = out.html;
        app.classList.remove('is-loading');
        if (out.mount) out.mount(app);
        if (isNav && !samePath) {
          window.scrollTo(0, 0);
          app.focus({ preventScroll: true });
        } else window.scrollTo(0, y);
        MP.bus.emit('route', router.current);
      };
      const skel = match && match.r.opts.skeleton;
      if (isNav && !samePath && skel && MP.pages.skeleton) {
        app.innerHTML = MP.pages.skeleton(skel);
        app.classList.add('is-loading');
        setTimeout(paint, 170);
      } else paint();
    }
  });
})(window.MP);
