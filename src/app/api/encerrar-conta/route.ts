import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JwtPayloadCustom = jwt.JwtPayload & {
  id?: unknown;
  userId?: unknown;
  user_id?: unknown;
  usuario_id?: unknown;
  sub?: unknown;
  email?: unknown;
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

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário não autenticado.",
        },
        { status: 401 }
      );
    }

    const jwtSecret = cleanSecret(process.env.JWT_SECRET);

    if (!jwtSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "JWT_SECRET não configurada.",
        },
        { status: 500 }
      );
    }

    let decoded: JwtPayloadCustom;

    try {
      decoded = jwt.verify(
        token,
        jwtSecret
      ) as JwtPayloadCustom;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Token inválido ou expirado.",
        },
        { status: 401 }
      );
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

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Token não possui um identificador de usuário válido.",
        },
        { status: 401 }
      );
    }

    const [walletRows]: any = await db.query(
      `
      SELECT
        id,
        user_id,
        conta,
        balance,
        currency,
        status
      FROM wallet
      WHERE user_id = ?
      LIMIT 1
      `,
      [userId]
    );

    if (
      !Array.isArray(walletRows) ||
      walletRows.length === 0
    ) {
      return NextResponse.json({
        success: true,
        message: "Conta encerrada.",
      });
    }

    const wallet = walletRows[0];

    const [result]: any = await db.query(
      `
      DELETE FROM wallet
      WHERE id = ?
      AND user_id = ?
      LIMIT 1
      `,
      [wallet.id, userId]
    );

    if (
      !result ||
      result.affectedRows === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Não foi possível excluir a carteira.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conta encerrada com sucesso.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development"
            ? String(error?.message || error)
            : "Não foi possível encerrar a conta.",
      },
      { status: 500 }
    );
  }
}