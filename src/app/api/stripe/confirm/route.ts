import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { getStripe } from "../../../lib/stripe-server";

export async function POST(req: Request) {
  try {
    const { subscriptionId, assinaturaId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId é obrigatório" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const paidStatuses = ["active", "trialing", "incomplete"];
    if (!paidStatuses.includes(subscription.status)) {
      return NextResponse.json(
        {
          error: "Assinatura ainda não confirmada",
          status: subscription.status,
        },
        { status: 400 }
      );
    }

    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id || null;

    if (assinaturaId) {
      await db.execute(
        `
        UPDATE usuario_beneficios
        SET
          ativo = 1,
          status_assinatura = 'aprovado',
          stripe_subscription_id = ?,
          stripe_customer_id = ?
        WHERE id = ?
        `,
        [subscription.id, customerId, Number(assinaturaId)]
      );
    } else {
      await db.execute(
        `
        UPDATE usuario_beneficios
        SET
          ativo = 1,
          status_assinatura = 'aprovado'
        WHERE stripe_subscription_id = ?
        `,
        [subscription.id]
      );
    }

    return NextResponse.json({
      ok: true,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error("ERRO STRIPE CONFIRM:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao confirmar pagamento" },
      { status: 500 }
    );
  }
}
