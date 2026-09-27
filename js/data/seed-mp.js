/*
 * Produtos reais da MP Ferragens, transcritos dos folhetos de ofertas.
 * No painel (Admin › Produtos) o botão "Importar produtos dos folhetos" envia estes itens para o site.
 * Sem foto ainda: cada produto usa uma ilustração; troque por fotos reais em Admin › Produtos.
 * Estoque, preço no cartão e unidades foram preenchidos com valores provisórios (ver notas abaixo).
 */
(function (MP) {
  const U = MP.util;

  MP.seed.mpCategories = [
    { id: 'telhado-calhas', slug: 'telhado-calhas', name: 'Telhado e Calhas', short: 'Telhado', icon: 'home', art: { type: 'sheet', n: 3 }, order: 8, desc: 'Telhas, calhas, rufos, pregos e parafusos para cobertura e acabamento do telhado.' },
    { id: 'solda', slug: 'solda', name: 'Solda', short: 'Solda', icon: 'bolt', art: { type: 'rebar', d: 10, rows: [4, 5, 4] }, order: 9, desc: 'Máquinas, eletrodos, máscaras e acessórios para soldagem.' }
  ];

  let seq = 0;
  const list = [];
  /*
   * M(categoria, tipo, nome, variante, marca, preço, unidade, arte, opções)
   *  - preço no cartão = mesmo preço do folheto (ajuste no painel se cobrar diferença)
   *  - estoque provisório = 100 (ajuste no painel)
   *  opções: desc, wholesale {price, from}, gift, units, feat, specs {}
   */
  const M = (cat, type, name, variant, brand, price, unit, art, o = {}) => {
    seq++;
    const specs = {};
    if (brand) specs['Marca'] = brand;
    if (o.specs) Object.assign(specs, o.specs);
    specs['Unidade de venda'] = unit;
    if (o.gift) specs['Brinde'] = o.gift;
    const extra = [];
    if (o.gift) extra.push(`Brinde: ${o.gift}.`);
    const desc = o.desc || `${name}${variant ? ' ' + variant : ''}, vendido por ${unit.toLowerCase()}.`;
    list.push({
      id: 'mp' + String(seq).padStart(3, '0'),
      slug: U.slugify(`${name} ${variant}`.trim()),
      name,
      variant,
      category: cat,
      type,
      brand: brand || '',
      price,
      oldPrice: null,
      cardPrice: price,
      wholesalePrice: o.wholesale ? o.wholesale.price : null,
      wholesaleMin: o.wholesale ? o.wholesale.from : 10,
      desc,
      longDesc: [desc].concat(extra).join(' '),
      units: o.units || null,
      specs,
      art,
      images: [],
      rating: 0,
      reviews: 0,
      sold: 0,
      createdAt: '2026-09-25',
      stock: 100,
      featured: !!o.feat,
      active: true
    });
  };

  /* ---------------- TELHADO E CALHAS ---------------- */
  M('telhado-calhas', 'Telhas', 'Telha Galvanizada Nacional', '43 mm', '', 31.0, 'Metro', { type: 'sheet', n: 4 }, { feat: true, specs: { Medida: '43 mm' } });
  M('telhado-calhas', 'Fixação', 'Prego Telheiro', '2 ½ x 10 - 500 g', 'OK Brasil', 15.0, 'Pacote', { type: 'nails', n: 9 }, { specs: { Medida: '2 ½ x 10', Peso: '500 g' } });
  M('telhado-calhas', 'Fixação', 'Parafuso Auto Brocante', '14x1 (8 mm)', '', 0.3, 'Unidade', { type: 'bolt' }, { specs: { Medida: '14x1 (8 mm)' } });
  M('telhado-calhas', 'Calhas', 'Calha Galvanizada', '43 mm', '', 55.0, 'Unidade', { type: 'uProfile', h: 96 }, { feat: true, specs: { Medida: '43 mm' } });
  M('telhado-calhas', 'Calhas', 'Veda Calha', '280 ml', 'Unipega', 24.0, 'Unidade', { type: 'spray', pal: 'gray', label: 'VEDA CALHA', sub: '280 ML', size: 26, cap: '#1f7ad8' }, { specs: { Volume: '280 ml' } });
  M('telhado-calhas', 'Calhas', 'Tampa + Saída de Calha', '0,43 mm', '', 8.0, 'Kit', { type: 'sheet', n: 2 }, { specs: { Espessura: '0,43 mm' } });
  M('telhado-calhas', 'Rufos e perfis', 'Perfil Saia ZC', '3 m x 1,50 mm', '', 34.0, 'Unidade', { type: 'lProfile', a: 92 }, { specs: { Medida: '3 m x 1,50 mm' } });
  M('telhado-calhas', 'Rufos e perfis', 'Tira Articulada', '6 m x 0,50 mm', '', 34.0, 'Unidade', { type: 'flatBar', h: 40 }, { specs: { Medida: '6 m x 0,50 mm' } });

  /* ---------------- AÇO E METAIS ---------------- */
  M('aco-metais', 'Metalon', 'Metalon', '20x20x0,80', '', 31.0, 'Unidade', { type: 'squareTube', h: 88 }, { feat: true, specs: { Medida: '20 x 20 x 0,80 mm' } });
  M('aco-metais', 'Vergalhão', 'Vergalhão 3/8', '', '', 50.0, 'Unidade', { type: 'rebar', d: 24, rows: [3, 4, 3] }, { feat: true });
  M('aco-metais', 'Vergalhão', 'Vergalhão 4.2', '', '', 12.0, 'Unidade', { type: 'rebar', d: 14, rows: [4, 5, 4] });
  M('aco-metais', 'Arames', 'Arame Recozido', 'BWG 18 - 1,24 mm', '', 14.0, 'KG', { type: 'coil', pal: 'gray', w: 150, thick: 7, rings: 12, tag: 'BWG 18' }, { specs: { Bitola: 'BWG 18 (1,24 mm)' } });
  M('aco-metais', 'Perfis', 'Perfil "U"', '75 x 38 x 6 m (2 mm)', '', 97.0, 'MT', { type: 'uProfile', h: 104 }, { specs: { Medida: '75 x 38 x 6 m', Espessura: '2 mm' } });
  M('aco-metais', 'Telas', 'Tela Serralheiro', '5x5x2 mm', '', 48.0, 'MT', { type: 'mesh', n: 8 }, { specs: { Medida: '5x5x2 mm' } });
  M('aco-metais', 'Fitas', 'Fita de Aço', '', '', 47.0, 'MT', { type: 'flatBar', h: 34 });

  /* ---------------- FERRAGENS (lubrificantes) ---------------- */
  M('ferragens', 'Lubrificantes', 'WD-40', 'desengripante', 'WD-40', 36.0, 'Unidade', { type: 'spray', pal: 'blue', label: 'WD-40', sub: 'MULTIUSO', size: 40, cap: '#ffc20e' }, {
    desc: 'O clássico que resolve. Desengripa, lubrifica e protege contra ferrugem em segundos.', wholesale: { price: 32.0, from: 6 }, feat: true
  });
  M('ferragens', 'Lubrificantes', 'Lubfast', 'lubrificante', 'Lubfast', 15.0, 'Unidade', { type: 'spray', pal: 'red', label: 'LUBFAST', sub: 'LUBRIFICANTE', size: 32, cap: '#111111' }, {
    desc: 'Lubrificante rápido para o dia a dia. Eficiente, econômico e pronto para usar.', wholesale: { price: 8.5, from: 6 }
  });
  M('ferragens', 'Lubrificantes', 'Starret Lubrificante', '', 'Starret', 16.0, 'Unidade', { type: 'spray', pal: 'yellow', label: 'STARRET', sub: 'LUB', size: 34, cap: '#ffc20e' }, {
    desc: 'Precisão que vem da marca. Ideal para ferramentas e superfícies que exigem cuidado.', wholesale: { price: 12.0, from: 6 }
  });

  /* ---------------- FERRAMENTAS ---------------- */
  M('ferramentas', 'Manuais', 'Alicate Universal', '8"', '', 38.0, 'Unidade', { type: 'pliers' }, { specs: { Tamanho: '8"' } });
  M('ferramentas', 'Abrasivos', 'Disco Flap 4.5" GR 40', '115 x 1,0 x 22,23 mm', 'OK Brasil', 8.0, 'Unidade', { type: 'disc', pal: 'orange', flap: true, label: 'FLAP GR 40' }, { specs: { Medida: '115 x 1,0 x 22,23 mm', Granulação: 'GR 40' } });
  M('ferramentas', 'Abrasivos', 'Disco Starret 4.5"', '115 x 1,0 x 22,23 mm', 'Starret', 3.5, 'Unidade', { type: 'disc', pal: 'blue', label: 'STARRET' }, { specs: { Medida: '115 x 1,0 x 22,23 mm' } });

  /* ---------------- PINTURA ---------------- */
  M('pintura', 'Tintas', 'Fundo Reparador', '3,6 L base d\'água incolor', 'Sherwin-Williams', 92.0, 'Unidade', { type: 'paint', color: '#f4f6f8', label: 'FUNDO', sub: 'REPARADOR 3,6 L' }, { specs: { Volume: '3,6 L', Base: 'Água', Cor: 'Incolor' } });

  /* ---------------- SOLDA ---------------- */
  M('solda', 'Acessórios', 'Porta Eletrodo', '1000A', '', 34.0, 'Unidade', { type: 'label', lines: ['PORTA', 'ELETRODO', '1000A'], size: 40 }, { specs: { Capacidade: '1000 A' } });
  M('solda', 'Eletrodos', 'Eletrodo Belgo', 'E6013 2,5 mm (solda fina)', 'Belgo', 26.0, 'KG', { type: 'rebar', d: 10, rows: [4, 5, 4] }, {
    feat: true,
    specs: { Tipo: 'E6013', Diâmetro: '2,5 mm', 'Caixa de 5 kg': `${U.brl(114)} (${U.brl(22.8)}/kg)` },
    desc: 'Eletrodo Belgo E6013 2,5 mm para solda fina. Vendido por kg ou em caixa de 5 kg.',
    units: [
      { key: 'kg', label: 'KG', factor: 1 },
      { key: 'cx', label: 'Caixa 5 kg', factor: 114 / 26 }
    ]
  });
  M('solda', 'Equipamentos', 'Máscara de Solda Automática', '', '', 95.0, 'Unidade', { type: 'label', lines: ['MÁSCARA', 'DE SOLDA', 'AUTOMÁTICA'], size: 38 }, { gift: '1 par de luva pigmentada' });
  M('solda', 'Equipamentos', 'Máquina de Solda MIG/TIG/MMA', '', '', 680.0, 'Unidade', { type: 'label', lines: ['MÁQUINA', 'DE SOLDA', 'MIG / TIG / MMA'], size: 38 }, { feat: true, gift: 'Lubrificante Lubfast' });
  M('solda', 'Arames', 'Arame Tubular', '0,8 mm 1 kg MIG', '', 85.0, 'Unidade', { type: 'coil', pal: 'steel', w: 170, thick: 9, rings: 10, tag: '0,8 MM' }, { gift: '1 kg de eletrodo Belgo', specs: { Diâmetro: '0,8 mm', Peso: '1 kg' } });

  MP.seed.mpProducts = list;
})(window.MP);
