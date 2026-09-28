#!/usr/bin/env node
/*
 * Gera as páginas que o Google e o WhatsApp conseguem ler (a loja em si é um app de página única).
 *
 *   node tools/build-seo.js            (ou: npm run seo)
 *
 * O que faz, tudo a partir dos dados públicos do Firestore (produtos, categorias, configurações):
 *   - produto/<slug>/index.html e categoria/<slug>/index.html  (título, descrição, imagem de prévia e dados do produto)
 *   - sitemap.xml e robots.txt
 *   - atualiza o bloco de SEO da página inicial (index.html)
 * Pessoas que abrem essas páginas são levadas direto para a loja; robôs (Google, WhatsApp...) leem o conteúdo.
 * Rode antes de cada publicação: `npm run deploy` já faz isso e depois publica no Firebase.
 *
 * Endereço do site: tools/seo.config.json ("siteUrl"). Troque para https://mpferragens.com.br quando o domínio estiver no ar.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = process.env.MP_ROOT ? path.resolve(process.env.MP_ROOT) : path.resolve(__dirname, '..');
const FIRESTORE = process.env.FIRESTORE_URL || 'https://firestore.googleapis.com';
const MARK = '.seo-generated';

/* ---------- configuração ---------- */
const cfgPath = path.join(ROOT, 'tools', 'seo.config.json');
const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
// Em builds na Vercel, usa o endereço do próprio deploy quando SITE_URL não foi definido à mão
// (VERCEL_PROJECT_PRODUCTION_URL = domínio de produção do projeto; VERCEL_URL = domínio deste deploy específico, ex. de preview).
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const SITE = String(process.env.SITE_URL || (vercelUrl && `https://${vercelUrl}`) || cfg.siteUrl || '').replace(/\/+$/, '');
if (!/^https?:\/\//.test(SITE)) {
  console.error('Defina "siteUrl" em tools/seo.config.json (ex.: https://mpferragens.com.br), ou a variável de ambiente SITE_URL.');
  process.exit(1);
}
// lê js/firebase-config.js como o navegador lê (ignora os exemplos que estão nos comentários)
const fbCtx = {};
fbCtx.window = fbCtx;
try {
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'firebase-config.js'), 'utf8'), fbCtx);
} catch (e) {
  console.error('Não consegui ler js/firebase-config.js: ' + e.message);
  process.exit(1);
}
if (!fbCtx.MP_FIREBASE || !fbCtx.MP_FIREBASE.projectId) {
  console.error('O Firebase ainda não está configurado em js/firebase-config.js (MP_FIREBASE está vazio).');
  process.exit(1);
}
const PROJECT = fbCtx.MP_FIREBASE.projectId;

/* ---------- utilitários ---------- */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n) || 0).replace(/\u00a0/g, ' ');
const clip = (s, n) => {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
};
const safeSlug = (s) => /^[a-z0-9][a-z0-9-]*$/.test(String(s || ''));
const jsonLd = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

/* valores do Firestore (formato REST) -> objetos comuns */
const decode = (v) => {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  return null;
};
const decodeFields = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, decode(v)]));

async function fetchCollection(name) {
  const out = [];
  let token = '';
  do {
    const url = `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${name}?pageSize=300${token ? '&pageToken=' + encodeURIComponent(token) : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Não consegui ler "${name}" no Firestore (HTTP ${res.status}). Confira se as regras foram publicadas.`);
    const j = await res.json();
    (j.documents || []).forEach((d) => out.push(Object.assign({ id: d.name.split('/').pop() }, decodeFields(d.fields || {}))));
    token = j.nextPageToken || '';
  } while (token);
  return out;
}

/* categorias/cupons/promoções ficam num único documento cada (catalog/<tipo>), um mapa { id: item } */
async function fetchMergedDoc(name) {
  const url = `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/catalog/${name}`;
  const res = await fetch(url);
  if (res.status === 404) return []; // ainda não foi publicado nada desse tipo
  if (!res.ok) throw new Error(`Não consegui ler "catalog/${name}" no Firestore (HTTP ${res.status}). Confira se as regras foram publicadas.`);
  const j = await res.json();
  return Object.entries(decodeFields(j.fields || {})).map(([id, v]) => Object.assign({ id }, v));
}

async function fetchSettings() {
  // padrões da loja (mesmo arquivo usado pelo site) + o que o dono salvou em Admin > Loja
  const ctx = { MP: { util: { sha256: () => '' }, seed: {} } };
  ctx.window = ctx;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'data', 'seed-settings.js'), 'utf8'), ctx);
  const d = ctx.MP.seed.settings;
  let s = {};
  try {
    const res = await fetch(`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/config/settings`);
    if (res.ok) s = decodeFields((await res.json()).fields || {});
  } catch (e) {}
  return Object.assign({}, d, s, { address: Object.assign({}, d.address, s.address), social: Object.assign({}, d.social, s.social) });
}

