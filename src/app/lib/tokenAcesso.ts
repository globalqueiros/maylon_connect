import { validarSessao } from "./sessaoServidor";

/**
 * Lê o access_token direto, sem chamar o /api/me.
 * Chamar o próprio site de dentro do servidor falha atrás da Cloudflare/AWS
 * (e com NEXT_PUBLIC_APP_URL=localhost) e mandava o usuário de volta pro login.
 * Os tokens do /api/login e do /api/me já trazem o user_type.
 * Também confere a sessão: sessão revogada ou encerrada não entra.
 */

export type TipoUsuario = "motorista" | "passageiro" | null;

export function tipoDoUsuario(value: unknown): TipoUsuario {
  const t = String(value ?? "").trim().toLowerCase();
  if (t === "driver" || t === "motorista" || t === "1") return "motorista";
  if (t === "customer" || t === "passageiro" || t === "passenger" || t === "2") {
    return "passageiro";
  }
  return null;
}

/** Devolve o tipo do usuário, ou null se o token for inválido/vencido. */
export async function verificarTokenAcesso(
  token: string | undefined | null,
  req?: Request
): Promise<{ valido: boolean; tipo: TipoUsuario; indisponivel?: boolean }> {
  const sessao = await validarSessao(token, req);
  // indisponivel: o banco falhou; não é sessão encerrada (não deslogar).
  if (!sessao.ok) return { valido: false, tipo: null, indisponivel: !!sessao.indisponivel };
  return {
    valido: true,
    tipo: tipoDoUsuario(sessao.payload.user_type ?? sessao.payload.tipo),
  };
}
