import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const [rows]: any = await db.query(
      `
      SELECT 
        trc.trip_request_id,
        trc.pickup_address,
        trc.destination_address,
        COALESCE(tr.actual_fare, tr.estimated_fare, 0) as valor,
        tr.current_status
      FROM trip_request_coordinates trc
      LEFT JOIN trip_requests tr 
        ON tr.id = trc.trip_request_id
      WHERE trc.trip_request_id = ?
      `,
      [id]
    );

    return NextResponse.json(rows[0] || null);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar corrida" },
      { status: 500 }
    );
  }
}