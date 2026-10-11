import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../lib/session-auth";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SessionStatus = "active" | "inactive" | "revoked";

type SessionRow = {
  session_uuid: string;
  user_id: string | number;
  user_name: string | null;
  user_email: string | null;
  ip_address: string | null;
  device_name: string | null;
  browser_name: string | null;
  operating_system: string | null;
  status: string;
  created_at: string | Date;
  last_activity_at: string | Date | null;
  expires_at: string | Date;
  ended_at: string | Date | null;
  end_reason: string | null;
};

type SessionResponse = Omit<
  SessionRow,
  "user_id" | "created_at" | "last_activity_at" | "expires_at" | "ended_at"
> & {
  user_id: string;
  created_at: string | null;
  last_activity_at: string | null;
  expires_at: string | null;
  ended_at: string | null;
  effective_status: SessionStatus;
};

function getEffectiveStatus(session: SessionRow): SessionStatus {
  const status = session.status?.toLowerCase();

  if (status === "revoked") return "revoked";
  if (status !== "active") return "inactive";

  const expiration = new Date(session.expires_at).getTime();

  if (!Number.isFinite(expiration) || expiration <= Date.now()) {
    return "inactive";
  }

  return "active";
}

function serializeDate(
  value: string | Date | null
): string | null {
  if (value == null) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  return value;
}

export async function GET(request: NextRequest) {
  try {
    const authenticated = await getAuthenticatedUser();

    if (!authenticated?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const userId = authenticated.user.id;
    const requestedStatus =
      request.nextUrl.searchParams.get("status") || "all";

    const validStatuses: SessionStatus[] = [
      "active",
      "inactive",
      "revoked",
    ];

    if (
      requestedStatus !== "all" &&
      !validStatuses.includes(requestedStatus as SessionStatus)
    ) {
      return NextResponse.json(
        { error: "Filtro de sessão inválido." },
        { status: 400 }
      );
    }

    const [rows] = await db.query(
      `SELECT
        s.session_uuid,
        s.user_id,
        u.full_name AS user_name,
        u.email AS user_email,
        s.ip_address,
        s.device_name,
        s.browser_name,
        s.operating_system,
        s.status,
        s.created_at,
        s.last_activity_at,
        s.expires_at,
        s.ended_at,
        s.end_reason
      FROM user_sessions s
      LEFT JOIN users u
        ON CONVERT(u.id USING utf8mb4) COLLATE utf8mb4_unicode_ci =
           CONVERT(s.user_id USING utf8mb4) COLLATE utf8mb4_unicode_ci
      WHERE s.user_id = ?
      ORDER BY s.last_activity_at DESC, s.created_at DESC`,
      [userId]
    );

    const allSessions: SessionResponse[] = (
      rows as SessionRow[]
    ).map((session) => ({
      ...session,
      user_id: String(session.user_id),
      created_at: serializeDate(session.created_at),
      last_activity_at: serializeDate(session.last_activity_at),
      expires_at: serializeDate(session.expires_at),
      ended_at: serializeDate(session.ended_at),
      effective_status: getEffectiveStatus(session),
    }));

    const counts = {
      total: allSessions.length,
      active: allSessions.filter(
        (session) => session.effective_status === "active"
      ).length,
      inactive: allSessions.filter(
        (session) => session.effective_status === "inactive"
      ).length,
      revoked: allSessions.filter(
        (session) => session.effective_status === "revoked"
      ).length,
    };

    const sessions =
      requestedStatus === "all"
        ? allSessions
        : allSessions.filter(
            (session) =>
              session.effective_status === requestedStatus
          );

    return NextResponse.json(
      { success: true, sessions, counts },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/motorista/sessoes]", error);

    return NextResponse.json(
      { error: "Erro interno ao consultar as sessões." },
      { status: 500 }
    );
  }
}