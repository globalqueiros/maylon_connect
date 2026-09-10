import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import {
  getAppUrl,
  getStripe,
  makePedidoCodigo,
  toCentavos,
} from "../../../lib/stripeServer";
import {
  ensurePaymentColumns,
  findActiveOrPending,
  logPagamento,
  upsertPendente,
} from "../../../lib/assinaturaDb";
import {
  getSessionUserId,
  pickBeneficioId,
  readJsonBody,
  toPositiveInt,
} from "../../../lib/session";

export const dynamic = "force-dynamic";

/**
 * Creates an Embedded Checkout Session so the card form stays inside the portal
 * (no redirect to checkout.stripe.com).
 */
export async function POST(req: Request) {
  try {
    await ensurePaymentColumns();
    const body = await readJsonBody(req);
    const url = new URL(req.url);

    const usuario_id = await getSessionUserId(
      body.usuario_id ??
        body.usuarioId ??
        body.user_id ??
        url.searchParams.get("usuario_id"),
      req
    );

    const beneficioId =
      pickBeneficioId(body) ??
      toPositiveInt(url.searchParams.get("beneficio_id"));

    if (!usuario_id || !beneficioId) {
      return NextResponse.json(
        {
          error: "Dados obrigatórios não enviados",
          details: {
            usuario_id: usuario_id ?? null,
            beneficio_id: beneficioId ?? null,
            received_keys: Object.keys(body),
          },
        },
        { status: 400 }
      );
    }

    const [beneficioRows]: any = await db.query(
      `SELECT id, titulo, valor, status FROM beneficios WHERE id = ? LIMIT 1`,
      [beneficioId]
    );
    const beneficio = beneficioRows?.[0];
    if (!beneficio || Number(beneficio.status) !== 1) {
      return NextResponse.json(
        { error: "Benefício não encontrado" },
        { status: 404 }
      );
    }

    const beneficioTitulo = String(
      body.titulo || beneficio.titulo || "Assinatura Maylon"
    ).trim();

    const appUrl = getAppUrl();
    const stripe = getStripe();
    const valorCentavos = toCentavos(body.valor ?? beneficio.valor);
    const valorNumber = valorCentavos / 100;

    if (!valorCentavos || valorCentavos <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    const existing = await findActiveOrPending(usuario_id, beneficioId);
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
    if (!user?.email) {
      return NextResponse.json(
        { error: "Usuário sem e-mail cadastrado" },
        { status: 400 }
      );
    }

    const pedidoCodigo = makePedidoCodigo("MLS");

    let customerId: string | undefined;
    if (existing?.stripe_customer_id) {
      customerId = existing.stripe_customer_id;
    } else {
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
      ui_mode: "embedded_page",
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: beneficioTitulo },
            recurring: { interval: "month" },
            unit_amount: valorCentavos,
          },
          quantity: 1,
        },
      ],
      return_url: `${appUrl}/passageiro/beneficios/pagamento/sucesso?method=card&session_id={CHECKOUT_SESSION_ID}&pedido=${encodeURIComponent(pedidoCodigo)}`,
      client_reference_id: String(usuario_id),
      metadata: {
        usuario_id: String(usuario_id),
        beneficio_id: String(beneficioId),
        metodo_pagamento: "stripe_recorrente",
        pedido_codigo: pedidoCodigo,
      },
      subscription_data: {
        metadata: {
          usuario_id: String(usuario_id),
          beneficio_id: String(beneficioId),
          pedido_codigo: pedidoCodigo,
        },
      },
    });

    if (!session.client_secret) {
      throw new Error(
        "Stripe não retornou client_secret do Embedded Checkout"
      );
    }

    const assinaturaId = await upsertPendente({
      usuarioId: usuario_id,
      beneficioId,
      metodo: "stripe_recorrente",
      pedidoCodigo,
      valor: valorNumber,
      extra: {
        stripe_customer_id: customerId || null,
      },
    });

    await logPagamento({
      usuarioId: usuario_id,
      beneficioId,
      usuarioBeneficioId: assinaturaId,
      gateway: "stripe",
      metodo: "card",
      status: "embedded_checkout_created",
      amount: valorNumber,
      externalId: session.id,
      pedidoCodigo,
      payload: { sessionId: session.id, ui_mode: "embedded" },
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
      session_id: session.id,
      pedido_codigo: pedidoCodigo,
      assinatura_id: assinaturaId,
      inline: true,
      embedded: true,
    });
  } catch (error: any) {
    console.error("ERRO STRIPE:", error);
    const raw = String(error?.message || "");
    let message = raw || "Erro ao criar pagamento Stripe";
    if (
      /connection|ECONN|ENOTFOUND|ETIMEDOUT|retried|network|fetch failed/i.test(
        raw
      )
    ) {
      message =
        "Falha de conexão com a Stripe. Verifique internet/DNS e se STRIPE_SECRET_KEY (test/live) está correta no .env.";
    }
    return NextResponse.json(
      { error: message },
      { status: error?.status || 500 }
    );
  }
}
