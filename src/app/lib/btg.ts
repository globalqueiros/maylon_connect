type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

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
  return process.env.BTG_COMPANY_ID || process.env.BTG_SECRET || "";
}

export function getBtgConfig() {
  const companyId = getBtgCompanyId();
  const accountNumber = process.env.BTG_ACCOUNT_NUMBER || "";
  const accountBranch = process.env.BTG_ACCOUNT_BRANCH || "1";
  const pixKey = process.env.BTG_PIX_KEY || "";

  return {
    companyId,
    accountNumber,
    accountBranch,
    pixKey,
    clientId: process.env.BTG_CLIENT_ID || "",
    clientSecret: process.env.BTG_CLIENT_SECRET || "",
  };
}

export function assertBtgReady() {
  const cfg = getBtgConfig();
  const missing: string[] = [];
  if (!cfg.clientId && !process.env.BTG_ACCESS_TOKEN) missing.push("BTG_CLIENT_ID or BTG_ACCESS_TOKEN");
  if (!cfg.clientSecret && !process.env.BTG_ACCESS_TOKEN) missing.push("BTG_CLIENT_SECRET");
  if (!cfg.companyId) missing.push("BTG_COMPANY_ID");
  if (!cfg.accountNumber) missing.push("BTG_ACCOUNT_NUMBER");
  if (!cfg.pixKey) missing.push("BTG_PIX_KEY");
  if (missing.length) {
    throw new Error(
      `Configuração BTG incompleta. Informe: ${missing.join(", ")}`
    );
  }
  return cfg;
}

export async function getBtgAccessToken(): Promise<string> {
  if (process.env.BTG_ACCESS_TOKEN) {
    return process.env.BTG_ACCESS_TOKEN;
  }

  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }

  const clientId = process.env.BTG_CLIENT_ID;
  const clientSecret = process.env.BTG_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("BTG_CLIENT_ID / BTG_CLIENT_SECRET não configurados");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const scope =
    process.env.BTG_SCOPE ||
    "brn:btg:empresas:banking:collections openid empresas.btgpactual.com/pix-cash-in";

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope,
  });

  // Prefer refresh_token flow when available (Banking APIs require Authorization Code)
  if (process.env.BTG_REFRESH_TOKEN) {
    body.set("grant_type", "refresh_token");
    body.set("refresh_token", process.env.BTG_REFRESH_TOKEN);
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

/** Stable-ish contract id for Pix Automático (max 35 chars). */
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
  const initialDate = ymd(addDays(new Date(), 32)); // first auto debit next cycle

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
  return btgFetch(
    `/v1/companies/${cfg.companyId}/pix-cash-in/instant-collections/${txId}`,
    { method: "GET" }
  );
}
