# Roteiro para colocar a loja no ar

Siga na ordem. Marque cada item.

## 1. Deixar tudo pronto (no painel, em `/#/admin`)
- [ ] **Admin › Loja › Otimizar fotos do site** (uma vez). Reduz as fotos já cadastradas e deixa o site bem mais leve no celular. Depois, as fotos novas já entram reduzidas.
- [ ] **Admin › Loja**: conferir WhatsApp, e-mail, horários, redes sociais, bairro e CEP (o que ainda é exemplo).
- [ ] **Admin › Produtos**: preços, estoque e fotos conferidos; nenhum produto de demonstração sobrando.
- [ ] **Admin › Banners**: só os banners que você quer, e a imagem para celular enviada.
- [ ] **Firebase › Authentication**: apagar as contas de teste (menos a sua). **Firestore › orders**: apagar os pedidos de teste.

## 2. Publicar
Na pasta do projeto, no terminal:

```
firebase login          (só na primeira vez)
npm run deploy
```

O comando gera as páginas para o Google e publica. O endereço aparece no fim, algo como `https://mp-ferragens-6e4a3.web.app`.

## 3. Endereço próprio (mpferragens.com.br)
1. Registrar o domínio no [registro.br](https://registro.br) (cerca de R$ 40 por ano, no CPF/CNPJ da loja).
2. Firebase › **Hosting › Adicionar domínio personalizado**, e criar no registro.br os registros DNS que o Firebase mostrar. Repetir para `www.mpferragens.com.br`, escolhendo redirecionar para o sem `www`.
3. Firebase › **Authentication › Configurações › Domínios autorizados**: adicionar os dois endereços.
4. Em [tools/seo.config.json](tools/seo.config.json), trocar `siteUrl` para `https://mpferragens.com.br`.
5. Rodar `npm run deploy` de novo.

## 4. Aparecer no Google ao pesquisar "MP Ferragens"
1. **Google Search Console** (<https://search.google.com/search-console>): adicionar o site, confirmar a propriedade, enviar `sitemap.xml` e, em **Inspeção de URL**, colocar a página inicial e clicar em **Solicitar indexação**.
2. **Google Meu Negócio** (<https://business.google.com>): criar o perfil "MP Ferragens", categoria "Loja de ferragens", com o mesmo endereço, telefone e horário do site, o site novo e fotos da loja. É isso que faz a loja aparecer no mapa e no quadro à direita da busca.
3. **Mesmo nome, endereço e telefone em todo lugar**: site, Google, Instagram, Facebook, WhatsApp Business. Escreva sempre "MP Ferragens", Rua Itália, nº 33, Flores, Manaus, (92) 98111-1443.
4. **Link do site** no perfil do Instagram, no Facebook e no WhatsApp Business.
5. Peça aos clientes para **avaliar a loja no Google**. Avaliações ajudam muito na busca local.

**O que esperar:** ninguém consegue garantir a 1ª posição no Google. Para a busca pelo nome da loja, o site com endereço próprio, o Meu Negócio e o Search Console configurados costumam aparecer entre os primeiros resultados em alguns dias ou semanas. Se existir outra empresa com o mesmo nome, o Google mistura os resultados; o endereço "Manaus" ajuda a diferenciar.

## 5. Teste final (com o site no ar, no seu celular)
- [ ] Abrir o site pelo 4G, não pelo Wi-Fi: a primeira tela aparece rápido?
- [ ] Criar uma conta de teste, montar um orçamento, finalizar no WhatsApp.
- [ ] Ver o pedido no painel e mudar o status; o cliente vê a mudança?
- [ ] "Esqueci minha senha" chega por e-mail?
- [ ] Compartilhar um produto no WhatsApp: aparece foto e preço?
- [ ] Apagar a conta e o pedido de teste.

## 6. Depois de publicar
- Sempre que mudar produtos, preços ou fotos e quiser que o Google e a prévia do WhatsApp enxerguem: `npm run deploy`. Na loja em si, a mudança aparece na hora.
- Uma vez por mês, confira no Search Console se há erros de indexação.
- Para uma loja com **centenas de produtos**, o próximo passo é guardar as fotos no Firebase Storage (exige o plano Blaze, com cartão, mas o uso pequeno costuma ficar no gratuito). Avise antes de passar de uns 100 produtos.
