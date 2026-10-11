import { sessaoDaRequisicao } from "./sessaoServidor";

/** Coerce mysql/jwt/json values into a positive integer id. */
export function toPositiveInt(value: unknown): number | null {
  if (value == null || value === "") return null;

  if (typeof value === "bigint") {
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.trunc(value) : null;
  }

  const raw = String(value).trim();
  if (!raw || raw === "null" || raw === "undefined" || raw === "NaN") {
    return null;
  }

  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return Math.trunc(n);

  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export type JwtPayload = {
  id?: unknown;
  userId?: unknown;
  user_id?: unknown;
  sub?: unknown;
  user_type?: string;
  email?: string;
};

export type SessionUser = {
  /** Sempre texto: os ids de usuário são UUID (antes virava número e "6b04…" virava 6). */
  id: string;
  user_type?: string;
  email?: string;
};

/** Id de usuário vindo de fora (body/query): aceita UUID ou inteiro positivo, como texto. */
export function toUserId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s || s === "null" || s === "undefined") return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return s;
  if (/^[1-9][0-9]*$/.test(s)) return s;
  return null;
}

/** Pull access_token from a raw Cookie header (most reliable in route handlers). */
export function tokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== "access_token") continue;
    const value = trimmed.slice(eq + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}

/**
 * Usuário logado (cookie access_token, cookies() do Next ou Authorization: Bearer),
 * validado pelo validador central: sessão revogada/encerrada não passa.
 */
export async function getSessionUser(
  req?: Request
): Promise<SessionUser | null> {
  const sessao = await sessaoDaRequisicao(req);
  if (!sessao.ok) return null;
  return {
    id: sessao.userId,
    user_type: typeof sessao.payload.user_type === "string" ? sessao.payload.user_type : undefined,
    email: typeof sessao.payload.email === "string" ? sessao.payload.email : undefined,
  };
}

/**
 * Id do usuário logado, sempre da sessão. O primeiro parâmetro (id vindo do
 * body/URL) é ignorado de propósito: aceitar esse id deixava uma pessoa agir
 * no lugar de outra. Mantido na assinatura só para não quebrar quem chama.
 */
export async function getSessionUserId(
  _bodyUserIdIgnorado?: unknown,
  req?: Request
): Promise<string | null> {
  const session = await getSessionUser(req);
  return session?.id ?? null;
}

export function pickBeneficioId(body: Record<string, unknown>) {
  return (
    toPositiveInt(body.beneficio_id) ??
    toPositiveInt(body.beneficioId) ??
    (body.beneficio_id == null && body.beneficioId == null
      ? toPositiveInt(body.id)
      : null)
  );
}

export async function readJsonBody(
  req: Request
): Promise<Record<string, unknown>> {
  try {
    const text = await req.text();
    if (!text?.trim()) return {};
    const data = JSON.parse(text);
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }
  } catch (error) {
    console.error("Failed to parse JSON body:", error);
  }
  return {};
}
