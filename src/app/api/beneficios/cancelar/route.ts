import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "../../../lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { usuario_id, beneficio_id } = await req.json();

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
      AND ativo = 1
      `,
      [usuario_id, beneficio_id]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Benefício não encontrado" },
        { status: 404 }
      );
    }

    const beneficio = rows[0];

    if (beneficio.metodo_pagamento === "stripe_recorrente") {
      if (beneficio.stripe_subscription_id) {
        await stripe.subscriptions.cancel(
          beneficio.stripe_subscription_id
        );
      }
    }

    // Pix BTG: cancelamento remoto depende de endpoint de revoke da autorização
    // (mantemos status local cancelado; revoke remoto pode ser plugado com BTG_ACCESS_TOKEN)

    await db.query(
      `
      UPDATE usuario_beneficios
      SET ativo = 0, status_assinatura = 'cancelado'
      WHERE id = ?
      `,
      [beneficio.id]
    );

    return NextResponse.json({
      ativo: false,
      message: "Assinatura cancelada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);

    return NextResponse.json(
      {
        error: "Erro ao cancelar assinatura",
      },
      {
        status: 500,
      }
    );
  }
}