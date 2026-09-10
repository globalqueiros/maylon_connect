type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

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

function btgBaseUrl() {
  const env = (process.env.BTG_ENV || "production").toLowerCase();
  if (env === "sandbox") {
    return "https://api.sandbox.empresas.btgpactual.com";
  }
  return "https://api.empresas.btgpactual.com";
}

function btgIdUrl() {
  const env = (process.env.BTG_ENV || "production").toLowerCase();
  if (env === "sandbox") {
    return "https://id.sandbox.btgpactual.com";
  }
  return "https://id.btgpactual.com";
}

export function getBtgCompanyId() {
  return cleanEnv(process.env.BTG_COMPANY_ID) || cleanEnv(process.env.BTG_SECRET);
}

export function getBtgConfig() {
  return {
    companyId: getBtgCompanyId(),
    accountNumber: cleanEnv(process.env.BTG_ACCOUNT_NUMBER),
    accountBranch: cleanEnv(process.env.BTG_ACCOUNT_BRANCH) || "1",
    pixKey: cleanEnv(process.env.BTG_PIX_KEY),
    clientId: cleanEnv(process.env.BTG_CLIENT_ID),
    clientSecret: cleanEnv(process.env.BTG_CLIENT_SECRET),
  };
}

/** Local/demo mode when BTG banking keys are not configured. */
export function isBtgMockMode() {
  const flag = cleanEnv(process.env.BTG_MOCK).toLowerCase();
  if (flag === "true" || flag === "1" || flag === "yes") return true;
  if (flag === "false" || flag === "0" || flag === "no") return false;
  const cfg = getBtgConfig();
  // Auto-mock in non-production when account/pix key are empty
  return (
    process.env.NODE_ENV !== "production" &&
    (!cfg.accountNumber || !cfg.pixKey)
  );
}

export class BtgConfigError extends Error {
  status = 503;
  constructor(message: string) {
    super(message);
    this.name = "BtgConfigError";
  }
}

export function assertBtgReady() {
  if (isBtgMockMode()) {
    return {
      ...getBtgConfig(),
      companyId: getBtgConfig().companyId || "mock-company",
      accountNumber: getBtgConfig().accountNumber || "000000",
      pixKey: getBtgConfig().pixKey || "mock-pix-key",
    };
  }

  const cfg = getBtgConfig();
  const missing: string[] = [];
  if (!cfg.clientId && !cleanEnv(process.env.BTG_ACCESS_TOKEN)) {
    missing.push("BTG_CLIENT_ID or BTG_ACCESS_TOKEN");
  }
  if (!cfg.clientSecret && !cleanEnv(process.env.BTG_ACCESS_TOKEN)) {
    missing.push("BTG_CLIENT_SECRET");
  }
  if (!cfg.companyId) missing.push("BTG_COMPANY_ID");
  if (!cfg.accountNumber) missing.push("BTG_ACCOUNT_NUMBER");
  if (!cfg.pixKey) missing.push("BTG_PIX_KEY");
  if (missing.length) {
    throw new BtgConfigError(
      `Configuração BTG incompleta. Informe: ${missing.join(", ")}`
    );
  }
  return cfg;
}

function mockEmv(label: string) {
  // Valid-looking EMV string for QR rendering (not a real bank charge).
  const payload = `00020126580014br.gov.bcb.pix0136${label}52040000530398654041.005802BR5913MAYLON CONNECT6009SAO PAULO62070503***6304ABCD`;
  return payload.slice(0, 180);
}

