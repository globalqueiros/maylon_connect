import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";
import { authCookieOptions } from "../../lib/authCookies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type JwtPayloadCustom = jwt.JwtPayload & {
  id?: unknown;
  userId?: unknown;
  user_id?: unknown;
  usuario_id?: unknown;
  sub?: unknown;
  email?: unknown;
  user_type?: unknown;
};

function cleanSecret(value?: string): string {
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

function safeString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const result = String(value).trim();

  return result || null;
}

function isValidUserId(value: unknown): boolean {
  const normalized = safeString(value);

  if (!normalized) {
    return false;
  }

  if (/^[0-9]+$/.test(normalized)) {
    const number = Number(normalized);

    return Number.isSafeInteger(number) && number > 0;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    normalized
  );
}

function normalizeUserType(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return jsonError("Não autenticado", 401);
    }

    const jwtSecret = cleanSecret(process.env.JWT_SECRET);

    if (!jwtSecret) {
      console.error("GET /api/me: JWT_SECRET não configurada");

      return jsonError("JWT_SECRET não configurada", 500);
    }

    let decoded: JwtPayloadCustom;

    try {
      decoded = jwt.verify(token, jwtSecret) as JwtPayloadCustom;
    } catch (error) {
      console.error("GET /api/me: token inválido:", error);

      return jsonError("Token inválido ou expirado", 401);
    }

    const candidates = [
      decoded.id,
      decoded.usuario_id,
      decoded.userId,
      decoded.user_id,
      decoded.sub,
    ];

    let userId: string | null = null;

    for (const candidate of candidates) {
      if (isValidUserId(candidate)) {
        userId = safeString(candidate);
        break;
      }
    }

    const email =
      typeof decoded.email === "string"
        ? decoded.email.trim().toLowerCase()
        : "";

    if (!userId && !email) {
      return jsonError(
        "Token não possui identificador de usuário",
        401
      );
    }

    let rows: any[] = [];

    try {
      if (userId) {
        const [result]: any = await db.query(
          `
          SELECT
            id,
            full_name,
            phone,
            email,
            user_type,
            profile_image,
            identification_number,
            identification_type,
            phone_verified_at,
            email_verified_at
          FROM users
          WHERE id = ?
          LIMIT 1
          `,
          [userId]
        );

        if (Array.isArray(result)) {
          rows = result;
        }
      }

      if (!rows.length && email) {
        const [result]: any = await db.query(
          `
          SELECT
            id,
            full_name,
            phone,
            email,
            user_type,
            profile_image,
            identification_number,
            identification_type,
            phone_verified_at,
            email_verified_at
          FROM users
          WHERE LOWER(email) = LOWER(?)
          LIMIT 1
          `,
          [email]
        );

        if (Array.isArray(result)) {
          rows = result;
        }
      }
    } catch (dbError: any) {
      console.error("GET /api/me: erro no banco:", dbError);

      const code = String(dbError?.code || "");

      if (code === "ER_ACCESS_DENIED_ERROR") {
        return jsonError(
          "Falha de autenticação com o banco. Verifique DB_USER e DB_PASSWORD.",
          500
        );
      }

      if (code === "ECONNREFUSED") {
        return jsonError(
          "Não foi possível conectar ao banco.",
          500
        );
      }

      if (code === "ECONNRESET") {
        return jsonError(
          "A conexão com o banco foi encerrada.",
          500
        );
      }

      return jsonError(
        "Erro ao consultar o usuário no banco.",
        500
      );
    }

    if (!rows.length) {
      return jsonError(
        "Usuário não encontrado. Faça login novamente.",
        401
      );
    }

    const user = rows[0];

    const resolvedId = safeString(user.id);

    if (!resolvedId || !isValidUserId(resolvedId)) {
      console.error(
        "GET /api/me: ID de usuário inválido:",
        user.id
      );

      return jsonError(
        "ID do usuário possui formato inválido.",
        500
      );
    }

    const userType = normalizeUserType(user.user_type);

    const newToken = jwt.sign(
      {
        id: resolvedId,
        usuario_id: resolvedId,
        userId: resolvedId,
        user_id: resolvedId,
        user_type: userType,
        email: user.email ?? null,
      },
      jwtSecret,
      {
        expiresIn: "10d",
      }
    );

    const response = NextResponse.json(
      {
        success: true,
        id: resolvedId,
        usuario_id: resolvedId,
        userId: resolvedId,
        user_id: resolvedId,
        full_name: user.full_name ?? null,
        phone: user.phone ?? null,
        email: user.email ?? null,
        profile_image: user.profile_image ?? null,
        identification_number:
          user.identification_number ?? null,
        identification_type:
          user.identification_type ?? null,
        phone_verified_at:
          user.phone_verified_at ?? null,
        email_verified_at:
          user.email_verified_at ?? null,
        user_type: userType,
      },
      {
        status: 200,
      }
    );

    response.cookies.set(
      "access_token",
      newToken,
      authCookieOptions(60 * 60 * 24 * 10)
    );

    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error: any) {
    console.error("GET /api/me - ERRO INTERNO:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro interno",
        error:
          process.env.NODE_ENV === "development"
            ? String(error?.message || error)
            : undefined,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}