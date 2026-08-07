import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "../../../lib/db";

const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY as string
);

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            usuario_id,
            beneficio_id,
            titulo,
            valor,
        } = body;

        if (
            !usuario_id ||
            !beneficio_id ||
            !titulo ||
            valor === undefined ||
            valor === null
        ) {
            return NextResponse.json(
                {
                    error: "Dados obrigatórios não enviados",
                },
                {
                    status: 400,
                }
            );
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL;

        if (!appUrl) {
            return NextResponse.json(
                {
                    error: "NEXT_PUBLIC_APP_URL não configurada",
                },
                {
                    status: 500,
                }
            );
        }

        const valorCentavos = Math.round(
            Number(String(valor).replace(",", ".")) * 100
        );

        if (isNaN(valorCentavos) || valorCentavos <= 0) {
            return NextResponse.json(
                {
                    error: "Valor inválido",
                },
                {
                    status: 400,
                }
            );
        }

        const [rows]: any = await db.execute(
            `
            SELECT *
            FROM usuario_beneficios
            WHERE usuario_id = ?
            AND beneficio_id = ?
            AND status_assinatura IN ('pendente', 'aprovado')
      `,
            [usuario_id, beneficio_id]
        );

        if (rows.length > 0) {
            return NextResponse.json(
                {
                    error: "Já existe uma assinatura para este benefício",
                },
                {
                    status: 400,
                }
            );
        }

        const session =
            await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                mode: "subscription",
                line_items: [
                    {
                        price_data: {
                            currency: "brl",

                            product_data: {
                                name: titulo,
                            },
                            recurring: {
                                interval: "month",
                            },
                            unit_amount: valorCentavos,
                        },
                        quantity: 1,
                    },
                ],
                success_url:
                    `${process.env.NEXT_PUBLIC_APP_URL}/passageiro/beneficios?success=true`,
                cancel_url:
                    `${process.env.NEXT_PUBLIC_APP_URL}/passageiro/beneficios?cancel=true`,
                metadata: {
                    usuario_id: usuario_id.toString(),
                    beneficio_id: beneficio_id.toString(),
                    metodo_pagamento: "stripe_recorrente",
                },
                subscription_data: {
                    metadata: {
                        usuario_id: usuario_id.toString(),
                        beneficio_id: beneficio_id.toString(),
                    },
                },
            });
        if (!session.url) {
            throw new Error(
                "Não foi possível gerar a URL do checkout"
            );
        }
        await db.execute(
            `
                INSERT INTO usuario_beneficios
                (
                    usuario_id,
                    beneficio_id,
                    ativo,
                    metodo_pagamento,
                    status_assinatura
                )
                VALUES (?, ?, ?, ?, ?)
                `,
            [
                usuario_id,
                beneficio_id,
                0,
                "stripe_recorrente",
                "pendente",
            ]
        );
        return NextResponse.json({
            url: session.url,
        });
            } catch (error: any) {
                console.error("ERRO STRIPE:", error);
                return NextResponse.json(
            {
                error:
                    error?.message ||
                    "Erro ao criar checkout Stripe",
            },
            {
                status: 500,
            }
        );
    }
}