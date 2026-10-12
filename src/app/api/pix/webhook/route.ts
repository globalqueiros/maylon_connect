import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { getPixInstantCharge } from "../../../lib/btg";
import { webhookBtgAutorizado } from "../../../lib/webhookBtg";

export const dynamic = "force-dynamic";

/** Consulta a cobrança no BTG (mesma regra do /api/btg/pix/status). */
async function cobrancaPagaNoBtg(txId: string): Promise<boolean> {
  try {
    const charge: any = await getPixInstantCharge(txId);
    const remoto = String(charge?.status || "").toUpperCase();
    return ["PAID", "CONCLUIDA", "COMPLETED"].includes(remoto);
  } catch (error) {
    console.warn("[pix webhook] falha ao consultar cobrança no BTG:", error);
    return false;
  }
}

/**
 * Webhook BTG Pactual.
 * Eventos esperados:
 * - automatic-pix.authorization-created / scheduling-approved / authorization rejected
 * - instant-collection.paid (1ª mensalidade)
 * - automatic-pix.scheduling-paid (mensalidades seguintes)
 */
export async function POST(req: Request) {
  try {
    // Antes não havia autenticação nenhuma: qualquer POST "pago" ativava assinatura.
    if (!webhookBtgAutorizado(req)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

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
      // Além do segredo, confirma no próprio BTG que a cobrança foi paga.
      const pagoNoBtg =
        (status === "PAID" || String(eventType).includes(".paid")) &&
        !!txId &&
        (await cobrancaPagaNoBtg(String(txId)));

      if (!pagoNoBtg) {
        console.warn("[pix webhook] pagamento não confirmado no BTG; nada ativado.", txId);
      } else {
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
