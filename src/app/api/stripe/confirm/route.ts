import { NextResponse } from "next/server";
import { getStripe } from "../../../lib/stripeServer";
import {
  ensurePaymentColumns,
  findActiveOrPending,
  findByPedido,
  logPagamento,
  updateAssinaturaById,
} from "../../../lib/assinaturaDb";
import { readJsonBody } from "../../../lib/session";
import { sessaoDaRequisicao } from "../../../lib/sessaoServidor";

export const dynamic = "force-dynamic";

/**
 * Confirma no portal uma assinatura de cartão já paga na Stripe.
 * Só ativa quando: a pessoa está logada, a assinatura existe na Stripe,
 * está paga (active/trialing) e foi criada para essa mesma pessoa.
 * Antes bastava mandar um assinatura_id para ativar qualquer benefício.
 */
export async function POST(req: Request) {
  try {
    const sessao = await sessaoDaRequisicao(req);
    if (!sessao.ok) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    await ensurePaymentColumns();
    const body = await readJsonBody(req);

    const subscriptionId = String(body.subscriptionId || body.subscription_id || "").trim();
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId é obrigatório para confirmar o pagamento" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const paidStatuses = ["active", "trialing"];

    let subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["default_payment_method"],
      });
      if (!paidStatuses.includes(subscription.status)) {
        // incomplete can become active right after confirmPayment — refresh once
        subscription = await stripe.subscriptions.retrieve(subscription.id, {
          expand: ["default_payment_method"],
        });
      }
    } catch {
      return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });
    }

    // A assinatura precisa ter sido criada para quem está logado (metadata do checkout).
    const meta = subscription.metadata || {};
    if (String(meta.usuario_id ?? "").trim() !== sessao.userId) {
      return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });
    }

    if (!paidStatuses.includes(subscription.status)) {
      return NextResponse.json(
        {
          error: "Assinatura ainda não confirmada",
          status: subscription.status,
        },
        { status: 400 }
      );
    }

    const beneficioMeta = Number(meta.beneficio_id || 0);
    const pedidoCodigo = String(meta.pedido_codigo || "").trim();

    // A linha a ativar vem do que a Stripe diz (pedido/benefício), nunca do body.
    let row: any = (pedidoCodigo && (await findByPedido(pedidoCodigo))) || null;
    if (!row && beneficioMeta > 0) {
      row = await findActiveOrPending(sessao.userId, beneficioMeta);
    }

    if (
      !row ||
      String(row.usuario_id) !== sessao.userId ||
      (beneficioMeta > 0 && Number(row.beneficio_id) !== beneficioMeta)
    ) {
      return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });
    }

    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id || null;

    let paymentMethodId: string | null = null;
    let cardBrand: string | null = null;
    let cardLast4: string | null = null;
    const pm = subscription.default_payment_method as any;
    if (pm && typeof pm !== "string") {
      paymentMethodId = pm.id || null;
      cardBrand = pm.card?.brand || null;
      cardLast4 = pm.card?.last4 || null;
    }

    const targetId = Number(row.id);

    await updateAssinaturaById(targetId, {
      ativo: 1,
      status_assinatura: "aprovado",
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      stripe_payment_method_id: paymentMethodId,
      card_brand: cardBrand,
      card_last4: cardLast4,
    });

    await logPagamento({
      usuarioId: sessao.userId,
      beneficioId: Number(row.beneficio_id || 0) || beneficioMeta,
      usuarioBeneficioId: targetId,
      gateway: "stripe",
      metodo: "card",
      status: "aprovado",
      amount: row.valor_cobrado != null ? Number(row.valor_cobrado) : undefined,
      externalId: subscription.id,
      pedidoCodigo: pedidoCodigo || row.pedido_codigo || undefined,
      payload: { subscriptionId: subscription.id, status: subscription.status },
    });

    return NextResponse.json({
      ok: true,
      status: subscription.status,
      subscription_id: subscription.id,
      pedido_codigo: pedidoCodigo || row.pedido_codigo || null,
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
