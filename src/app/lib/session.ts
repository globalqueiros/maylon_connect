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
  const fromBody = toPositiveInt(bodyUserId);
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
      // Prefer token, but never discard a valid body id if token has no id
      if (fromToken) return fromToken;
    } catch {
      // fall back to body
    }
  }

  return fromBody;
}

export function pickBeneficioId(body: Record<string, unknown>) {
  return (
    toPositiveInt(body.beneficio_id) ??
    toPositiveInt(body.beneficioId) ??
    // only use generic `id` if beneficio_* keys are absent
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
