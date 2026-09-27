# Ligando o servidor (Firebase) — passo a passo

Com isso o site passa a ter **contas de clientes de verdade**, **pedidos que chegam ao seu painel** e
**status do pedido que o cliente vê atualizado**. Custo: o plano gratuito (Spark) do Firebase basta para uma loja pequena.

> Enquanto `js/firebase-config.js` estiver com `null`, o site continua em modo demonstração (tudo só no navegador).

## 1. Criar o projeto
1. Entre em <https://console.firebase.google.com> com sua conta Google → **Adicionar projeto** (ex.: `mp-ferragens`). Pode desativar o Google Analytics.
2. Na página inicial do projeto, clique no ícone **`</>` (Web)** → dê um apelido → **Registrar app**.
3. O Firebase mostra um bloco `firebaseConfig = { apiKey: ..., authDomain: ..., projectId: ..., appId: ... }`.
   Copie os valores para [js/firebase-config.js](js/firebase-config.js), trocando `window.MP_FIREBASE = null;` por:

```js
window.MP_FIREBASE = {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  appId: '...'
};
```

## 2. Ligar o login por e-mail e senha
Console → **Authentication** → **Vamos começar** → aba **Sign-in method** → **E-mail/senha** → ativar → Salvar.

## 3. Criar o banco e publicar as regras de segurança
1. Console → **Firestore Database** → **Criar banco de dados** → local `southamerica-east1` (São Paulo) → modo **produção**.
2. Aba **Regras** → apague tudo, cole o conteúdo de [firestore.rules](firestore.rules) → **Publicar**.

Sem essas regras o site mostra "Não foi possível conectar". São elas que impedem um cliente de mexer em preços ou ver pedidos de outros.

## 4. Criar a sua conta de administrador
1. Abra o site (veja o passo 5), vá em **Criar conta** e cadastre o e-mail do dono da loja. (Ou crie em Console → Authentication → Users → Adicionar usuário.)
2. Console → **Authentication → Users** → copie o **UID** dessa conta.
3. Console → **Firestore Database → Iniciar coleção** → ID da coleção `admins` → ID do documento = **o UID copiado** → adicione qualquer campo (ex.: `role` = `admin`) → Salvar.
4. Acesse `seusite/#/admin`, entre com esse e-mail e senha.

Só quem tem o documento em `admins` abre o painel. Para dar acesso a um funcionário, repita o passo 3 com o UID dele.

## 5. Publicar o catálogo e colocar o site no ar
- O login **não funciona abrindo o `index.html` com duplo clique** (`file://`). Para testar no seu computador, na pasta do site rode `npx serve .` e abra o endereço `http://localhost:3000`.
- Para colocar no ar: **Firebase Hosting** (`npm i -g firebase-tools`, `firebase login`, `firebase init hosting` apontando para esta pasta, `firebase deploy`), ou qualquer hospedagem estática (Netlify, Vercel, GitHub Pages).
- Se usar domínio próprio: Console → **Authentication → Settings → Authorized domains** → adicione o domínio.
- No primeiro acesso ao painel aparece **"Publicar catálogo de demonstração"**: envia categorias, produtos, banners e cupons de exemplo para a nuvem. Depois é só editar em Admin › Produtos etc.

## Como o dia a dia funciona
- Cliente monta o orçamento e envia pelo WhatsApp → o pedido também é gravado na nuvem.
- Você vê em **Admin › Pedidos** (atualiza sozinho) e muda o status pelo seletor da linha (Aguardando → Em separação → A caminho → Entregue / Cancelado).
- O cliente logado vê o status novo em **Minha conta › Pedidos**.
- Esqueci a senha: o Firebase envia um e-mail com o link de redefinição.

## Limites conhecidos
- Fotos dos produtos ficam dentro do documento do produto (limite de 1 MB). O painel já reduz as fotos; se avisar "Registro grande demais", use menos fotos. Para muitas fotos em alta resolução, o próximo passo é o Firebase Storage (exige plano Blaze).
- Os preços do pedido são calculados no navegador do cliente. Como o pedido é confirmado por você no WhatsApp, isso é aceitável, mas confira o valor antes de fechar.
- Cupons de desconto ficam legíveis por quem inspecionar o site.
- Favoritos, lista de desejos e orçamentos salvos continuam só no navegador de cada pessoa.
- Números de pedido na nuvem são códigos curtos (ex.: `MP1F3K9A2`), não sequenciais.
- Qualquer visitante pode criar pedidos; se houver spam, ative o **Firebase App Check**.
