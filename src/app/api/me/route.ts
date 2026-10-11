import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";
import { authCookieOptions } from "../../lib/authCookies";
import {
  IDENTITY_MATCH_KEY,
  LAST_LIVENESS_KEY,
  mapearStatusDidit,
  provaVidaDevida,
} from "../../lib/didit";
import { obterConsulta } from "../../lib/lawsuitDb";
import { estenderSessao, tokenDaRequisicao, validarSessao } from "../../lib/sessaoServidor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type JwtPayloadCustom = jwt.JwtPayload & {
  id?: unknown;
  userId?: unknown;
  user_id?: unknown;
  usuario_id?: unknown;
  sub?: unknown;
  email?: unknown;
  user_type?: unknown;
};

type UserRow = {
  id: string | number;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  user_type: string | null;
  profile_image: string | null;
  identification_number: string | null;
  identification_type: string | null;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  created_at: string | Date | null;
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
  if (value === null || value === undefined) return null;

  const result = String(value).trim();

  return result || null;
}

function isValidUserId(value: unknown): boolean {
  const normalized = safeString(value);

  if (!normalized) return false;

  if (/^[0-9]+$/.test(normalized)) {
    const number = Number(normalized);

    return Number.isSafeInteger(number) && number > 0;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    normalized
  );
}

