import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [rows]: any = await db.query(
      `
      SELECT
        tr.id,
        tr.ref_id,
        tr.entrance,
        tr.note,
        tr.actual_fare,
        tr.actual_distance,
        tr.current_status,
        tr.payment_status,
        tr.created_at,
        tr.payment_method,
        u.full_name AS passenger_name,
        u.email AS passenger_email,
        u.phone AS passenger_phone,
        d.full_name AS driver_name,
        d.phone AS driver_phone
      FROM trip_requests tr
      LEFT JOIN users u
        ON u.id = tr.customer_id
      LEFT JOIN users d
        ON d.id = tr.driver_id
      WHERE tr.id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Corrida não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      trip: rows[0],
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}