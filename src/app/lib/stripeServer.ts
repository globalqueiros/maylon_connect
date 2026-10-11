import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

function cleanEnv(value?: string | null) {
  if (!value) return "";
  const cleaned = value.replace(/\r/g, "").trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    return cleaned.slice(1, -1);
  }
  return cleaned;
}

export function getStripe() {
  const key = cleanEnv(process.env.STRIPE_SECRET_KEY);
  if (!key) {
    throw Object.assign(new Error("STRIPE_SECRET_KEY não configurada no .env"), {
      status: 503,
    });
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