function normalizeUserType(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    // Cookie (web e apps hoje) ou Authorization: Bearer.
    const token =
      cookieStore.get("access_token")?.value || tokenDaRequisicao(req) || undefined;

    if (!token) {
      return jsonError("Não autenticado.", 401);
    }

    const jwtSecret = cleanSecret(process.env.JWT_SECRET);

    if (!jwtSecret) {
      console.error("GET /api/me: JWT_SECRET não configurada.");

      return jsonError("Configuração de autenticação indisponível.", 500);
    }

    let decoded: JwtPayloadCustom;

    try {
      decoded = jwt.verify(token, jwtSecret, {
        algorithms: ["HS256"],
      }) as JwtPayloadCustom;
    } catch (error) {
      console.error("GET /api/me: token inválido ou expirado.", error);

      return jsonError("Token inválido ou expirado. Faça login novamente.", 401);
    }

    // Sessão encerrada/revogada não passa, mesmo com o token ainda assinado.
    const sessao = await validarSessao(token, req);
    if (!sessao.ok) {
      return jsonError("Sessão encerrada. Faça login novamente.", 401);
    }

    const candidates = [
      decoded.sub,
      decoded.id,
      decoded.usuario_id,
      decoded.userId,
      decoded.user_id,
    ];

    let userId: string | null = null;

    for (const candidate of candidates) {
      if (isValidUserId(candidate)) {
        userId = safeString(candidate);
        break;
      }
    }

    const email =
      typeof decoded.email === "string"
        ? decoded.email.trim().toLowerCase()
        : "";

    if (!userId && !email) {
      return jsonError(
        "Token não possui identificador de usuário válido.",
        401
      );
    }

    let rows: UserRow[] = [];

    try {
      if (userId) {
        const [result] = await db.query(
          `
            SELECT
              id,
              full_name,
              phone,
              email,
              user_type,
              profile_image,
              identification_number,
              identification_type,
              phone_verified_at,
              email_verified_at,
              created_at
            FROM users
            WHERE id = ?
            LIMIT 1
          `,
          [userId]
        );

        if (Array.isArray(result)) {
          rows = result as UserRow[];
        }
      }

      if (!rows.length && email) {
        const [result] = await db.query(
          `
            SELECT
              id,
              full_name,
              phone,
              email,
              user_type,
              profile_image,
              identification_number,
              identification_type,
              phone_verified_at,
              email_verified_at,
              created_at
            FROM users
            WHERE LOWER(email) = LOWER(?)
            LIMIT 1
          `,
          [email]
        );

        if (Array.isArray(result)) {
          rows = result as UserRow[];
        }
      }
    } catch (dbError) {
      console.error("GET /api/me: erro no banco:", dbError);

      const code = String(
        (dbError as { code?: string })?.code || ""
      );

      if (code === "ER_ACCESS_DENIED_ERROR") {
        return jsonError(
          "Falha de autenticação com o banco de dados.",
          500
        );
      }

      if (code === "ECONNREFUSED") {
        return jsonError("Não foi possível conectar ao banco de dados.", 500);
      }

      if (code === "ECONNRESET") {
        return jsonError("A conexão com o banco de dados foi encerrada.", 500);
      }

      return jsonError("Erro ao consultar o usuário no banco de dados.", 500);
    }

    if (!rows.length) {
      return jsonError(
        "Usuário não encontrado. Faça login novamente.",
        401
      );
    }

    const user = rows[0];
    const resolvedId = safeString(user.id);

    if (!resolvedId || !isValidUserId(resolvedId)) {
      console.error("GET /api/me: ID de usuário inválido.");

      return jsonError("ID do usuário possui formato inválido.", 500);
    }

    const userType = normalizeUserType(user.user_type);

    let verificacaoDocumento: {
      status: ReturnType<typeof mapearStatusDidit>;
      didit_status: string | null;
      is_verified: boolean;
      identity_match: unknown;
    } | null = null;

    let provaVida: {
      devida: boolean;
      last_liveness_at: string | null;
    } | null = null;

    let verificacaoProcessos: {
      status: string;
      total: number;
      checked_at: unknown;
    } | null = null;

    if (userType === "driver") {
      try {
        const [driverDetails] = await db.query(
          `
            SELECT is_verified
            FROM driver_details
            WHERE user_id = ?
            LIMIT 1
          `,
          [resolvedId]
        ) as unknown as [
          Array<{ is_verified?: number | boolean }>
        ];

        const [verificacoes] = await db.query(
          `
            SELECT current_status, attempt_details
            FROM driver_identity_verifications
            WHERE driver_id = ?
            ORDER BY updated_at DESC
            LIMIT 1
          `,
          [resolvedId]
        ) as unknown as [
          Array<{
            current_status?: string | null;
            attempt_details?: unknown;
          }>
        ];

        const detailsRow = driverDetails[0];
        const verifRow = verificacoes[0];
        const isVerified = detailsRow?.is_verified ?? 0;

        const diditStatus =
          typeof verifRow?.current_status === "string"
            ? verifRow.current_status
            : null;

        let lastLivenessAt: string | null = null;
        let identityMatch: unknown = null;

        if (verifRow?.attempt_details) {
          try {
            const detalhes =
              typeof verifRow.attempt_details === "string"
                ? JSON.parse(verifRow.attempt_details)
                : verifRow.attempt_details;

            if (
              typeof detalhes?.[LAST_LIVENESS_KEY] === "string" &&
              detalhes[LAST_LIVENESS_KEY]
            ) {
              lastLivenessAt = detalhes[LAST_LIVENESS_KEY];
            }

            if (detalhes?.[IDENTITY_MATCH_KEY]) {
              identityMatch = detalhes[IDENTITY_MATCH_KEY];
            }
          } catch {
            lastLivenessAt = null;
          }
        }

        verificacaoDocumento = {
          status: mapearStatusDidit(diditStatus, isVerified),
          didit_status: diditStatus,
          is_verified: Boolean(isVerified),
          identity_match: identityMatch,
        };

        provaVida = {
          devida: provaVidaDevida(
            user.created_at,
            lastLivenessAt
          ),
          last_liveness_at: lastLivenessAt,
        };

        const consultaProcessos = await obterConsulta(resolvedId);

        verificacaoProcessos = {
          status: consultaProcessos?.status ?? "nao_iniciado",
          total: consultaProcessos?.total ?? 0,
          checked_at: consultaProcessos?.checked_at ?? null,
        };
      } catch (dbError) {
        console.error(
          "GET /api/me: erro ao consultar verificações do motorista:",
          dbError
        );
      }
    } else if (
      userType === "customer" ||
      userType === "passageiro" ||
      userType === "passenger" ||
      userType === "2"
    ) {
      try {
        const [verificacoes] = await db.query(
          `
            SELECT current_status
            FROM driver_identity_verifications
            WHERE driver_id = ?
            ORDER BY updated_at DESC
            LIMIT 1
          `,
          [resolvedId]
        ) as unknown as [
          Array<{ current_status?: string | null }>
        ];

        const diditStatus =
          typeof verificacoes[0]?.current_status === "string"
            ? verificacoes[0].current_status
            : null;

        const status = mapearStatusDidit(diditStatus, false);

        verificacaoDocumento = {
          status,
          didit_status: diditStatus,
          is_verified: status === "aprovado",
          identity_match: null,
        };

        provaVida = {
          devida: false,
          last_liveness_at: null,
        };

        verificacaoProcessos = {
          status: "nao_iniciado",
          total: 0,
          checked_at: null,
        };
      } catch (dbError) {
        console.error(
          "GET /api/me: erro ao consultar verificações do passageiro:",
          dbError
        );
      }
    }

    const newToken = jwt.sign(
      {
        sub: resolvedId,
        id: resolvedId,
        usuario_id: resolvedId,
        userId: resolvedId,
        user_id: resolvedId,
        user_type: userType,
        email: user.email ?? null,
        // Mantém a mesma sessão: o token muda, a sessão (e a lista de aparelhos) não.
        sid: sessao.sessionUuid,
      },
      jwtSecret,
      {
        algorithm: "HS256",
        expiresIn: "10d",
      }
    );

    await estenderSessao(
      sessao.sessionUuid,
      new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    ).catch((error) => console.error("GET /api/me: erro ao estender sessão:", error));

    const response = NextResponse.json(
      {
        success: true,
        id: resolvedId,
        usuario_id: resolvedId,
        userId: resolvedId,
        user_id: resolvedId,
        full_name: user.full_name ?? null,
        phone: user.phone ?? null,
        email: user.email ?? null,
        profile_image: user.profile_image ?? null,
        identification_number: user.identification_number ?? null,
        identification_type: user.identification_type ?? null,
        phone_verified_at: user.phone_verified_at ?? null,
        email_verified_at: user.email_verified_at ?? null,
        created_at: user.created_at ?? null,
        user_type: userType,
        verification: {
          documento: verificacaoDocumento,
          prova_vida: provaVida,
          processos_judiciais: verificacaoProcessos,
        },
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

    response.cookies.set(
      "access_token",
      newToken,
      authCookieOptions(60 * 60 * 24 * 10)
    );

    return response;
  } catch (error) {
    console.error("GET /api/me: erro interno:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro interno.",
        error:
          process.env.NODE_ENV === "development"
            ? String((error as Error)?.message || error)
            : undefined,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}