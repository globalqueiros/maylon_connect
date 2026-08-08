import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY não configurada");
    }
    stripe = new Stripe(key);
  }
  return stripe;
}

export function toCentavos(valor: string | number): number {
  const n = Math.round(Number(String(valor).replace(",", ".")) * 100);
  if (Number.isNaN(n) || n <= 0) {
    throw new Error("Valor inválido");
  }
  return n;
}