/* imagem de prévia: foto em data:URL vira arquivo; sem foto usa o banner da loja */
function photoFor(dirRel, item, list) {
  const src = (list && list[0]) || item.image || '';
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/s.exec(src);
  if (m) {
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    const file = `foto.${ext}`;
    fs.writeFileSync(path.join(ROOT, dirRel, file), Buffer.from(m[2], 'base64'));
    return `${SITE}/${dirRel.replace(/\\/g, '/')}/${file}`;
  }
  if (/^https?:\/\//.test(src)) return src;
  return `${SITE}/assets/banner-mp.jpg`;
}

const BOTS = '/bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|slack|linkedin|twitter|pinterest|preview|embedly|applebot|duckduck|yandex|baidu/i';

/* ---------- modelo das páginas ---------- */
function page({ title, desc, canonical, image, type, extraMeta = '', ld, body, appPath, store }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" href="/assets/logo.jpg">
<meta property="og:site_name" content="${esc(store)}">
<meta property="og:locale" content="pt_BR">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
${extraMeta}${ld ? ld + '\n' : ''}<style>body{font-family:system-ui,Arial,sans-serif;max-width:860px;margin:0 auto;padding:24px 16px;color:#111;line-height:1.5}img{max-width:100%;height:auto}a{color:#b8141b}table{border-collapse:collapse}td,th{padding:4px 12px 4px 0;text-align:left;vertical-align:top}.btn{display:inline-block;background:#ffc20e;color:#111;padding:12px 20px;border-radius:8px;font-weight:700;text-decoration:none}</style>
</head>
<body>
${body}
<script>
/* pessoas vão direto para a loja; robôs (Google, WhatsApp...) ficam lendo esta página */
if (!${BOTS}.test(navigator.userAgent)) location.replace('/#${appPath}');
</script>
</body>
</html>
`;
}

/* ---------- principal ---------- */
(async () => {
  console.log(`Site: ${SITE}  ·  Projeto Firebase: ${PROJECT}`);
  const [settings, prodsAll0, cats, prodImgs] = await Promise.all([fetchSettings(), fetchCollection('products'), fetchMergedDoc('categories'), fetchCollection('productImages')]);
  // a foto do produto fica num documento à parte (productImages/{id}); junta de volta só para gerar a prévia
  const imgById = {};
  prodImgs.forEach((d) => (imgById[d.id] = d.images || []));
  const prodsAll = prodsAll0.map((p) => Object.assign({}, p, { images: (p.images && p.images.length ? p.images : imgById[p.id]) || [] }));
  const prods = prodsAll.filter((p) => p.active !== false && safeSlug(p.slug));
  const catBy = {};
  cats.forEach((c) => (catBy[c.slug] = c));
  const store = settings.storeName || 'MP Ferragens';
  const a = settings.address || {};
  const cityLine = [a.city, a.state].filter(Boolean).join(' - ');

  // limpa páginas geradas antes (só se a pasta foi criada por este script)
  ['produto', 'categoria'].forEach((d) => {
    const dir = path.join(ROOT, d);
    if (fs.existsSync(dir)) {
      if (!fs.existsSync(path.join(dir, MARK))) throw new Error(`A pasta "${d}" já existe e não foi criada por este script. Renomeie ou apague.`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, MARK), 'gerado por tools/build-seo.js\n');
  });

  const urls = [{ loc: `${SITE}/`, pri: '1.0' }];

  /* produtos */
  for (const p of prods) {
    const rel = `produto/${p.slug}`;
    fs.mkdirSync(path.join(ROOT, rel), { recursive: true });
    const name = [p.name, p.variant].filter(Boolean).join(' ');
    const image = photoFor(rel, p, p.images);
    const canonical = `${SITE}/${rel}/`;
    const desc = clip(`${name} por ${brl(p.price)} na ${store}, ${cityLine}. ${p.desc || ''}`, 158);
    const cat = catBy[p.category];
    const specs = Object.entries(p.specs || {});
    const inStock = p.stock == null || p.stock > 0;
    const ld = jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description: p.longDesc || p.desc || name,
      sku: p.id,
      image: [image],
      ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
      offers: {
        '@type': 'Offer',
        url: canonical,
        priceCurrency: 'BRL',
        price: Number(p.price).toFixed(2),
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: store }
      }
    });
    const body = `<nav><a href="/">${esc(store)}</a>${cat ? ` › <a href="/categoria/${esc(cat.slug)}/">${esc(cat.name)}</a>` : ''}</nav>
<h1>${esc(name)}</h1>
${image.includes('/produto/') ? `<img src="${esc(image)}" alt="${esc(name)}" width="480">` : ''}
<p><strong>${brl(p.price)}</strong> à vista no PIX${p.wholesalePrice ? ` · Atacado: ${brl(p.wholesalePrice)} a partir de ${p.wholesaleMin || 10} unidades` : ''}</p>
<p>${esc(p.longDesc || p.desc || '')}</p>
${specs.length ? `<table>${specs.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>` : ''}
<p><a class="btn" href="/#/produto/${esc(p.slug)}">Ver na loja e pedir orçamento</a></p>
<p>${esc(store)} · ${esc([a.street, a.district, cityLine].filter(Boolean).join(', '))} · ${esc(settings.whatsappDisplay || '')}</p>`;
    fs.writeFileSync(path.join(ROOT, rel, 'index.html'), page({ title: `${name} | ${store}`, desc, canonical, image, type: 'product', extraMeta: `<meta property="product:price:amount" content="${Number(p.price).toFixed(2)}">\n<meta property="product:price:currency" content="BRL">\n`, ld, body, appPath: `/produto/${p.slug}`, store }));
    urls.push({ loc: canonical, pri: '0.8' });
  }

  /* categorias */
  for (const c of cats) {
    if (!safeSlug(c.slug)) continue;
    const rel = `categoria/${c.slug}`;
    fs.mkdirSync(path.join(ROOT, rel), { recursive: true });
    const list = prods.filter((p) => p.category === c.slug);
    const image = photoFor(rel, c, [c.image]);
    const canonical = `${SITE}/${rel}/`;
    const desc = clip(`${c.name} na ${store}, ${cityLine}: ${c.desc || 'produtos com preço bom e entrega rápida.'}`, 158);
    const ld = jsonLd({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: c.name,
      url: canonical,
      mainEntity: { '@type': 'ItemList', itemListElement: list.slice(0, 50).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/produto/${p.slug}/`, name: [p.name, p.variant].filter(Boolean).join(' ') })) }
    });
    const body = `<nav><a href="/">${esc(store)}</a></nav>
<h1>${esc(c.name)}</h1>
<p>${esc(c.desc || '')}</p>
<ul>${list.map((p) => `<li><a href="/produto/${esc(p.slug)}/">${esc([p.name, p.variant].filter(Boolean).join(' '))}</a> — ${brl(p.price)}</li>`).join('')}</ul>
<p><a class="btn" href="/#/categoria/${esc(c.slug)}">Ver a categoria na loja</a></p>`;
    fs.writeFileSync(path.join(ROOT, rel, 'index.html'), page({ title: `${c.name} | ${store}`, desc, canonical, image, type: 'website', ld, body, appPath: `/categoria/${c.slug}`, store }));
    urls.push({ loc: canonical, pri: '0.9' });
  }

  /* sitemap + robots */
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc><lastmod>${today}</lastmod><priority>${u.pri}</priority></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

  /* bloco de SEO da página inicial */
  const idx = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(idx, 'utf8');
  const homeTitle = `${store} — Materiais de construção e ferragens em ${a.city || 'Manaus'}`;
  const homeDesc = clip(`Ferro, ferragens, telhas, calhas, solda, elétrica, hidráulica e pintura com preço bom em ${cityLine || 'Manaus'}. Monte seu orçamento online e finalize pelo WhatsApp.`, 158);
  const homeImg = `${SITE}/assets/banner-mp.jpg`;
  const block = `<!-- seo:start (gerado por tools/build-seo.js) -->
  <title>${esc(homeTitle)}</title>
  <meta name="description" content="${esc(homeDesc)}">
  <link rel="canonical" href="${esc(SITE)}/">
  <meta property="og:site_name" content="${esc(store)}">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(homeTitle)}">
  <meta property="og:description" content="${esc(homeDesc)}">
  <meta property="og:url" content="${esc(SITE)}/">
  <meta property="og:image" content="${esc(homeImg)}">
  <meta name="twitter:card" content="summary_large_image">
  ${jsonLd({ '@context': 'https://schema.org', '@type': 'HardwareStore', name: store, url: `${SITE}/`, image: homeImg, logo: `${SITE}/assets/logo.jpg`, telephone: settings.whatsappDisplay || settings.phone, address: { '@type': 'PostalAddress', streetAddress: a.street || '', addressLocality: a.city || '', addressRegion: a.state || '', ...(a.cep ? { postalCode: a.cep } : {}), addressCountry: 'BR' } })}
  ${jsonLd({ '@context': 'https://schema.org', '@type': 'WebSite', name: store, alternateName: [`${store} Manaus`, store.replace(/\s+/g, '')], url: `${SITE}/` })}
  <!-- seo:end -->`;
  if (!/<!-- seo:start[\s\S]*?<!-- seo:end -->/.test(html)) throw new Error('index.html não tem o bloco <!-- seo:start --> ... <!-- seo:end -->.');
  html = html.replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->/, () => block);
  fs.writeFileSync(idx, html);

  console.log(`Pronto: ${prods.length} produtos, ${cats.length} categorias, sitemap.xml, robots.txt e index.html atualizados.`);
})().catch((e) => {
  console.error('\nErro: ' + e.message);
  process.exit(1);
});
