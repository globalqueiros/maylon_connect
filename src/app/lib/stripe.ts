import { loadStripe } from "@stripe/stripe-js";

const publicKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_STRIPE_KEY ||
  "";

export const stripePromise = publicKey ? loadStripe(publicKey) : null;
