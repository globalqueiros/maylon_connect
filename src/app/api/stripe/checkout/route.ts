import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../../lib/db";
import {
  getAppUrl,
  getStripe,
  makePedidoCodigo,
  toCentavos,
} from "../../../lib/stripeServer";
import {
  findActiveOrPending,
  logPagamento,
  upsertPendente,
} from "../../../lib/assinaturaDb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { beneficio_id, titulo, valor, usuario_id: bodyUserId } = body;

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    let usuario_id = Number(bodyUserId);

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET!
        ) as { id: number };
        usuario_id = Number(decoded.id);
      } catch {
        // fall back to body id
      }
    }

    if (!usuario_id || !beneficio_id || !titulo || valor == null) {
      return NextResponse.json(
        { error: "Dados obrigatórios não enviados" },
        { status: 400 }
      );
    }

    const appUrl = getAppUrl();
    const stripe = getStripe();
    const valorCentavos = toCentavos(valor);
    const valorNumber = valorCentavos / 100;

    const existing = await findActiveOrPending(usuario_id, Number(beneficio_id));
    if (existing?.status_assinatura === "aprovado" && existing.ativo === 1) {
      return NextResponse.json(
        { error: "Já existe uma assinatura ativa para este benefício" },
        { status: 400 }
      );
    }

    const [userRows]: any = await db.query(
      `SELECT id, email, full_name FROM users WHERE id = ? LIMIT 1`,
      [usuario_id]
    );
    const user = userRows?.[0];

    const pedidoCodigo = makePedidoCodigo("MLS");

    let customerId: string | undefined;
    if (existing?.stripe_customer_id) {
      customerId = existing.stripe_customer_id;
    } else if (user?.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      if (customers.data[0]) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.full_name || undefined,
          metadata: { usuario_id: String(usuario_id) },
        });
        customerId = customer.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_email: customerId ? undefined : user?.email || undefined,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: String(titulo) },
            recurring: { interval: "month" },
            unit_amount: valorCentavos,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/passageiro/beneficios/pagamento/sucesso?method=card&session_id={CHECKOUT_SESSION_ID}&pedido=${pedidoCodigo}`,
      cancel_url: `${appUrl}/passageiro/beneficios/pagamento/recusado?method=card&pedido=${pedidoCodigo}&reason=canceled&valor=${encodeURIComponent(String(valorNumber))}`,
      client_reference_id: String(usuario_id),
      metadata: {
        usuario_id: String(usuario_id),
        beneficio_id: String(beneficio_id),
        metodo_pagamento: "stripe_recorrente",
        pedido_codigo: pedidoCodigo,
      },
      subscription_data: {
        metadata: {
          usuario_id: String(usuario_id),
          beneficio_id: String(beneficio_id),
          pedido_codigo: pedidoCodigo,
        },
      },
    });

    if (!session.url) {
      throw new Error("Não foi possível gerar a URL do checkout");
    }

    const assinaturaId = await upsertPendente({
      usuarioId: usuario_id,
      beneficioId: Number(beneficio_id),
      metodo: "stripe_recorrente",
      pedidoCodigo,
      valor: valorNumber,
      extra: {
        stripe_customer_id: customerId || null,
      },
    });

    await logPagamento({
      usuarioId: usuario_id,
      beneficioId: Number(beneficio_id),
      usuarioBeneficioId: assinaturaId,
      gateway: "stripe",
      metodo: "card",
      status: "checkout_created",
      amount: valorNumber,
      externalId: session.id,
      pedidoCodigo,
      payload: { sessionId: session.id },
    });

    return NextResponse.json({
      url: session.url,
      session_id: session.id,
      pedido_codigo: pedidoCodigo,
    });
  } catch (error: any) {
    console.error("ERRO STRIPE:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar checkout Stripe" },
      { status: 500 }
    );
  }
}