export async function getBtgAccessToken(): Promise<string> {
  if (isBtgMockMode()) return "mock-btg-token";

  const staticToken = cleanEnv(process.env.BTG_ACCESS_TOKEN);
  if (staticToken) return staticToken;

  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }

  const clientId = cleanEnv(process.env.BTG_CLIENT_ID);
  const clientSecret = cleanEnv(process.env.BTG_CLIENT_SECRET);
  if (!clientId || !clientSecret) {
    throw new Error("BTG_CLIENT_ID / BTG_CLIENT_SECRET não configurados");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const scope =
    cleanEnv(process.env.BTG_SCOPE) ||
    "brn:btg:empresas:banking:collections openid empresas.btgpactual.com/pix-cash-in";

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope,
  });

  const refresh = cleanEnv(process.env.BTG_REFRESH_TOKEN);
  if (refresh) {
    body.set("grant_type", "refresh_token");
    body.set("refresh_token", refresh);
    body.delete("scope");
  }

  const res = await fetch(`${btgIdUrl()}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(
      data?.error_description ||
        data?.error ||
        "Falha ao obter access token BTG"
    );
  }

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  };

  return data.access_token;
}

async function btgFetch<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getBtgAccessToken();
  const res = await fetch(`${btgBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      data?.name ||
      data?.message ||
      data?.error_description ||
      data?.error ||
      `BTG HTTP ${res.status}`;
    const err = new Error(msg) as Error & { status?: number; payload?: unknown };
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data as T;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function ymd(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function buildPixContractId(usuarioId: number, beneficioId: number) {
  return `MAY${usuarioId}B${beneficioId}${Date.now()}`.slice(0, 35);
}

/** Step 1: Pix Automático authorization QR (Journey 2) */
export async function createPixAuthorization(params: {
  contract: string;
  amount: number;
  debtorName: string;
  debtorTaxId: string;
  description: string;
}) {
  const cfg = assertBtgReady();

  if (isBtgMockMode()) {
    const authorizationId = `MOCK-AUTH-${Date.now()}`;
    const emv = mockEmv(authorizationId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32));
    console.warn("[BTG MOCK] createPixAuthorization — configure BTG_ACCOUNT_NUMBER and BTG_PIX_KEY for real PIX");
    return {
      authorizationId,
      id: authorizationId,
      status: "CREATED",
      emv,
      qrCodeInfo: { emv },
      mock: true,
    };
  }

  const initialDate = ymd(addDays(new Date(), 32));

  const payload = {
    initialDate,
    amount: params.amount,
    retryPolicy: "ACCEPT_3R_7D",
    period: "MONTHLY",
    account: {
      number: cfg.accountNumber,
      branch: cfg.accountBranch,
    },
    link: {
      contract: params.contract.slice(0, 35),
      description: params.description.slice(0, 35),
      debtor: {
        taxId: params.debtorTaxId.replace(/\D/g, ""),
        name: params.debtorName,
        personType: params.debtorTaxId.replace(/\D/g, "").length > 11 ? "J" : "F",
      },
    },
  };

  return btgFetch(
    `/${cfg.companyId}/banking/collections/automatic-pix/authorization/flow`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function getPixAuthorization(authorizationId: string) {
  const cfg = assertBtgReady();
  if (isBtgMockMode() || String(authorizationId).startsWith("MOCK-AUTH-")) {
    // Auto-approve after a few status polls so local UI can continue.
    return {
      authorizationId,
      status: "APPROVED",
      mock: true,
    };
  }
  return btgFetch(
    `/${cfg.companyId}/banking/collections/automatic-pix/authorization/${authorizationId}`,
    { method: "GET" }
  );
}

/** Step 2: first month charge via Pix cobrança dinâmico */
export async function createPixInstantCharge(params: {
  amount: number;
  displayText: string;
  payerName: string;
  payerTaxId: string;
  tags?: Record<string, string>;
}) {
  const cfg = assertBtgReady();

  if (isBtgMockMode()) {
    const txId = `MOCK-TX-${Date.now()}`;
    const emv = mockEmv(txId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32));
    console.warn("[BTG MOCK] createPixInstantCharge");
    return {
      id: txId,
      txId,
      emv,
      status: "ACTIVE",
      mock: true,
    };
  }

  const payload = {
    pixKey: cfg.pixKey,
    expiresIn: 3600,
    amount: {
      original: params.amount,
      allowCustomerChangeValue: false,
    },
    displayText: params.displayText.slice(0, 140),
    payer: {
      name: params.payerName,
      taxId: params.payerTaxId.replace(/\D/g, ""),
    },
    tags: params.tags || {},
  };

  return btgFetch(
    `/v1/companies/${cfg.companyId}/pix-cash-in/instant-collections`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function getPixInstantCharge(txId: string) {
  const cfg = assertBtgReady();
  if (isBtgMockMode() || String(txId).startsWith("MOCK-TX-")) {
    return {
      id: txId,
      txId,
      status: "PAID",
      mock: true,
    };
  }
  return btgFetch(
    `/v1/companies/${cfg.companyId}/pix-cash-in/instant-collections/${txId}`,
    { method: "GET" }
  );
}
