import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };

    const [rows]: any = await db.query(
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
      WHERE id = ?`,
      [decoded.id]
    );

    if (!rows.length) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const user = rows[0];
    const userId = Number(user.id);

    const newToken = jwt.sign(
      { id: userId, user_type: user.user_type },
      process.env.JWT_SECRET!,
      { expiresIn: "10d" }
    );

    const response = NextResponse.json({
      id: userId,
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
    console.error(error);

    return NextResponse.json(
      { message: "Token inválido ou expirado" },
      { status: 401 }
    );
  }
}