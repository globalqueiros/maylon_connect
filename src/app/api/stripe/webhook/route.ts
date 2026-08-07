import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "../../../lib/dba";

export const dynamic = "force-dynamic";

const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY as string
);

export async function POST(req: Request) {
    const body = await req.text();

    const signature = (await headers()).get(
        "stripe-signature"
    ) as string;

    if (!signature) {
        return NextResponse.json(
            { error: "Assinatura Stripe ausente" },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err: any) {
        console.error("Erro webhook:", err.message);

        return NextResponse.json(
            { error: err.message },
            { status: 400 }
        );
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session =
                    event.data.object as Stripe.Checkout.Session;

                const usuario_id =
                    session.metadata?.usuario_id;

                const beneficio_id =
                    session.metadata?.beneficio_id;

                const subscriptionId =
                    session.subscription?.toString();

                const customerId =
                    session.customer?.toString();

                await db.execute<any>(
                    `
                    UPDATE usuario_beneficios
                    SET
                        ativo = 1,
                        status_assinatura = 'aprovado',
                        stripe_subscription_id = ?,
                        stripe_customer_id = ?
                    WHERE usuario_id = ?
                    AND beneficio_id = ?
                    `,
                    [
                        String(subscriptionId),
                        String(customerId),
                        Number(usuario_id),
                        Number(beneficio_id),
                    ]
                );

                break;
            }

            case "invoice.payment_failed": {
                const invoice =
                    event.data.object as Stripe.Invoice;

                const subscription =
                    typeof invoice.parent === "object" &&
                        invoice.parent &&
                        "subscription_details" in invoice.parent
                        ? invoice.parent.subscription_details?.subscription
                        : null;

                const subscriptionId =
                    typeof subscription === "string"
                        ? subscription
                        : subscription?.id;

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
                const subscription =
                    event.data.object as Stripe.Subscription;

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
                console.log(
                    `Evento não tratado: ${event.type}`
                );
        }

        return NextResponse.json({
            received: true,
        });
            } catch (error) {
                console.error(
                    "Erro ao processar webhook:",
                    error
                );

                return NextResponse.json(
                    { error: "Erro interno" },
                    { status: 500 }
                );
            }
}