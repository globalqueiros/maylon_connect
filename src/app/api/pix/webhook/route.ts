import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

/**
 * Webhook BTG Pactual.
 * Eventos esperados:
 * - automatic-pix.authorization-created / scheduling-approved / authorization rejected
 * - instant-collection.paid (1ª mensalidade)
 * - automatic-pix.scheduling-paid (mensalidades seguintes)
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const eventType =
      payload?.event ||
      payload?.type ||
      payload?.eventType ||
      payload?.name ||
      "";

    const data = payload?.data || payload?.payload || payload;

    console.log("BTG webhook:", eventType, JSON.stringify(data)?.slice(0, 500));

    const authorizationId =
      data?.authorizationId ||
      data?.id ||
      data?.authorization?.authorizationId ||
      null;

    const txId = data?.txId || data?.instantPix?.txId || null;
    const tags = data?.tags || {};
    const assinaturaIdFromTag = tags?.assinatura_id
      ? Number(tags.assinatura_id)
      : null;

    const status = String(data?.status || "").toUpperCase();

    // Autorização aprovada → libera 1ª mensalidade
    if (
      String(eventType).includes("authorization") ||
      String(eventType).includes("scheduling-approved") ||
      status === "APPROVED"
    ) {
      if (
        ["APPROVED", "CREATED", "FINISHED"].includes(status) ||
        String(eventType).includes("scheduling-approved") ||
        String(eventType).includes("authorization-created")
      ) {
        if (status === "APPROVED" || String(eventType).includes("approved")) {
          if (authorizationId) {
            await db.execute(
              `
              UPDATE usuario_beneficios
              SET
                status_assinatura = 'aguardando_pagamento',
                pix_stage = 'autorizacao_aprovada'
              WHERE btg_authorization_id = ?
                AND metodo_pagamento = 'pix_btg'
              `,
              [authorizationId]
            );
          }
        }
      }

      if (
        status === "REJECTED" ||
        String(eventType).includes("rejected") ||
        String(eventType).includes("cancelled")
      ) {
        if (authorizationId) {
          await db.execute(
            `
            UPDATE usuario_beneficios
            SET
              ativo = 0,
              status_assinatura = 'recusado',
              pix_stage = 'recusado'
            WHERE btg_authorization_id = ?
              AND metodo_pagamento = 'pix_btg'
            `,
            [authorizationId]
          );
        }
      }
    }

    // Pagamento da 1ª mensalidade (Pix cobrança dinâmico)
    if (
      String(eventType).includes("instant-collection") ||
      status === "PAID"
    ) {
      if (status === "PAID" || String(eventType).includes(".paid")) {
        if (assinaturaIdFromTag) {
          await db.execute(
            `
            UPDATE usuario_beneficios
            SET
              ativo = 1,
              status_assinatura = 'aprovado',
              pix_stage = 'concluido',
              btg_tx_id = COALESCE(?, btg_tx_id)
            WHERE id = ?
            `,
            [txId, assinaturaIdFromTag]
          );
        } else if (txId) {
          await db.execute(
            `
            UPDATE usuario_beneficios
            SET
              ativo = 1,
              status_assinatura = 'aprovado',
              pix_stage = 'concluido'
            WHERE btg_tx_id = ?
              AND metodo_pagamento = 'pix_btg'
            `,
            [txId]
          );
        }
      }
    }

    // Mensalidades recorrentes via Pix Automático
    if (String(eventType).includes("scheduling-paid")) {
      if (authorizationId) {
        await db.execute(
          `
          UPDATE usuario_beneficios
          SET
            ativo = 1,
            status_assinatura = 'aprovado',
            pix_stage = 'concluido'
          WHERE btg_authorization_id = ?
          `,
          [authorizationId]
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro webhook BTG:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
