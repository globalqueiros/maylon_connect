/**
 * Chamadas das telas de pagamento de conta para a API RVHub.
 * Fluxo: consultarConta (mostra valor, vencimento e quem recebe) ->
 * o usuário confirma -> pagarConta.
 * Pode ser importado em componentes "use client" (não tem chave nem segredo).
 */

export type ContaConsultada = {
  linhaDigitavel: string;
  valor: number;
  vencimento: string | null;
  beneficiario: string | null;
  vencida: boolean;
  taxa: number;
};

async function postApi(url: string, body: Record<string, unknown>) {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Falha de conexão. Tente novamente.");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `Não foi possível concluir (${response.status}).`);
  }
  return data;
}

export async function consultarConta(linhaDigitavel: string): Promise<ContaConsultada> {
  const data = await postApi("/api/rvhub/contas/simular", { linhaDigitavel });
  const vencimento: string | null = data.vencimento ?? null;
  const hoje = new Date().toISOString().slice(0, 10);
  return {
    linhaDigitavel: data.linhaDigitavel ?? linhaDigitavel,
    valor: Number(data.valor),
    vencimento,
    beneficiario: data.beneficiario ?? null,
    vencida: Boolean(vencimento && vencimento.slice(0, 10) < hoje),
    taxa: 0,
  };
}

export async function pagarConta(linhaDigitavel: string): Promise<{ status: string }> {
  const data = await postApi("/api/rvhub/contas", { linhaDigitavel });
  return { status: String(data?.transacao?.status || "") };
}

/** "2026-10-05" -> "05/10/2026" */
export function formatarDataConta(value: string | null): string {
  if (!value) return "—";
  const [ano, mes, dia] = value.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : value;
}

export function formatarValorConta(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
