# Integração Asaas – Recarga de celular e Pagamento de contas

Tudo roda no servidor. A chave da Asaas nunca vai para o navegador.

## 1. Configurar

No `.env.local` (não sobe pro GitHub):

```
ASAAS_API_KEY=sua_chave            # sandbox começa com $aact_hmlg_
ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3   # produção: https://api.asaas.com/v3
ASAAS_WEBHOOK_TOKEN=um_token_forte_que_voce_inventa
ASAAS_VALIDACAO_TOKEN=outro_token_forte     # se vazio, usa o ASAAS_WEBHOOK_TOKEN
# ASAAS_VALIDACAO_OUTROS=aprovar            # só se quiser aprovar transferências/Pix feitos por fora do app
```

Rodar uma vez no banco: `sql/asaas_transacoes.sql`.

## 2. Webhook (quando o site estiver no ar)

Na Asaas: **Integrações > Webhooks > Adicionar**
- URL: `https://SEU_DOMINIO/api/asaas/webhook`
- Token de autenticação: o mesmo de `ASAAS_WEBHOOK_TOKEN`
- Eventos: **Recarga de celular** e **Pagamento de contas**

Sem o token configurado o webhook recusa tudo, de propósito.

## 2.1 Aprovação automática (obrigatório pra recarga funcionar sozinha)

Sem isso, toda recarga e conta fica em `WAITING_CRITICAL_ACTION`, esperando
aprovação por SMS/token no painel da Asaas.

Na Asaas: **Menu do usuário > Integrações > Mecanismos de segurança > Validação de saque via webhook**
- URL: `https://SEU_DOMINIO/api/asaas/validacao-saque`
- Token: o mesmo de `ASAAS_VALIDACAO_TOKEN`
- E-mail para avisos de erro: o seu

A rota só aprova recarga/conta que foi criada pelo app, com o mesmo valor.
Todo o resto é recusado, então **transferências e Pix feitos direto no painel da
Asaas também passam por essa validação e serão recusados**, a não ser que
`ASAAS_VALIDACAO_OUTROS=aprovar` esteja configurado. Se precisar sacar para o
banco, ative essa opção ou desligue a validação na hora do saque.

Se a rota ficar fora do ar, a Asaas tenta 3 vezes e depois cancela a operação
(o dinheiro volta pro saldo).

## 3. Rotas

Todas exigem o usuário logado (cookie `access_token`), menos o webhook.
Em erro, todas devolvem `{ error: "mensagem" }`.

| Rota | O que faz |
|---|---|
| `GET /api/asaas/recarga/valores?telefone=11987654321` | Operadora do número e valores aceitos |
| `POST /api/asaas/recarga` `{ telefone, valor }` | Faz a recarga |
| `POST /api/asaas/recarga/{id}/cancelar` | Cancela, se a Asaas ainda não executou |
| `POST /api/asaas/contas/simular` `{ linhaDigitavel }` | Mostra valor, vencimento e beneficiário. Não paga |
| `POST /api/asaas/contas` `{ linhaDigitavel, dataAgendamento?, descricao?, valor? }` | Paga ou agenda a conta |
| `GET /api/asaas/historico?tipo=recarga\|conta&pagina=1` | Histórico do usuário logado |
| `GET /api/asaas/historico/{id}` | Uma operação, com status atualizado na Asaas |
| `POST /api/asaas/webhook` | Recebe as confirmações da Asaas |
| `POST /api/asaas/validacao-saque` | Aprova automaticamente o que o app criou |

`{id}` é o `id` que volta na recarga/conta e no histórico.

## 4. Coisas importantes

- **Valores de recarga são fixos por operadora** (ex.: Vivo R$ 12, 15, 20...). A tela deve usar a lista de `/recarga/valores`. A operadora é detectada pelo número, então o seletor de operadora não é necessário.
- **Tudo sai do saldo da conta Asaas.** Sem saldo, a Asaas recusa.
- **Clique duplo protegido:** a mesma recarga (telefone + valor) em 2 minutos, ou a mesma conta já em andamento, é recusada.
- **Status `VERIFICAR`:** a chamada à Asaas caiu sem resposta (acontece: no teste a Asaas deu timeout e criou a conta mesmo assim). A aprovação automática liga a operação ao histórico sozinha; se não ligar, conferir no painel da Asaas antes de repetir.
- **Aprovação:** ver item 2.1.

## 5. Motorista

As rotas valem para qualquer usuário logado. As telas do motorista podem chamar as mesmas rotas, sem copiar nada da API.
