/*
 * Distância de entrega (km), por estrada de verdade — usada só para o cálculo de frete por combustível
 * (veja MP.shipping em js/core/cart.js). API: OpenRouteService (chave em js/ors-config.js).
 *
 * Sem chave configurada (MP_ORS_KEY vazio), MP.distance.resolve() sempre devolve null — quem chamar usa
 * o frete de reserva (valor fixo) nesse caso, sem quebrar nada.
 *
 * Cache em 3 camadas, pra nunca calcular o mesmo CEP duas vezes e economizar da cota da API:
 *   1. memória (nesta aba, enquanto estiver aberta)
 *   2. localStorage (neste aparelho, entre visitas)
 *   3. Firestore (entre clientes diferentes — se alguém da sua rua já pediu, o cálculo já está pronto)
 */
(function (MP) {
  const U = MP.util;
  /*
   * A OpenRouteService avisou (out/2026) que vai aposentar este endereço em favor de api.heigit.org —
   * mas até agora (testado com a chave real) o endereço novo devolve "404" nos mesmos caminhos, então
   * fica assim por enquanto (continua funcionando). Se um dia o frete por distância parar de funcionar,
   * é o primeiro lugar a checar: veja o anúncio deles em openrouteservice.org pelo endereço certo novo.
   */
  const ORS = 'https://api.openrouteservice.org';
  const key = () => window.MP_ORS_KEY || '';
  const CACHE_KEY = 'shipDistCache';
  const mem = {}; // { cep: {km, address} }

  const withTimeout = (ms) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    return { signal: ctl.signal, done: () => clearTimeout(t) };
  };

  const localCache = () => {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  };
  const saveLocal = (cep, data) => {
    try {
      const c = localCache();
      c[cep] = data;
      localStorage.setItem(CACHE_KEY, JSON.stringify(c));
    } catch (e) {}
  };

  /* endereço em texto -> {lat, lon}, ou null se não encontrar */
  const geocode = async (text) => {
    const { signal, done } = withTimeout(6000);
    try {
      const url = `${ORS}/geocode/search?api_key=${encodeURIComponent(key())}&text=${encodeURIComponent(text)}&boundary.country=BR&size=1`;
      const r = await fetch(url, { signal });
      done();
      if (!r.ok) return null;
      const j = await r.json();
      const f = j && j.features && j.features[0];
      if (!f || !f.geometry || !f.geometry.coordinates) return null;
      const [lon, lat] = f.geometry.coordinates;
      return { lat, lon };
    } catch (e) {
      done();
      return null;
    }
  };

  /* distância de estrada (km) entre dois pontos {lat,lon}, ou null se não conseguir calcular */
  const routeKm = async (a, b) => {
    const { signal, done } = withTimeout(6000);
    try {
      const r = await fetch(`${ORS}/v2/directions/driving-car`, {
        method: 'POST',
        signal,
        headers: { Authorization: key(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates: [[a.lon, a.lat], [b.lon, b.lat]] })
      });
      done();
      if (!r.ok) return null;
      const j = await r.json();
      const meters = j && j.routes && j.routes[0] && j.routes[0].summary && j.routes[0].summary.distance;
      return typeof meters === 'number' ? meters / 1000 : null;
    } catch (e) {
      done();
      return null;
    }
  };

  let storeOriginPromise = null;
  /* geocodifica o endereço da loja só 1 vez por visita (não muda durante a navegação) */
  const storeOrigin = () => {
    if (!storeOriginPromise) {
      storeOriginPromise = (async () => {
        const a = MP.settings.get().address;
        const text = [a.street, a.district, a.city, a.state, 'Brasil'].filter(Boolean).join(', ');
        return geocode(text);
      })();
    }
    return storeOriginPromise;
  };

  const cloudGet = async (cep) => {
    if (!MP.cloud.enabled || !MP.cloud.db) return null;
    try {
      const d = await MP.cloud.db.doc('shippingDistanceCache/' + cep).get();
      return d.exists ? d.data() : null;
    } catch (e) {
      return null;
    }
  };
  const cloudSet = (cep, data) => {
    if (!MP.cloud.enabled || !MP.cloud.db) return;
    MP.cloud.db
      .doc('shippingDistanceCache/' + cep)
      .set({ km: data.km, address: data.address, cachedAt: new Date().toISOString() })
      .catch(() => {}); // cache é só uma economia; se falhar, o cálculo já foi usado mesmo assim
  };

  MP.distance = {
    /* {km, address} do CEP até a loja, ou null se não deu pra calcular (sem chave, endereço não achado, etc.) */
    async resolve(cep) {
      const d = U.digits(cep);
      if (d.length !== 8) return null;
      if (mem[d]) return mem[d];
      if (!key()) return null; // sem chave: quem chamou cai no frete de reserva

      const cachedLocal = localCache()[d];
      if (cachedLocal && typeof cachedLocal.km === 'number') {
        mem[d] = cachedLocal;
        return cachedLocal;
      }
      const cachedCloud = await cloudGet(d);
      if (cachedCloud && typeof cachedCloud.km === 'number') {
        const data = { km: cachedCloud.km, address: cachedCloud.address || '' };
        mem[d] = data;
        saveLocal(d, data);
        return data;
      }

      const info = await U.lookupCep(d);
      const text = info ? [info.street, info.district, info.city, info.state, 'Brasil'].filter(Boolean).join(', ') : `${d}, Brasil`;
      const [origin, dest] = await Promise.all([storeOrigin(), geocode(text)]);
      if (!origin || !dest) return null;
      const km = await routeKm(origin, dest);
      if (km == null) return null;

      const address = info ? [info.street, info.district, info.city].filter(Boolean).join(', ') : '';
      const data = { km: Math.round(km * 10) / 10, address };
      mem[d] = data;
      saveLocal(d, data);
      cloudSet(d, data);
      return data;
    }
  };
})(window.MP);
