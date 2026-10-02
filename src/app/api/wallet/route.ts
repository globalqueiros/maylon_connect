import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JwtPayload = {
  id?: string | number;
  email?: string;
  user_type?: string;
};

function limparSecret(value?: string) {
  if (!value) return "";

  const cleaned = value
    .replace(/\r/g, "")
    .trim();

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    return cleaned.slice(1, -1);
  }

  return cleaned;
}

function jsonError(
  error: string,
  status: number
) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

function getUserIdFromToken(
  request: NextRequest
): string {
  const accessToken =
    request.cookies.get("access_token")?.value;

  if (!accessToken) {
    throw new Error("AUTH_REQUIRED");
  }

  const secret = limparSecret(
    process.env.JWT_SECRET
  );

  if (!secret) {
    console.error(
      "JWT_SECRET não configurado."
    );

    throw new Error("JWT_SECRET_MISSING");
  }

  try {
    const decoded = jwt.verify(
      accessToken,
      secret
    ) as JwtPayload;

    const userId = String(
      decoded?.id || ""
    ).trim();

    if (!userId) {
      throw new Error("USER_NOT_FOUND");
    }

    return userId;
  } catch {
    throw new Error("TOKEN_INVALID");
  }
}

async function getUser(userId: string) {
  const [rows] = await db.execute(
    `
    SELECT
      id,
      email,
      full_name,
      user_type
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [userId]
  );

  const users = rows as any[];

  if (!users.length) {
    return null;
  }

  return users[0];
}

async function getWallet(userId: string) {
  const [rows] = await db.execute(
    `
    SELECT
      id,
      user_id,
      conta,
      balance,
      currency
    FROM wallet
    WHERE user_id = ?
    LIMIT 1
    `,
    [userId]
  );

  const wallets = rows as any[];

  if (!wallets.length) {
    return null;
  }

  return wallets[0];
}

async function getTransactions(
  walletId: number | string
) {
  const [rows] = await db.execute(
    `
    SELECT
      id,
      amount,
      type,
      created_at
    FROM wallet_transactions
    WHERE wallet_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT 10
    `,
    [walletId]
  );

  return rows as any[];
}

function formatWallet(
  wallet: any
) {
  return {
    id: wallet.id,
    user_id: wallet.user_id,
    conta: wallet.conta || null,
    balance: Number(wallet.balance || 0),
    currency: wallet.currency || "BRL",
  };
}

function formatTransactions(
  transactions: any[]
) {
  return transactions.map(
    (transaction) => ({
      id: transaction.id,

      title:
        transaction.type === "in"
          ? "Dinheiro recebido"
          : "Dinheiro enviado",

      description:
        transaction.type === "in"
          ? "Valor recebido na carteira"
          : "Valor enviado da carteira",

      value: Number(
        transaction.amount || 0
      ),

      type:
        transaction.type === "in"
          ? "in"
          : "out",

      created_at:
        transaction.created_at,
    })
  );
}

export async function GET(
  request: NextRequest
) {
  try {
    const userId =
      getUserIdFromToken(request);

    const user = await getUser(userId);

    if (!user) {
      return jsonError(
        "Usuário não encontrado.",
        404
      );
    }

    const wallet =
      await getWallet(userId);

    if (!wallet) {
      return jsonError(
        "Carteira não encontrada.",
        404
      );
    }

    const transactions =
      await getTransactions(wallet.id);

    return NextResponse.json(
      {
        success: true,
        wallet: formatWallet(wallet),
        transactions:
          formatTransactions(
            transactions
          ),
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "AUTH_REQUIRED"
    ) {
      return jsonError(
        "Sua sessão expirou. Faça login novamente.",
        401
      );
    }

    if (
      error instanceof Error &&
      error.message === "TOKEN_INVALID"
    ) {
      return jsonError(
        "Sua sessão expirou. Faça login novamente.",
        401
      );
    }

    if (
      error instanceof Error &&
      error.message === "JWT_SECRET_MISSING"
    ) {
      return jsonError(
        "JWT_SECRET não configurado no servidor.",
        500
      );
    }

    console.error(
      "ERRO GET /api/wallet:",
      error
    );

    return jsonError(
      "Erro ao carregar carteira.",
      500
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const userId =
      getUserIdFromToken(request);

    const user = await getUser(userId);

    if (!user) {
      return jsonError(
        "Usuário não encontrado.",
        404
      );
    }

    const existingWallet =
      await getWallet(userId);

    if (existingWallet) {
      const transactions =
        await getTransactions(
          existingWallet.id
        );

      return NextResponse.json(
        {
          success: true,
          created: false,
          message:
            "Você já possui uma carteira.",
          wallet:
            formatWallet(existingWallet),
          transactions:
            formatTransactions(
              transactions
            ),
        },
        { status: 200 }
      );
    }

    const conta =
      `MAY-${userId
        .slice(0, 8)
        .toUpperCase()}-${Date.now()
        .toString()
        .slice(-6)}`;

    const [result] =
      await db.execute(
        `
        INSERT INTO wallet (
          user_id,
          conta,
          balance,
          currency
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          userId,
          conta,
          0,
          "BRL",
        ]
      );

    const created =
      result as any;

    const [rows] =
      await db.execute(
        `
        SELECT
          id,
          user_id,
          conta,
          balance,
          currency
        FROM wallet
        WHERE id = ?
        LIMIT 1
        `,
        [created.insertId]
      );

    const wallets =
      rows as any[];

    if (!wallets.length) {
      return jsonError(
        "A carteira foi criada, mas não foi possível carregá-la.",
        500
      );
    }

    const wallet = wallets[0];

    return NextResponse.json(
      {
        success: true,
        created: true,
        message:
          "Carteira criada com sucesso.",
        wallet: formatWallet(wallet),
        transactions: [],
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "AUTH_REQUIRED"
    ) {
      return jsonError(
        "Sua sessão expirou. Faça login novamente.",
        401
      );
    }

    if (
      error instanceof Error &&
      error.message === "TOKEN_INVALID"
    ) {
      return jsonError(
        "Sua sessão expirou. Faça login novamente.",
        401
      );
    }

    if (
      error instanceof Error &&
      error.message === "JWT_SECRET_MISSING"
    ) {
      return jsonError(
        "JWT_SECRET não configurado no servidor.",
        500
      );
    }

    console.error(
      "ERRO POST /api/wallet:",
      error
    );

    return jsonError(
      "Não foi possível criar sua carteira.",
      500
    );
  }
}
