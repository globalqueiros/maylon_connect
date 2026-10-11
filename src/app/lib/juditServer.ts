import { JUDIT_API_URL } from "./judit";
import type { ConsultaProcessosResult, JuditLawsuit } from "./judit";

export function cleanSecret(value?: string): string {
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

export async function consultarProcessos(
  cpf: string
): Promise<ConsultaProcessosResult> {
  const apiKey = cleanSecret(process.env.JUDIT_API_KEY);

  if (!apiKey) {
    console.error("consultarProcessos: JUDIT_API_KEY ausente");
    return { ok: false, error: "not_configured" };
  }

  const searchKey = cpf.replace(/\D/g, "");

  if (!searchKey) {
    return { ok: false, error: "unexpected" };
  }

  try {
    const res = await fetch(`${JUDIT_API_URL}/lawsuits`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        search: {
          search_type: "cpf",
          search_key: searchKey,
        },
      }),
    });

    if (res.status === 404) {
      return { ok: true, hasLawsuits: false, total: 0, data: [] };
    }

    if (!res.ok) {
      const detail = await res.text();

      let detalheErro: unknown = detail;
      try {
        const parsed = JSON.parse(detail) as {
          error?: { data?: unknown };
        };
        if (parsed?.error?.data) detalheErro = parsed.error.data;
      } catch {
        // mantém o texto bruto
      }

      console.error(
        "consultarProcessos: erro na Judit:",
        res.status,
        detalheErro
      );
      return { ok: false, error: "request_failed" };
    }

    const json = (await res.json()) as {
      has_lawsuits?: boolean;
      lawsuit?: JuditLawsuit[];
      lawsuits?: JuditLawsuit[];
      response_data?: JuditLawsuit[];
    };

    const data = Array.isArray(json?.lawsuits)
      ? json.lawsuits
      : Array.isArray(json?.lawsuit)
        ? json.lawsuit
        : Array.isArray(json?.response_data)
          ? json.response_data
          : [];

    const hasLawsuits = data.length > 0 || Boolean(json?.has_lawsuits);

    return { ok: true, hasLawsuits, total: data.length, data };
  } catch (error) {
    console.error("consultarProcessos: falha na requisição:", error);
    return { ok: false, error: "request_failed" };
  }
}
