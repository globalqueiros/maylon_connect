# Portal Connect — Client Handoff

## What to send the client

Send the **source code** (git repo / zip) **without** secret env files:

- Include: application code, `package.json`, `.env.example`, this handoff note
- Do **not** include: `.env`, `.env.local`, `node_modules`, `.next`

On the deploy server, create `.env` from `.env.example` using the client’s existing production values (DB, JWT, Stripe, BTG, SMTP, AWS).

## Production database

Deploy server `.env` should use the production MySQL host (not `127.0.0.1`):

```env
DB_HOST=<production-host>
DB_USER=<production-user>
DB_PASSWORD=<production-password>
DB_NAME=smartmobility_db
```

Ensure the deploy server IP is allowed in MySQL “Remote MySQL” / user grants.

## Deploy steps (server)

```bash
git pull
npm ci
# Apply payment columns (ignore "duplicate column" errors)
# mysql -u USER -p DB_NAME < sql/usuario_beneficios_payments.sql
npm run build
npm run start
# or restart your process manager (pm2 / systemd)
```

## PIX + Cartão (required env)

Cartão (Stripe):
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL` = public site URL

PIX (BTG):
- `BTG_CLIENT_ID`, `BTG_CLIENT_SECRET`
- `BTG_COMPANY_ID` (or `BTG_SECRET`)
- `BTG_ACCOUNT_NUMBER`
- `BTG_PIX_KEY`
- User profile must have CPF/CNPJ (`identification_number`)

Without `BTG_ACCOUNT_NUMBER` + `BTG_PIX_KEY`, PIX returns a clear configuration error (not a crash).

## Client retest checklist

Please hard-refresh the browser (**Ctrl+Shift+R** / **Cmd+Shift+R**), then verify:

1. **Login** with a real production user  
2. **Dashboard** (`/passageiro`) loads stats and latest trips  
3. **Viagens** (`/passageiro/viagens`) lists trip history  
4. **Benefícios** (`/passageiro/beneficios`) lists plans (no 500)  
5. **PIX** — open a benefit → PIX → generate authorization QR  
6. **Cartão** — open a benefit → Cartão → checkout modal appears in front (not behind)

### Original bugs that should be fixed

- PIX / card “Dados obrigatórios não enviados”
- Card modal appearing behind the main modal
- Unexpected logout / empty trips after navigation

If anything still fails, send: screenshot + Network tab status for the failing `/api/...` request.

## Local developer note

- `.env` = production/deploy baseline  
- `.env.local` = local MySQL overrides (gitignored)  
- Smoke test: `node scripts/smoke-test.mjs`
