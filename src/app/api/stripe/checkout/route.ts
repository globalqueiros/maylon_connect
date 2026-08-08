import { NextResponse } from "next/server";
import {
  findActiveOrPending,
  getBeneficio,
  getUsuario,
  upsertPendingAssinatura,
  updateAssinaturaById,
} from "../../../lib/assinaturas";
import { getStripe, toCentavos } from "../../../lib/stripe-server";

function extractClientSecret(subscription: any): string | null {
  const invoice = subscription.latest_invoice;
  if (!invoice || typeof invoice === "string") return null;

  const pi = invoice.payment_intent;
  if (pi && typeof pi === "object" && pi.client_secret) {
    return pi.client_secret as string;
  }

  const confirmation = invoice.confirmation_secret;
  if (confirmation?.client_secret) {
    return confirmation.client_secret as string;
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { usuario_id, beneficio_id, titulo, valor } = body;

    if (
      !usuario_id ||
      !beneficio_id ||
      !titulo ||
      valor === undefined ||
      valor === null
    ) {
      return NextResponse.json(
        { error: "Dados obrigatórios não enviados" },
        { status: 400 }
      );
    }

    const usuario = await getUsuario(Number(usuario_id));
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const beneficio = await getBeneficio(Number(beneficio_id));
    if (!beneficio) {
      return NextResponse.json(
        { error: "Benefício não encontrado" },
        { status: 404 }
      );
    }

    const existing = await findActiveOrPending(
      Number(usuario_id),
      Number(beneficio_id)
    );

    if (existing?.status_assinatura === "aprovado") {
      return NextResponse.json(
        { error: "Já existe uma assinatura para este benefício" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const valorCentavos = toCentavos(valor ?? beneficio.valor);

    let customerId = existing?.stripe_customer_id as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: usuario.email || undefined,
        name: usuario.full_name || undefined,
        metadata: {
          usuario_id: String(usuario_id),
        },
      });
      customerId = customer.id;
    }

    const productName = String(titulo || beneficio.titulo);
    const product = await stripe.products.create({
      name: productName,
      metadata: {
        beneficio_id: String(beneficio_id),
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: valorCentavos,
            recurring: { interval: "month" },
            product: product.id,
          },
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
        payment_method_types: ["card"],
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        usuario_id: String(usuario_id),
        beneficio_id: String(beneficio_id),
        metodo_pagamento: "stripe_recorrente",
      },
    });

    let clientSecret = extractClientSecret(subscription);

    if (!clientSecret && subscription.latest_invoice) {
      const invoiceId =
        typeof subscription.latest_invoice === "string"
          ? subscription.latest_invoice
          : subscription.latest_invoice.id;

      const invoice = await stripe.invoices.retrieve(invoiceId, {
        expand: ["payment_intent"],
      });
      clientSecret = extractClientSecret({ latest_invoice: invoice });
    }

    if (!clientSecret) {
      await stripe.subscriptions.cancel(subscription.id);
      return NextResponse.json(
        { error: "Não foi possível iniciar o pagamento do cartão" },
        { status: 500 }
      );
    }

    const assinaturaId = await upsertPendingAssinatura({
      usuarioId: Number(usuario_id),
      beneficioId: Number(beneficio_id),
      metodo: "stripe_recorrente",
      status: "pendente",
      extras: {
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
      },
    });

    await updateAssinaturaById(assinaturaId, {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
    });

    return NextResponse.json({
      clientSecret,
      subscriptionId: subscription.id,
      customerId,
      assinaturaId,
      valor: Number(valor ?? beneficio.valor),
      titulo: titulo || beneficio.titulo,
    });
  } catch (error: any) {
    console.error("ERRO STRIPE:", error);
    return NextResponse.json(
      {
        error: error?.message || "Erro ao criar checkout Stripe",
      },
      { status: 500 }
    );
  }
}
