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

function userFromToken(token: string): SessionUser | null {
  if (!process.env.JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    const id = idFromPayload(decoded);
    if (!id) return null;
    return {
      id,
      user_type: decoded.user_type,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

/** Read authenticated user from access_token cookie and/or Authorization header. */
export async function getSessionUser(
  req?: Request
): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("access_token")?.value;
  if (cookieToken) {
    const fromCookie = userFromToken(cookieToken);
    if (fromCookie) return fromCookie;
  }

  const auth = req?.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const bearer = auth.slice(7).trim();
    if (bearer) {
      const fromBearer = userFromToken(bearer);
      if (fromBearer) return fromBearer;
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
