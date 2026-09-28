/**
 * Cliente da API Asaas (recarga de celular e pagamento de contas).
 * Só importe em rotas de API (servidor): a chave ASAAS_API_KEY nunca vai para o navegador.
 */

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

// Sandbox: https://api-sandbox.asaas.com/v3 | Produção: https://api.asaas.com/v3
const BASE_URL = envStr("ASAAS_BASE_URL") || "https://api-sandbox.asaas.com/v3";

export class AsaasError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function asaasFetch<T>(
  method: "GET" | "POST",
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const apiKey = envStr("ASAAS_API_KEY");
  if (!apiKey) throw new AsaasError("ASAAS_API_KEY não configurada", 500);

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      access_token: apiKey,
      "Content-Type": "application/json",
      "User-Agent": "maylon-connect",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    // Asaas devolve { errors: [{ code, description }] }
    const message =
      data?.errors?.map((e: any) => e?.description).filter(Boolean).join(" ") ||
      `Erro Asaas (${res.status})`;
    throw new AsaasError(message, res.status);
  }
  return data as T;
}

/* ---------- Recarga de celular ---------- */

export type AsaasValorRecarga = {
  name: string;
  minValue: number;
  maxValue: number;
  bonus?: string;
  description?: string;
};

export type AsaasOperadora = { name: string; values: AsaasValorRecarga[] };

export type AsaasRecarga = {
  id: string;
  value: number;
  phoneNumber: string;
  status: string;
  canBeCancelled?: boolean;
  operatorName?: string;
};

/** Operadora do número e os valores que ela aceita. */
export function buscarOperadora(telefone: string) {
  return asaasFetch<AsaasOperadora>(
    "GET",
    `/mobilePhoneRecharges/${encodeURIComponent(telefone)}/provider`
  );
}

export function criarRecarga(telefone: string, valor: number) {
  return asaasFetch<AsaasRecarga>("POST", "/mobilePhoneRecharges", {
    phoneNumber: telefone,
    value: valor,
  });
}

export function buscarRecarga(id: string) {
  return asaasFetch<AsaasRecarga>(
    "GET",
    `/mobilePhoneRecharges/${encodeURIComponent(id)}`
  );
}

export function cancelarRecarga(id: string) {
  return asaasFetch<AsaasRecarga>(
    "POST",
    `/mobilePhoneRecharges/${encodeURIComponent(id)}/cancel`
  );
}

/* ---------- Pagamento de contas ---------- */

export type AsaasSimulacaoConta = {
  minimumScheduleDate: string;
  fee: number;
  bankSlipInfo: {
    identificationField: string;
    value: number;
    dueDate: string | null;
    beneficiaryName: string | null;
    companyName: string | null;
    allowChangeValue: boolean;
    minValue: number | null;
    maxValue: number | null;
    isOverdue: boolean;
  };
};

export type AsaasConta = {
  id: string;
  status: string;
  value: number;
  identificationField: string;
  scheduleDate?: string;
  canBeCancelled?: boolean;
  failReasons?: string | null;
};

export function simularConta(linhaDigitavel: string) {
  return asaasFetch<AsaasSimulacaoConta>("POST", "/bill/simulate", {
    identificationField: linhaDigitavel,
  });
}

export function criarPagamentoConta(params: {
  linhaDigitavel: string;
  dataAgendamento?: string;
  descricao?: string;
  valor?: number;
}) {
  return asaasFetch<AsaasConta>("POST", "/bill", {
    identificationField: params.linhaDigitavel,
    scheduleDate: params.dataAgendamento,
    description: params.descricao,
    value: params.valor,
  });
}

export function buscarPagamentoConta(id: string) {
  return asaasFetch<AsaasConta>("GET", `/bill/${encodeURIComponent(id)}`);
}
