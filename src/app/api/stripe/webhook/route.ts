import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "../../../lib/db";
import { getStripe } from "../../../lib/stripe-server";

export const dynamic = "force-dynamic";

async function approveBySubscription(
  subscriptionId: string,
  customerId?: string | null,
  metadata?: Stripe.Metadata | null
) {
  const usuario_id = metadata?.usuario_id;
  const beneficio_id = metadata?.beneficio_id;

  if (usuario_id && beneficio_id) {
    await db.execute(
      `
      UPDATE usuario_beneficios
      SET
        ativo = 1,
        status_assinatura = 'aprovado',
        stripe_subscription_id = ?,
        stripe_customer_id = COALESCE(?, stripe_customer_id)
      WHERE usuario_id = ?
        AND beneficio_id = ?
      `,
      [
        subscriptionId,
        customerId || null,
        Number(usuario_id),
        Number(beneficio_id),
      ]
    );
    return;
  }

  await db.execute(
    `
    UPDATE usuario_beneficios
    SET
      ativo = 1,
      status_assinatura = 'aprovado',
      stripe_customer_id = COALESCE(?, stripe_customer_id)
    WHERE stripe_subscription_id = ?
    `,
    [customerId || null, subscriptionId]
  );
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent as any;
  if (parent?.subscription_details?.subscription) {
    const sub = parent.subscription_details.subscription;
    return typeof sub === "string" ? sub : sub?.id || null;
  }

  const legacy = (invoice as any).subscription;
  if (!legacy) return null;
  return typeof legacy === "string" ? legacy : legacy.id;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;

  if (!signature) {
    return NextResponse.json(
      { error: "Assinatura Stripe ausente" },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("Erro webhook:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription?.toString();
        const customerId = session.customer?.toString();

        if (subscriptionId) {
          await approveBySubscription(
            subscriptionId,
            customerId,
            session.metadata
          );
        }
        break;
      }

      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = subscriptionIdFromInvoice(invoice);
        if (subscriptionId) {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          await approveBySubscription(
            subscriptionId,
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer?.id,
            subscription.metadata
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        if (
          subscription.status === "active" ||
          subscription.status === "trialing"
        ) {
          await approveBySubscription(
            subscription.id,
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer?.id,
            subscription.metadata
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = subscriptionIdFromInvoice(invoice);

        if (subscriptionId) {
          await db.execute(
            `
            UPDATE usuario_beneficios
            SET
              ativo = 0,
              status_assinatura = 'erro'
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
          SET
            ativo = 0,
            status_assinatura = 'cancelado'
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
