import { db } from "../../../lib/db";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

// Atrás do proxy o req.url chega como http://localhost:3000, então os
// redirects usam o domínio do NEXT_PUBLIC_APP_URL.
function baseUrl(req: Request) {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  return env || new URL(req.url).origin;
}

export async function GET(req: Request) {
  const base = baseUrl(req);

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/?error=invalid", base)
      );
    }

    const [rows]: any = await db.query(
      `SELECT * FROM auth_tokens 
       WHERE token = ? 
       AND type='magic'`,
      [token]
    );

    const record = rows[0];

    if (!record) {
      return NextResponse.redirect(
        new URL("/?error=invalid", base)
      );
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.redirect(
        new URL("/?error=expired", base)
      );
    }

    const [users]: any = await db.query(
      "SELECT id, email, user_type FROM users WHERE email = ?",
      [record.email]
    );

    const user = users[0];

    if (!user) {
      return NextResponse.redirect(
        new URL("/?error=notfound", base)
      );
    }

    await db.query(
      "UPDATE auth_tokens SET used = TRUE WHERE id = ?",
      [record.id]
    );

    const jwtToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const response = NextResponse.redirect(
      new URL("/auth/success", base)
    );

    response.cookies.set("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("access_token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (error) {
    console.error("VERIFY ERROR:", error);

    return NextResponse.redirect(
      new URL("/?error=server", base)
    );
  }
}