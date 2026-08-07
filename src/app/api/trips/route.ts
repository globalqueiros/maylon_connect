import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET(req: Request) {
  try {
    const res = await fetch("http://localhost:3000/api/me", {
      headers: req.headers,
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await res.json();
    const userId = user.id;

    const [rows]: any = await db.query(
      ` SELECT 
          trc.trip_request_id,
          trc.pickup_address,
          trc.destination_address,
          COALESCE(tr.actual_fare, tr.estimated_fare, 0) as valor,
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
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar viagens" },
      { status: 500 }
    );
  }
}