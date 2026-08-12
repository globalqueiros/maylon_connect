import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";
import { toPositiveInt } from "../../lib/session";
import { authCookieOptions } from "../../lib/authCookies";

export const dynamic = "force-dynamic";

function cleanSecret(value?: string) {
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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Não autenticado" },
        { status: 401 }
      );
    }

    const jwtSecret = cleanSecret(process.env.JWT_SECRET);
    if (!jwtSecret) {
      return NextResponse.json(
        { message: "JWT_SECRET não configurada" },
        { status: 500 }
      );
    }

    let decoded: {
      id?: unknown;
      userId?: unknown;
      user_id?: unknown;
      sub?: unknown;
      email?: string;
      user_type?: string;
    };

    try {
      decoded = jwt.verify(token, jwtSecret) as typeof decoded;
    } catch {
      return NextResponse.json(
        { message: "Token inválido ou expirado" },
        { status: 401 }
      );
    }

    const userId =
      toPositiveInt(decoded.id) ??
      toPositiveInt(decoded.userId) ??
      toPositiveInt(decoded.user_id) ??
      toPositiveInt(decoded.sub);

    if (!userId && !decoded.email) {
      return NextResponse.json(
        { message: "Token inválido" },
        { status: 401 }
      );
    }

    let rows: any[] = [];

    try {
      if (userId) {
        const [byId]: any = await db.query(
          `SELECT
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
          LIMIT 1`,
          [userId]
        );
        rows = byId;
      }

      if (!rows.length && decoded.email) {
        const [byEmail]: any = await db.query(
          `SELECT
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
          WHERE email = ?
          LIMIT 1`,
          [decoded.email]
        );
        rows = byEmail;
      }
    } catch (dbError: any) {
      console.error("/api/me database error:", dbError);
      const code = String(dbError?.code || "");
      const dbHint =
        code === "ER_ACCESS_DENIED_ERROR" || code === "ECONNREFUSED"
          ? "Falha na conexão com o banco. Verifique DB_HOST/DB_USER/DB_PASSWORD no .env."
          : "Erro ao carregar usuário no banco de dados.";
      return NextResponse.json({ message: dbHint }, { status: 500 });
    }

    if (!rows.length) {
      return NextResponse.json(
        {
          message:
            "Usuário não encontrado neste banco. Faça login novamente com uma conta existente.",
        },
        { status: 401 }
      );
    }

    const user = rows[0];
    const resolvedId = Number(user.id);

    const newToken = jwt.sign(
      {
        id: resolvedId,
        user_type: user.user_type,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: "10d" }
    );

    const response = NextResponse.json({
      id: resolvedId,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      profile_image: user.profile_image,
      identification_number: user.identification_number,
      identification_type: user.identification_type,
      phone_verified_at: user.phone_verified_at,
      email_verified_at: user.email_verified_at,
      user_type: user.user_type,
    });

    response.cookies.set(
      "access_token",
      newToken,
      authCookieOptions(60 * 60 * 24 * 10)
    );

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error("/api/me error:", error);
    return NextResponse.json(
      { message: "Erro interno" },
      { status: 500 }
    );
  }
}
