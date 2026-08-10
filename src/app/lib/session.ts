import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

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
  id: number;
  user_type?: string;
  email?: string;
};

function idFromPayload(decoded: JwtPayload): number | null {
  return (
    toPositiveInt(decoded.id) ??
    toPositiveInt(decoded.userId) ??
    toPositiveInt(decoded.user_id) ??
    toPositiveInt(decoded.sub)
  );
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

function userFromToken(token: string): SessionUser | null {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    console.error("JWT_SECRET missing/empty while resolving session");
    return null;
  }
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    const id = idFromPayload(decoded);
    if (!id) return null;
    return {
      id,
      user_type: decoded.user_type,
      email: decoded.email,
    };
  } catch (error: any) {
    console.warn("JWT verify failed:", error?.message || error);
    return null;
  }
}

/**
 * Resolve the logged-in user from:
 * 1) Request Cookie header
 * 2) next/headers cookies()
 * 3) Authorization: Bearer
 */
export async function getSessionUser(
  req?: Request
): Promise<SessionUser | null> {
  const fromHeader = tokenFromCookieHeader(req?.headers.get("cookie") ?? null);
  if (fromHeader) {
    const user = userFromToken(fromHeader);
    if (user) return user;
  }

  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("access_token")?.value;
    if (cookieToken) {
      const user = userFromToken(cookieToken);
      if (user) return user;
    }
  } catch (error) {
    console.warn("cookies() unavailable in this context:", error);
  }

  const auth = req?.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const bearer = auth.slice(7).trim();
    if (bearer) {
      const user = userFromToken(bearer);
      if (user) return user;
    }
  }

  return null;
}

export async function getSessionUserId(
  bodyUserId?: unknown,
  req?: Request
): Promise<number | null> {
  const session = await getSessionUser(req);
  if (session?.id) return session.id;
  return toPositiveInt(bodyUserId);
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
