/* Utilitários gerais — namespace global MP (sem build, funciona abrindo o index.html direto). */
window.MP = window.MP || {};
MP.seed = MP.seed || {};
MP.components = MP.components || {};
MP.pages = MP.pages || {};

(function (MP) {
  const U = (MP.util = {});

  U.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  U.brl = (n) => brl.format(Number(n) || 0).replace(/ /g, ' ');
  U.round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  U.norm = (s) =>
    String(s == null ? '' : s)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();

  U.slugify = (s) => U.norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  U.uid = (p = 'id') => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  U.digits = (s) => String(s || '').replace(/\D/g, '');

  U.debounce = (fn, ms = 200) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };

  U.$ = (sel, root = document) => root.querySelector(sel);
  U.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const pad = (n) => String(n).padStart(2, '0');
  U.fmtDate = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? '—' : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };
  U.fmtDateTime = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? '—' : `${U.fmtDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  /* ---------- máscaras e validações ---------- */
  U.maskPhone = (v) => {
    const d = U.digits(v).slice(0, 11);
    if (d.length <= 2) return d ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };
  U.maskCep = (v) => {
    const d = U.digits(v).slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };
  U.maskDoc = (v) => {
    const d = U.digits(v).slice(0, 14);
    if (d.length <= 11) {
      return d
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1-$2');
    }
    return d
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };
  U.validCpf = (v) => {
    const d = U.digits(v);
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    for (let t = 9; t < 11; t++) {
      let sum = 0;
      for (let i = 0; i < t; i++) sum += Number(d[i]) * (t + 1 - i);
      const dv = ((sum * 10) % 11) % 10;
      if (dv !== Number(d[t])) return false;
    }
    return true;
  };
  U.validCnpj = (v) => {
    const d = U.digits(v);
    if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
    const calc = (len) => {
      let sum = 0;
      let pos = len - 7;
      for (let i = len; i >= 1; i--) {
        sum += Number(d[len - i]) * pos--;
        if (pos < 2) pos = 9;
      }
      const r = sum % 11;
      return r < 2 ? 0 : 11 - r;
    };
    return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
  };
  U.validDoc = (v) => (U.digits(v).length > 11 ? U.validCnpj(v) : U.validCpf(v));
  U.validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());

  /* ---------- query string ---------- */
  U.parseQuery = (str) => {
    const out = {};
    new URLSearchParams(str || '').forEach((v, k) => (out[k] = v));
    return out;
  };
  U.buildQuery = (obj) => {
    const p = new URLSearchParams();
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      if (v !== '' && v != null) p.set(k, v);
    });
    const s = p.toString();
    return s ? '?' + s : '';
  };

  /* ---------- hash de senha (SHA-256 síncrono, mesmo resultado em file:// e http://) ---------- */
  U.sha256 = (text) => {
    const rr = (v, a) => (v >>> a) | (v << (32 - a));
    const K = [];
    const H = [];
    for (let p = 2, n = 0; n < 64; p++) {
      let prime = true;
      for (let i = 2; i * i <= p; i++) if (p % i === 0) { prime = false; break; }
      if (!prime) continue;
      if (n < 8) H[n] = ((Math.pow(p, 1 / 2) % 1) * 4294967296) | 0;
      K[n++] = ((Math.pow(p, 1 / 3) % 1) * 4294967296) | 0;
    }
    const bytes = new TextEncoder().encode(text);
    const l = bytes.length;
    const padded = new Uint8Array(((l + 9 + 63) >> 6) << 6);
    padded.set(bytes);
    padded[l] = 0x80;
    const dv = new DataView(padded.buffer);
    dv.setUint32(padded.length - 4, (l * 8) >>> 0);
    dv.setUint32(padded.length - 8, Math.floor((l * 8) / 4294967296));
    let h = H.slice();
    const w = new Array(64);
    for (let off = 0; off < padded.length; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + K[i] + w[i]) | 0;
        const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h = [h[0] + a, h[1] + b, h[2] + c, h[3] + d, h[4] + e, h[5] + f, h[6] + g, h[7] + hh].map((x) => x | 0);
    }
    return h.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
  };
  U.addrLine = (a) => [a.street, a.district, [a.city, a.state].filter(Boolean).join(' - '), a.cep].filter(Boolean).join(', ');
  U.hashPassword = (email, pw) => U.sha256(`${U.norm(email)}:${pw}:mp-ferragens`);

  /* ---------- arquivos / imagens ---------- */
  U.readFile = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  /* Redimensiona para caber no localStorage (produtos/banners). Logo usa readFile (sem recompressão). */
  U.resizeImage = async (file, maxDim = 900, quality = 0.84) => {
    const src = await U.readFile(file);
    if (/svg/.test(file.type)) return src;
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });
    const k = Math.min(1, maxDim / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL(file.type === 'image/png' ? 'image/webp' : 'image/jpeg', quality);
  };

  /*
   * Banners: comprime pra WebP (sempre, não importa o formato enviado) numa qualidade alta — o design
   * continua nítido, mas o arquivo cai bastante de tamanho — e limita ao tamanho de verdade usado no
   * site (1920 px no computador, 800 px no celular), mesmo que o envio seja "raw" (sem recorte extra).
   * Volta ao arquivo original se, por algum motivo, o resultado não ficar menor.
   */
  U.resizeBanner = async (file, maxDim = 1920, quality = 0.92) => {
    const src = await U.readFile(file);
    if (/svg/.test(file.type)) return src;
    try {
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = src;
      });
      const k = Math.min(1, maxDim / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * k));
      c.height = Math.max(1, Math.round(img.height * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const out = c.toDataURL('image/webp', quality);
      return out.startsWith('data:image/webp') && out.length < src.length ? out : src;
    } catch (e) {
      return src;
    }
  };

  /* Reduz uma foto já salva (data:URL). Devolve a original se não der para reduzir ou se não compensar. */
  U.shrinkDataUrl = async (src, maxDim = 600, quality = 0.72) => {
    if (!/^data:image\/(png|jpe?g|webp);base64,/.test(String(src))) return src;
    try {
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = src;
      });
      const k = Math.min(1, maxDim / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * k));
      c.height = Math.max(1, Math.round(img.height * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const out = c.toDataURL('image/webp', quality);
      return out.startsWith('data:image/webp') && out.length < src.length * 0.92 ? out : src;
    } catch (e) {
      return src;
    }
  };

  U.lookupCep = async (cep) => {
    const d = U.digits(cep);
    if (d.length !== 8) return null;
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 3500);
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal: ctl.signal });
      clearTimeout(t);
      const j = await r.json();
      return j && !j.erro ? { street: j.logradouro, district: j.bairro, city: j.localidade, state: j.uf } : null;
    } catch (e) {
      return null;
    }
  };

  U.download = (filename, text, type = 'application/json') => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  };

  U.plural = (n, one, many) => (n === 1 ? one : many);
})(window.MP);
