import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";
import { toPositiveInt } from "../../lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "Sem refresh token" }, { status: 401 });
    }

    if (!process.env.JWT_REFRESH_SECRET || !process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: "Secrets JWT não configuradas" },
        { status: 500 }
      );
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    ) as { id?: unknown; email?: string };

    const userId = toPositiveInt(decoded.id);
    if (!userId) {
      return NextResponse.json({ error: "Refresh inválido" }, { status: 403 });
    }

    const [rows]: any = await db.query(
      `SELECT id, email, user_type FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    const user = rows?.[0];
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 });
    }

    const newAccessToken = jwt.sign(
      {
        id: Number(user.id),
        user_type: user.user_type,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10d" }
    );

    const res = NextResponse.json({ success: true });

    res.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 10,
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Refresh inválido" }, { status: 403 });
  }
}
