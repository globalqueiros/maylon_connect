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
  if (!raw) return null;

  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return Math.trunc(n);

  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

type JwtPayload = {
  id?: unknown;
  userId?: unknown;
  user_id?: unknown;
  sub?: unknown;
  user_type?: string;
};

export async function getSessionUserId(
  bodyUserId?: unknown
): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (token && process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      const fromToken =
        toPositiveInt(decoded.id) ??
        toPositiveInt(decoded.userId) ??
        toPositiveInt(decoded.user_id) ??
        toPositiveInt(decoded.sub);
      if (fromToken) return fromToken;
    } catch {
      // fall back to body
    }
  }

  return toPositiveInt(bodyUserId);
}

export function pickBeneficioId(body: Record<string, unknown>) {
  return (
    toPositiveInt(body.beneficio_id) ??
    toPositiveInt(body.beneficioId) ??
    toPositiveInt(body.id)
  );
}
