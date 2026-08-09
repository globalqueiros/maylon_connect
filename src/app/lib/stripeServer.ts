import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY não configurada");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function toCentavos(valor: string | number) {
  const n = Math.round(Number(String(valor).replace(",", ".")) * 100);
  if (Number.isNaN(n) || n <= 0) {
    throw new Error("Valor inválido");
  }
  return n;
}

export function formatBRL(valor: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(String(valor).replace(",", ".")));
}

export function makePedidoCodigo(prefix = "ML") {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${y}${m}${d}${rand}`;
}
