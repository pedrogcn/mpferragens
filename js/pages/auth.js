/* Entrar, criar conta e recuperação de senha. */
(function (MP) {
  const U = MP.util;
  const { esc } = U;
  const C = MP.components;

  const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/conta/pedidos');

  const shell = (title, inner, side) => ({
    title,
    html: `<div class="container page-pad"><div class="auth-wrap">
      <div class="auth-card">${inner}</div>
      <aside class="auth-side">${side}</aside></div></div>`
  });

  const perks = () => `<h2>Sua conta na ${esc(MP.settings.get().storeName)}</h2>
    <ul class="perks">
      <li>${MP.icon('clipboard', 22)} Acompanhe seus pedidos e orçamentos</li>
      <li>${MP.icon('heart', 22)} Salve favoritos e sua lista de desejos</li>
      <li>${MP.icon('pin', 22)} Guarde endereços de entrega das suas obras</li>
      <li>${MP.icon('bolt', 22)} Peça de novo em poucos cliques</li>
    </ul>`;

  MP.pages.login = (ctx) => {
    if (MP.auth.current()) {
      MP.router.go(safeNext(ctx.query.next));
      return { redirected: true };
    }
    const demo = !MP.cloud.enabled && MP.seed.users && MP.seed.users[0];
    return shell(
      'Entrar',
      `<h1>Entrar</h1><p class="muted">Acesse sua conta para acompanhar seus pedidos.</p>
      <form data-submit="login" data-next="${esc(ctx.query.next || '')}" novalidate>
        ${C.field({ label: 'E-mail', name: 'email', type: 'email', required: true, autocomplete: 'username', placeholder: 'seu@email.com' })}
        ${C.field({ label: 'Senha', name: 'password', type: 'password', required: true, autocomplete: 'current-password' })}
        <p class="form-error" data-err="form" role="alert"></p>
        <button class="btn btn-primary btn-lg btn-block">Entrar</button>
      </form>
      <div class="auth-links"><a href="#/recuperar-senha">Esqueci minha senha</a><a href="#/cadastro">Criar conta</a></div>
      ${demo ? `<p class="demo-hint">Conta de demonstração: <b>${esc(demo.email)}</b> / <b>123456</b></p>` : ''}`,
      perks()
    );
  };

  /* trava o botão enquanto o servidor responde (evita clique duplo) */
  const busy = (form, on) => {
    const b = form.querySelector('button:not([type=button])');
    if (b) b.disabled = on;
  };

  MP.on.submit('login', async (form, fd) => {
    C.clearErrors(form);
    const email = String(fd.get('email') || '').trim();
    const pw = String(fd.get('password') || '');
    if (!U.validEmail(email)) return C.formError(form, 'email', 'Informe um e-mail válido.');
    if (!pw) return C.formError(form, 'password', 'Informe a senha.');
    busy(form, true);
    const r = await MP.auth.login(email, pw);
    busy(form, false);
    if (!r.ok) return C.formError(form, 'form', r.error);
    MP.ui.toast(`Bem-vindo, ${MP.auth.firstName(r.user)}!`);
    MP.router.go(safeNext(form.dataset.next));
  });

  MP.pages.register = (ctx) => {
    if (MP.auth.current()) {
      MP.router.go('/conta/pedidos');
      return { redirected: true };
    }
    return shell(
      'Criar conta',
      `<h1>Criar conta</h1><p class="muted">Cadastre-se como pessoa física ou jurídica.</p>
      <form data-submit="register" data-next="${esc(ctx.query.next || '')}" novalidate>
        <div class="seg" role="radiogroup" aria-label="Tipo de cadastro">
          <label><input type="radio" name="type" value="pf" checked data-change="reg-type"><span>Pessoa física</span></label>
          <label><input type="radio" name="type" value="pj" data-change="reg-type"><span>Pessoa jurídica</span></label>
        </div>
        <div class="grid-2">
          ${C.field({ label: 'Nome completo', name: 'name', required: true, autocomplete: 'name', attrs: 'data-role="name"' })}
          ${C.field({ label: 'CPF', name: 'doc', required: true, mask: 'doc', attrs: 'data-role="doc" inputmode="numeric" maxlength="18"' })}
        </div>
        <div class="field is-hidden" data-pj><label for="reg-company">Nome fantasia (opcional)</label><input id="reg-company" name="company" autocomplete="organization"></div>
        <div class="grid-2">
          ${C.field({ label: 'Telefone', name: 'phone', required: true, mask: 'phone', autocomplete: 'tel', attrs: 'inputmode="tel"' })}
          ${C.field({ label: 'E-mail', name: 'email', type: 'email', required: true, autocomplete: 'email' })}
        </div>
        <div class="grid-2">
          ${C.field({ label: 'Senha', name: 'password', type: 'password', required: true, autocomplete: 'new-password', hint: 'Mínimo de 6 caracteres.' })}
          ${C.field({ label: 'Confirmar senha', name: 'password2', type: 'password', required: true, autocomplete: 'new-password' })}
        </div>
        <h3 class="form-sub">Endereço</h3>
        ${C.addressFields({}, '')}
        <p class="form-error" data-err="form" role="alert"></p>
        <button class="btn btn-primary btn-lg btn-block">Criar conta</button>
      </form>
      <div class="auth-links"><span>Já tem conta? <a href="#/entrar">Entrar</a></span></div>`,
      perks()
    );
  };

  MP.on.change('reg-type', (el) => {
    const form = el.closest('form');
    const pj = el.value === 'pj';
    const set = (role, text) => {
      const i = form.querySelector(`[data-role="${role}"]`);
      if (i) i.closest('.field').querySelector('label').innerHTML = text + ' <i aria-hidden="true">*</i>';
    };
    set('name', pj ? 'Razão social' : 'Nome completo');
    set('doc', pj ? 'CNPJ' : 'CPF');
    form.querySelector('[data-pj]').classList.toggle('is-hidden', !pj);
  });

  MP.on.submit('register', async (form, fd) => {
    C.clearErrors(form);
    const g = (k) => String(fd.get(k) || '').trim();
    const type = g('type') === 'pj' ? 'pj' : 'pf';
    const errs = {};
    if (g('name').length < 3) errs.name = type === 'pj' ? 'Informe a razão social.' : 'Informe seu nome completo.';
    if (!(type === 'pj' ? U.validCnpj(g('doc')) : U.validCpf(g('doc')))) errs.doc = type === 'pj' ? 'CNPJ inválido.' : 'CPF inválido.';
    if (U.digits(g('phone')).length < 10) errs.phone = 'Informe um telefone com DDD.';
    if (!U.validEmail(g('email'))) errs.email = 'E-mail inválido.';
    if (g('password').length < 6) errs.password = 'A senha deve ter pelo menos 6 caracteres.';
    if (g('password2') !== g('password')) errs.password2 = 'As senhas não conferem.';
    const keys = Object.keys(errs);
    if (keys.length) {
      keys.forEach((k) => C.formError(form, k, errs[k]));
      const first = form.querySelector(`[name="${keys[0]}"]`);
      first && first.focus();
      return;
    }
    busy(form, true);
    const r = await MP.auth.register({ type, name: g('name'), company: g('company'), doc: g('doc'), phone: g('phone'), email: g('email'), password: g('password'), address: C.readAddress(fd, '') });
    busy(form, false);
    if (!r.ok) return C.formError(form, 'email', r.error);
    MP.ui.toast('Conta criada com sucesso!');
    MP.router.go(safeNext(form.dataset.next));
  });

  MP.pages.forgot = () =>
    shell(
      'Recuperar senha',
      `<h1>Esqueci minha senha</h1><p class="muted">${MP.cloud.enabled ? 'Informe seu e-mail e enviaremos um link para você criar uma nova senha.' : 'Informe seu e-mail. Como o site ainda não envia e-mails automáticos, a redefinição é feita pelo atendimento da loja.'}</p>
      <form data-submit="forgot" novalidate>
        ${C.field({ label: 'E-mail cadastrado', name: 'email', type: 'email', required: true })}
        <p class="form-error" data-err="form" role="alert"></p>
        <button class="btn btn-primary btn-lg btn-block">${MP.cloud.enabled ? 'Enviar link por e-mail' : 'Pedir redefinição pelo WhatsApp'}</button>
      </form>
      <div class="auth-links"><a href="#/entrar">Voltar para o login</a></div>`,
      perks()
    );
  MP.on.submit('forgot', async (form, fd) => {
    C.clearErrors(form);
    const email = String(fd.get('email') || '').trim();
    if (!U.validEmail(email)) return C.formError(form, 'email', 'Informe um e-mail válido.');
    if (MP.cloud.enabled) {
      busy(form, true);
      const r = await MP.auth.resetPassword(email);
      busy(form, false);
      if (!r.ok) return C.formError(form, 'form', r.error);
      MP.ui.toast('Se este e-mail tiver conta, você receberá o link em instantes. Veja também a caixa de spam.', 'info');
      return;
    }
    window.open(MP.orders.waLink(`Olá! Preciso redefinir a senha da minha conta no site. E-mail cadastrado: ${email}`), '_blank', 'noopener');
    MP.ui.toast('Abrimos o WhatsApp da loja para você solicitar a redefinição.', 'info');
  });
})(window.MP);
