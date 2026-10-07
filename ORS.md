# Frete por distância (OpenRouteService)

O frete do site pode ser calculado de duas formas:

- **Sem a chave configurada** (como já funciona hoje): valor fixo por zona (Manaus/Interior), definido em
  Admin > Loja > Frete.
- **Com a chave configurada**: o site calcula a distância de estrada de verdade entre a loja e o endereço
  do cliente (pelo CEP), e o frete sai de `distância × fator ÷ consumo do veículo × preço da gasolina`.

Nada quebra se você não configurar a chave — o site continua com o frete fixo, normalmente.

## Passo a passo (gratuito, sem cartão de crédito)

1. Acesse **openrouteservice.org** e clique em **"Sign up"**.
2. Cadastre-se com e-mail (ou login do Google). Confirme o e-mail, se pedir.
3. No **Dashboard**, clique em **"Request a token"** (ou "Create token").
4. Dê um nome qualquer (ex.: "MP Ferragens") e escolha o plano **gratuito**.
5. Copie a chave gerada.
6. Abra o arquivo `js/ors-config.js` e cole a chave entre as aspas:

   ```js
   window.MP_ORS_KEY = 'sua-chave-aqui';
   ```

7. Publique o site (`npm run deploy`).

A cota gratuita é de **2.000 cálculos por dia** — bem mais do que uma loja de bairro usa. O site também
guarda em cache o resultado de cada CEP (no aparelho do cliente e no banco de dados), então o mesmo
endereço nunca é calculado duas vezes.

## Onde ajustar os números (sem mexer em código)

Em **Admin > Loja > Frete > "Cálculo do frete pela distância"**:

- **Consumo da Saveiro** (km por litro)
- **Preço da gasolina** (R$ por litro) — atualize aqui quando o preço mudar
- **Fator Manaus** (padrão 2× — ida e volta)
- **Fator Interior** (padrão 1,7×)

## Se o endereço não for encontrado

O site nunca mostra um valor de frete "chutado": se o CEP não puder ser localizado no mapa, aparece uma
mensagem clara pedindo para o cliente confirmar o CEP ou falar pelo WhatsApp — sem travar o resto do
pedido (o cliente ainda consegue enviar o orçamento normalmente, e o frete é combinado no atendimento).
