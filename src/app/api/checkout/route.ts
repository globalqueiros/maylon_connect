import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export async function POST(req: Request) {
  const { carrinho } = await req.json();

  const total = carrinho.reduce(
    (acc: number, item: any) =>
      acc + Number(item.preco),
    0
  );

  const paymentIntent =
    await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: "brl",
      automatic_payment_methods: {
        enabled: true,
      },
    });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  });
}