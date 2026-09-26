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

          /* Passageiro - tabela users */
          u.id AS passenger_id,
          u.full_name AS passenger_name,
          u.phone AS passenger_phone,

          /* Motorista - tabela users */
          d.id AS driver_id,
          d.full_name AS driver_name,
          d.phone AS driver_phone

        FROM trip_requests tr

        /* Passageiro */
        LEFT JOIN users u
          ON u.id = tr.customer_id

        /* Motorista */
        LEFT JOIN users d
          ON d.id = tr.driver_id

        WHERE tr.id = ?

        LIMIT 1
      `,
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          error: "Corrida não encontrada",
        },
        { status: 404 }
      );
    }

    const trip = rows[0];

    return NextResponse.json(
      {
        success: true,
        trip: {
          id: trip.id,
          ref_id: trip.ref_id,

          entrance: trip.entrance,
          note: trip.note,

          actual_fare: trip.actual_fare,
          actual_distance: trip.actual_distance,

          current_status: trip.current_status,
          payment_status: trip.payment_status,
          payment_method: trip.payment_method,

          created_at: trip.created_at,

          passenger: {
            id: trip.passenger_id,
            full_name: trip.passenger_name,
            phone: trip.passenger_phone,
          },

          driver: {
            id: trip.driver_id,
            full_name: trip.driver_name,
            phone: trip.driver_phone,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar detalhes da corrida:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao buscar os dados da corrida",
      },
      { status: 500 }
    );
  }
}
