/**
 * Cliente da API RVHub (recarga de celular e pagamento de contas).
 * Só importe em rotas de API (servidor): client_id/client_secret nunca vão
 * para o navegador.
 *
 * Fluxo de auth: Basic base64(client_id:client_secret) em /oauth2/token,
 * devolve um JWT usado como Authorization: Bearer <token>.
 *
 * Valores monetários: a RVHub trabalha em CENTAVOS (int). Aqui sempre
 * convertemos para reais na saída (reais()) e para centavos na entrada
 * (centavos()).
 */

import { randomUUID } from "node:crypto";

function envStr(key: string): string | undefined {
  const value = process.env[key];
  if (value == null) return undefined;
  const cleaned = value.replace(/\r/g, "").trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    return cleaned.slice(1, -1);
  }
  return cleaned || undefined;
}

function rvEnv(): "sandbox" | "production" {
  const env = (envStr("RVHUB_ENV") || "sandbox").toLowerCase();
  return env === "production" || env === "prod" ? "production" : "sandbox";
}

// Sandbox: api.sbx.rvhub.com.br | Produção: api.rvhub.com.br
const BASE_URL =
  envStr("RVHUB_API_URL") ||
  (rvEnv() === "production"
    ? "https://api.rvhub.com.br"
    : "https://api.sbx.rvhub.com.br");

const AUTH_URL =
  envStr("RVHUB_AUTH_URL") ||
  (rvEnv() === "production"
    ? "https://auth.rvhub.com.br"
    : "https://auth.sbx.rvhub.com.br");

/** Reais -> centavos (int), como a RVHub espera. */
export function centavos(valor: number): number {
  return Math.round(valor * 100);
}

/** Centavos (int) -> reais. */
export function reais(valor: number | null | undefined): number {
  return Number(valor ?? 0) / 100;
}

export class RvhubError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "RvhubError";
  }
}

/**
 * A RVHub pode ter executado mesmo com erro: sem resposta (rede) ou 5xx.
 * Nesses casos a operação fica como VERIFICAR.
 */
export function resultadoIncerto(error: unknown): boolean {
  return !(error instanceof RvhubError) || error.status >= 500;
}

type TokenCache = { accessToken: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  const staticToken = envStr("RVHUB_ACCESS_TOKEN");
  if (staticToken) return staticToken;

  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }

  const clientId = envStr("RVHUB_CLIENT_ID");
  const clientSecret = envStr("RVHUB_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new RvhubError(
      "RVHUB_CLIENT_ID / RVHUB_CLIENT_SECRET não configurados",
      500
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(
    `${AUTH_URL}/oauth2/token?grant_type=client_credentials`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      cache: "no-store",
    }
  );

  const text = await res.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok || !data?.access_token) {
    throw new RvhubError(
      String(
        data?.message ||
          data?.error_description ||
          data?.error ||
          `Falha ao obter token RVHub (${res.status})`
      ),
      res.status || 500
    );
  }

  tokenCache = {
    accessToken: String(data.access_token),
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  };

  return tokenCache.accessToken;
}

async function rvFetch<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  options?: { body?: Record<string, unknown>; idempotencyKey?: string }
): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (options?.idempotencyKey) {
    headers["X-Idempotency-Key"] = options.idempotencyKey;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    // RVHub devolve { status, code, message, see }
    const message = String(
      data?.message || data?.error_description || `Erro RVHub (${res.status})`
    );
    throw new RvhubError(
      message,
      res.status,
      data?.code ? String(data.code) : undefined
    );
  }

  return data as T;
}

/* ---------- Portfólio ---------- */

export type RvhubProduto = {
  provider: string;
  kind: string;
  product_id: string;
  name: string;
  amount?: number;
  expires_in?: number;
  minimum_amount?: number;
  maximum_amount?: number;
  incremental_rate?: number;
  fixed_amount?: boolean;
  area_codes?: string[];
};

export type RvhubProvider = {
  provider: string;
  kind: string;
  links?: Array<{ rel: string; href: string; type: string }>;
};

export function listarProviders() {
  return rvFetch<RvhubProvider[]>("GET", "/portfolio/providers");
}

export function listarProdutos(params: {
  kind?: string;
  areaCode?: string;
  provider?: string;
}) {
  const qs = new URLSearchParams();
  qs.set("kinds", params.kind || "cellphone");
  if (params.areaCode) qs.set("area_code", params.areaCode);
  if (params.provider) qs.set("provider", params.provider);
  return rvFetch<RvhubProduto[]>("GET", `/portfolio?${qs.toString()}`);
}

/* ---------- Recarga de celular ---------- */

export type RvhubLink = { href: string; rel: string; type: string };

export type RvhubRecarga = {
  id: string;
  product_id?: string;
  area_code?: string;
  cell_phone_number?: string;
  status: string;
  status_reason?: string;
  created_at?: string;
  updated_at?: string;
  nsu?: string;
  authorization_code?: string | number;
  face_amount?: number;
  due_date?: string;
  message?: string;
  authorized_at?: string;
  charged_amount?: number;
  links?: RvhubLink[];
};

