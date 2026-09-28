# Integração Asaas – Recarga de celular e Pagamento de contas

Tudo roda no servidor. A chave da Asaas nunca vai para o navegador.

## 1. Configurar

No `.env.local` (não sobe pro GitHub):

```
ASAAS_API_KEY=sua_chave            # sandbox começa com $aact_hmlg_
ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3   # produção: https://api.asaas.com/v3
ASAAS_WEBHOOK_TOKEN=um_token_forte_que_voce_inventa
```

Rodar uma vez no banco: `sql/asaas_transacoes.sql`.

## 2. Webhook (quando o site estiver no ar)

Na Asaas: **Integrações > Webhooks > Adicionar**
- URL: `https://SEU_DOMINIO/api/asaas/webhook`
- Token de autenticação: o mesmo de `ASAAS_WEBHOOK_TOKEN`
- Eventos: **Recarga de celular** e **Pagamento de contas**

Sem o token configurado o webhook recusa tudo, de propósito.

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

`{id}` é o `id` que volta na recarga/conta e no histórico.

## 4. Coisas importantes

- **Valores de recarga são fixos por operadora** (ex.: Vivo R$ 12, 15, 20...). A tela deve usar a lista de `/recarga/valores`. A operadora é detectada pelo número, então o seletor de operadora não é necessário.
- **Tudo sai do saldo da conta Asaas.** Sem saldo, a Asaas recusa.
- **Clique duplo protegido:** a mesma recarga (telefone + valor) em 2 minutos, ou a mesma conta já em andamento, é recusada.
- **Status `VERIFICAR`:** a chamada à Asaas caiu sem resposta. Conferir no painel da Asaas antes de repetir.
- **Validação de transferências:** se a conta Asaas pedir token/SMS para saques, recargas e contas podem ficar aguardando essa autorização. Verifique em Minha Conta > Segurança.

## 5. Motorista

As rotas valem para qualquer usuário logado. As telas do motorista podem chamar as mesmas rotas, sem copiar nada da API.
