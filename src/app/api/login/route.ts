import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authCookieOptions } from "../../lib/authCookies";

export const dynamic = "force-dynamic";

function mapLoginError(error: any): { message: string; status: number } {
  const code = String(error?.code || "");
  const msg = String(error?.message || "");

  if (
    code === "ER_ACCESS_DENIED_ERROR" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    code === "PROTOCOL_CONNECTION_LOST" ||
    msg.toLowerCase().includes("access denied") ||
    msg.toLowerCase().includes("connect")
  ) {
    return {
      message:
        "Falha na conexão com o banco de dados. Verifique DB_HOST, DB_USER, DB_PASSWORD e permissões do MySQL.",
      status: 503,
    };
  }

  if (msg.toLowerCase().includes("secret") || msg.toLowerCase().includes("jwt")) {
    return {
      message: "JWT_SECRET / JWT_REFRESH_SECRET não configurados corretamente.",
      status: 500,
    };
  }

  return {
    message: "Erro interno no servidor",
    status: 500,
  };
}

export async function POST(req: Request) {
  try {
    if (!process.env.JWT_SECRET?.trim() || !process.env.JWT_REFRESH_SECRET?.trim()) {
      return NextResponse.json(
        {
          error:
            "JWT_SECRET / JWT_REFRESH_SECRET não configurados no servidor (.env).",
        },
        { status: 500 }
      );
    }

    if (
      !process.env.DB_HOST ||
      !process.env.DB_USER ||
      !process.env.DB_NAME
    ) {
      return NextResponse.json(
        {
          error:
            "Variáveis de banco (DB_HOST, DB_USER, DB_NAME) não configuradas no .env.",
        },
        { status: 500 }
      );
    }

    let email = "";
    let password = "";
    try {
      const body = await req.json();
      email = String(body?.email || "").trim();
      password = String(body?.password || "");
    } catch {
      return NextResponse.json(
        { error: "JSON inválido no login" },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

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

    let rows: any[] = [];
    try {
      const [result]: any = await db.query(
        "SELECT id, full_name, phone, profile_image, email, user_type, password FROM users WHERE email = ? LIMIT 1",
        [email]
      );
      rows = result;
    } catch (dbError) {
      console.error("Erro DB no login:", dbError);
      const mapped = mapLoginError(dbError);
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Usuário ou senha inválida" },
        { status: 401 }
      );
    }

    const user = rows[0];

    if (!user.password) {
      return NextResponse.json(
        { error: "Usuário sem senha cadastrada. Use o link mágico ou redefina a senha." },
        { status: 401 }
      );
    }

    let valid = false;
    try {
      valid = await bcrypt.compare(password, user.password);
    } catch (hashError) {
      console.error("Erro bcrypt no login:", hashError);
      return NextResponse.json(
        { error: "Senha do usuário está em formato inválido no banco." },
        { status: 500 }
      );
    }

    if (!valid) {
      return NextResponse.json(
        { error: "Usuário ou senha inválida" },
        { status: 401 }
      );
    }

    const userId = Number(user.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json(
        { error: "ID de usuário inválido no banco" },
        { status: 500 }
      );
    }

    const accessToken = jwt.sign(
      {
        id: userId,
        user_type: user.user_type,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10d" }
    );

    const refreshToken = jwt.sign(
      { id: userId, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Session logging must never block login
    try {
      const now = new Date();
      const nowSP = new Date(
        now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
      )
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      await db.query(
        "INSERT INTO sessions (user_id, ip, user_agent, refresh_token, created_at) VALUES (?, ?, ?, ?, ?)",
        [userId, ip, userAgent, refreshToken, nowSP]
      );
    } catch (sessionError) {
      console.warn("Falha ao registrar sessão (login continua):", sessionError);
    }

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
    const mapped = mapLoginError(error);
    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status }
    );
  }
}
