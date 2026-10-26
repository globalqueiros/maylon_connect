# Motorista feminina e preferências de pareamento

## Quem pode chamar

Os apps (`maylon_user`, `maylon_drive`) usam o token do backend de despacho
(`auth.maylon.com.br`). O portal não valida esse token sozinho: ele pergunta ao
backend quem é o dono (`/api/customer/info`, depois `/api/driver/info`) e guarda
a resposta por 60 s. O endereço do backend pode ser trocado com `MAYLON_API_URL`.
A web continua usando o cookie `access_token`. A rota interna do despacho usa
`x-internal-token` (`INTERNAL_API_TOKEN`).

## Passageira

`GET /api/passageiro/preferencias` → `{ success, motorista_feminina }`

`POST /api/passageiro/preferencias` com `{ "motorista_feminina": true | false }`
salva a preferência. O interruptor do pedido de corrida no app mexe nesta mesma
preferência, que também vale para a motorista (ver "Onde a regra é aplicada").

Autismo/TEA e laudo: `GET/POST /api/passageiro/acessibilidade` (`{ pcd, autista }`)
e `POST /api/passageiro/acessibilidade/documento` (`multipart`: `documento` +
`tipo = laudo_autismo`). Salvar de novo uma seleção que não mudou mantém o
status (aprovado não volta a "pendente").

## Motorista

`GET /api/motorista/preferencias` →
`{ success, somente_passageiras, genero_confirmado }`

`POST /api/motorista/preferencias` com `{ "somente_passageiras": true | false }`.
Ligar só é aceito se o gênero feminino estiver confirmado (403 caso contrário).
Desligar é sempre permitido.

## Rotas de pareamento

| Rota | Quem chama | O que faz |
|---|---|---|
| `POST /api/pareamento/motoristas` `{ motorista_ids }` | app da passageira | Devolve `elegiveis`, `sem_motorista_feminina` e `opcoes_sem_motorista` para os lances recebidos |
| `POST /api/pareamento/corridas-permitidas` `{ passageiro_ids }` | app da motorista | Devolve `permitidos` e `bloqueados` entre as corridas pendentes |
| `GET /api/pareamento/apoio?trip_request_id=` | app da motorista | `apoio_viagem` da passageira da corrida, só para a motorista atribuída |
| `POST /api/pareamento/elegibilidade` | despacho (interna) | `{ passageiro_id, motorista_ids, motorista_feminina? }` → elegíveis, descartados e apoio |

Regras:

- Passageira pediu motorista mulher: só entra motorista com gênero feminino
  confirmado. Gênero ausente ou desconhecido não conta.
- Motorista com "somente passageiras": só recebe passageira com gênero feminino
  confirmado.
- `sem_motorista_feminina = true`: o app avisa e deixa a passageira escolher
  entre esperar, aceitar qualquer motorista (isso desliga a preferência) ou
  cancelar. Nunca oferecer outra motorista em silêncio.
- `apoio_viagem` (`viagem_silenciosa`, `evitar_mudanca_de_rota`) só existe para
  passageira com autismo/TEA solicitado e não reprovado. O diagnóstico e o laudo
  nunca saem do servidor.

## Onde a regra é aplicada

O despacho (criar a corrida e escolher quem recebe) roda no backend
`auth.maylon.com.br`, que não faz parte destes repositórios. Por isso a regra é
aplicada nas duas pontas, nos apps:

- **App da motorista:** a lista de corridas pendentes passa por
  `corridas-permitidas`; corrida de passageira que pediu motorista mulher não
  aparece para quem não tem o gênero feminino confirmado. Se o portal não
  responder, a corrida continua aparecendo (o servidor já fez o bloqueio);
  existe um modo estrito opcional (`blockWhenUnverified`).
- **App da passageira:** os lances passam por `motoristas`; se o portal não
  responder, nenhum lance aparece.

Isso não impede um app adulterado ou antigo. Para garantia total, o backend de
despacho deve chamar `POST /api/pareamento/elegibilidade` antes de oferecer a
corrida às motoristas.

## Como o gênero é confirmado

1. Documento verificado (Didit): quando a verificação é aprovada **e** o
   documento confere com o cadastro, o gênero do documento é gravado em
   `usuario_genero` (`fonte = didit`). Vale mais que o cadastro.
2. Sem registro do Didit, usa a coluna de gênero de `users` (`gender`,
   `genero` ou `sexo`), se existir.

Na base atual a coluna `users.gender` não existe e o cadastro não pergunta o
gênero, então na prática só o Didit confirma. Motoristas já aprovadas antes
desta mudança podem ser preenchidas a partir do histórico com
`sql/backfill_genero_didit.sql` (rode a prévia antes); as demais passam a ter o
gênero confirmado ao refazerem a verificação.

O backend de despacho (Laravel) lê as mesmas tabelas e aplica a regra no
servidor: veja `app/Services/PareamentoFeminino.php` no pacote do backend.

## Banco

As tabelas `usuario_genero` e `preferencias_pareamento` são criadas na primeira
chamada. O script equivalente está em `sql/pareamento_motorista_feminina.sql`.
O apoio da viagem lê `trip_requests.customer_id` e `trip_requests.driver_id`.

## Testes

`npm test` roda as regras de pareamento e a ponte de autenticação (sem banco).
