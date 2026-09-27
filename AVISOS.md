# Avisos de pedido novo

O site avisa o dono da loja de duas formas. As duas trabalham juntas.

## 1. Aviso no painel (já funciona, sem configurar nada)
Enquanto o painel (`/#/admin`) estiver aberto em qualquer aba, computador ou celular, quando chega um pedido:
- toca um som curto;
- aparece um aviso na tela com o nome do cliente e o valor;
- o menu **Pedidos** mostra um contador vermelho com os pedidos "Aguardando";
- o título da aba passa a mostrar "🔔 Novo pedido!" até você abrir a lista de pedidos;
- se você ativar, o navegador também mostra uma notificação do sistema.

No topo do painel há o botão **Avisos: ligados / desligados**. Ao ligar, o navegador pede permissão para notificações: clique em **Permitir**.

Limites: só avisa com o painel aberto. No iPhone as notificações do sistema exigem "Adicionar à Tela de Início"; o som e o aviso na tela funcionam normalmente.

## 2. Aviso por e-mail (recomendado, para quando o painel estiver fechado)
Usa o serviço gratuito **Web3Forms**. O e-mail chega para o endereço que você cadastrar, com número do pedido, cliente, telefone, itens, total e link do painel.

1. Abra <https://web3forms.com> e clique em **Get Started / Create your Access Key**.
2. Digite o **e-mail do dono da loja** (é para lá que os avisos vão). Eles enviam a chave (Access Key) para esse e-mail.
3. Abra o arquivo [js/firebase-config.js](js/firebase-config.js) e cole a chave:

```js
window.MP_NOTIFY = { web3formsKey: 'COLE-A-CHAVE-AQUI' };
```

4. Rode `firebase deploy` (ou `npm run deploy`) e faça um pedido de teste no site: o e-mail deve chegar em alguns segundos (veja também o spam).

Observações:
- O plano gratuito tem um limite mensal de envios (cerca de 250; confira no site do serviço).
- A chave é pública (fica no código do site). Se alguém abusar dela, gere outra no Web3Forms e troque aqui.
- Os dados do pedido (nome, telefone, itens) passam por esse serviço para chegar ao seu e-mail. Isso vale citar na Política de Privacidade.
- Se a chave ficar vazia, nenhum e-mail é enviado. O painel continua avisando normalmente.
