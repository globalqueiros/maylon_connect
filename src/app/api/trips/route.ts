import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { getSessionUser } from "../../lib/session";

export const dynamic = "force-dynamic";

async function loadTripsForUser(userId: number) {
  // Primary: trips table as source of truth (works even without coordinates rows)
  try {
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
  } catch (error: any) {
    // Fallback if some columns don't exist in this DB schema
    console.warn("Trips primary query failed, using fallback:", error?.message);
  }

  try {
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
  } catch (error: any) {
    console.warn("Trips fallback query failed:", error?.message);
  }

  // Last resort: coordinates-driven query (legacy)
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
    LEFT JOIN trip_requests tr
      ON tr.id = trc.trip_request_id
    WHERE tr.customer_id = ? OR tr.driver_id = ?
    ORDER BY tr.created_at DESC
    `,
    [userId, userId]
  );
  return Array.isArray(rows) ? rows : [];
}

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json(
        {
          error: "Não autorizado",
          message: "Sessão ausente ou expirada. Faça login novamente.",
        },
        { status: 401 }
      );
    }

    const trips = await loadTripsForUser(session.id);
    return NextResponse.json(trips);
  } catch (error) {
    console.error("Erro /api/trips:", error);
    return NextResponse.json(
      { error: "Erro ao buscar viagens" },
      { status: 500 }
    );
  }
}
