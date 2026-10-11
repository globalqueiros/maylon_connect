import { NextResponse } from "next/server";
import { getStripe } from "../../../lib/stripeServer";
import {
  ensurePaymentColumns,
  findByPedido,
  logPagamento,
  updateAssinaturaById,
} from "../../../lib/assinaturaDb";
import { readJsonBody, toPositiveInt } from "../../../lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await ensurePaymentColumns();
    const body = await readJsonBody(req);

    const subscriptionId = String(body.subscriptionId || body.subscription_id || "");
    const pedidoCodigo = String(body.pedido_codigo || body.pedido || "");
    const assinaturaId = toPositiveInt(body.assinaturaId ?? body.assinatura_id);

    if (!subscriptionId && !pedidoCodigo && !assinaturaId) {
      return NextResponse.json(
        { error: "subscriptionId ou pedido_codigo é obrigatório" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    let subscription = null as Awaited<
      ReturnType<typeof stripe.subscriptions.retrieve>
    > | null;

    if (subscriptionId) {
      subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["default_payment_method"],
      });
    }

    const paidStatuses = ["active", "trialing"];
    if (subscription && !paidStatuses.includes(subscription.status)) {
      // incomplete can become active right after confirmPayment — refresh once
      subscription = await stripe.subscriptions.retrieve(subscription.id, {
        expand: ["default_payment_method"],
      });
    }

    if (subscription && !paidStatuses.includes(subscription.status)) {
      return NextResponse.json(
        {
          error: "Assinatura ainda não confirmada",
          status: subscription.status,
        },
        { status: 400 }
      );
    }

    const customerId = subscription
      ? typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id || null
      : null;

    let paymentMethodId: string | null = null;
    let cardBrand: string | null = null;
    let cardLast4: string | null = null;
    const pm = subscription?.default_payment_method as any;
    if (pm && typeof pm !== "string") {
      paymentMethodId = pm.id || null;
      cardBrand = pm.card?.brand || null;
      cardLast4 = pm.card?.last4 || null;
    }

    let row =
      (pedidoCodigo && (await findByPedido(pedidoCodigo))) ||
      null;

    const targetId = assinaturaId || row?.id || null;

    if (targetId) {
      await updateAssinaturaById(targetId, {
        ativo: 1,
        status_assinatura: "aprovado",
        stripe_subscription_id: subscription?.id || null,
        stripe_customer_id: customerId,
        stripe_payment_method_id: paymentMethodId,
        card_brand: cardBrand,
        card_last4: cardLast4,
      });

      await logPagamento({
        usuarioId: Number(row?.usuario_id || 0) || Number(body.usuario_id || 0),
        beneficioId:
          Number(row?.beneficio_id || 0) || Number(body.beneficio_id || 0),
        usuarioBeneficioId: targetId,
        gateway: "stripe",
        metodo: "card",
        status: "aprovado",
        amount: row?.valor_cobrado != null ? Number(row.valor_cobrado) : undefined,
        externalId: subscription?.id,
        pedidoCodigo: pedidoCodigo || row?.pedido_codigo || undefined,
        payload: { subscriptionId: subscription?.id, status: subscription?.status },
      });
    }

    return NextResponse.json({
      ok: true,
      status: subscription?.status || "active",
      subscription_id: subscription?.id || null,
      pedido_codigo: pedidoCodigo || row?.pedido_codigo || null,
      assinatura_id: targetId,
    });
  } catch (error: any) {
    console.error("ERRO STRIPE CONFIRM:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao confirmar pagamento" },
      { status: 500 }
    );
  }
}
