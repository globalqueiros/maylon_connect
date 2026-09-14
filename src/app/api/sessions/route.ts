import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// =========================================================
// JWT
// =========================================================

type JwtPayload = {
  id?: string | number;

  usuario_id?: string;
  userId?: string;
  user_id?: string;

  email?: string;
  user_type?: string;

  // ID da sessão atual
  session_id?: string | number;

  // Caso seu JWT utilize jti
  jti?: string;
};

// =========================================================
// SESSION
// =========================================================

type SessionRow = {
  id: string | number;

  user_id: string | number;

  ip: string | null;

  user_agent: string | null;

  refresh_token: string | null;

  created_at: Date | string | null;
};

// =========================================================
// LIMPA JWT SECRET
// =========================================================

function limparSecret(value?: string) {
  if (!value) {
    return "";
  }

  const cleaned = value
    .replace(/\r/g, "")
    .trim();

  if (
    (cleaned.startsWith('"') &&
      cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") &&
      cleaned.endsWith("'"))
  ) {
    return cleaned.slice(1, -1);
  }

  return cleaned;
}

// =========================================================
// PEGA ACCESS TOKEN
// =========================================================

function getAccessToken(request: NextRequest) {
  const token =
    request.cookies.get("access_token")?.value;

  if (!token) {
    return null;
  }

  return token.trim();
}

// =========================================================
// PEGA USER ID DO JWT
// =========================================================

function getUserIdFromJwt(
  decoded: JwtPayload
): string | null {
  /*
   * Prioridade:
   *
   * usuario_id
   * user_id
   * userId
   *
   * O campo "id" não é usado aqui porque
   * normalmente representa o ID numérico do usuário.
   */

  const userId =
    decoded.usuario_id ??
    decoded.user_id ??
    decoded.userId ??
    null;

  if (!userId) {
    return null;
  }

  const value = String(userId).trim();

  return value || null;
}

// =========================================================
// PEGA ID DA SESSÃO ATUAL
// =========================================================

function getCurrentSessionId(
  decoded: JwtPayload
): string | null {
  /*
   * Preferimos session_id.
   *
   * jti fica como fallback caso seu JWT
   * utilize o padrão JWT ID.
   */

  const sessionId =
    decoded.session_id ??
    decoded.jti ??
    null;

  if (
    sessionId === null ||
    sessionId === undefined
  ) {
    return null;
  }

  const value = String(sessionId).trim();

  return value || null;
}

// =========================================================
// GET
// =========================================================

export async function GET(
  request: NextRequest
) {
  try {
    console.log(
      "========================================"
    );

    console.log(
      "[SESSIONS] INICIANDO"
    );

    console.log(
      "========================================"
    );

    // =====================================================
    // TOKEN
    // =====================================================

    const accessToken =
      getAccessToken(request);

    if (!accessToken) {
      console.log(
        "[SESSIONS] Cookie access_token não encontrado."
      );

      return NextResponse.json(
        {
          success: false,

          error:
            "Usuário não autenticado.",

          sessions: [],
        },
        {
          status: 401,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // =====================================================
    // SECRET
    // =====================================================

    const secret = limparSecret(
      process.env.JWT_SECRET
    );

    if (!secret) {
      console.error(
        "[SESSIONS] JWT_SECRET não configurado."
      );

      return NextResponse.json(
        {
          success: false,

          error:
            "JWT_SECRET não configurado no servidor.",

          sessions: [],
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // VALIDA JWT
    // =====================================================

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(
        accessToken,
        secret
      ) as JwtPayload;
    } catch (error) {
      console.error(
        "[SESSIONS] JWT inválido:",
        error
      );

      return NextResponse.json(
        {
          success: false,

          error:
            "Sessão inválida ou expirada.",

          sessions: [],
        },
        {
          status: 401,
        }
      );
    }

    console.log(
      "[SESSIONS] JWT validado."
    );

    // =====================================================
    // USER ID
    // =====================================================

    const userId =
      getUserIdFromJwt(decoded);

    console.log(
      "[SESSIONS] User ID:",
      userId
    );

    if (!userId) {
      return NextResponse.json(
        {
          success: false,

          error:
            "ID/UUID do usuário não encontrado no token.",

          sessions: [],
        },
        {
          status: 401,
        }
      );
    }

    // =====================================================
    // SESSÃO ATUAL
    // =====================================================

    const currentSessionId =
      getCurrentSessionId(decoded);

    console.log(
      "[SESSIONS] Session ID atual:",
      currentSessionId
    );

    // =====================================================
    // BUSCA SESSÕES
    // =====================================================

    const [rows] = await db.query(
      `
        SELECT
          id,
          user_id,
          ip,
          user_agent,
          refresh_token,
          created_at
        FROM smartmobility_db.sessions
        WHERE CAST(user_id AS CHAR) = ?
        ORDER BY created_at DESC
      `,
      [userId]
    );

    const sessions =
      rows as SessionRow[];

    console.log(
      "[SESSIONS] Sessões encontradas:",
      sessions.length
    );

    // =====================================================
    // FORMATA SESSÕES
    // =====================================================

    const safeSessions =
      sessions.map((session) => {
        const isCurrent =
          currentSessionId !== null &&
          String(session.id) ===
            String(currentSessionId);

        return {
          id: session.id,

          user_id: String(
            session.user_id
          ),

          ip:
            session.ip &&
            String(session.ip).trim()
              ? String(session.ip).trim()
              : null,

          user_agent:
            session.user_agent &&
            String(session.user_agent).trim()
              ? String(
                  session.user_agent
                ).trim()
              : null,

          created_at:
            session.created_at,

          // IMPORTANTE
          // Não enviamos refresh_token
          // para o frontend.

          is_current:
            isCurrent,
        };
      });

    // =====================================================
    // LOG
    // =====================================================

    console.log(
      "[SESSIONS] Sessões formatadas:",
      safeSessions.map(
        (session) => ({
          id: session.id,

          is_current:
            session.is_current,
        })
      )
    );

    // =====================================================
    // RESPOSTA
    // =====================================================

    return NextResponse.json(
      {
        success: true,

        user_id: userId,

        email:
          decoded.email ?? null,

        user_type:
          decoded.user_type ?? null,

        current_session_id:
          currentSessionId,

        total:
          safeSessions.length,

        sessions:
          safeSessions,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",

          Pragma: "no-cache",

          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error(
      "[SESSIONS] ERRO:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar sessões.",

        sessions: [],
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}
