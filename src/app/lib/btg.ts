type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

function btgBaseUrl() {
  return (
    process.env.BTG_API_BASE_URL ||
    (process.env.BTG_ENV === "production"
      ? "https://api.empresas.btgpactual.com"
      : "https://api.sandbox.empresas.btgpactual.com")
  );
}

function btgIdBaseUrl() {
  return (
    process.env.BTG_ID_BASE_URL ||
    (process.env.BTG_ENV === "production"
      ? "https://id.btgpactual.com"
      : "https://id.sandbox.btgpactual.com")
  );
}

export function getBtgCompanyId() {
  const companyId = process.env.BTG_COMPANY_ID;
  if (!companyId) throw new Error("BTG_COMPANY_ID não configurada");
  return companyId;
}

async function refreshAccessToken(): Promise<string> {
  const clientId = process.env.BTG_CLIENT_ID;
  const clientSecret = process.env.BTG_CLIENT_SECRET;
  const refreshToken = process.env.BTG_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    const staticToken = process.env.BTG_ACCESS_TOKEN || process.env.BTG_TOKEN;
    if (!staticToken) {
      throw new Error(
        "Credenciais BTG ausentes (BTG_ACCESS_TOKEN ou BTG_REFRESH_TOKEN)"
      );
    }
    return staticToken;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${btgIdBaseUrl()}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(
      data?.error_description ||
        data?.name ||
        "Falha ao renovar token BTG"
    );
  }

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 - 60_000,
  };

  return data.access_token;
}

export async function getBtgAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  if (process.env.BTG_ACCESS_TOKEN || process.env.BTG_TOKEN) {
    if (!process.env.BTG_REFRESH_TOKEN) {
      return (process.env.BTG_ACCESS_TOKEN || process.env.BTG_TOKEN)!;
    }
  }

  return refreshAccessToken();
}

export async function btgFetch<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getBtgAccessToken();
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  if (process.env.BTG_ENV !== "production" && process.env.BTG_SANDBOX_RESPONSE) {
    headers.set("x-response", process.env.BTG_SANDBOX_RESPONSE);
  }

  const res = await fetch(`${btgBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const message =
      data?.name ||
      data?.message ||
      data?.error ||
      `Erro BTG HTTP ${res.status}`;
    const err = new Error(message) as Error & { status?: number; data?: any };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export function addDaysIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function buildPixContractId(usuarioId: number, beneficioId: number) {
  const stamp = Date.now().toString(36).toUpperCase();
  return `UB${usuarioId}B${beneficioId}${stamp}`.slice(0, 35);
}

/** Jornada 2: QR de autorização mensal (sem pagamento imediato). */
export async function createPixAuthorization(params: {
  contract: string;
  debtorName: string;
  debtorTaxId: string;
  amount: number;
  description: string;
}) {
  const companyId = getBtgCompanyId();
  const branch = process.env.BTG_ACCOUNT_BRANCH;
  const number = process.env.BTG_ACCOUNT_NUMBER;

  if (!branch || !number) {
    throw new Error("BTG_ACCOUNT_BRANCH / BTG_ACCOUNT_NUMBER não configurados");
  }

  const taxId = params.debtorTaxId.replace(/\D/g, "");
  const personType = taxId.length > 11 ? "J" : "F";

  return btgFetch(
    `/${companyId}/banking/collections/automatic-pix/authorization/flow`,
    {
      method: "POST",
      body: JSON.stringify({
        initialDate: addDaysIso(3),
        account: { branch, number },
        amount: params.amount,
        retryPolicy: "ACCEPT_3R_7D",
        period: "MONTHLY",
        link: {
          contract: params.contract,
          description: params.description.slice(0, 35),
          debtor: {
            taxId,
            name: params.debtorName,
            personType,
          },
        },
      }),
    }
  );
}

/** Cobrança Pix dinâmica da primeira mensalidade. */
export async function createPixInstantCollection(params: {
  amount: number;
  displayText: string;
  payerName?: string;
  payerTaxId?: string;
  tags?: Record<string, string>;
  expiresIn?: number;
}) {
  const companyId = getBtgCompanyId();
  const pixKey = process.env.BTG_PIX_KEY;
  if (!pixKey) throw new Error("BTG_PIX_KEY não configurada");

  return btgFetch(
    `/v1/companies/${companyId}/pix-cash-in/instant-collections`,
    {
      method: "POST",
      body: JSON.stringify({
        pixKey,
        expiresIn: params.expiresIn ?? 3600,
        displayText: params.displayText,
        amount: {
          original: params.amount,
          allowCustomerChangeValue: false,
        },
        payer:
          params.payerName && params.payerTaxId
            ? {
                name: params.payerName,
                taxId: params.payerTaxId.replace(/\D/g, ""),
              }
            : undefined,
        tags: params.tags,
      }),
    }
  );
}
