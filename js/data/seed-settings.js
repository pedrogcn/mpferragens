/* Configurações padrão da loja. Tudo isto é editável no painel (#/admin > Loja).
 * WhatsApp/telefone, rua e bairro vêm dos banners oficiais da loja (Rua Itália, nº 33, Flores · (92) 98111-1443).
 * ATENÇÃO: e-mail, horários, redes sociais, bairro e CEP abaixo ainda são PLACEHOLDERS: confira em Admin > Loja. */
(function (MP) {
  MP.seed.settings = {
    storeName: 'MP Ferragens',
    tagline: 'Ferro, ferragens e muito mais para a sua obra!',
    logo: 'assets/logo.jpg',
    whatsapp: '5592981111443',
    whatsappDisplay: '(92) 98111-1443',
    phone: '(92) 98111-1443',
    email: 'contato@mpferragens.com.br',
    address: { street: 'Rua Itália, nº 33', district: 'Flores', city: 'Manaus', state: 'AM', cep: '' },
    hours: ['Segunda a Sábado: 7h às 18h', 'Domingo: 8h às 14h'],
    social: {
      instagram: 'https://www.instagram.com/mp.ferragens_am/',
      facebook: 'https://facebook.com/mpferragens',
      tiktok: '',
      youtube: ''
    },
    handle: '@mpferragens',
    // freeAbove/freeAboveTelha valem para as duas zonas (Manaus e Interior); com telha no carrinho, o limite é o maior (freeAboveTelha)
    shipping: { manausPrice: 29.9, interiorPrice: 89.9, freeAbove: 1300, freeAboveTelha: 3000, manausDays: '1 a 2 dias úteis', interiorDays: '5 a 10 dias úteis' },
    pickupText: 'Retire na loja em até 2 horas após a confirmação do pedido.',
    /* senha padrão do painel: admin123 (troque em Loja > Segurança) */
    adminPasswordHash: MP.util.sha256('admin123:mp-admin')
  };

  MP.seed.categories = [
    { id: 'aco-metais', slug: 'aco-metais', name: 'Aço e Metais', short: 'Aço e Metais', icon: 'layers', art: { type: 'rebar', d: 20 }, order: 1, desc: 'Variedade e qualidade para sua obra. Confira nossos principais produtos.' },
    { id: 'ferragens', slug: 'ferragens', name: 'Ferragens', short: 'Ferragens', icon: 'nut', art: { type: 'nails' }, order: 2, desc: 'Fixação, fechaduras, dobradiças e tudo em ferragens para sua obra.' },
    { id: 'eletrica', slug: 'eletrica', name: 'Elétrica', short: 'Elétrica', icon: 'bolt', art: { type: 'coil', pal: 'red', w: 170, tag: '2,5 mm' }, order: 3, desc: 'Cabos, tomadas, disjuntores e iluminação com segurança.' },
    { id: 'hidraulica', slug: 'hidraulica', name: 'Hidráulica', short: 'Hidráulica', icon: 'drop', art: { type: 'roundTube', pal: 'white', band: '#1f7ad8' }, order: 4, desc: 'Tubos, conexões, registros e reservatórios para instalações hidráulicas.' },
    { id: 'pintura', slug: 'pintura', name: 'Pintura', short: 'Pintura', icon: 'roller', art: { type: 'paint', color: '#f5f5f5', label: 'TINTA' }, order: 5, desc: 'Tintas, rolos, pincéis e acessórios para um acabamento perfeito.' },
    { id: 'construcao', slug: 'construcao', name: 'Construção', short: 'Construção', icon: 'hardhat', art: { type: 'cement' }, order: 6, desc: 'Cimento, argamassa, blocos e tudo para a estrutura da sua obra.' },
    { id: 'ferramentas', slug: 'ferramentas', name: 'Ferramentas', short: 'Ferramentas', icon: 'wrench', art: { type: 'hammer' }, order: 7, desc: 'Ferramentas manuais e elétricas para profissionais e para o dia a dia.' }
  ];

  MP.seed.coupons = [
    { id: 'c-bemvindo', code: 'BEMVINDO10', type: 'percent', value: 10, min: 100, active: true, desc: '10% de desconto em compras acima de R$ 100' },
    { id: 'c-obra50', code: 'OBRA50', type: 'fixed', value: 50, min: 500, active: true, desc: 'R$ 50 de desconto em compras acima de R$ 500' }
  ];

  MP.seed.banners = [
    {
      id: 'b0', active: true, order: 0, full: true, hero: 'steel', theme: 'dark',
      kicker: '', title: 'MP Ferragens — Tudo em ferragens para sua obra', brand: '', text: '', cta: '', link: '', badge: '',
      image: 'assets/banner-mp.jpg'
    },
    {
      id: 'b0e', active: true, order: 1, full: true, hero: 'steel', theme: 'dark',
      kicker: '', title: 'Fazemos entrega! Atendimento rápido, sem complicação', brand: '', text: '', cta: '', link: '#/contato', badge: '',
      image: 'assets/banner-entrega.jpg', imageMobile: 'assets/banner-entrega-celular.jpg'
    },
    {
      id: 'b1', active: true, order: 1, hero: 'steel', theme: 'dark',
      kicker: 'MANAUS É NA', title: 'FERRO E FERRAGENS', brand: 'MP FERRAGENS',
      text: 'Qualidade, preço baixo e entrega rápida em Manaus.',
      cta: 'COMPRAR AGORA', link: '#/categoria/aco-metais', badge: 'TUDO PARA SUA OBRA EM UM SÓ LUGAR!', image: ''
    },
    {
      id: 'b2', active: true, order: 2, hero: 'eletro', theme: 'dark',
      kicker: 'INSTALE COM SEGURANÇA', title: 'ELÉTRICA E HIDRÁULICA', brand: '',
      text: 'Cabos, disjuntores, tubos e conexões das melhores marcas.',
      cta: 'VER PRODUTOS', link: '#/categoria/eletrica', badge: 'CUPOM BEMVINDO10 = 10% OFF', image: ''
    },
    {
      id: 'b3', active: true, order: 3, hero: 'tools', theme: 'dark',
      kicker: 'TRABALHE COM QUEM ENTENDE', title: 'FERRAMENTAS', brand: 'PARA PROFISSIONAIS',
      text: 'Furadeiras, martelos, trenas e muito mais com preço de obra.',
      cta: 'VER FERRAMENTAS', link: '#/categoria/ferramentas', badge: 'ATÉ 10% OFF NO PIX', image: ''
    }
  ];
})(window.MP);
