import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function limparSecret(value?: string) {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Informe o e-mail e a senha." },
        { status: 400 }
      );
    }

    const [rows] = await db.query(
      `
      SELECT
        id,
        email,
        password,
        user_type,
        full_name
      FROM users
      WHERE LOWER(email) = ?
      LIMIT 1
      `,
      [email]
    );

    const users = rows as any[];

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: "E-mail ou senha inválidos." },
        { status: 401 }
      );
    }

    const user = users[0];
    const userId = String(user.id || "").trim();

    if (!userId) {
      console.error("ID DO USUÁRIO INVÁLIDO:", user);
      return NextResponse.json(
        {
          success: false,
          error: "ID do usuário inválido no banco de dados.",
        },
        { status: 500 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário sem senha cadastrada.",
        },
        { status: 500 }
      );
    }

    const senhaCorreta = await bcrypt.compare(
      password,
      String(user.password)
    );

    if (!senhaCorreta) {
      return NextResponse.json(
        { success: false, error: "E-mail ou senha inválidos." },
        { status: 401 }
      );
    }

    const userType = String(user.user_type || "")
      .trim()
      .toLowerCase();

    const isCustomer =
      userType === "customer" ||
      userType === "passageiro" ||
      userType === "passenger";

    const isDriver =
      userType === "driver" ||
      userType === "motorista";

    if (!isCustomer && !isDriver) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo de usuário não configurado.",
        },
        { status: 403 }
      );
    }

    const secret = limparSecret(process.env.JWT_SECRET);

    if (!secret) {
      return NextResponse.json(
        {
          success: false,
          error: "JWT_SECRET não configurado no servidor.",
        },
        { status: 500 }
      );
    }

    const accessToken = jwt.sign(
      {
        id: userId,
        email: user.email,
        user_type: userType,
      },
      secret,
      { expiresIn: "7d" }
    );

    const refreshToken = jwt.sign(
      {
        id: userId,
        type: "refresh",
      },
      secret,
      { expiresIn: "30d" }
    );

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");

    let ip = "unknown";

    if (forwardedFor) {
      ip = forwardedFor.split(",")[0].trim();
    } else if (realIp) {
      ip = realIp.trim();
    }

    const userAgent =
      request.headers.get("user-agent") || "unknown";

    await db.query(
      `
      INSERT INTO sessions (
        user_id,
        ip,
        user_agent,
        refresh_token,
        created_at
      )
      VALUES (?, ?, ?, ?, NOW())
      `,
      [userId, ip, userAgent, refreshToken]
    );

    const response = NextResponse.json({
      success: true,
      message: "Login realizado com sucesso.",
      user: {
        id: userId,
        email: user.email,
        nome: user.full_name || "",
        user_type: userType,
      },
      redirect: isDriver ? "/motorista" : "/passageiro",
    });

    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error("ERRO NO LOGIN:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development"
            ? String(error?.message || error)
            : "Não foi possível realizar o login.",
      },
      { status: 500 }
    );
  }
}
