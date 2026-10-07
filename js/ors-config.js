/*
 * Chave da API de mapas (OpenRouteService) — usada só para calcular a distância de entrega (km) entre
 * a loja e o CEP do cliente, para o frete por combustível (veja js/data/seed-settings.js > shipping).
 *
 * Enquanto este valor for vazio (''), o site usa o frete de reserva (valor fixo) normalmente — nada
 * quebra, só não calcula a distância de verdade.
 *
 * Para pegar a chave (gratuita, sem cartão):
 *   1. Acesse openrouteservice.org e crie uma conta grátis ("Sign up").
 *   2. No Dashboard, clique em "Request a token" (ou "Create token").
 *   3. Copie a chave gerada e cole abaixo, entre as aspas.
 */
window.MP_ORS_KEY = '';
