/*
 * Ilustrações de produto geradas em SVG (renders metálicos, sem depender de arquivos externos).
 * São o "placeholder" das fotos: no painel admin cada produto aceita upload de fotos reais,
 * que passam a ter prioridade sobre estas ilustrações.
 *
 * MP.art.url(spec, variant)   -> data URI de uma ilustração 600x600
 * MP.art.images(product)      -> lista de imagens do produto (fotos enviadas ou ilustrações)
 * MP.art.hero(kind)           -> cena larga para os banners
 */
(function (MP) {
  const OFF = [0, 0.22, 0.4, 0.72, 1];
  const PAL = {
    steel: ['#454a50', '#9da3a9', '#f1f3f5', '#a4aab0', '#3f4449'],
    zinc: ['#59666e', '#a9b8c0', '#eef5f8', '#9fb0b9', '#4a5860'],
    white: ['#a9aeb3', '#f0f2f4', '#ffffff', '#dfe2e5', '#a0a5aa'],
    blue: ['#0b3d91', '#2a72d6', '#8ec1ff', '#2265c4', '#0a2f70'],
    red: ['#6d0f14', '#c9252b', '#ff7a7d', '#b41f25', '#5f0c11'],
    yellow: ['#9a6b00', '#f5b400', '#ffe27a', '#e0a200', '#8a5f00'],
    black: ['#050505', '#2b2b2b', '#666666', '#252525', '#030303'],
    green: ['#0d4a26', '#1f9e52', '#7fe0a5', '#178443', '#0a3a1e'],
    orange: ['#8a3a00', '#ee7a12', '#ffc07a', '#d96a0a', '#7a3200'],
    gray: ['#5e6266', '#a5aaae', '#dfe2e4', '#9a9fa3', '#54585c'],
    brick: ['#6e2a16', '#b9532f', '#e58a63', '#a94a2a', '#5f2412'],
    wood: ['#5a3a1c', '#a87038', '#d9a468', '#9b6631', '#4d3117'],
    brass: ['#6f5210', '#c9a227', '#fff0a8', '#b8901c', '#5c440c']
  };
  const P = (n) => PAL[n] || PAL.steel;
  const lg = (id, pal, vertical = true) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${pal
      .map((c, i) => `<stop offset="${OFF[i]}" stop-color="${c}"/>`)
      .join('')}</linearGradient>`;
  const shadow = (k, cx = 300, cy = 512, rx = 210, ry = 20) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity=".28" filter="url(#${k}blur)"/>`;
  const blurDef = (k) => `<filter id="${k}blur" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="9"/></filter>`;

  /* cilindro horizontal (barra/tubo). hole=true desenha a boca do tubo */
  const hcyl = (k, id, x0, x1, cy, d, palName, hole) => {
    const pal = P(palName);
    const capRx = Math.max(3, d * 0.2);
    return (
      `<rect x="${x0}" y="${cy - d / 2}" width="${x1 - x0}" height="${d}" fill="url(#${k}${id})"/>` +
      `<ellipse cx="${x1}" cy="${cy}" rx="${capRx}" ry="${d / 2}" fill="${pal[2]}" stroke="${pal[4]}" stroke-width="1.5"/>` +
      (hole
        ? `<ellipse cx="${x1 + 1}" cy="${cy}" rx="${capRx * 0.7}" ry="${d * 0.38}" fill="#1b1e21"/><ellipse cx="${x1 - 1}" cy="${cy - d * 0.04}" rx="${capRx * 0.35}" ry="${d * 0.3}" fill="#3a3f44"/>`
        : '') +
      `<rect x="${x0}" y="${cy - d / 2 + d * 0.1}" width="${x1 - x0}" height="${Math.max(2, d * 0.07)}" fill="#fff" opacity=".45"/>`
    );
  };
  const rot = (a, body) => `<g transform="rotate(${a} 300 300)">${body}</g>`;

  /* ---------- fragmentos: cada função devolve {defs, body} ---------- */
  const F = {};

  F.rebar = (k, s) => {
    const D = s.d || 24;
    const rows = s.rows || [2, 3, 2];
    let body = '';
    let idx = 0;
    const step = D * 0.9;
    const bars = [];
    rows.forEach((n, r) => {
      const y = 300 + (r - (rows.length - 1) / 2) * step;
      for (let i = 0; i < n; i++) {
        const xo = (i - (n - 1) / 2) * 0;
        bars.push({ y: y + (i % 2 ? 4 : -4) + xo, r, i, idx: idx++ });
      }
    });
    bars.sort((a, b) => a.y - b.y);
    bars.forEach((b, n) => {
      const x0 = 50 + ((n * 13) % 26);
      const x1 = 545 - ((n * 17) % 22);
      let ribs = '';
      for (let x = x0 + 14; x < x1 - 10; x += D * 0.5) {
        ribs += `<path d="M${x} ${b.y - D / 2 + 2}l${D * 0.22} ${D - 4}" stroke="#2c3034" stroke-opacity=".38" stroke-width="${Math.max(1.5, D * 0.08)}"/>`;
      }
      body +=
        `<rect x="${x0}" y="${b.y - D / 2}" width="${x1 - x0}" height="${D}" rx="${D * 0.14}" fill="url(#${k}m)"/>` +
        ribs +
        `<rect x="${x0 + 6}" y="${b.y - D / 2 + D * 0.12}" width="${x1 - x0 - 14}" height="${Math.max(2, D * 0.08)}" rx="2" fill="#fff" opacity=".5"/>` +
        `<ellipse cx="${x1}" cy="${b.y}" rx="${D * 0.2}" ry="${D / 2}" fill="#dfe3e6" stroke="#4a4f55" stroke-width="1.2"/>` +
        `<ellipse cx="${x1}" cy="${b.y}" rx="${D * 0.1}" ry="${D * 0.3}" fill="#9aa0a6"/>`;
    });
    return { defs: lg(k + 'm', P(s.pal || 'steel')) + blurDef(k), body: shadow(k) + rot(-28, body) };
  };

  F.squareTube = (k, s) => {
    const h = s.h || 92;
    const t = s.t || 12;
    const x0 = 55;
    const x1 = 500;
    const S = h * 0.36;
    const cy = 300;
    const end = `<path fill-rule="evenodd" d="M${x1} ${cy - h / 2}h${S}v${h}h${-S}z M${x1 + t * 0.5} ${cy - h / 2 + t}h${S - t}v${h - 2 * t}h${-(S - t)}z" fill="${P('steel')[2]}" stroke="#40454a" stroke-width="1.5"/><path d="M${x1 + t * 0.5} ${cy - h / 2 + t}h${S - t}v${h - 2 * t}h${-(S - t)}z" fill="#1c1f22" opacity=".85"/>`;
    const body =
      `<rect x="${x0}" y="${cy - h / 2}" width="${x1 - x0}" height="${h}" fill="url(#${k}m)"/>` +
      `<rect x="${x0}" y="${cy - h / 2}" width="${x1 - x0}" height="${h * 0.16}" fill="#fff" opacity=".35"/>` +
      `<rect x="${x0}" y="${cy + h / 2 - h * 0.12}" width="${x1 - x0}" height="${h * 0.12}" fill="#000" opacity=".2"/>` +
      end;
    return { defs: lg(k + 'm', P(s.pal || 'zinc')) + blurDef(k), body: shadow(k) + rot(-28, body) };
  };

  F.roundTube = (k, s) => {
    const d = s.d || 84;
    const pal = s.pal || 'zinc';
    const band = s.band
      ? `<rect x="130" y="${300 - d / 2}" width="26" height="${d}" fill="${s.band}" opacity=".9"/><rect x="420" y="${300 - d / 2}" width="26" height="${d}" fill="${s.band}" opacity=".9"/>`
      : '';
    const body = hcyl(k, 'm', 55, 505, 300, d, pal, true) + band;
    return { defs: lg(k + 'm', P(pal)) + blurDef(k), body: shadow(k) + rot(s.rot == null ? -28 : s.rot, body) };
  };

  F.uProfile = (k, s) => {
    const h = s.h || 110;
    const t = 14;
    const x0 = 55;
    const x1 = 495;
    const S = 62;
    const cy = 300;
    const body =
      `<rect x="${x0}" y="${cy - h / 2}" width="${x1 - x0}" height="${h}" fill="url(#${k}m)"/>` +
      `<rect x="${x0}" y="${cy - h / 2 + t}" width="${x1 - x0}" height="3" fill="#000" opacity=".3"/>` +
      `<rect x="${x0}" y="${cy + h / 2 - t - 3}" width="${x1 - x0}" height="3" fill="#000" opacity=".3"/>` +
      `<rect x="${x0}" y="${cy - h / 2}" width="${x1 - x0}" height="6" fill="#fff" opacity=".4"/>` +
      `<path d="M${x1} ${cy - h / 2}h${S}v${t}h${-(S - t)}v${h - 2 * t}h${S - t}v${t}h${-S}z" fill="${P('steel')[2]}" stroke="#40454a" stroke-width="1.5"/>`;
    return { defs: lg(k + 'm', P('steel')) + blurDef(k), body: shadow(k) + rot(-28, body) };
  };

  F.lProfile = (k, s) => {
    const a = s.a || 100;
    const t = 16;
    const x0 = 55;
    const x1 = 495;
    const cy = 300;
    const S = 60;
    const body =
      `<rect x="${x0}" y="${cy - a / 2}" width="${x1 - x0}" height="${a}" fill="url(#${k}m)"/>` +
      `<rect x="${x0}" y="${cy + a / 2 - t}" width="${x1 - x0}" height="${t}" fill="url(#${k}n)"/>` +
      `<rect x="${x0}" y="${cy - a / 2}" width="${x1 - x0}" height="5" fill="#fff" opacity=".45"/>` +
      `<path d="M${x1} ${cy - a / 2}h${t * 0.9}v${a - t}h${S - t * 0.9}v${t}h${-S}z" fill="${P('steel')[2]}" stroke="#40454a" stroke-width="1.5"/>`;
    return { defs: lg(k + 'm', P('steel')) + lg(k + 'n', P('gray')) + blurDef(k), body: shadow(k) + rot(-28, body) };
  };

  F.flatBar = (k, s) => {
    const h = s.h || 42;
    const body =
      `<rect x="55" y="${300 - h / 2}" width="450" height="${h}" fill="url(#${k}m)"/>` +
      `<rect x="55" y="${300 - h / 2}" width="450" height="5" fill="#fff" opacity=".5"/>` +
      `<path d="M505 ${300 - h / 2}h30v${h}h-30z" fill="${P('steel')[2]}" stroke="#40454a" stroke-width="1.5"/>`;
    return { defs: lg(k + 'm', P('steel')) + blurDef(k), body: shadow(k) + rot(-28, body) };
  };

  F.sheet = (k, s) => {
    const n = s.n || 3;
    let body = '';
    for (let i = 0; i < n; i++) {
      const dy = (n - 1 - i) * -18;
      body +=
        `<g transform="translate(0 ${dy + 30})">` +
        `<path d="M70 360 L360 250 L540 300 L250 420z" fill="url(#${k}t)" stroke="#5a6066" stroke-width="1.2"/>` +
        `<path d="M70 360 L250 420 L250 440 L70 380z" fill="#7f868c"/>` +
        `<path d="M250 420 L540 300 L540 320 L250 440z" fill="#585e64"/></g>`;
    }
    body += `<path d="M110 340 L340 262" stroke="#fff" stroke-opacity=".5" stroke-width="10" stroke-linecap="round" transform="translate(0 ${30 - (n - 1) * 18})"/>`;
    return {
      defs: `<linearGradient id="${k}t" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#9aa1a7"/><stop offset=".5" stop-color="#e9edf0"/><stop offset="1" stop-color="#b3b9be"/></linearGradient>` + blurDef(k),
      body: shadow(k, 310, 520, 230, 18) + body
    };
  };

  F.mesh = (k, s) => {
    const n = s.n || 9;
    let lines = '';
    for (let i = 0; i <= n; i++) {
      const v = (i * 360) / n;
      lines += `<path d="M${v} 0V360M0 ${v}H360"/>`;
    }
    const g = `<g stroke-linecap="round" fill="none">${lines}</g>`;
    return {
      defs: blurDef(k),
      body:
        shadow(k, 300, 520, 230, 18) +
        `<g transform="matrix(.78 -.26 .5 .42 120 300)"><g stroke="#000" stroke-opacity=".22" stroke-width="9" transform="translate(10 14)">${g}</g><g stroke="#8f969c" stroke-width="7">${g}</g><g stroke="#e8ecef" stroke-width="2.6">${g}</g></g>`
    };
  };

  F.coil = (k, s) => {
    const col = P(s.pal || 'gray');
    const rings = s.rings || 9;
    const w = s.w || 190;
    const thick = s.thick || 10;
    let body = '';
    for (let j = 3; j >= 0; j--) {
      const dy = j * 13;
      for (let i = 0; i < rings; i++) {
        const rx = w - i * ((w - 60) / rings);
        body += `<ellipse cx="300" cy="${300 + dy}" rx="${rx}" ry="${rx * 0.62}" fill="none" stroke="${i % 2 ? col[1] : col[3]}" stroke-width="${thick}" opacity="${j === 0 ? 1 : 0.95}"/>`;
      }
      if (j > 0) body += `<ellipse cx="300" cy="${300 + dy}" rx="${w + thick / 2}" ry="${(w + thick / 2) * 0.62}" fill="none" stroke="${col[4]}" stroke-width="2"/>`;
    }
    body += `<ellipse cx="300" cy="300" rx="52" ry="30" fill="#1b1e21" opacity=".9"/>`;
    if (s.tag) body += `<rect x="256" y="${300 + w * 0.62 - 6}" width="88" height="46" rx="4" fill="#ffd21f"/><text x="300" y="${300 + w * 0.62 + 24}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="18" fill="#111">${s.tag}</text>`;
    return { defs: blurDef(k), body: shadow(k, 300, 520, w + 20, 20) + `<g transform="translate(0 -20)">${body}</g>` };
  };

  F.nails = (k, s) => {
    const n = s.n || 9;
    let body = '';
    for (let i = 0; i < n; i++) {
      const a = -58 + (i * 116) / (n - 1);
      const L = 300 + ((i * 37) % 60);
      body += `<g transform="rotate(${a} 300 500)"><rect x="296" y="${500 - L}" width="8" height="${L - 30}" rx="3" fill="url(#${k}m)"/><path d="M296 ${500 - 30}h8l-4 34z" fill="#8a9096"/><ellipse cx="300" cy="${500 - L}" rx="${s.head || 17}" ry="5" fill="#cfd4d8" stroke="#555b61" stroke-width="1.5"/></g>`;
    }
    return { defs: lg(k + 'm', P('steel'), false) + blurDef(k), body: shadow(k, 300, 508, 180, 14) + body };
  };

  F.bolt = (k, s) => {
    const L = s.len || 300;
    let th = '';
    for (let x = 150; x < 150 + L; x += 12) th += `<path d="M${x} 250l8 100" stroke="#3b4045" stroke-opacity=".5" stroke-width="3"/>`;
    const body =
      `<g transform="rotate(-18 300 300)">` +
      `<rect x="150" y="262" width="${L}" height="76" rx="8" fill="url(#${k}m)"/>${th}` +
      `<path d="M${150 + L} 262l24 14v48l-24 14z" fill="#b6bcc1"/>` +
      `<path d="M112 232l38-8v152l-38-8z" fill="url(#${k}n)"/><rect x="132" y="224" width="30" height="152" rx="4" fill="url(#${k}m)"/>` +
      `<rect x="132" y="232" width="30" height="8" fill="#fff" opacity=".5"/></g>`;
    return { defs: lg(k + 'm', P('steel')) + lg(k + 'n', P('gray')) + blurDef(k), body: shadow(k) + body };
  };

  F.hinge = (k) => {
    const plate = (x, dir) =>
      `<g transform="translate(${x} 0)"><rect x="0" y="180" width="${dir * 170}" height="240" rx="6" transform="${dir < 0 ? 'translate(' + dir * 170 + ' 0) scale(1 1)' : ''}" fill="url(#${k}h)" stroke="#8f7418" stroke-width="2"/></g>`;
    let holes = '';
    [220, 300, 380].forEach((y) => (holes += `<circle cx="215" cy="${y}" r="9" fill="#1b1e21"/><circle cx="385" cy="${y}" r="9" fill="#1b1e21"/>`));
    const body =
      `<rect x="132" y="180" width="168" height="240" rx="6" fill="url(#${k}h)" stroke="#8f7418" stroke-width="2"/>` +
      `<rect x="300" y="180" width="168" height="240" rx="6" fill="url(#${k}h)" stroke="#8f7418" stroke-width="2"/>` +
      holes +
      `<rect x="282" y="172" width="36" height="256" rx="18" fill="url(#${k}v)"/><rect x="292" y="180" width="6" height="240" fill="#fff" opacity=".5"/>`;
    return {
      defs: lg(k + 'h', P('brass'), false) + lg(k + 'v', P('brass'), false) + blurDef(k),
      body: shadow(k, 300, 500, 190, 16) + `<g transform="rotate(-8 300 300)">${body}</g>`
    };
  };

  F.padlock = (k) => {
    const body =
      `<path d="M215 300v-70a85 85 0 0 1 170 0v70" fill="none" stroke="url(#${k}s)" stroke-width="30" stroke-linecap="round"/>` +
      `<path d="M215 300v-70a85 85 0 0 1 170 0v70" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round" transform="translate(-6 -2)"/>` +
      `<rect x="150" y="285" width="300" height="220" rx="30" fill="url(#${k}b)" stroke="#8f7418" stroke-width="3"/>` +
      `<rect x="164" y="299" width="272" height="16" rx="8" fill="#fff" opacity=".4"/>` +
      `<circle cx="300" cy="380" r="26" fill="#1b1e21"/><rect x="290" y="390" width="20" height="56" rx="8" fill="#1b1e21"/>`;
    return { defs: lg(k + 'b', P('brass'), false) + lg(k + 's', P('steel'), false) + blurDef(k), body: shadow(k, 300, 522, 170, 14) + body };
  };

  F.lock = (k) => {
    const body =
      `<rect x="170" y="90" width="120" height="420" rx="14" fill="url(#${k}m)" stroke="#555b61" stroke-width="2"/>` +
      `<rect x="180" y="100" width="100" height="14" rx="7" fill="#fff" opacity=".4"/>` +
      `<circle cx="230" cy="180" r="30" fill="#1b1e21"/><rect x="222" y="190" width="16" height="44" rx="7" fill="#1b1e21"/>` +
      `<circle cx="230" cy="380" r="22" fill="url(#${k}n)" stroke="#555" stroke-width="2"/>` +
      `<path d="M230 380H470a22 22 0 0 1 0 44H240z" fill="url(#${k}n)" stroke="#555b61" stroke-width="2" transform="translate(0 -22)"/>` +
      `<rect x="130" y="240" width="8" height="70" rx="3" fill="#7c8288"/><rect x="290" y="240" width="46" height="70" rx="8" fill="url(#${k}m)" stroke="#555b61" stroke-width="2"/>`;
    return { defs: lg(k + 'm', P('steel'), false) + lg(k + 'n', P('steel')) + blurDef(k), body: shadow(k, 320, 522, 190, 14) + body };
  };

  F.outlet = (k) => {
    const body =
      `<rect x="120" y="120" width="360" height="360" rx="36" fill="url(#${k}w)" stroke="#b9bec3" stroke-width="3"/>` +
      `<rect x="150" y="150" width="300" height="300" rx="24" fill="#f6f7f8" stroke="#d3d7da" stroke-width="2"/>` +
      `<circle cx="300" cy="300" r="82" fill="#eceef0" stroke="#c7ccd0" stroke-width="3"/>` +
      `<rect x="228" y="268" width="14" height="42" rx="4" fill="#26292c"/><rect x="358" y="268" width="14" height="42" rx="4" fill="#26292c"/>` +
      `<circle cx="300" cy="352" r="10" fill="#26292c"/>` +
      `<circle cx="300" cy="196" r="10" fill="#d3d7da"/><circle cx="300" cy="404" r="10" fill="#d3d7da"/>`;
    return { defs: lg(k + 'w', P('white')) + blurDef(k), body: shadow(k, 300, 508, 190, 14) + body };
  };

  F.breaker = (k, s) => {
    const body =
      `<rect x="200" y="90" width="200" height="420" rx="16" fill="url(#${k}w)" stroke="#a9aeb3" stroke-width="3"/>` +
      `<rect x="222" y="130" width="156" height="150" rx="10" fill="#26292c"/>` +
      `<rect x="250" y="150" width="100" height="70" rx="8" fill="url(#${k}b)"/>` +
      `<rect x="222" y="300" width="156" height="60" rx="6" fill="#f6f7f8" stroke="#c7ccd0"/><text x="300" y="342" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="34" fill="#c9252b">${s.label || '20A'}</text>` +
      `<rect x="232" y="410" width="30" height="66" rx="6" fill="#9aa0a6"/><rect x="338" y="410" width="30" height="66" rx="6" fill="#9aa0a6"/>`;
    return { defs: lg(k + 'w', P('white'), false) + lg(k + 'b', P('black')) + blurDef(k), body: shadow(k, 300, 520, 130, 14) + body };
  };

  F.bulb = (k) => {
    const body =
      `<path d="M300 70c-92 0-150 66-150 140 0 60 32 84 60 116 16 18 22 34 22 54h136c0-20 6-36 22-54 28-32 60-56 60-116 0-74-58-140-150-140z" fill="url(#${k}g)" stroke="#d6d9dc" stroke-width="3"/>` +
      `<ellipse cx="240" cy="170" rx="30" ry="56" fill="#fff" opacity=".55" transform="rotate(20 240 170)"/>` +
      `<path d="M262 300h76v-40l-38-30-38 30z" fill="#ffd21f" opacity=".85"/>` +
      `<rect x="222" y="380" width="156" height="112" rx="10" fill="url(#${k}m)"/>` +
      [402, 424, 446, 468].map((y) => `<path d="M222 ${y}h156" stroke="#3b4045" stroke-opacity=".5" stroke-width="4"/>`).join('') +
      `<path d="M250 492h100l-14 28h-72z" fill="#565b61"/>`;
    return {
      defs: `<radialGradient id="${k}g" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#fff6d2"/><stop offset="1" stop-color="#f2e2a0"/></radialGradient>` + lg(k + 'm', P('steel'), false) + blurDef(k),
      body: shadow(k, 300, 528, 120, 10) + body
    };
  };

  F.tape = (k, s) => {
    const c = P(s.pal || 'black');
    const body =
      `<ellipse cx="300" cy="340" rx="210" ry="150" fill="${c[3]}" stroke="${c[4]}" stroke-width="3"/>` +
      `<ellipse cx="300" cy="310" rx="210" ry="150" fill="${c[1]}" stroke="${c[4]}" stroke-width="3"/>` +
      `<ellipse cx="300" cy="310" rx="120" ry="82" fill="#e9ecef"/><ellipse cx="300" cy="306" rx="96" ry="62" fill="#c7ccd0"/>` +
      `<path d="M170 250c40-60 190-80 260-20" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="10" stroke-linecap="round"/>`;
    return { defs: blurDef(k), body: shadow(k, 300, 520, 220, 18) + body };
  };

  F.elbow = (k, s) => {
    const pal = s.pal || 'white';
    const d = 96;
    const body =
      `<path d="M120 190H290a120 120 0 0 1 120 120V470" fill="none" stroke="url(#${k}o)" stroke-width="${d}" stroke-linecap="butt"/>` +
      `<path d="M120 170H300a130 130 0 0 1 130 130V470" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="10" transform="translate(-4 2)"/>` +
      `<ellipse cx="118" cy="190" rx="20" ry="${d / 2}" fill="${P(pal)[2]}" stroke="${P(pal)[4]}" stroke-width="2"/><ellipse cx="118" cy="190" rx="14" ry="${d * 0.38}" fill="#1b1e21"/>` +
      `<ellipse cx="410" cy="470" rx="${d / 2}" ry="20" fill="${P(pal)[2]}" stroke="${P(pal)[4]}" stroke-width="2"/><ellipse cx="410" cy="470" rx="${d * 0.38}" ry="14" fill="#1b1e21"/>`;
    return { defs: lg(k + 'o', P(pal), false) + blurDef(k), body: shadow(k, 330, 512, 190, 14) + body };
  };

  F.faucet = (k) => {
    const body =
      `<rect x="120" y="150" width="130" height="86" rx="12" fill="url(#${k}m)"/>` +
      `<path d="M240 190h150a80 80 0 0 1 80 80v40" fill="none" stroke="url(#${k}n)" stroke-width="70" stroke-linecap="butt"/>` +
      `<rect x="432" y="300" width="76" height="60" rx="8" fill="url(#${k}m)"/>` +
      `<rect x="262" y="120" width="60" height="30" rx="6" fill="#c9252b"/><rect x="278" y="150" width="28" height="44" fill="url(#${k}m)"/>` +
      `<rect x="200" y="235" width="64" height="30" fill="url(#${k}m)"/><path d="M120 236h130v26H120z" fill="#8a9096"/>`;
    return { defs: lg(k + 'm', P('steel')) + lg(k + 'n', P('steel'), false) + blurDef(k), body: shadow(k, 320, 500, 190, 14) + `<g transform="translate(-10 40)">${body}</g>` };
  };

  F.valve = (k) => {
    const body =
      `<rect x="70" y="270" width="110" height="80" rx="8" fill="url(#${k}m)"/><rect x="420" y="270" width="110" height="80" rx="8" fill="url(#${k}m)"/>` +
      `<ellipse cx="300" cy="320" rx="140" ry="110" fill="url(#${k}m)" stroke="#8f7418" stroke-width="3"/>` +
      `<rect x="282" y="140" width="36" height="110" fill="url(#${k}m)"/>` +
      `<rect x="130" y="110" width="340" height="44" rx="22" fill="#c9252b" stroke="#7a1418" stroke-width="2"/>` +
      `<rect x="150" y="120" width="300" height="8" rx="4" fill="#fff" opacity=".35"/>`;
    return { defs: lg(k + 'm', P('brass')) + blurDef(k), body: shadow(k, 300, 470, 220, 16) + `<g transform="translate(0 30)">${body}</g>` };
  };

  F.tank = (k, s) => {
    const c = P(s.pal || 'blue');
    let ribs = '';
    [200, 260, 320, 380].forEach((y) => (ribs += `<path d="M138 ${y}h324" stroke="${c[4]}" stroke-opacity=".35" stroke-width="5"/>`));
    const body =
      `<path d="M130 190h340v250c0 30-76 50-170 50s-170-20-170-50z" fill="url(#${k}m)"/>` +
      `<ellipse cx="300" cy="190" rx="170" ry="34" fill="${c[2]}" stroke="${c[4]}" stroke-width="2"/>` +
      `<ellipse cx="300" cy="192" rx="140" ry="26" fill="${c[1]}"/>` +
      ribs +
      `<ellipse cx="300" cy="180" rx="44" ry="12" fill="${c[0]}"/><rect x="270" y="150" width="60" height="30" rx="8" fill="${c[3]}"/>` +
      `<rect x="150" y="215" width="12" height="230" rx="6" fill="#fff" opacity=".35"/>`;
    return { defs: lg(k + 'm', c, false) + blurDef(k), body: shadow(k, 300, 520, 190, 14) + body };
  };

  F.paint = (k, s) => {
    const col = s.color || '#f5f5f5';
    const label = s.label || 'TINTA';
    const body =
      `<path d="M150 190v260c0 34 66 48 150 48s150-14 150-48V190z" fill="url(#${k}m)" stroke="#8b9095" stroke-width="2"/>` +
      `<ellipse cx="300" cy="190" rx="150" ry="34" fill="#c9ced2" stroke="#7f858a" stroke-width="2"/>` +
      `<ellipse cx="300" cy="190" rx="132" ry="27" fill="${col}" stroke="#aeb3b8" stroke-width="2"/>` +
      `<path d="M150 200a150 34 0 0 0 300 0v-24a150 34 0 0 1-300 0z" fill="#9aa0a6"/>` +
      `<rect x="150" y="250" width="300" height="170" fill="${s.band || '#c9252b'}"/>` +
      `<rect x="150" y="250" width="300" height="170" fill="url(#${k}m)" opacity=".55"/>` +
      `<rect x="178" y="282" width="244" height="106" rx="8" fill="#fff" opacity=".95"/>` +
      `<text x="300" y="340" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${label.length > 7 ? 32 : 40}" fill="#111">${label}</text>` +
      `<text x="300" y="368" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="17" fill="#c9252b">${s.sub || 'MP FERRAGENS'}</text>` +
      `<path d="M158 170c-10-90 30-130 142-130s152 40 142 130" fill="none" stroke="#7f858a" stroke-width="7" stroke-linecap="round"/>`;
    return {
      defs: `<linearGradient id="${k}m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".3" stop-color="#fff" stop-opacity=".5"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>` + blurDef(k),
      body: shadow(k, 300, 508, 180, 14) + body
    };
  };

  F.roller = (k) => {
    const body =
      `<g transform="rotate(-14 300 300)"><rect x="110" y="130" width="380" height="104" rx="30" fill="url(#${k}m)" stroke="#d8d0b8" stroke-width="2"/>` +
      [150, 185, 220, 255, 290, 325, 360, 395, 430, 465].map((x) => `<path d="M${x} 134v96" stroke="#000" stroke-opacity=".07" stroke-width="3"/>`).join('') +
      `<rect x="490" y="160" width="46" height="44" rx="8" fill="#c9252b"/>` +
      `<path d="M536 182h30v90H340v70" fill="none" stroke="#8a9096" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<rect x="318" y="340" width="44" height="170" rx="18" fill="url(#${k}n)"/></g>`;
    return { defs: lg(k + 'm', ['#b9b09a', '#f7f1de', '#fffdf5', '#efe6cc', '#b3a98f']) + lg(k + 'n', P('red'), false) + blurDef(k), body: shadow(k, 320, 520, 180, 12) + body };
  };

  F.brush = (k) => {
    let bristles = '';
    for (let i = 0; i < 16; i++) bristles += `<path d="M${226 + i * 9} 116v66" stroke="#${i % 2 ? '111' : '2a2a2a'}" stroke-width="7"/>`;
    const body =
      `<g transform="rotate(-24 300 300)"><path d="M232 110h136l-6 92H238z" fill="url(#${k}m)" stroke="#8b9095"/><rect x="226" y="110" width="148" height="10" fill="#c7ccd0"/>` +
      bristles +
      `<path d="M252 200h96l14 40h-124z" fill="url(#${k}w)"/><rect x="280" y="240" width="40" height="250" rx="20" fill="url(#${k}w)"/></g>`;
    return { defs: lg(k + 'm', P('steel'), false) + lg(k + 'w', P('wood'), false) + blurDef(k), body: shadow(k, 330, 520, 150, 12) + `<g transform="translate(0 18)">${body}</g>` };
  };

  F.cement = (k, s) => {
    const body =
      `<path d="M120 110c60-24 300-24 360 0l14 380c-70 26-318 26-388 0z" fill="url(#${k}m)" stroke="#7d8388" stroke-width="2"/>` +
      `<path d="M120 110c60 22 300 22 360 0" fill="none" stroke="#6d7378" stroke-width="3"/>` +
      `<path d="M126 130c40 18 308 18 348 0v26c-40 18-308 18-348 0z" fill="#8f959a" opacity=".55"/>` +
      `<rect x="150" y="200" width="300" height="200" rx="6" fill="${s.color || '#0b5ea8'}"/>` +
      `<rect x="150" y="200" width="300" height="200" fill="url(#${k}m)" opacity=".4"/>` +
      `<text x="300" y="275" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${(s.label || 'CIMENTO').length > 8 ? 34 : 44}" fill="#fff">${s.label || 'CIMENTO'}</text>` +
      `<text x="300" y="320" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="26" fill="#ffd21f">${s.sub || 'CP II · 50 kg'}</text>` +
      `<rect x="220" y="340" width="160" height="30" rx="4" fill="#fff" opacity=".9"/><text x="300" y="361" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="16" fill="#111">USO GERAL</text>`;
    return {
      defs: `<linearGradient id="${k}m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d9297"/><stop offset=".25" stop-color="#d6dade"/><stop offset=".55" stop-color="#eceff1"/><stop offset="1" stop-color="#868b90"/></linearGradient>` + blurDef(k),
      body: shadow(k, 300, 508, 200, 14) + body
    };
  };

  F.bricks = (k, s) => {
    const c = s.pal || 'brick';
    const brick = (x, y) =>
      `<g transform="translate(${x} ${y})"><path d="M0 0l40-20h190l-40 20z" fill="${P(c)[2]}"/><path d="M190 0l40-20v56l-40 20z" fill="${P(c)[3]}"/><rect x="0" y="0" width="190" height="56" fill="url(#${k}m)"/>` +
      [30, 75, 120, 160].map((hx) => `<rect x="${hx}" y="14" width="18" height="28" rx="3" fill="#3a1a0e" opacity=".55"/>`).join('') +
      `</g>`;
    let body = '';
    [[110, 400], [305, 400], [110, 344], [305, 344], [110, 288], [305, 288]].forEach(([x, y], i) => {
      body += brick(i % 2 ? x - 60 : x, y);
    });
    return { defs: lg(k + 'm', P(c)) + blurDef(k), body: shadow(k, 300, 520, 230, 16) + `<g transform="translate(20 -20)">${body}</g>` };
  };

  F.block = (k) => {
    const blk = (x, y) =>
      `<g transform="translate(${x} ${y})"><path d="M0 0l40-24h180l-40 24z" fill="#d9dcdf"/><path d="M180 0l40-24v90l-40 24z" fill="#9ea3a7"/><rect width="180" height="90" fill="url(#${k}m)"/>` +
      `<rect x="30" y="22" width="44" height="50" rx="4" fill="#4d5256" opacity=".8"/><rect x="106" y="22" width="44" height="50" rx="4" fill="#4d5256" opacity=".8"/></g>`;
    return { defs: lg(k + 'm', P('gray')) + blurDef(k), body: shadow(k, 300, 520, 220, 16) + blk(120, 400) + blk(210, 300) + blk(160, 350).replace('translate(160 350)', 'translate(300 400)') };
  };

  F.wheelbarrow = (k) => {
    const body =
      `<path d="M110 200h330l-46 170H176z" fill="url(#${k}m)" stroke="#7a1418" stroke-width="3"/>` +
      `<path d="M110 200h330" stroke="#ff7a7d" stroke-width="8" stroke-linecap="round"/>` +
      `<path d="M176 370h218" stroke="#5f0c11" stroke-width="6"/>` +
      `<path d="M440 220L560 330M190 360L90 500M395 360l80 140" stroke="#3a3f44" stroke-width="12" stroke-linecap="round" fill="none"/>` +
      `<circle cx="250" cy="460" r="60" fill="#222" stroke="#111" stroke-width="3"/><circle cx="250" cy="460" r="36" fill="#9aa0a6"/><circle cx="250" cy="460" r="12" fill="#2b2b2b"/>` +
      `<path d="M560 330l30 20M90 500l-20 10" stroke="#111" stroke-width="16" stroke-linecap="round"/>`;
    return { defs: lg(k + 'm', P('red')) + blurDef(k), body: shadow(k, 320, 526, 250, 14) + body };
  };

  F.hammer = (k) => {
    const body =
      `<g transform="rotate(-38 300 300)"><rect x="278" y="150" width="44" height="380" rx="18" fill="url(#${k}w)"/>` +
      `<path d="M278 420h44v100h-44z" fill="#111" opacity=".85"/>` +
      `<path d="M160 100h240a30 30 0 0 1 30 30v40H160z" fill="url(#${k}m)" stroke="#40454a" stroke-width="2"/>` +
      `<path d="M160 100c-50 0-80 26-90 60l90 10z" fill="url(#${k}m)" stroke="#40454a" stroke-width="2"/>` +
      `<rect x="170" y="108" width="240" height="8" rx="4" fill="#fff" opacity=".45"/></g>`;
    return { defs: lg(k + 'm', P('steel')) + lg(k + 'w', P('wood'), false) + blurDef(k), body: shadow(k, 320, 520, 220, 14) + body };
  };

  F.drill = (k) => {
    const body =
      `<g transform="rotate(-8 300 300)"><path d="M150 180h250c40 0 60 26 60 60v30c0 30-20 50-56 50H150c-30 0-44-20-44-50v-40c0-30 14-50 44-50z" fill="url(#${k}y)" stroke="#8a5f00" stroke-width="2"/>` +
      `<rect x="150" y="200" width="250" height="14" rx="7" fill="#fff" opacity=".4"/>` +
      `<rect x="62" y="205" width="90" height="70" rx="10" fill="url(#${k}k)"/><rect x="20" y="228" width="50" height="26" rx="4" fill="url(#${k}m)"/><rect x="0" y="238" width="30" height="6" fill="#8a9096"/>` +
      `<path d="M250 320h100l-14 170a20 20 0 0 1-20 18h-40a20 20 0 0 1-20-18z" fill="url(#${k}k)"/>` +
      `<rect x="395" y="208" width="60" height="26" rx="6" fill="#111"/><circle cx="430" cy="270" r="9" fill="#111"/></g>`;
    return { defs: lg(k + 'y', P('yellow')) + lg(k + 'k', P('black')) + lg(k + 'm', P('steel')) + blurDef(k), body: shadow(k, 300, 520, 190, 12) + body };
  };

  F.measure = (k) => {
    const body =
      `<rect x="120" y="150" width="360" height="330" rx="70" fill="url(#${k}y)" stroke="#8a5f00" stroke-width="3"/>` +
      `<rect x="150" y="180" width="300" height="270" rx="50" fill="#171717" opacity=".9"/>` +
      `<rect x="180" y="210" width="240" height="210" rx="34" fill="url(#${k}y)" opacity=".9"/>` +
      `<text x="300" y="332" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="46" fill="#111">5 m</text>` +
      `<rect x="440" y="392" width="140" height="46" rx="6" fill="#ffd21f" stroke="#8a5f00" stroke-width="2"/>` +
      [455, 475, 495, 515, 535, 555].map((x) => `<path d="M${x} 392v${x % 40 === 15 ? 22 : 14}" stroke="#111" stroke-width="2"/>`).join('') +
      `<path d="M150 200c30-30 120-40 180-30" stroke="#fff" stroke-opacity=".4" stroke-width="10" stroke-linecap="round" fill="none"/>`;
    return { defs: lg(k + 'y', P('yellow')) + blurDef(k), body: shadow(k, 320, 512, 240, 16) + body };
  };

  F.pliers = (k) => {
    const body =
      `<g transform="rotate(-40 300 300)"><path d="M190 60c30-10 60 10 70 60l16 100-40 10-24-90c-6-30-10-60-22-80z" fill="url(#${k}m)" stroke="#40454a" stroke-width="2"/>` +
      `<path d="M410 60c-30-10-60 10-70 60l-16 100 40 10 24-90c6-30 10-60 22-80z" fill="url(#${k}m)" stroke="#40454a" stroke-width="2"/>` +
      `<circle cx="300" cy="235" r="20" fill="#c9252b" stroke="#40454a" stroke-width="2"/>` +
      `<path d="M262 250l-50 240c-4 22 26 34 42 20l56-150z" fill="url(#${k}r)"/><path d="M338 250l50 240c4 22-26 34-42 20l-56-150z" fill="url(#${k}r)"/></g>`;
    return { defs: lg(k + 'm', P('steel'), false) + lg(k + 'r', P('red'), false) + blurDef(k), body: shadow(k, 300, 522, 190, 12) + body };
  };

  F.level = (k) => {
    const body =
      `<g transform="rotate(-22 300 300)"><rect x="40" y="248" width="520" height="104" rx="12" fill="url(#${k}y)" stroke="#8a5f00" stroke-width="2"/>` +
      `<rect x="230" y="272" width="140" height="56" rx="28" fill="#eafbe3" stroke="#555" stroke-width="3"/><circle cx="300" cy="300" r="17" fill="#8be36b" stroke="#3a9a2a" stroke-width="2"/>` +
      `<rect x="80" y="278" width="70" height="44" rx="22" fill="#111" opacity=".85"/><rect x="450" y="278" width="70" height="44" rx="22" fill="#111" opacity=".85"/>` +
      `<rect x="50" y="256" width="500" height="8" rx="4" fill="#fff" opacity=".45"/></g>`;
    return { defs: lg(k + 'y', P('yellow')) + blurDef(k), body: shadow(k) + body };
  };

  F.screwdriver = (k) => {
    const one = (dx, col, tip) =>
      `<g transform="translate(${dx} 0)"><rect x="-26" y="70" width="52" height="170" rx="24" fill="url(#${k}${col})"/><rect x="-26" y="150" width="52" height="30" fill="#111" opacity=".85"/><rect x="-6" y="240" width="12" height="230" fill="url(#${k}m)"/>${tip}</g>`;
    const body =
      `<g transform="rotate(-6 300 300)">${one(190, 'r', '<path d="M-6 470h12l-2 18h-8z" fill="#8a9096"/>')}${one(300, 'y', '<path d="M-6 470l6 16 6-16z" fill="#8a9096"/>')}${one(410, 'r', '<path d="M-6 470h12l-2 18h-8z" fill="#8a9096"/>')}</g>`;
    return { defs: lg(k + 'r', P('red'), false) + lg(k + 'y', P('yellow'), false) + lg(k + 'm', P('steel'), false) + blurDef(k), body: shadow(k, 300, 512, 220, 12) + body };
  };

  const xml = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* disco de corte / flap (s.flap = lamelas) */
  F.disc = (k, s) => {
    const c = P(s.pal || 'orange');
    let petals = '';
    if (s.flap) {
      for (let i = 0; i < 24; i++) petals += `<rect x="286" y="96" width="28" height="92" rx="6" fill="${i % 2 ? c[1] : c[3]}" stroke="${c[4]}" stroke-width="1.5" transform="rotate(${i * 15} 300 300)"/>`;
    } else {
      petals = `<circle cx="300" cy="300" r="150" fill="none" stroke="${c[2]}" stroke-width="3" opacity=".6"/>`;
    }
    const body =
      `<circle cx="300" cy="300" r="206" fill="${c[1]}" stroke="${c[4]}" stroke-width="4"/>` + petals +
      `<circle cx="300" cy="300" r="72" fill="#d5d9dc" stroke="#7f858a" stroke-width="3"/><circle cx="300" cy="300" r="28" fill="#fff" stroke="#7f858a" stroke-width="3"/>` +
      (s.label ? `<text x="300" y="422" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-weight="800" font-size="30" fill="${s.flap ? '#111' : '#fff'}">${xml(s.label)}</text>` : '');
    return { defs: blurDef(k), body: shadow(k, 300, 528, 190, 14) + body };
  };

  /* lata de spray (lubrificantes) */
  F.spray = (k, s) => {
    const c = P(s.pal || 'blue');
    const body =
      `<rect x="230" y="200" width="140" height="300" rx="16" fill="url(#${k}m)" stroke="${c[4]}" stroke-width="3"/>` +
      `<path d="M245 200c0-30 20-44 55-44s55 14 55 44z" fill="#c9ced2" stroke="#7f858a" stroke-width="3"/>` +
      `<rect x="272" y="124" width="56" height="36" rx="6" fill="${s.cap || '#e63946'}"/>` +
      `<rect x="230" y="285" width="140" height="130" fill="#fff" opacity=".93"/>` +
      `<text x="300" y="342" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-weight="800" font-size="${s.size || 30}" fill="#111">${xml(s.label)}</text>` +
      (s.sub ? `<text x="300" y="376" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="18" fill="#444">${xml(s.sub)}</text>` : '') +
      `<rect x="246" y="212" width="12" height="276" rx="6" fill="#fff" opacity=".35"/>`;
    return { defs: lg(k + 'm', c, false) + blurDef(k), body: shadow(k, 300, 520, 130, 14) + body };
  };

  /* etiqueta neutra com o nome do produto (quando ainda não há foto) */
  F.label = (k, s) => {
    const lines = s.lines || ['PRODUTO'];
    const y0 = 300 - ((lines.length - 1) * 44) / 2 + 14;
    const body =
      `<rect x="70" y="160" width="460" height="280" rx="30" fill="#161616" stroke="#ffc20e" stroke-width="10"/>` +
      lines.map((t, i) => `<text x="300" y="${y0 + i * 44}" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-weight="800" font-size="${s.size || 38}" fill="${i === 0 ? '#ffc20e' : '#ffffff'}">${xml(t)}</text>`).join('');
    return { defs: blurDef(k), body: shadow(k, 300, 480, 220, 14) + body };
  };

  /* ---------- composição ---------- */
  const uid = (() => {
    let n = 0;
    return () => 'a' + (n++).toString(36);
  })();

  const LONG = ['rebar', 'squareTube', 'roundTube', 'uProfile', 'lProfile', 'flatBar'];
const variantTransform = (v, type) => {
    if (v === 0) return LONG.includes(type) ? 'translate(300 300) scale(1.24) translate(-300 -300)' : '';
    if (v === 1) return 'translate(300 300) scale(1.45) translate(-345 -300)';
    if (v === 2) return 'translate(300 300) rotate(7) scale(.88) translate(-300 -290)';
    return '';
  };

  const cache = new Map();
  const build = (spec, variant = 0) => {
    const key = JSON.stringify([spec, variant]);
    if (cache.has(key)) return cache.get(key);
    const k = uid();
    const fn = F[spec.type] || F.squareTube;
    const f = fn(k, spec);
    const t = variantTransform(variant, spec.type);
    const inner = t ? `<g transform="${t}">${f.body}</g>` : f.body;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600"><defs>${f.defs}</defs>${inner}</svg>`;
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    cache.set(key, url);
    return url;
  };

  const scene = (w, h, items) => {
    let defs = '';
    let body = '';
    items.forEach(([spec, x, y, sc, ro]) => {
      const k = uid();
      const f = (F[spec.type] || F.squareTube)(k, spec);
      defs += f.defs;
      body += `<g transform="translate(${x} ${y}) rotate(${ro || 0}) scale(${sc}) translate(-300 -300)">${f.body}</g>`;
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${defs}</defs>${body}</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };

  const HERO = {
    steel: () =>
      scene(760, 480, [
        [{ type: 'uProfile', h: 120 }, 520, 250, 0.95, 8],
        [{ type: 'squareTube', h: 100 }, 330, 300, 0.95, 4],
        [{ type: 'roundTube', d: 84, pal: 'zinc' }, 470, 130, 0.8, 16],
        [{ type: 'rebar', d: 24 }, 250, 250, 0.95, 26]
      ]),
    eletro: () =>
      scene(760, 480, [
        [{ type: 'coil', pal: 'red', tag: '2,5 mm', w: 190 }, 250, 300, 0.85, 0],
        [{ type: 'roundTube', d: 84, pal: 'white', band: '#1f7ad8' }, 520, 170, 0.8, 10],
        [{ type: 'breaker', label: '20A' }, 600, 330, 0.55, 0],
        [{ type: 'outlet' }, 470, 380, 0.5, -6],
        [{ type: 'bulb' }, 690, 200, 0.42, 8]
      ]),
    tools: () =>
      scene(760, 480, [
        [{ type: 'drill' }, 330, 290, 1, -4],
        [{ type: 'hammer' }, 600, 240, 0.85, 10],
        [{ type: 'measure' }, 480, 400, 0.48, 0],
        [{ type: 'level' }, 300, 120, 0.7, 4]
      ])
  };

  /* ilustração padrão quando um produto criado no admin não tem foto */
  const CAT_FALLBACK = {
    'aco-metais': { type: 'squareTube' },
    ferragens: { type: 'nails' },
    eletrica: { type: 'coil', pal: 'blue', w: 180 },
    hidraulica: { type: 'roundTube', pal: 'white', band: '#1f7ad8' },
    pintura: { type: 'paint', color: '#f5f5f5', label: 'TINTA' },
    construcao: { type: 'cement' },
    ferramentas: { type: 'hammer' },
    'telhado-calhas': { type: 'sheet', n: 3 },
    solda: { type: 'rebar', d: 10, rows: [4, 5, 4] }
  };

  MP.art = {
    url: build,
    scene,
    hero: (kind) => (HERO[kind] || HERO.steel)(),
    types: Object.keys(F),
    fallback: (cat) => CAT_FALLBACK[cat] || { type: 'squareTube' },
    images(p) {
      if (p.images && p.images.length) return p.images;
      const spec = p.art || CAT_FALLBACK[p.category] || { type: 'squareTube' };
      return [build(spec, 0), build(spec, 1), build(spec, 2)];
    },
    main(p) {
      return this.images(p)[0];
    }
  };
})(window.MP);
