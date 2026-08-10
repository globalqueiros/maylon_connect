import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { getSessionUser } from "../../lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.id;

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
        WHERE
          tr.customer_id = ?
          OR tr.driver_id = ?
        ORDER BY tr.created_at DESC
      `,
      [userId, userId]
    );

    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error("Erro /api/trips:", error);
    return NextResponse.json(
      { error: "Erro ao buscar viagens" },
      { status: 500 }
    );
  }
}
