import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";
import { toPositiveInt, tokenFromCookieHeader } from "../../lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resolveUserIdFromToken(token: string): number | null {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) return null;
  try {
    const decoded = jwt.verify(token, secret) as {
      id?: unknown;
      userId?: unknown;
      user_id?: unknown;
      sub?: unknown;
    };
    return (
      toPositiveInt(decoded.id) ??
      toPositiveInt(decoded.userId) ??
      toPositiveInt(decoded.user_id) ??
      toPositiveInt(decoded.sub)
    );
  } catch {
    return null;
  }
}

async function resolveUserId(req: Request): Promise<number | null> {
  // 1) Raw Cookie header from the incoming request
  const headerToken = tokenFromCookieHeader(req.headers.get("cookie"));
  if (headerToken) {
    const id = resolveUserIdFromToken(headerToken);
    if (id) return id;
  }

  // 2) next/headers cookie store
  try {
    const store = await cookies();
    const cookieToken = store.get("access_token")?.value;
    if (cookieToken) {
      const id = resolveUserIdFromToken(cookieToken);
      if (id) return id;
    }
  } catch {
    // ignore
  }

  // 3) Authorization bearer
  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const id = resolveUserIdFromToken(auth.slice(7).trim());
    if (id) return id;
  }

  return null;
}

async function loadTripsForUser(userId: number) {
  const attempts: Array<() => Promise<any[]>> = [
    async () => {
      const [rows]: any = await db.query(
        `
        SELECT
          tr.id AS trip_request_id,
          COALESCE(trc.pickup_address, tr.pickup_address, '') AS pickup_address,
          COALESCE(
            trc.destination_address,
            tr.dropoff_address,
            tr.destination_address,
            ''
          ) AS destination_address,
          COALESCE(trc.pickup_city, tr.pickup_city, '') AS pickup_city,
          COALESCE(trc.pickup_state, tr.pickup_state, '') AS pickup_state,
          COALESCE(trc.destination_city, tr.dropoff_city, tr.destination_city, '') AS destination_city,
          COALESCE(trc.destination_state, tr.dropoff_state, tr.destination_state, '') AS destination_state,
          COALESCE(tr.actual_fare, tr.estimated_fare, 0) AS valor,
          tr.current_status,
          tr.created_at
        FROM trip_requests tr
        LEFT JOIN trip_request_coordinates trc
          ON trc.trip_request_id = tr.id
        WHERE tr.customer_id = ? OR tr.driver_id = ?
        ORDER BY tr.created_at DESC
        `,
        [userId, userId]
      );
      return Array.isArray(rows) ? rows : [];
    },
    async () => {
      const [rows]: any = await db.query(
        `
        SELECT
          tr.id AS trip_request_id,
          COALESCE(trc.pickup_address, tr.pickup_address, '') AS pickup_address,
          COALESCE(
            trc.destination_address,
            tr.dropoff_address,
            tr.destination_address,
            ''
          ) AS destination_address,
          COALESCE(tr.actual_fare, tr.estimated_fare, 0) AS valor,
          tr.current_status,
          tr.created_at
        FROM trip_requests tr
        LEFT JOIN trip_request_coordinates trc
          ON trc.trip_request_id = tr.id
        WHERE tr.customer_id = ? OR tr.driver_id = ?
        ORDER BY tr.created_at DESC
        `,
        [userId, userId]
      );
      return Array.isArray(rows) ? rows : [];
    },
    async () => {
      const [rows]: any = await db.query(
        `
        SELECT
          tr.id AS trip_request_id,
          COALESCE(tr.pickup_address, '') AS pickup_address,
          COALESCE(tr.dropoff_address, '') AS destination_address,
          COALESCE(tr.actual_fare, tr.estimated_fare, 0) AS valor,
          tr.current_status,
          tr.created_at
        FROM trip_requests tr
        WHERE tr.customer_id = ? OR tr.driver_id = ?
        ORDER BY tr.created_at DESC
        `,
        [userId, userId]
      );
      return Array.isArray(rows) ? rows : [];
    },
    async () => {
      const [rows]: any = await db.query(
        `
        SELECT
          trc.trip_request_id,
          trc.pickup_address,
          trc.destination_address,
          COALESCE(tr.actual_fare, tr.estimated_fare, 0) AS valor,
          tr.current_status,
          tr.created_at
        FROM trip_request_coordinates trc
        INNER JOIN trip_requests tr
          ON tr.id = trc.trip_request_id
        WHERE tr.customer_id = ? OR tr.driver_id = ?
        ORDER BY tr.created_at DESC
        `,
        [userId, userId]
      );
      return Array.isArray(rows) ? rows : [];
    },
  ];

  let lastError: unknown = null;
  for (const run of attempts) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Falha ao consultar viagens");
}

export async function GET(req: Request) {
  try {
    if (!process.env.JWT_SECRET?.trim()) {
      return NextResponse.json(
        { error: "JWT_SECRET não configurada no servidor" },
        { status: 500 }
      );
    }

    const userId = await resolveUserId(req);
    if (!userId) {
      return NextResponse.json(
        {
          error: "Não autorizado",
          message: "Sessão ausente ou expirada.",
        },
        { status: 401 }
      );
    }

    const trips = await loadTripsForUser(userId);
    return NextResponse.json(trips, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Erro /api/trips:", error);
    return NextResponse.json(
      { error: "Erro ao buscar viagens" },
      { status: 500 }
    );
  }
}
