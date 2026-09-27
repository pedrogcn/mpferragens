/* Contato/localização, páginas institucionais, 404 e skeletons de carregamento. */
(function (MP) {
  const U = MP.util;
  const { esc } = U;
  const C = MP.components;

  const addrLine = (s) => U.addrLine(s.address);

  MP.pages.locationBlock = () => {
    const s = MP.settings.get();
    const q = encodeURIComponent(addrLine(s));
    const wa = MP.orders.waLink('Olá! Vim pelo site e gostaria de atendimento.');
    return `<div class="loc">
      <div class="loc-info">
        <ul class="loc-list">
          <li>${MP.icon('pin', 22)}<div><b>Endereço</b><span>${esc(U.addrLine(s.address))}</span></div></li>
          <li>${MP.icon('clock', 22)}<div><b>Horário de funcionamento</b><span>${s.hours.map(esc).join('<br>')}</span></div></li>
          <li>${MP.icon('whatsapp', 22)}<div><b>WhatsApp</b><a href="${esc(wa)}" target="_blank" rel="noopener">${esc(s.whatsappDisplay)}</a></div></li>
          <li>${MP.icon('phone', 22)}<div><b>Telefone</b><a href="tel:${U.digits(s.phone)}">${esc(s.phone)}</a></div></li>
          <li>${MP.icon('mail', 22)}<div><b>E-mail</b><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></div></li>
        </ul>
        <a class="btn btn-danger btn-lg" href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener">${MP.icon('pin', 18)} VER NO GOOGLE MAPS</a>
        <div class="social-row light">${C.socialLinks(22)}</div>
      </div>
      <div class="loc-map"><iframe title="Mapa com a localização da loja" src="https://www.google.com/maps?q=${q}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
    </div>`;
  };

  MP.pages.contact = () => ({
    title: 'Contato e localização',
    html: `<div class="container page-pad">${C.breadcrumb([{ label: 'Início', href: '#/' }, { label: 'Contato' }])}
      <h1 class="page-title">ONDE ESTAMOS</h1>
      ${MP.pages.locationBlock()}
      <section class="section narrow">
        <h2 class="section-title left">FALE CONOSCO</h2>
        <form class="card contact-form" data-submit="contact" novalidate>
          <div class="grid-2">${C.field({ label: 'Seu nome', name: 'name', required: true, autocomplete: 'name' })}${C.field({ label: 'Telefone / WhatsApp', name: 'phone', mask: 'phone', autocomplete: 'tel' })}</div>
          ${C.field({ label: 'Mensagem', name: 'msg', type: 'textarea', required: true, rows: 4, placeholder: 'Conte o que você precisa: produtos, quantidades, prazo...' })}
          <div class="form-actions"><button class="btn btn-wa">${MP.icon('whatsapp', 18)} Enviar pelo WhatsApp</button></div>
        </form>
      </section></div>`
  });
  MP.on.submit('contact', (form, fd) => {
    C.clearErrors(form);
    const name = String(fd.get('name') || '').trim();
    const msg = String(fd.get('msg') || '').trim();
    if (name.length < 2) return C.formError(form, 'name', 'Informe seu nome.');
    if (msg.length < 5) return C.formError(form, 'msg', 'Escreva sua mensagem.');
    const phone = String(fd.get('phone') || '').trim();
    window.open(MP.orders.waLink(`Olá! Meu nome é ${name}${phone ? ' (' + phone + ')' : ''}.\n\n${msg}`), '_blank', 'noopener');
    MP.ui.toast('Abrimos o WhatsApp da loja com a sua mensagem.', 'info');
  });

  /* ---------- institucional ---------- */
  const PAGES = {
    'quem-somos': {
      title: 'Quem somos',
      body: (s) => `<p>A <b>${esc(s.storeName)}</b> atende construtores, profissionais e clientes que buscam ferro, ferragens e materiais de construção com preço justo, qualidade e entrega rápida em ${esc(s.address.city)}.</p>
        <p>Nosso compromisso é facilitar a sua obra: catálogo organizado, orçamento online e atendimento especializado pelo WhatsApp, do primeiro item à entrega final.</p>
        <p>Venha nos visitar: ${esc(addrLine(s))}.</p>`
    },
    privacidade: {
      title: 'Política de Privacidade',
      body: (s) => `<p>Esta política explica como a ${esc(s.storeName)} trata os dados pessoais informados neste site, em conformidade com a Lei Geral de Proteção de Dados (LGPD).</p>
        <h3>Dados que coletamos</h3><p>Nome, telefone, e-mail, documento (CPF/CNPJ) e endereço, informados por você ao criar uma conta ou solicitar um orçamento.</p>
        <h3>Como usamos</h3><p>Para elaborar orçamentos, confirmar pedidos, organizar entregas e entrar em contato sobre a sua compra. Não vendemos seus dados.</p>
        <h3>Seus direitos</h3><p>Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelo e-mail ${esc(s.email)}.</p>`
    },
    termos: {
      title: 'Termos de Uso',
      body: (s) => `<p>Ao utilizar este site você concorda com os termos abaixo.</p>
        <h3>Orçamentos e preços</h3><p>Os valores exibidos são de referência e podem ser alterados sem aviso. O pedido só é confirmado após o atendimento da ${esc(s.storeName)}, que verifica disponibilidade, prazo e forma de pagamento.</p>
        <h3>Entrega e retirada</h3><p>Prazos e fretes variam conforme o CEP e o volume da compra. A retirada na loja é gratuita.</p>
        <h3>Trocas e devoluções</h3><p>Seguem o Código de Defesa do Consumidor. Produtos cortados sob medida não possuem troca, salvo defeito.</p>`
    }
  };
  MP.pages.institutional = (ctx) => {
    const pg = PAGES[ctx.params.page];
    if (!pg) return MP.pages.notFound();
    const s = MP.settings.get();
    return { title: pg.title, html: `<div class="container page-pad narrow prose">${C.breadcrumb([{ label: 'Início', href: '#/' }, { label: pg.title }])}<h1 class="page-title left">${pg.title}</h1>${pg.body(s)}</div>` };
  };

  MP.pages.notFound = () => ({
    title: 'Página não encontrada',
    html: `<div class="container page-pad">${C.emptyState({ icon: 'search', title: 'Página não encontrada', text: 'O endereço que você acessou não existe ou o produto saiu do catálogo.', action: '<a class="btn btn-primary" href="#/">Voltar ao início</a>' })}</div>`
  });

  /* ---------- skeletons ---------- */
  const card = '<div class="sk-card"><div class="sk sk-img"></div><div class="sk sk-line"></div><div class="sk sk-line short"></div><div class="sk sk-btn"></div></div>';
  MP.pages.skeleton = (kind) => {
    if (kind === 'home') return `<div class="sk sk-hero"></div><div class="container section"><div class="sk-row">${'<div class="sk sk-cat"></div>'.repeat(7)}</div><div class="pgrid">${card.repeat(4)}</div></div>`;
    if (kind === 'product') return `<div class="container page-pad"><div class="product-top"><div class="sk sk-gallery"></div><div><div class="sk sk-line big"></div><div class="sk sk-line"></div><div class="sk sk-line short"></div><div class="sk sk-box"></div><div class="sk sk-btn wide"></div></div></div></div>`;
    return `<div class="container page-pad"><div class="catalog"><div class="catalog-side"><div class="sk sk-box"></div></div><div class="catalog-main"><div class="pgrid">${card.repeat(8)}</div></div></div></div>`;
  };
})(window.MP);
