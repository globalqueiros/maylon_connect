import { jwtVerify } from "jose";

/**
 * Lê o access_token direto, sem chamar o /api/me.
 * Chamar o próprio site de dentro do servidor falha atrás da Cloudflare/AWS
 * (e com NEXT_PUBLIC_APP_URL=localhost) e mandava o usuário de volta pro login.
 * Os tokens do /api/login e do /api/me já trazem o user_type.
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
  token: string | undefined | null
): Promise<{ valido: boolean; tipo: TipoUsuario }> {
  const secret = process.env.JWT_SECRET?.trim();
  if (!token || !secret) {
    if (token && !secret) console.error("JWT_SECRET não configurado");
    return { valido: false, tipo: null };
  }
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return { valido: true, tipo: tipoDoUsuario(payload.user_type ?? payload.tipo) };
  } catch {
    return { valido: false, tipo: null };
  }
}
