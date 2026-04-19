import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get("access_token")?.value;

    if (!token) {
      return new NextResponse("Não autenticado", { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };

    const [rows]: any = await db.query(
      `SELECT 
        id, full_name, phone, email, user_type, profile_image,
        identification_number, identification_type,
        phone_verified_at, email_verified_at 
       FROM users 
       WHERE id = ?`,
      [decoded.id]
    );

    if (!rows.length) {
      return new NextResponse("Usuário não encontrado", { status: 404 });
    }

    const user = rows[0];

    const response = NextResponse.json({
      id: user.id,
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

    response.headers.set("Cache-Control", "no-store");

    return response;

  } catch (error) {
    return new NextResponse("Token inválido", { status: 401 });
  }
}