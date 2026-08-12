import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { getStripe } from "../../../lib/stripeServer";
import {
  getSessionUserId,
  readJsonBody,
  toPositiveInt,
} from "../../../lib/session";
import { logPagamento, updateAssinaturaById } from "../../../lib/assinaturaDb";

export const dynamic = "force-dynamic";

async function refundStripeSubscription(subscriptionId: string) {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice.payment_intent", "latest_invoice.charge"],
  });

  // Cancel first so no new renewals charge the client
  let canceledSub = subscription;
  if (subscription.status !== "canceled") {
    canceledSub = await stripe.subscriptions.cancel(subscriptionId, {
      invoice_now: false,
      prorate: true,
    });
  }

  let refundId: string | null = null;
  let refundAmount: number | null = null;
  let refundStatus: string | null = null;

  try {
    let invoice: any = canceledSub.latest_invoice;
    if (typeof invoice === "string") {
      invoice = await stripe.invoices.retrieve(invoice, {
        expand: ["payment_intent", "charge"],
      });
    }

    const paymentIntentId =
      typeof invoice?.payment_intent === "string"
        ? invoice.payment_intent
        : invoice?.payment_intent?.id;

    const chargeId =
      typeof invoice?.charge === "string"
        ? invoice.charge
        : invoice?.charge?.id;

    if (paymentIntentId) {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: "requested_by_customer",
      });
      refundId = refund.id;
      refundAmount = refund.amount;
      refundStatus = refund.status;
    } else if (chargeId) {
      const refund = await stripe.refunds.create({
        charge: chargeId,
        reason: "requested_by_customer",
      });
      refundId = refund.id;
      refundAmount = refund.amount;
      refundStatus = refund.status;
    } else {
      // Fallback: latest paid charge for this customer
      const customerId =
        typeof canceledSub.customer === "string"
          ? canceledSub.customer
          : canceledSub.customer?.id;
      if (customerId) {
        const charges = await stripe.charges.list({
          customer: customerId,
          limit: 5,
        });
        const paid = charges.data.find((c) => c.paid && !c.refunded);
        if (paid) {
          const refund = await stripe.refunds.create({
            charge: paid.id,
            reason: "requested_by_customer",
          });
          refundId = refund.id;
          refundAmount = refund.amount;
          refundStatus = refund.status;
        }
      }
    }
  } catch (refundError: any) {
    console.warn("Stripe refund warning:", refundError?.message || refundError);
  }

  return {
    subscriptionStatus: canceledSub.status,
    refundId,
    refundAmount,
    refundStatus,
  };
}

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    const usuario_id = await getSessionUserId(
      body.usuario_id ?? body.usuarioId ?? body.user_id,
      req
    );
    const beneficio_id =
      toPositiveInt(body.beneficio_id) ?? toPositiveInt(body.beneficioId);

    if (!usuario_id || !beneficio_id) {
      return NextResponse.json(
        { error: "Dados obrigatórios não enviados" },
        { status: 400 }
      );
    }

    const [rows]: any = await db.query(
      `
      SELECT * FROM usuario_beneficios
      WHERE usuario_id = ?
        AND beneficio_id = ?
        AND (
          ativo = 1
          OR status_assinatura IN ('aprovado', 'autorizado', 'pendente')
        )
      ORDER BY id DESC
      `,
      [usuario_id, beneficio_id]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Benefício ativo não encontrado" },
        { status: 404 }
      );
    }

    // Prefer Stripe/active row for refund messaging; cancel every open row
    // so leftover PIX "pendente" cannot keep the benefit visible twice.
    const beneficio =
      rows.find(
        (r: any) =>
          r.ativo === 1 ||
          String(r.metodo_pagamento || "").includes("stripe") ||
          r.stripe_subscription_id
      ) || rows[0];

    let refundInfo: {
      subscriptionStatus?: string;
      refundId: string | null;
      refundAmount: number | null;
      refundStatus: string | null;
    } = {
      refundId: null,
      refundAmount: null,
      refundStatus: null,
    };

    const metodo = String(beneficio.metodo_pagamento || "");
    const stripeIds = new Set<string>();
    for (const row of rows) {
      const sid = row.stripe_subscription_id;
      if (sid) stripeIds.add(String(sid));
    }

    for (const subscriptionId of stripeIds) {
      refundInfo = await refundStripeSubscription(subscriptionId);
    }

    for (const row of rows) {
      await updateAssinaturaById(Number(row.id), {
        ativo: 0,
        status_assinatura: "cancelado",
        pix_etapa: null,
        pix_stage: null,
      });
    }

    await logPagamento({
      usuarioId: usuario_id,
      beneficioId: beneficio_id,
      usuarioBeneficioId: Number(beneficio.id),
      gateway: metodo.includes("pix") ? "btg" : "stripe",
      metodo: metodo.includes("pix") ? "pix" : "card",
      status: refundInfo.refundId ? "cancelado_com_reembolso" : "cancelado",
      amount:
        refundInfo.refundAmount != null
          ? refundInfo.refundAmount / 100
          : beneficio.valor_cobrado != null
            ? Number(beneficio.valor_cobrado)
            : undefined,
      externalId: refundInfo.refundId || beneficio.stripe_subscription_id,
      pedidoCodigo: beneficio.pedido_codigo || undefined,
      payload: refundInfo,
    });

    const reembolsoMsg = refundInfo.refundId
      ? ` Reembolso iniciado (${refundInfo.refundStatus || "pending"}). O valor volta para o cartão em alguns dias úteis.`
      : metodo.includes("pix")
        ? " Assinatura cancelada. Para PIX, o estorno depende do banco/BTG — nossa equipe pode concluir o reembolso manualmente."
        : " Assinatura cancelada. Se houver cobrança recente, o reembolso pode levar alguns dias úteis.";

    return NextResponse.json({
      ativo: false,
      cancelado: true,
      reembolso: Boolean(refundInfo.refundId),
      refund_id: refundInfo.refundId,
      refund_status: refundInfo.refundStatus,
      message: `Serviço cancelado com sucesso.${reembolsoMsg}`,
    });
  } catch (error: any) {
    console.error("Erro ao cancelar assinatura:", error);
    return NextResponse.json(
      {
        error: error?.message || "Erro ao cancelar assinatura",
      },
      { status: error?.status || 500 }
    );
  }
}
