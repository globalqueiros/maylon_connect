import { NextResponse } from "next/server";
import {
  findByAuthorizationId,
  findByTxId,
  logPagamento,
  updateAssinaturaById,
} from "../../../lib/assinaturaDb";
import { createPixInstantCharge } from "../../../lib/btg";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const eventType =
      payload?.eventType ||
      payload?.type ||
      payload?.event ||
      payload?.name ||
      "";

    const data = payload?.data || payload;
    console.log("BTG webhook:", eventType, JSON.stringify(data)?.slice(0, 500));

    // Optional HMAC/secret check if BTG sends signature header later
    const secret = process.env.BTG_WEBHOOK_SECRET || process.env.BTG_SECRET;
    const provided =
      req.headers.get("x-webhook-secret") ||
      req.headers.get("x-btg-secret") ||
      "";
    if (secret && provided && provided !== secret) {
      return NextResponse.json({ error: "Secret inválido" }, { status: 401 });
    }

    const normalized = String(eventType).toLowerCase();

    // Authorization approved → create first month charge if needed
    if (
      normalized.includes("authorization") &&
      (normalized.includes("approved") ||
        String(data?.status || "").toUpperCase() === "APPROVED")
    ) {
      const authorizationId =
        data?.authorizationId || data?.id || data?.authorization_id;
      if (authorizationId) {
        const row = await findByAuthorizationId(String(authorizationId));
        if (row && row.pix_etapa === "autorizacao") {
          const [userRows]: any = await db.query(
            `SELECT full_name, identification_number FROM users WHERE id = ? LIMIT 1`,
            [row.usuario_id]
          );
          const user = userRows?.[0];
          const amount = Number(row.valor_cobrado || 0);
          const charge = await createPixInstantCharge({
            amount,
            displayText: `1ª mensalidade ${row.pedido_codigo}`,
            payerName: user?.full_name || "Cliente",
            payerTaxId: String(user?.identification_number || ""),
            tags: {
              pedido: String(row.pedido_codigo || ""),
              usuario_id: String(row.usuario_id),
              beneficio_id: String(row.beneficio_id),
            },
          });

          await updateAssinaturaById(row.id, {
            status_assinatura: "pendente",
            pix_etapa: "pagamento",
            btg_txid: charge?.txId || charge?.id || null,
            btg_charge_id: charge?.id || null,
            pix_emv: charge?.emv || null,
          });

          await logPagamento({
            usuarioId: row.usuario_id,
            beneficioId: row.beneficio_id,
            usuarioBeneficioId: row.id,
            gateway: "btg",
            metodo: "pix",
            status: "autorizado",
            amount,
            externalId: String(authorizationId),
            pedidoCodigo: row.pedido_codigo || undefined,
            payload,
          });
        }
      }
    }

    // Instant collection paid → activate subscription
    if (
      normalized.includes("instant-collection") &&
      (normalized.includes("paid") ||
        String(data?.status || "").toUpperCase() === "PAID")
    ) {
      const txId = data?.txId || data?.txid || data?.id;
      if (txId) {
        const row = await findByTxId(String(txId));
        if (row) {
          await updateAssinaturaById(row.id, {
            ativo: 1,
            status_assinatura: "aprovado",
            pix_etapa: "pago",
          });
          await logPagamento({
            usuarioId: row.usuario_id,
            beneficioId: row.beneficio_id,
            usuarioBeneficioId: row.id,
            gateway: "btg",
            metodo: "pix",
            status: "aprovado",
            amount: Number(row.valor_cobrado || data?.paidAmount || 0),
            externalId: String(txId),
            pedidoCodigo: row.pedido_codigo || undefined,
            payload,
          });
        }
      }
    }

    // Recurring schedule paid
    if (normalized.includes("scheduling-paid") || normalized.includes("scheduling_paid")) {
      const authorizationId =
        data?.authorizationId || data?.authorization_id || data?.id;
      if (authorizationId) {
        const row = await findByAuthorizationId(String(authorizationId));
        if (row) {
          await updateAssinaturaById(row.id, {
            ativo: 1,
            status_assinatura: "aprovado",
          });
          await logPagamento({
            usuarioId: row.usuario_id,
            beneficioId: row.beneficio_id,
            usuarioBeneficioId: row.id,
            gateway: "btg",
            metodo: "pix",
            status: "recorrente_pago",
            amount: Number(data?.amount || row.valor_cobrado || 0),
            externalId: String(authorizationId),
            pedidoCodigo: row.pedido_codigo || undefined,
            payload,
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Erro webhook BTG:", error);
    return NextResponse.json(
      { error: error?.message || "Erro webhook BTG" },
      { status: 500 }
    );
  }
}
