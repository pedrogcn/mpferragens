/* Produtos de demonstração (nomes/preços fictícios, baseados na imagem de referência).
 * Substitua tudo pelo painel admin (#/admin > Produtos). */
(function (MP) {
  const U = MP.util;

  const CAT_TEXT = {
    'aco-metais': 'Material de aço com excelente resistência mecânica e durabilidade, ideal para estruturas, armações, serralheria e acabamentos em obras residenciais, comerciais e industriais.',
    ferragens: 'Ferragem de qualidade para fixação, segurança e acabamento. Produto indicado para uso profissional e doméstico em obras, reformas e manutenção.',
    eletrica: 'Material elétrico dentro das normas técnicas, garantindo segurança e desempenho nas instalações residenciais, comerciais e prediais.',
    hidraulica: 'Material hidráulico de alta resistência e vedação eficiente para instalações de água fria, esgoto e áreas externas.',
    pintura: 'Produto para pintura com ótimo rendimento, cobertura e acabamento uniforme em ambientes internos e externos.',
    construcao: 'Material de construção de qualidade para fundação, alvenaria, assentamento e acabamentos da sua obra.',
    ferramentas: 'Ferramenta robusta e ergonômica, indicada para o uso profissional e para o dia a dia da obra.'
  };

  let seq = 0;
  const list = [];
  /* P(categoria, tipo, nome, variante, marca, preço, descrição curta, arte, opções) */
  const P = (cat, type, name, variant, brand, price, desc, art, o = {}) => {
    seq++;
    const s = o.s || [];
    const specs = {};
    specs['Marca'] = brand;
    if (s[0]) specs['Modelo'] = s[0];
    if (s[1]) specs['Dimensões'] = s[1];
    if (s[2]) specs['Material'] = s[2];
    if (s[3]) specs['Peso'] = s[3];
    specs['Unidade de venda'] = o.unit || 'Unidade';
    if (s[4]) specs['Aplicação'] = s[4];
    const full = `${name} ${variant}`.trim();
    const day = String(((seq * 7) % 27) + 1).padStart(2, '0');
    const month = String(((seq * 5) % 12) + 1).padStart(2, '0');
    list.push({
      id: 'p' + String(seq).padStart(3, '0'),
      slug: U.slugify(full),
      name,
      variant,
      category: cat,
      type,
      brand,
      price,
      oldPrice: o.old || null,
      cardPrice: o.card != null ? o.card : U.round2(price * 1.05),
      desc,
      longDesc: o.long || `${desc} ${CAT_TEXT[cat]}`,
      units: o.units || null,
      specs,
      art,
      images: [],
      rating: o.rating || Math.round((4.3 + ((seq * 37) % 7) / 10) * 10) / 10,
      reviews: o.rev || 6 + ((seq * 11) % 40),
      sold: o.sold || 40 + ((seq * 97) % 900),
      createdAt: `2025-${month}-${day}`,
      stock: o.stock != null ? o.stock : 40 + ((seq * 13) % 300),
      featured: !!o.feat,
      active: true
    });
  };

  /* ---------------- AÇO E METAIS ---------------- */
  P('aco-metais', 'Vergalhão', 'Vergalhão 3/8', '12 metros - Gerdau', 'Gerdau', 55.0,
    'Vergalhão de aço CA-50, ideal para obras em geral, com alta resistência e durabilidade. Produto de qualidade Gerdau.',
    { type: 'rebar', d: 24, rows: [3, 4, 3] },
    {
      card: 52.0, sold: 1980, rating: 5, rev: 24, feat: true, stock: 620,
      s: ['CA-50', 'Ø 9,5 mm x 12 m', 'Aço CA-50 nervurado', '≈ 6,7 kg por barra', 'Vigas, pilares, lajes e fundações'],
      unit: 'Barra',
      units: [
        { key: 'barra', label: 'Barra (12 m)', factor: 1 },
        { key: 'metro', label: 'Metro', factor: 0.0917 },
        { key: 'kg', label: 'KG (12 m)', factor: 0.149 }
      ],
      long: 'Vergalhão de aço CA-50 nervurado, ideal para obras em geral, com alta resistência mecânica e durabilidade. As nervuras garantem excelente aderência ao concreto. Produto de qualidade Gerdau, atende às normas técnicas ABNT NBR 7480.'
    });
  P('aco-metais', 'Vergalhão', 'Vergalhão 1/4', '6,3 mm - 6m', 'Gerdau', 42.5, 'Vergalhão CA-60 para estribos, tela e armações leves.',
    { type: 'rebar', d: 15, rows: [3, 4, 3] }, { sold: 1240, feat: true, s: ['CA-60', 'Ø 6,3 mm x 6 m', 'Aço CA-60', '≈ 1,5 kg por barra', 'Estribos e armações leves'], unit: 'Barra' });
  P('aco-metais', 'Vergalhão', 'Vergalhão 3/8', '10 mm - 6m', 'ArcelorMittal', 56.9, 'Vergalhão CA-50 de 10 mm para vigas, pilares e lajes.',
    { type: 'rebar', d: 24, rows: [2, 3, 2] }, { sold: 1510, feat: true, s: ['CA-50', 'Ø 10 mm x 6 m', 'Aço CA-50 nervurado', '≈ 3,7 kg por barra', 'Vigas, pilares e lajes'], unit: 'Barra' });
  P('aco-metais', 'Vergalhão', 'Vergalhão 5/16', '8 mm - 6m', 'ArcelorMittal', 36.5, 'Vergalhão CA-50 de 8 mm para armações de média carga.',
    { type: 'rebar', d: 19, rows: [3, 4, 3] }, { sold: 980, s: ['CA-50', 'Ø 8 mm x 6 m', 'Aço CA-50 nervurado', '≈ 2,4 kg por barra', 'Sapatas, cintas e vergas'], unit: 'Barra' });
  P('aco-metais', 'Perfil', 'Perfil U 6m', '50x25x2,65', 'Vilar', 68.9, 'Perfil U em aço laminado para serralheria, estruturas e esquadrias.',
    { type: 'uProfile', h: 104 }, { old: 79.9, sold: 870, feat: true, s: ['Perfil U enrijecido', '50 x 25 x 2,65 mm x 6 m', 'Aço carbono', '≈ 10,9 kg por barra', 'Serralheria e estruturas leves'], unit: 'Barra' });
  P('aco-metais', 'Perfil', 'Perfil U 3/8', '75x40x3,00', 'Gerdau', 92.6, 'Perfil U pesado para estruturas metálicas e reforços.',
    { type: 'uProfile', h: 128 }, { sold: 420, s: ['Perfil U laminado', '75 x 40 x 3,00 mm x 6 m', 'Aço carbono', '≈ 19 kg por barra', 'Estruturas e reforços'], unit: 'Barra' });
  P('aco-metais', 'Perfil', 'Perfil L', '1" x 1/8" - 6m', 'Vilar', 62.5, 'Perfil L de abas iguais para molduras, prateleiras e estruturas.',
    { type: 'lProfile', a: 92 }, { sold: 350, s: ['Perfil L abas iguais', '25,4 x 3,17 mm x 6 m', 'Aço carbono', '≈ 7,2 kg por barra', 'Molduras e estruturas'], unit: 'Barra' });
  P('aco-metais', 'Cantoneira', 'Cantoneira 1/8', '3/4" - 6m', 'Gerdau', 37.9, 'Cantoneira de aço para reforços, molduras e serralheria.',
    { type: 'lProfile', a: 78 }, { old: 44.9, sold: 1120, feat: true, s: ['Cantoneira abas iguais', '19 x 3,17 mm x 6 m', 'Aço carbono', '≈ 5,3 kg por barra', 'Serralheria em geral'], unit: 'Barra' });
  P('aco-metais', 'Tubo', 'Tubo Quadrado', '20x20x1,2 - 6m', 'Vilar', 58.9, 'Tubo quadrado (metalon) para portões, grades e estruturas.',
    { type: 'squareTube', h: 88 }, { sold: 1330, feat: true, s: ['Metalon quadrado', '20 x 20 x 1,2 mm x 6 m', 'Aço galvanizado', '≈ 3,4 kg por barra', 'Portões, grades e móveis'], unit: 'Barra' });
  P('aco-metais', 'Tubo', 'Tubo Redondo', '3/4" 1,5mm - 6m', 'ArcelorMittal', 74.9, 'Tubo redondo de aço para estruturas, corrimãos e tubulações.',
    { type: 'roundTube', d: 78, pal: 'zinc' }, { sold: 640, feat: true, s: ['Tubo redondo', 'Ø 3/4" x 1,5 mm x 6 m', 'Aço carbono', '≈ 4,1 kg por barra', 'Corrimãos e estruturas'], unit: 'Barra' });
  P('aco-metais', 'Chapa', 'Chapa de Aço', '1,20 mm - 1000x2000', 'ArcelorMittal', 389.0, 'Chapa de aço laminada a frio para corte e dobra.',
    { type: 'sheet', n: 3 }, { old: 429.0, sold: 280, s: ['Chapa laminada a frio', '1000 x 2000 x 1,20 mm', 'Aço SAE 1010', '≈ 18,8 kg', 'Corte, dobra e calhas'] });
  P('aco-metais', 'Tela Soldada', 'Tela Soldada Q92', '2x3 m', 'Gerdau', 168.0, 'Tela soldada nervurada para lajes, pisos e calçadas.',
    { type: 'mesh', n: 8 }, { sold: 540, stock: 6, s: ['Q92', '2,00 x 3,00 m', 'Aço CA-60', '≈ 14,4 kg', 'Lajes, pisos e calçadas'] });
  P('aco-metais', 'Arame', 'Arame Recozido', 'nº 18 - 1 kg', 'Outras', 18.9, 'Arame recozido para amarração de armaduras.',
    { type: 'coil', pal: 'gray', w: 150, thick: 7, rings: 12, tag: '1 KG' }, { sold: 1500, s: ['Nº 18 (BWG 18)', 'Rolo de 1 kg', 'Aço recozido', '1 kg', 'Amarração de armaduras'], unit: 'Rolo' });
  P('aco-metais', 'Barra Chata', 'Barra Chata', '1" x 1/8" - 6m', 'Outras', 44.9, 'Barra chata laminada para portões, grades e reforços.',
    { type: 'flatBar', h: 40 }, { sold: 300, s: ['Barra chata', '25,4 x 3,17 mm x 6 m', 'Aço carbono', '≈ 3,8 kg por barra', 'Portões e reforços'], unit: 'Barra' });

  /* ---------------- FERRAGENS ---------------- */
  P('ferragens', 'Fixação', 'Prego 18x27', 'com cabeça - 1 kg', 'Gerdau', 16.9, 'Prego polido com cabeça para carpintaria e fôrmas.', { type: 'nails', n: 9 }, { sold: 1700, feat: true, unit: 'Pacote 1 kg', s: ['18 x 27', '62 mm', 'Aço polido', '1 kg', 'Carpintaria e fôrmas'] });
  P('ferragens', 'Fixação', 'Parafuso Sextavado', '3/8" x 2" - cx 50', 'Outras', 38.9, 'Parafuso sextavado zincado com rosca para fixação estrutural.', { type: 'bolt' }, { sold: 410, unit: 'Caixa 50 un', s: ['Sextavado zincado', '3/8" x 2"', 'Aço zincado', '≈ 2,8 kg a caixa', 'Fixação estrutural'] });
  P('ferragens', 'Fixação', 'Bucha Nylon 8 mm', 'c/ 100 unidades', 'Outras', 14.9, 'Bucha de nylon para fixação em alvenaria e concreto.', { type: 'nails', n: 7, head: 10 }, { sold: 760, unit: 'Pacote 100 un', s: ['S8', 'Ø 8 mm', 'Nylon', '0,3 kg', 'Fixação em alvenaria'] });
  P('ferragens', 'Dobradiça', 'Dobradiça 3"', 'latonada - jogo', 'Outras', 11.9, 'Dobradiça de aço latonada para portas e janelas.', { type: 'hinge' }, { sold: 620, unit: 'Jogo', s: ['3" latonada', '76 x 63 mm', 'Aço latonado', '0,15 kg', 'Portas e janelas'] });
  P('ferragens', 'Cadeado', 'Cadeado 40 mm', 'latão maciço', 'Papaiz', 29.9, 'Cadeado de latão maciço com duas chaves.', { type: 'padlock' }, { sold: 830, feat: true, s: ['40 mm', '40 x 55 mm', 'Latão maciço', '0,25 kg', 'Portões e armários'] });
  P('ferragens', 'Fechadura', 'Fechadura Externa', 'cromada com chave', 'Papaiz', 89.9, 'Fechadura externa cromada com maçaneta e cilindro.', { type: 'lock' }, { sold: 290, stock: 3, s: ['Externa 40 mm', 'Espelho 20 cm', 'Zamac cromado', '0,9 kg', 'Portas externas'] });

  /* ---------------- ELÉTRICA ---------------- */
  P('eletrica', 'Cabos', 'Cabo Flexível 2,5 mm²', 'rolo 100 m - vermelho', 'Sil', 289.9, 'Cabo flexível 750 V para instalações elétricas residenciais.', { type: 'coil', pal: 'red', w: 175, tag: '100 m' }, { old: 329.9, sold: 720, feat: true, unit: 'Rolo 100 m', s: ['Flexível 750 V', '2,5 mm² x 100 m', 'Cobre / PVC', '≈ 2,9 kg', 'Circuitos de tomadas e iluminação'] });
  P('eletrica', 'Tomadas', 'Tomada 10A', '2P+T padrão NBR 14136', 'Pial', 12.9, 'Tomada 2P+T de embutir com placa, padrão brasileiro.', { type: 'outlet' }, { sold: 1450, s: ['10A / 250 V', '4x2"', 'Termoplástico', '0,08 kg', 'Instalações residenciais'] });
  P('eletrica', 'Disjuntores', 'Disjuntor 20A', 'monopolar curva C', 'Steck', 18.9, 'Disjuntor termomagnético monopolar de 20A.', { type: 'breaker', label: '20A' }, { sold: 980, s: ['Monopolar curva C', '1P 20A', 'Termoplástico', '0,1 kg', 'Quadros de distribuição'] });
  P('eletrica', 'Iluminação', 'Lâmpada LED 9W', 'bulbo 6500K', 'Philips', 9.9, 'Lâmpada LED bulbo econômica com luz branca fria.', { type: 'bulb' }, { sold: 2100, feat: true, s: ['LED bulbo', '9W / E27', 'Vidro e alumínio', '0,05 kg', 'Iluminação em geral'] });
  P('eletrica', 'Acessórios', 'Fita Isolante', '20 m - preta', '3M', 8.9, 'Fita isolante antichama para emendas elétricas.', { type: 'tape', pal: 'black' }, { sold: 1300, s: ['19 mm x 20 m', '19 mm x 20 m', 'PVC antichama', '0,1 kg', 'Isolação de emendas'] });
  P('eletrica', 'Eletrodutos', 'Eletroduto Corrugado', '3/4" - rolo 50 m', 'Tigre', 89.9, 'Eletroduto corrugado flexível para instalações embutidas.', { type: 'coil', pal: 'orange', w: 170, thick: 12, rings: 8, tag: '50 m' }, { sold: 390, unit: 'Rolo 50 m', s: ['Corrugado 3/4"', 'Ø 3/4" x 50 m', 'PVC antichama', '≈ 2,2 kg', 'Instalações embutidas'] });

  /* ---------------- HIDRÁULICA ---------------- */
  P('hidraulica', 'Tubos', 'Tubo PVC Soldável', '25 mm - 6 m', 'Tigre', 34.9, 'Tubo de PVC soldável para água fria.', { type: 'roundTube', pal: 'white', band: '#1f7ad8', d: 70 }, { sold: 900, feat: true, unit: 'Barra', s: ['Soldável marrom', 'Ø 25 mm x 6 m', 'PVC', '≈ 1,3 kg', 'Água fria predial'] });
  P('hidraulica', 'Conexões', 'Joelho 90°', 'soldável 25 mm', 'Tigre', 1.9, 'Joelho de 90° em PVC soldável.', { type: 'elbow' }, { sold: 2600, s: ['90° soldável', 'Ø 25 mm', 'PVC', '0,02 kg', 'Água fria predial'] });
  P('hidraulica', 'Torneiras', 'Torneira de Jardim', '1/2" cromada', 'Docol', 24.9, 'Torneira de jardim em metal cromado.', { type: 'faucet' }, { sold: 580, s: ['Jardim 1/2"', '1/2"', 'Metal cromado', '0,3 kg', 'Áreas externas'] });
  P('hidraulica', 'Reservatórios', 'Caixa d\'Água', '1000 litros', 'Fortlev', 549.0, 'Caixa d\'água de polietileno com tampa rosqueável.', { type: 'tank', pal: 'blue' }, { old: 599.0, sold: 240, s: ['1000 L', 'Ø 1,20 m', 'Polietileno', '≈ 17 kg', 'Reservatório residencial'] });
  P('hidraulica', 'Registros', 'Registro de Esfera', '3/4" bronze', 'Docol', 29.9, 'Registro de esfera em bronze com alavanca.', { type: 'valve' }, { sold: 470, s: ['Esfera 3/4"', '3/4"', 'Bronze', '0,35 kg', 'Controle de fluxo'] });
  P('hidraulica', 'Mangueiras', 'Mangueira', '1/2" - 20 m', 'Tramontina', 79.9, 'Mangueira flexível reforçada para jardim e obra.', { type: 'coil', pal: 'green', w: 165, thick: 12, rings: 8, tag: '20 m' }, { sold: 430, unit: 'Rolo 20 m', s: ['Flexível 1/2"', '1/2" x 20 m', 'PVC reforçado', '≈ 1,6 kg', 'Jardim e obra'] });

  /* ---------------- PINTURA ---------------- */
  P('pintura', 'Tintas', 'Tinta Acrílica Fosca', 'branco neve - 18 L', 'Suvinil', 289.9, 'Tinta acrílica fosca de alta cobertura para paredes.', { type: 'paint', color: '#f7f7f7', label: 'ACRÍLICA', sub: 'BRANCO NEVE 18 L' }, { old: 329.9, sold: 610, feat: true, unit: 'Lata 18 L', s: ['Acrílica fosca', '18 L', 'Base água', '≈ 24 kg', 'Paredes internas e externas'] });
  P('pintura', 'Tintas', 'Esmalte Sintético', 'azul - 3,6 L', 'Coral', 129.9, 'Esmalte sintético brilhante para madeira e metal.', { type: 'paint', color: '#1f5fbf', band: '#1f5fbf', label: 'ESMALTE', sub: 'AZUL 3,6 L' }, { sold: 350, unit: 'Galão 3,6 L', s: ['Esmalte brilhante', '3,6 L', 'Base solvente', '≈ 4,8 kg', 'Madeira e metal'] });
  P('pintura', 'Acessórios', 'Rolo de Lã', '23 cm com cabo', 'Atlas', 24.9, 'Rolo de lã para tintas acrílicas e látex.', { type: 'roller' }, { sold: 710, s: ['Lã 23 cm', '23 cm', 'Lã de carneiro', '0,2 kg', 'Pintura de paredes'] });
  P('pintura', 'Acessórios', 'Trincha', '2" cerdas brancas', 'Atlas', 12.9, 'Trincha com cerdas macias para acabamentos.', { type: 'brush' }, { sold: 500, s: ['2"', '50 mm', 'Cerdas sintéticas', '0,1 kg', 'Acabamentos e cantos'] });
  P('pintura', 'Massas', 'Massa Corrida', 'PVA - 25 kg', 'Suvinil', 69.9, 'Massa corrida PVA para nivelar e corrigir paredes.', { type: 'paint', color: '#efe5cf', band: '#0b5ea8', label: 'MASSA', sub: 'CORRIDA PVA 25 KG' }, { sold: 420, unit: 'Balde 25 kg', s: ['PVA', '25 kg', 'Base água', '25 kg', 'Interior'] });

  /* ---------------- CONSTRUÇÃO ---------------- */
  P('construcao', 'Cimento', 'Cimento CP II-E-32', 'saco 50 kg', 'Votorantim', 39.9, 'Cimento Portland composto para uso geral em obras.', { type: 'cement', color: '#0b5ea8', label: 'CIMENTO', sub: 'CP II · 50 kg' }, { sold: 2400, feat: true, unit: 'Saco 50 kg', s: ['CP II-E-32', '50 kg', 'Cimento Portland', '50 kg', 'Concreto e argamassas'] });
  P('construcao', 'Argamassa', 'Argamassa AC-II', 'saco 20 kg', 'Quartzolit', 26.9, 'Argamassa colante para assentamento de pisos e revestimentos.', { type: 'cement', color: '#c9252b', label: 'ARGAMASSA', sub: 'AC-II · 20 kg' }, { sold: 1500, unit: 'Saco 20 kg', s: ['AC-II', '20 kg', 'Cimentícia', '20 kg', 'Assentamento de pisos'] });
  P('construcao', 'Alvenaria', 'Tijolo 8 Furos', '9x19x19 cm', 'Cerâmica', 1.2, 'Tijolo cerâmico de 8 furos para alvenaria de vedação.', { type: 'bricks' }, { sold: 4200, units: [{ key: 'un', label: 'Unidade', factor: 1 }, { key: 'cento', label: 'Cento (100 un)', factor: 100 }, { key: 'milheiro', label: 'Milheiro (1000 un)', factor: 1000 }], s: ['8 furos', '9 x 19 x 19 cm', 'Cerâmica', '2,6 kg', 'Alvenaria de vedação'] });
  P('construcao', 'Alvenaria', 'Bloco de Concreto', '14x19x39 cm', 'Outras', 5.9, 'Bloco de concreto estrutural para alvenaria.', { type: 'block' }, { sold: 1800, s: ['Vedação 14', '14 x 19 x 39 cm', 'Concreto', '≈ 11 kg', 'Alvenaria'] });
  P('construcao', 'Equipamentos', 'Carrinho de Mão', 'caçamba 65 L', 'Tramontina', 219.9, 'Carrinho de mão com caçamba metálica e pneu com câmara.', { type: 'wheelbarrow' }, { sold: 190, s: ['Caçamba 65 L', '65 L', 'Aço', '≈ 14 kg', 'Transporte na obra'] });
  P('construcao', 'Areia', 'Areia Média Lavada', 'saco 20 kg', 'Outras', 9.9, 'Areia média lavada ensacada para reboco e concreto.', { type: 'cement', color: '#8a6a3a', label: 'AREIA', sub: 'MÉDIA · 20 kg' }, { sold: 2100, unit: 'Saco 20 kg', s: ['Média lavada', '20 kg', 'Areia', '20 kg', 'Reboco e concreto'] });

  /* ---------------- FERRAMENTAS ---------------- */
  P('ferramentas', 'Manuais', 'Martelo de Unha', 'cabo de madeira 27 mm', 'Tramontina', 39.9, 'Martelo de unha com cabo de madeira envernizado.', { type: 'hammer' }, { sold: 660, feat: true, s: ['Unha 27 mm', '27 mm', 'Aço forjado', '0,6 kg', 'Carpintaria'] });
  P('ferramentas', 'Elétricas', 'Furadeira de Impacto', '650W 220V', 'Vonder', 269.9, 'Furadeira de impacto 650W com mandril de 13 mm.', { type: 'drill' }, { old: 319.9, sold: 470, feat: true, s: ['FI 650', '650W / 220V', 'Plástico técnico', '1,9 kg', 'Furos em alvenaria e madeira'] });
  P('ferramentas', 'Medição', 'Trena', '5 m emborrachada', 'Stanley', 19.9, 'Trena de aço 5 m com trava e carcaça emborrachada.', { type: 'measure' }, { sold: 1100, s: ['5 m', '5 m x 19 mm', 'Aço / ABS', '0,2 kg', 'Medições em geral'] });
  P('ferramentas', 'Manuais', 'Alicate Universal', '8" isolado', 'Tramontina', 34.9, 'Alicate universal de 8" com cabo isolado.', { type: 'pliers' }, { sold: 520, s: ['Universal 8"', '8"', 'Aço cromo-vanádio', '0,4 kg', 'Corte e aperto'] });
  P('ferramentas', 'Medição', 'Nível de Bolha', '40 cm', 'Vonder', 24.9, 'Nível de bolha com 3 vials e base magnética.', { type: 'level' }, { sold: 380, s: ['3 vials', '40 cm', 'Alumínio', '0,3 kg', 'Alinhamento e prumo'] });
  P('ferramentas', 'Manuais', 'Jogo de Chaves', 'fenda e Phillips - 6 pçs', 'Tramontina', 29.9, 'Jogo com 6 chaves de fenda e Phillips com cabo ergonômico.', { type: 'screwdriver' }, { sold: 430, unit: 'Jogo', s: ['6 peças', '6 chaves', 'Aço cromo-vanádio', '0,5 kg', 'Manutenção geral'] });

  MP.seed.products = list;

  /* ---------- cliente demonstrativo e pedidos (baseados na imagem de referência) ---------- */
  const email = 'pedro@exemplo.com';
  MP.seed.users = [
    {
      id: 'u-demo', name: 'Pedro', type: 'pf', doc: '52998224725', phone: '(92) 99999-1234', email,
      passwordHash: U.hashPassword(email, '123456'), createdAt: '2025-03-10T12:00:00',
      addresses: [{ id: 'a1', label: 'Casa', cep: '69058-830', street: 'Rua das Flores', number: '120', complement: '', district: 'Flores', city: 'Manaus', state: 'AM', main: true }]
    }
  ];

  const bySlug = (slug) => list.find((p) => p.slug === slug);
  const order = (n, date, status, total, items, extra = {}) => {
    const its = items.map(([slug, qty]) => {
      const p = bySlug(slug);
      return { productId: p.id, name: p.name, variant: p.variant, unitLabel: p.units ? '' : p.specs['Unidade de venda'] || '', qty, price: p.price };
    });
    const subtotal = U.round2(its.reduce((a, i) => a + i.price * i.qty, 0));
    const diff = U.round2(total - subtotal);
    const hist = [{ status: 'Aguardando', at: date + 'T09:00:00' }];
    if (status !== 'Aguardando') hist.push({ status: 'Em separação', at: date + 'T10:00:00' });
    if (status === 'A caminho' || status === 'Entregue') hist.push({ status: 'A caminho', at: date + 'T14:00:00' });
    if (status === 'Entregue') hist.push({ status: 'Entregue', at: date + 'T17:30:00' });
    if (status === 'Cancelado') hist.push({ status: 'Cancelado', at: date + 'T11:00:00' });
    return {
      id: 'MP' + n, number: n, userId: 'u-demo', customer: { name: 'Pedro', phone: '(92) 99999-1234', email },
      items: its, subtotal, discount: diff < 0 ? -diff : 0, shipping: diff > 0 ? diff : 0, total, coupon: null,
      delivery: { mode: 'entrega', cep: '69058-830' }, status, history: hist, createdAt: date + 'T09:00:00', ...extra
    };
  };
  MP.seed.orders = [
    order(5823, '2025-09-20', 'Em separação', 1256.9, [['tela-soldada-q92-2x3-m', 4], ['vergalhao-3-8-12-metros-gerdau', 8], ['cimento-cp-ii-e-32-saco-50-kg', 3]]),
    order(4781, '2025-08-12', 'Entregue', 698.4, [['tubo-quadrado-20x20x1-2-6m', 4], ['cantoneira-1-8-3-4-6m', 6], ['perfil-u-6m-50x25x2-65', 2]]),
    order(4520, '2025-07-03', 'Entregue', 342.1, [['vergalhao-5-16-8-mm-6m', 6], ['arame-recozido-n-18-1-kg', 4], ['prego-18x27-com-cabeca-1-kg', 3]]),
    order(4018, '2025-06-15', 'Cancelado', 259.9, [['furadeira-de-impacto-650w-220v', 1]]),
    order(3765, '2025-05-28', 'Entregue', 892.3, [['vergalhao-3-8-10-mm-6m', 8], ['tubo-redondo-3-4-1-5mm-6m', 4], ['chapa-de-aco-1-20-mm-1000x2000', 1]])
  ];
  MP.seed.orderSeq = 5824;
})(window.MP);
