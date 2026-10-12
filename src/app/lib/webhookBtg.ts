import { timingSafeEqual } from "node:crypto";

/**
 * Autenticação dos webhooks do BTG (/api/btg/webhook e /api/pix/webhook).
 * O segredo vem do .env (BTG_WEBHOOK_SECRET; BTG_SECRET continua aceito
 * como antes) e precisa chegar no cabeçalho x-webhook-secret / x-btg-secret
 * ou, se o painel do BTG só permitir cadastrar a URL, em ?secret=.
 * Sem segredo configurado ou sem segredo na chamada: recusa. Antes a chamada
 * sem cabeçalho passava e qualquer um podia marcar uma assinatura como paga.
 */
export function segredoWebhookBtg(): string {
  return String(process.env.BTG_WEBHOOK_SECRET || process.env.BTG_SECRET || "")
    .replace(/\r/g, "")
    .trim();
}

export function webhookBtgAutorizado(req: Request): boolean {
  const secret = segredoWebhookBtg();
  if (!secret) {
    console.error("[webhook BTG] BTG_WEBHOOK_SECRET não configurado: chamada recusada.");
    return false;
  }

  let provided =
    req.headers.get("x-webhook-secret") || req.headers.get("x-btg-secret") || "";
  if (!provided) {
    try {
      provided = new URL(req.url).searchParams.get("secret") || "";
    } catch {
      provided = "";
    }
  }
  provided = provided.trim();
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
