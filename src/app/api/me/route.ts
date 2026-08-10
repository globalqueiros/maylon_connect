import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";
import { toPositiveInt } from "../../lib/session";

export const dynamic = "force-dynamic";

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

    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { message: "JWT_SECRET não configurada" },
        { status: 500 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id?: unknown;
      userId?: unknown;
      user_id?: unknown;
      sub?: unknown;
      email?: string;
      user_type?: string;
    };

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

    // Fallback for legacy tokens / id mismatches
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

    if (!rows.length) {
      // 401 so clients treat as auth failure (not a missing route)
      return NextResponse.json(
        { message: "Usuário não encontrado" },
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
      process.env.JWT_SECRET,
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

    response.cookies.set("access_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 10,
    });

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error("/api/me error:", error);

    return NextResponse.json(
      { message: "Token inválido ou expirado" },
      { status: 401 }
    );
  }
}
