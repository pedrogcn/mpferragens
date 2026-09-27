/* Conjunto de ícones inline (24x24, traço). MP.icon('nome', tamanho) */
(function (MP) {
  const c = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
  const r = (x, y, w, h, rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
  const p = (d) => `<path d="${d}"/>`;

  const I = {
    home: p('M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'),
    layers: p('m12 2.5 9.5 4.8L12 12 2.5 7.3z') + p('m2.5 12 9.5 4.8 9.5-4.8') + p('m2.5 16.7 9.5 4.8 9.5-4.8'),
    nut: p('M12 2.5 20 7v10l-8 4.5L4 17V7z') + c(12, 12, 3),
    bolt: p('M13 2 4 14h7l-1 8 9-12h-7z'),
    drop: p('M12 2.7C9 7 6 10 6 14a6 6 0 0 0 12 0c0-4-3-7-6-11.3z'),
    roller: r(4, 3, 13, 6, 1) + p('M17 6h3v6h-9v3') + r(9, 15, 4, 6, 1),
    hardhat: p('M2 18h20v2.5H2z') + p('M4 18a8 8 0 0 1 16 0') + p('M12 6v5') + p('M9 10v3'),
    wrench: p('M14.5 6.5a4 4 0 0 0 5 5L21 13l-8 8a2.1 2.1 0 0 1-3-3l8-8z'),
    grid4: r(3, 3, 7, 7, 1.5) + r(14, 3, 7, 7, 1.5) + r(3, 14, 7, 7, 1.5) + r(14, 14, 7, 7, 1.5),
    user: c(12, 8, 4) + p('M4 21a8 8 0 0 1 16 0'),
    cart: c(9, 20, 1.4) + c(18, 20, 1.4) + p('M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h9.6a1 1 0 0 0 1-.8L21 7H6'),
    search: c(11, 11, 7) + p('m21 21-5-5'),
    menu: p('M4 6h16M4 12h16M4 18h16'),
    x: p('m6 6 12 12M18 6 6 18'),
    truck: p('M2 6h11v10H2z') + p('M13 9h4l4 4v3h-8') + c(6.5, 18, 2) + c(17.5, 18, 2),
    coin: c(12, 12, 9) + p('M14.5 9.2c-.5-.9-1.4-1.4-2.5-1.4-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.100 0-2-.5-2.500-1.400') + p('M12 6v2M12 16v2'),
    card: r(2, 5, 20, 14, 2) + p('M2 10h20M6 15h4'),
    headset: p('M4 14v-2a8 8 0 0 1 16 0v2') + p('M4 14h3v5H5a1 1 0 0 1-1-1z') + p('M20 14h-3v5h2a1 1 0 0 0 1-1z') + p('M18 19c0 1.5-2 2-6 2'),
    heart: p('M12 21s-8-5.200-8-11a4.500 4.500 0 0 1 8-2.800A4.500 4.500 0 0 1 20 10c0 5.800-8 11-8 11z'),
    star: p('m12 2.500 2.900 6 6.600.9-4.800 4.600 1.200 6.500L12 17.400l-5.900 3.100 1.200-6.500L2.500 9.400l6.600-.9z'),
    shield: p('M12 3 4 6v6c0 5 3.500 8 8 9 4.500-1 8-4 8-9V6z') + p('m9 12 2 2 4-4'),
    store: p('m3 9 1.500-5h15L21 9') + p('M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0') + p('M5 12v9h14v-9M10 21v-5h4v5'),
    pin: p('M12 22s7-6.500 7-12a7 7 0 0 0-14 0c0 5.500 7 12 7 12z') + c(12, 10, 2.500),
    clock: c(12, 12, 9) + p('M12 7v5l3 2'),
    phone: p('M5 3h4l2 5-2.500 1.500a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z'),
    mail: r(3, 5, 18, 14, 2) + p('m3 7 9 6 9-6'),
    trash: p('M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5'),
    plus: p('M12 5v14M5 12h14'),
    minus: p('M5 12h14'),
    printer: p('M6 9V3h12v6M6 18H4v-7h16v7h-2') + r(6, 14, 12, 7),
    save: p('M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z') + p('M8 3v5h7V3M7 21v-7h10v7'),
    down: p('m6 9 6 6 6-6'),
    right: p('m9 6 6 6-6 6'),
    left: p('m15 6-6 6 6 6'),
    up: p('m6 15 6-6 6 6'),
    filter: p('M3 5h18l-7 8v6l-4 2v-8z'),
    grid: r(3, 3, 7, 7, 1) + r(14, 3, 7, 7, 1) + r(3, 14, 7, 7, 1) + r(14, 14, 7, 7, 1),
    list: p('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'),
    check: p('m5 12 5 5 9-10'),
    info: c(12, 12, 9) + p('M12 8h.01M11 12h1v5h1'),
    alert: p('M12 3 2 20h20z') + p('M12 10v5M12 18h.01'),
    edit: p('M4 20h4L19 9l-4-4L4 16z') + p('m14 6 4 4'),
    lock: r(5, 11, 14, 10, 2) + p('M8 11V8a4 4 0 0 1 8 0v3'),
    box: p('m12 2 9 5v10l-9 5-9-5V7z') + p('m3 7 9 5 9-5M12 12v10'),
    users: c(9, 8, 3.500) + p('M2 21a7 7 0 0 1 14 0') + p('M16 4.500a3.500 3.500 0 0 1 0 7') + p('M18 14.500a7 7 0 0 1 4 6.500'),
    sliders: p('M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1') + c(15, 6, 2) + c(9, 12, 2) + c(17, 18, 2),
    image: r(3, 4, 18, 16, 2) + c(9, 10, 1.500) + p('m21 16-5-5-9 9'),
    percent: p('M19 5 5 19') + c(7, 7, 2) + c(17, 17, 2),
    chart: p('M4 20V10M10 20V4M16 20v-8M22 20H2'),
    logout: p('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9'),
    clipboard: r(6, 4, 12, 17, 2) + p('M9 4V3h6v1M9 11h6M9 15h6'),
    bookmark: p('M6 3h12v18l-6-4-6 4z'),
    filetext: p('M6 3h9l4 4v14H6z') + p('M14 3v5h5M9 13h7M9 17h7'),
    share: c(18, 5, 3) + c(6, 12, 3) + c(18, 19, 3) + p('m8.600 10.700 6.800-4M8.600 13.300l6.800 4'),
    upload: p('M12 16V4M7 9l5-5 5 5M4 20h16'),
    download: p('M12 4v12M7 11l5 5 5-5M4 20h16'),
    arrowr: p('M5 12h14M13 6l6 6-6 6'),
    arrowl: p('M19 12H5M11 6l-6 6 6 6'),
    eye: p('M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z') + c(12, 12, 3),
    ticket: p('M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3z') + p('M13 6v12'),
    tag: p('M3 12V3h9l9 9-9 9z') + c(7.500, 7.500, 1.200),
    whatsapp: p('M3 21l1.600-4.600A9 9 0 1 1 8 19.600z') + p('M9 8.500c0 3.500 3 6.500 6.500 6.500l1-1.500-2-1-1 .8a4.500 4.500 0 0 1-2.300-2.300l.8-1-1-2z'),
    instagram: r(3, 3, 18, 18, 5) + c(12, 12, 4) + '<circle cx="17.500" cy="6.500" r=".8"/>',
    facebook: p('M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.500a.5.5 0 0 1 .5-.5z'),
    youtube: r(2, 6, 20, 12, 4) + '<path d="M10 9.500v5l4.500-2.500z" fill="currentColor"/>',
    tiktok: p('M14 3v11.500a3.500 3.500 0 1 1-3.500-3.500') + p('M14 3c.3 2.500 2 4.300 5 4.500'),
    settings: c(12, 12, 3) + p('M12 2v3M12 19v3M2 12h3M19 12h3M4.900 4.900 7 7M17 17l2.100 2.100M4.900 19.100 7 17M17 7l2.100-2.100'),
    refresh: p('M20 11a8 8 0 0 0-14.500-3M4 4v4h4M4 13a8 8 0 0 0 14.500 3M20 20v-4h-4'),
    external: p('M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'),
    dashboard: r(3, 3, 8, 9, 1.500) + r(13, 3, 8, 5, 1.500) + r(13, 10, 8, 11, 1.500) + r(3, 14, 8, 7, 1.500)
  };
  const FILLED = { star: 1 };

  MP.icon = (name, size = 20, cls = '') => {
    const inner = I[name] || I.info;
    const fill = FILLED[name] ? 'currentColor' : 'none';
    const stroke = FILLED[name] ? 'none' : 'currentColor';
    return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
  };
  MP.icon.has = (n) => !!I[n];
})(window.MP);