export function solicitarRecarga(params: {
  productId: string;
  areaCode: string;
  cellPhoneNumber: string;
  amount?: number;
  idempotencyKey?: string;
}) {
  const body: Record<string, unknown> = {
    product_id: params.productId,
    area_code: params.areaCode,
    cell_phone_number: params.cellPhoneNumber,
  };
  if (params.amount != null) body.amount = params.amount;
  const affiliation = envStr("RVHUB_AFFILIATION_KEY");
  if (affiliation) body.affiliation_key = affiliation;

  return rvFetch<RvhubRecarga>("POST", "/cellphone-topups/transactions", {
    body,
    idempotencyKey: params.idempotencyKey || randomUUID(),
  });
}

export function confirmarRecarga(id: string) {
  return rvFetch<RvhubRecarga>(
    "POST",
    `/cellphone-topups/transactions/${encodeURIComponent(id)}/capture`
  );
}

export function consultarRecarga(id: string) {
  return rvFetch<RvhubRecarga>(
    "GET",
    `/cellphone-topups/transactions/${encodeURIComponent(id)}`
  );
}

export function estornarRecarga(id: string) {
  return rvFetch<RvhubRecarga>(
    "DELETE",
    `/cellphone-topups/transactions/${encodeURIComponent(id)}`
  );
}

/* ---------- Recarga de PIN (gift cards) ---------- */

export type RvhubPin = {
  id: string;
  product_id?: string;
  status: string;
  status_reason?: string;
  created_at?: string;
  updated_at?: string;
  authorization_code?: string | number;
  face_amount?: number;
  due_date?: string;
  authorized_at?: string;
  /** Código do PIN que o cliente usa para resgatar os créditos. */
  pin?: string;
  lot?: string;
  serial_number?: string;
  charged_amount?: number;
  affiliation_key?: string;
  message?: string;
  links?: RvhubLink[];
};

/**
 * Solicita uma recarga de PIN (gift card). `amount` só é usado em produtos
 * de valor variável; nos fixos o valor vem do próprio product_id.
 */
export function solicitarPin(params: {
  productId: string;
  amount?: number;
  idempotencyKey?: string;
}) {
  const body: Record<string, unknown> = {
    product_id: params.productId,
  };
  if (params.amount != null) body.amount = params.amount;
  const affiliation = envStr("RVHUB_AFFILIATION_KEY");
  if (affiliation) body.affiliation_key = affiliation;

  return rvFetch<RvhubPin>("POST", "/pin-topups/transactions", {
    body,
    idempotencyKey: params.idempotencyKey || randomUUID(),
  });
}

export function confirmarPin(id: string) {
  return rvFetch<RvhubPin>(
    "POST",
    `/pin-topups/transactions/${encodeURIComponent(id)}/capture`
  );
}

export function consultarPin(id: string) {
  return rvFetch<RvhubPin>(
    "GET",
    `/pin-topups/transactions/${encodeURIComponent(id)}`
  );
}

export function estornarPin(id: string) {
  return rvFetch<RvhubPin>(
    "DELETE",
    `/pin-topups/transactions/${encodeURIComponent(id)}`
  );
}

/* ---------- Pagamento de contas ---------- */

export type RvhubConta = {
  id: string;
  barcode?: string;
  digitable_line?: string;
  status: string;
  status_reason?: string;
  amount?: number;
  total_amount?: number;
  paid_amount?: number;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
  payee_document?: string;
  payer_document?: string;
  payee_name?: string;
  payee_company_name?: string;
  payer_name?: string;
  bill_type?: string;
  duplicate_payment_allowed?: boolean;
  partial_payment?: boolean;
  total_amount_can_be_changed?: boolean;
  min_amount?: number;
  max_amount?: number;
  payment_limit_date?: string;
  other_info?: unknown;
  statuses?: Array<{ status: string; created_at: string }>;
  links?: RvhubLink[];
};

export function solicitarPagamentoConta(params: {
  barcode?: string;
  digitableLine?: string;
  idempotencyKey?: string;
}) {
  const body: Record<string, unknown> = {};
  if (params.barcode) body.barcode = params.barcode;
  if (params.digitableLine) body.digitable_line = params.digitableLine;

  return rvFetch<RvhubConta>("POST", "/bills/payments", {
    body,
    idempotencyKey: params.idempotencyKey || randomUUID(),
  });
}

export function aprovarPagamentoConta(params: {
  id: string;
  paidAmount: number;
  payerName: string;
  payerDocument: string;
}) {
  return rvFetch<RvhubConta>(
    "POST",
    `/bills/payments/${encodeURIComponent(params.id)}/capture`,
    {
      body: {
        paid_amount: params.paidAmount,
        payer: {
          name: params.payerName,
          document: params.payerDocument.replace(/\D/g, ""),
        },
      },
    }
  );
}

export function consultarPagamentoConta(id: string) {
  return rvFetch<RvhubConta>(
    "GET",
    `/bills/payments/${encodeURIComponent(id)}`
  );
}

export function desfazerPagamentoConta(id: string) {
  return rvFetch<RvhubConta>(
    "DELETE",
    `/bills/payments/${encodeURIComponent(id)}`
  );
}

/** true quando o bill_type é de tributo (fora do escopo atual). */
export function isTributo(billType?: string | null): boolean {
  const t = String(billType || "").toLowerCase();
  return (
    t.includes("tributo") ||
    t.includes("darf") ||
    t.includes("das") ||
    t.includes("fgts") ||
    t.includes("damsp") ||
    t.includes("tax")
  );
}
