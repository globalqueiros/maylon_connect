import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "../../../lib/db";
import { getStripe } from "../../../lib/stripeServer";
import {
  findActiveOrPending,
  logPagamento,
  updateAssinaturaById,
} from "../../../lib/assinaturaDb";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Assinatura Stripe ausente" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET não configurado");
    return NextResponse.json(
      { error: "Webhook secret não configurado" },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Erro webhook:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const usuario_id = Number(session.metadata?.usuario_id);
        const beneficio_id = Number(session.metadata?.beneficio_id);
        const pedido = session.metadata?.pedido_codigo || null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id || null;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id || null;

        let cardBrand: string | null = null;
        let cardLast4: string | null = null;
        let paymentMethodId: string | null = null;

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const pmRef = sub.default_payment_method;
          paymentMethodId =
            typeof pmRef === "string" ? pmRef : pmRef?.id || null;
          if (paymentMethodId) {
            const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
            cardBrand = pm.card?.brand || null;
            cardLast4 = pm.card?.last4 || null;
          }
        }

        if (usuario_id && beneficio_id) {
          const row = await findActiveOrPending(usuario_id, beneficio_id);
          if (row) {
            await updateAssinaturaById(row.id, {
              ativo: 1,
              status_assinatura: "aprovado",
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: customerId,
              stripe_payment_method_id: paymentMethodId,
              card_brand: cardBrand,
              card_last4: cardLast4,
              pedido_codigo: pedido,
            });
          } else {
            await db.execute(
              `
              UPDATE usuario_beneficios
              SET ativo = 1, status_assinatura = 'aprovado',
                  stripe_subscription_id = ?, stripe_customer_id = ?
              WHERE usuario_id = ? AND beneficio_id = ?
              `,
              [subscriptionId, customerId, usuario_id, beneficio_id]
            );
          }

          await logPagamento({
            usuarioId: usuario_id,
            beneficioId: beneficio_id,
            gateway: "stripe",
            metodo: "card",
            status: "aprovado",
            amount: (session.amount_total || 0) / 100,
            externalId: session.id,
            pedidoCodigo: pedido || undefined,
            payload: { type: event.type, subscriptionId, customerId },
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof (invoice as any).subscription === "string"
            ? (invoice as any).subscription
            : (invoice as any).subscription?.id || null;

        if (subscriptionId) {
          await db.execute(
            `
            UPDATE usuario_beneficios
            SET ativo = 1, status_assinatura = 'aprovado'
            WHERE stripe_subscription_id = ?
            `,
            [subscriptionId]
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription =
          typeof invoice.parent === "object" &&
          invoice.parent &&
          "subscription_details" in invoice.parent
            ? invoice.parent.subscription_details?.subscription
            : (invoice as any).subscription;

        const subscriptionId =
          typeof subscription === "string"
            ? subscription
            : subscription?.id;

        if (subscriptionId) {
          await db.execute(
            `
            UPDATE usuario_beneficios
            SET ativo = 0, status_assinatura = 'erro'
            WHERE stripe_subscription_id = ?
            `,
            [subscriptionId]
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await db.execute(
          `
          UPDATE usuario_beneficios
          SET ativo = 0, status_assinatura = 'cancelado'
          WHERE stripe_subscription_id = ?
          `,
          [subscription.id]
        );
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
