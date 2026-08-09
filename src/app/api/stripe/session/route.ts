import { NextResponse } from "next/server";
import { getStripe, formatBRL } from "../../../lib/stripeServer";
import { db } from "../../../lib/db";
import { findActiveOrPending, updateAssinaturaById } from "../../../lib/assinaturaDb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id obrigatório" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer", "payment_intent"],
    });

    const usuarioId = Number(session.metadata?.usuario_id || 0);
    const beneficioId = Number(session.metadata?.beneficio_id || 0);
    const pedido =
      session.metadata?.pedido_codigo ||
      searchParams.get("pedido") ||
      session.id;

    let customerName = "";
    let customerEmail = "";
    if (typeof session.customer === "object" && session.customer) {
      customerName = (session.customer as any).name || "";
      customerEmail = (session.customer as any).email || "";
    }

    if (usuarioId) {
      const [rows]: any = await db.query(
        `SELECT full_name, email FROM users WHERE id = ? LIMIT 1`,
        [usuarioId]
      );
      if (rows?.[0]) {
        customerName = customerName || rows[0].full_name || "";
        customerEmail = customerEmail || rows[0].email || "";
      }
    }

    let cardBrand = "";
    let cardLast4 = "";
    const subscription =
      typeof session.subscription === "object" ? session.subscription : null;

    if (subscription?.default_payment_method) {
      const pmId =
        typeof subscription.default_payment_method === "string"
          ? subscription.default_payment_method
          : subscription.default_payment_method.id;
      const pm = await stripe.paymentMethods.retrieve(pmId);
      cardBrand = pm.card?.brand || "";
      cardLast4 = pm.card?.last4 || "";
    }

    const amountTotal = (session.amount_total || 0) / 100;
    const paid =
      session.payment_status === "paid" ||
      session.status === "complete";

    if (paid && usuarioId && beneficioId) {
      const row = await findActiveOrPending(usuarioId, beneficioId);
      if (row) {
        await updateAssinaturaById(row.id, {
          ativo: 1,
          status_assinatura: "aprovado",
          stripe_subscription_id:
            subscription?.id ||
            (typeof session.subscription === "string"
              ? session.subscription
              : null),
          stripe_customer_id:
            typeof session.customer === "string"
              ? session.customer
              : (session.customer as any)?.id || null,
          stripe_payment_method_id:
            subscription &&
            typeof subscription.default_payment_method === "string"
              ? subscription.default_payment_method
              : (subscription?.default_payment_method as any)?.id || null,
          card_brand: cardBrand || null,
          card_last4: cardLast4 || null,
          pedido_codigo: pedido,
        });
      }
    }

    return NextResponse.json({
      paid,
      status: session.status,
      payment_status: session.payment_status,
      pedido,
      amount: amountTotal,
      amount_formatted: formatBRL(amountTotal),
      method: "card",
      customer: {
        name: customerName,
        email: customerEmail,
      },
      card: {
        brand: cardBrand,
        last4: cardLast4,
      },
      date: new Date(
        (session.created || Math.floor(Date.now() / 1000)) * 1000
      ).toLocaleString("pt-BR"),
      transaction_id: session.id,
    });
  } catch (error: any) {
    console.error("Erro session Stripe:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao consultar sessão" },
      { status: 500 }
    );
  }
}
