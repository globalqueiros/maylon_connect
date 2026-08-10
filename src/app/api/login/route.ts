import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authCookieOptions } from "../../lib/authCookies";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const forwarded = req.headers.get("x-forwarded-for");

    let ip =
      req.headers.get("cf-connecting-ip") ||
      (forwarded ? forwarded.split(",")[0].trim() : null) ||
      req.headers.get("x-real-ip") ||
      "unknown";
      
    if (ip === "::1" || ip?.includes("::1")) {
      ip = "127.0.0.1";
    }

    const userAgent = req.headers.get("user-agent") || "unknown";

    const [rows]: any = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Usuário ou senha inválida" },
        { status: 401 }
      );
    }

    const user = rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return NextResponse.json(
        { error: "Usuário ou senha inválida" },
        { status: 401 }
      );
    }

    const userId = Number(user.id);

    const accessToken = jwt.sign(
      {
        id: userId,
        user_type: user.user_type,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "10d" }
    );

    const refreshToken = jwt.sign(
      { id: userId, email: user.email },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    const now = new Date();
    const nowSP = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
    )
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    await db.query(
      "INSERT INTO sessions (user_id, ip, user_agent, refresh_token, created_at) VALUES (?, ?, ?, ?, ?)",
      [user.id, ip, userAgent, refreshToken, nowSP]
    );

    const res = NextResponse.json({
      success: true,
      user: {
        id: userId,
        full_name: user.full_name,
        phone: user.phone,
        profile_image: user.profile_image,
        email: user.email,
        user_type: user.user_type,
      },
    });

    res.cookies.set(
      "access_token",
      accessToken,
      authCookieOptions(60 * 60 * 24 * 10)
    );

    res.cookies.set(
      "refresh_token",
      refreshToken,
      authCookieOptions(60 * 60 * 24 * 7)
    );

    return res;

  } catch (error) {
    console.error("Erro no login:", error);

    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}