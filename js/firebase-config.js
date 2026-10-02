/*
 * Configuração do Firebase (servidor de contas, pedidos e catálogo).
 *
 * Enquanto este valor for null, o site funciona em MODO DEMONSTRAÇÃO (tudo salvo só no navegador).
 * Para ligar o servidor real, siga o passo a passo do arquivo FIREBASE.md e cole aqui o objeto
 * "firebaseConfig" que o Firebase mostra ao registrar o app da web, por exemplo:
 *
 * window.MP_FIREBASE = {
 *   apiKey: '...',
 *   authDomain: 'seu-projeto.firebaseapp.com',
 *   projectId: 'seu-projeto',
 *   appId: '...'
 * };
 *
 * (Essas chaves são públicas por natureza; quem protege os dados são as regras do Firestore, firestore.rules.)
 */
/*
 * NUVEM PAUSADA (de propósito, a pedido do lojista): o site está rodando em modo demonstração
 * pra todo mundo — mostra produtos de exemplo, e qualquer pedido feito agora NÃO chega ao painel.
 * Pra ligar a nuvem de novo: apague a linha "window.MP_FIREBASE = null;" logo abaixo e descomente
 * o bloco com as chaves reais (ou peça pro Claude fazer isso).
 */
window.MP_FIREBASE = null;
/*
window.MP_FIREBASE = {
  apiKey: 'AIzaSyCBomVQeZkLliasuIPt6X6DpInt7EGHxPg',
  authDomain: 'mp-ferragens-6e4a3.firebaseapp.com',
  projectId: 'mp-ferragens-6e4a3',
  appId: '1:990631303478:web:7bb10309c29861d49e3b97'
};
*/

/*
 * Aviso de pedido novo por e-mail (opcional, gratuito). Passo a passo em AVISOS.md.
 * Cole aqui a chave ("Access Key") recebida do serviço Web3Forms (web3forms.com) no e-mail do dono da loja.
 * Vazio = sem e-mail (o painel continua avisando com som e notificação quando está aberto).
 */
window.MP_NOTIFY = { web3formsKey: '' };
