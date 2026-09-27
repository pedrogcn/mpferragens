# Publicar na Vercel

O site já está preparado para rodar na Vercel sem ajustes manuais de configuração. O arquivo [vercel.json](vercel.json) já diz à Vercel como montar e servir o site.

## O que já está pronto
- **Build automático:** a Vercel roda `npm run seo` antes de publicar, o mesmo comando que gera as páginas do Google (produto, categoria, sitemap) no Firebase. Isso já usa os dados reais do Firestore.
- **Endereço das páginas do Google:** o gerador agora descobre sozinho o endereço da Vercel (variável `VERCEL_PROJECT_PRODUCTION_URL`, que a própria Vercel define). Você não precisa configurar nada, a não ser que já tenha um domínio próprio (veja abaixo).
- **Links limpos:** `/produto/algo/` e `/categoria/algo/` continuam funcionando, do mesmo jeito que no Firebase.
- **Cache das imagens e dos arquivos do site**, igual ao que já existia.

## Como conectar (uma vez só)
1. Entre em [vercel.com](https://vercel.com) com sua conta (dá para usar a conta do GitHub).
2. **Add New… → Project** e escolha o repositório `pedrogcn/mpferragens`.
3. Em "Framework Preset", deixe **Other** (o `vercel.json` já configura o resto sozinho).
4. Confirme e clique em **Deploy**.

Depois do primeiro deploy, a Vercel dá um endereço parecido com `mpferragens.vercel.app` (ou `mpferragens-git-main-pedrogcn.vercel.app` para essa branch). Todo novo `git push` na branch `main` publica uma nova versão sozinho.

## Passo obrigatório: autorizar o domínio no Firebase
**Sem isso, o login de clientes e do painel não funciona no endereço da Vercel.** O Firebase só aceita login vindo de domínios que você autorizou.

1. No [console do Firebase](https://console.firebase.google.com), abra o projeto `mp-ferragens-6e4a3`.
2. **Authentication → Configurações → Domínios autorizados**.
3. Clique em **Adicionar domínio** e cole o endereço que a Vercel deu ao site (ex.: `mpferragens.vercel.app`).
4. Se a Vercel também criar domínios de "preview" (um por branch/PR) e você quiser testar login neles, repita para cada um.

Se você esquecer esse passo, o site abre normalmente, mas o login mostra: *"Este endereço do site ainda não foi autorizado no Firebase"*.

## Se e quando usar um domínio próprio (mpferragens.com.br)
Um domínio só pode apontar para **um lugar por vez**. Se `mpferragens.com.br` for usado na Vercel, ele deixa de apontar para o Firebase Hosting (ou vice-versa). Decida qual dos dois vai ser o endereço final antes de conectar o domínio, para não ter surpresas.

Depois de decidir e conectar o domínio na Vercel (Project Settings → Domains), some domínio ao Firebase em "Domínios autorizados" (passo acima) com o novo endereço.

## O que eu não testei
Não tenho como testar de verdade num deploy real da Vercel a partir daqui. Testei a geração das páginas simulando as variáveis que a Vercel define, e por texto o resultado ficou correto. Depois do primeiro deploy, confira o roteiro de testes abaixo.

## Testes depois de publicar
- [ ] A página inicial abre com o banner e os produtos.
- [ ] Uma página de produto (ex.: `/produto/algum-produto/`) abre direto e mostra a prévia certa ao compartilhar.
- [ ] Criar conta e fazer login funcionam (depende do passo do Firebase acima).
- [ ] O painel (`/#/admin`) abre e mostra os pedidos.
- [ ] `robots.txt` e `sitemap.xml` abrem e mostram o endereço certo da Vercel (ou do domínio próprio, se já conectado).
