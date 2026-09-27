# Aparecer no Google e compartilhar bonito no WhatsApp

A loja é um app de página única, e o Google e o WhatsApp não conseguem ler as páginas dos produtos direto. Para resolver sem servidor pago, o comando abaixo **gera uma página de cada produto e categoria** com título, descrição, foto, preço e dados que o Google entende. Pessoas que abrem essas páginas vão direto para a loja; robôs ficam lendo o conteúdo.

## Como publicar (sempre que mudar produtos, preços ou fotos)
No terminal, na pasta do projeto:

```
npm run deploy
```

Ele faz duas coisas: gera as páginas (`node tools/build-seo.js`) e publica no Firebase (`firebase deploy`).
Para só gerar, sem publicar: `npm run seo`.

O comando cria/atualiza: `produto/…`, `categoria/…`, `sitemap.xml`, `robots.txt` e o bloco de SEO do `index.html`. Não edite esses arquivos à mão; eles são refeitos a cada execução.

> Produto cadastrado no painel e **ainda não publicado com `npm run deploy`** funciona na loja normalmente, mas o Google e a prévia do WhatsApp só o enxergam depois de rodar o comando.

## Endereço do site
O endereço usado nas páginas fica em [tools/seo.config.json](tools/seo.config.json) (`siteUrl`).
- Enquanto o domínio próprio não estiver conectado, deixe o endereço do Firebase (`https://mp-ferragens-6e4a3.web.app`).
- Quando `mpferragens.com.br` estiver funcionando, troque para `https://mpferragens.com.br` e rode `npm run deploy` de novo.

## Passos para o Google encontrar a loja (uma vez só)
1. **Google Meu Negócio (o mais importante para loja local).** Em <https://business.google.com>, crie o perfil "MP Ferragens", categoria "Loja de ferragens", endereço Rua Itália, nº 33, Manaus, telefone (92) 98111-1443, horários e fotos. É o que faz a loja aparecer no mapa e em "ferragens perto de mim".
2. **Google Search Console.** Em <https://search.google.com/search-console>, adicione o site (propriedade "Prefixo do URL" com o endereço do site) e confirme a propriedade. Depois, em **Sitemaps**, envie `sitemap.xml`.
3. Em cada mudança grande de catálogo, rode `npm run deploy`; o sitemap é atualizado junto.

O Google leva de dias a semanas para indexar. O resultado depende também de fotos boas, descrições completas e de o Google Meu Negócio estar bem preenchido.

## Compartilhar produto
Na página de cada produto há o botão **Compartilhar este produto**. Ele envia o link limpo (`/produto/nome-do-produto/`), e o WhatsApp mostra foto, nome e preço na prévia. Vale também para a página inicial e as categorias.

## Limites
- A prévia com foto do produto usa a primeira foto cadastrada. Sem foto, aparece o banner da loja.
- A busca do Google não indexa as páginas de conta, carrinho e painel; isso é o esperado.
- Os endereços internos da loja continuam com `#` (por exemplo `/#/produto/…`). Isso não atrapalha, porque o Google e o WhatsApp usam as páginas geradas.
