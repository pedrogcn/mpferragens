# MP Ferragens — e-commerce

Site estático (HTML + CSS + JavaScript puro, sem build). Para ver: abra `index.html` no navegador
(ou rode `npx serve .` nesta pasta).

## Acesso de demonstração
- Cliente: `pedro@exemplo.com` / `123456`
- Painel: `#/admin` — senha `admin123` (troque em Loja › Segurança)
- Cupons de teste: `BEMVINDO10` (10% acima de R$ 100) e `OBRA50` (R$ 50 acima de R$ 500)

## Onde mudar o quê
| O quê | Onde |
|---|---|
| Logo oficial | `assets/logo.jpg` (ou upload em Admin › Loja) |
| WhatsApp, endereço, horários, redes, frete | Admin › Loja (padrões em `js/data/seed-settings.js`) |
| Produtos, fotos, preços, estoque | Admin › Produtos |
| Categorias, banners, cupons, promoções | Admin › respectivas seções |
| Pedidos e status | Admin › Pedidos |
| Colocar no ar e aparecer no Google (passo a passo) | [LANCAMENTO.md](LANCAMENTO.md) |
| Publicar na Vercel, em vez do (ou além do) Firebase Hosting | [VERCEL.md](VERCEL.md) |
| Avisos de pedido novo (painel e e-mail) | [AVISOS.md](AVISOS.md) |
| Google, sitemap e prévia no WhatsApp | [SEO.md](SEO.md) — publique sempre com `npm run deploy` |

## Estrutura
- `js/core/` — utilitários, ícones, ilustrações SVG (`art.js`), dados (`store.js`), contas (`auth.js`), carrinho/frete/WhatsApp (`cart.js`), roteador e UI (`ui.js`)
- `js/components/` — Header, Footer, ProductCard, CategoryCard, Gallery, SearchBar, Forms, Stepper, Toast/Modal
- `js/pages/` — home, catálogo (categoria/busca/promoções), produto, carrinho, login/cadastro, conta, contato
- `js/admin/` — painel administrativo
- `css/` — `base.css` (tokens, botões, formulários), `components.css`, `pages.css`

## Limites atuais (importante)
Os dados ficam no `localStorage` do navegador de cada pessoa: pedidos feitos por clientes **não chegam ao painel do
dono da loja** — o canal real do pedido é a mensagem de WhatsApp. Login e senha do painel são demonstrativos.

**Para ligar contas reais, pedidos no painel e status do pedido, siga [FIREBASE.md](FIREBASE.md)** (camada em `js/core/cloud.js`, regras em `firestore.rules`).
O pagamento online continua fora do escopo; para isso seria preciso um back-end próprio, trocando `js/core/store.js` e
`js/core/auth.js` por uma API/back-end; o restante do código usa apenas essas interfaces.
