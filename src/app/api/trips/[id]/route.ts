import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

function normalizarNumero(
  valor: unknown
): number | null {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return null;
  }

  return numero;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || !String(id).trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "ID da corrida não informado",
        },
        { status: 400 }
      );
    }

    const [rows]: any = await db.query(
      `
      SELECT
        tr.id,
        tr.ref_id,
        tr.entrance,
        tr.note,

        /*
         * VALORES
         */
        tr.estimated_fare,
        tr.paid_fare,

        /*
         * DISTÂNCIAS
         */
        tr.actual_distance,
        tr.estimated_distance,

        /*
         * STATUS
         */
        tr.current_status,
        tr.payment_status,
        tr.payment_method,

        /*
         * DATA
         */
        tr.created_at,

        /*
         * ROTA
         */
        tr.encoded_polyline,

        /*
         * ENDEREÇOS
         */
        c.pickup_address,
        c.destination_address,

        /*
         * COORDENADAS DE ORIGEM
         */
        CASE
          WHEN c.pickup_coordinates IS NOT NULL
          THEN ST_Y(c.pickup_coordinates)
          ELSE NULL
        END AS pickup_lat,

        CASE
          WHEN c.pickup_coordinates IS NOT NULL
          THEN ST_X(c.pickup_coordinates)
          ELSE NULL
        END AS pickup_lng,

        /*
         * COORDENADAS DE DESTINO
         */
        CASE
          WHEN c.destination_coordinates IS NOT NULL
          THEN ST_Y(c.destination_coordinates)
          ELSE NULL
        END AS destination_lat,

        CASE
          WHEN c.destination_coordinates IS NOT NULL
          THEN ST_X(c.destination_coordinates)
          ELSE NULL
        END AS destination_lng,

        /*
         * PASSAGEIRO
         */
        u.id AS passenger_id,
        u.full_name AS passenger_name,
        u.phone AS passenger_phone,

        /*
         * MOTORISTA
         */
        d.id AS driver_id,
        d.full_name AS driver_name,
        d.phone AS driver_phone,

        /*
         * VEÍCULO
         */
        v.id AS vehicle_id,
        v.licence_plate_number AS vehicle_plate,
        v.category_id AS vehicle_category_id,
        v.model_id AS vehicle_model_id,

        /*
         * CATEGORIA
         */
        vc.name AS vehicle_category_name,

        /*
         * MODELO
         */
        vm.name AS vehicle_model_name,
        vm.image AS vehicle_model_image

      FROM trip_requests tr

      LEFT JOIN trip_request_coordinates c
        ON c.trip_request_id = tr.id

      LEFT JOIN users u
        ON u.id = tr.customer_id

      LEFT JOIN users d
        ON d.id = tr.driver_id

      LEFT JOIN vehicles v
        ON v.driver_id = d.id

      LEFT JOIN vehicle_categories vc
        ON vc.id = v.category_id

      LEFT JOIN vehicle_models vm
        ON vm.id = v.model_id

      WHERE tr.id = ?

      LIMIT 1
      `,
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Corrida não encontrada",
        },
        { status: 404 }
      );
    }

    const trip = rows[0];

    /*
     * ============================================================
     * VALORES
     * ============================================================
     *
     * Exemplo:
     *
     * MySQL:
     * estimated_fare = 6.23
     *
     * API:
     * estimated_fare = 6.23
     *
     * Frontend:
     * R$ 6,23
     */

    const estimatedFare =
      normalizarNumero(
        trip.estimated_fare
      );

    const paidFare =
      normalizarNumero(
        trip.paid_fare
      );

    /*
     * ============================================================
     * DISTÂNCIAS
     * ============================================================
     */

    const actualDistance =
      normalizarNumero(
        trip.actual_distance
      );

    const estimatedDistance =
      normalizarNumero(
        trip.estimated_distance
      );

    /*
     * ============================================================
     * PASSAGEIRO
     * ============================================================
     */

    const passenger =
      trip.passenger_id
        ? {
            id: trip.passenger_id,
            full_name:
              trip.passenger_name ?? null,
            phone:
              trip.passenger_phone ?? null,
          }
        : null;

    /*
     * ============================================================
     * MOTORISTA
     * ============================================================
     */

    const driver =
      trip.driver_id
        ? {
            id: trip.driver_id,
            full_name:
              trip.driver_name ?? null,
            phone:
              trip.driver_phone ?? null,
          }
        : null;

    /*
     * ============================================================
     * VEÍCULO
     * ============================================================
     */

    const vehicle =
      trip.vehicle_id
        ? {
            id: trip.vehicle_id,

            licence_plate_number:
              trip.vehicle_plate ??
              null,

            category_id:
              trip.vehicle_category_id ??
              null,

            category:
              trip.vehicle_category_id
                ? {
                    id:
                      trip.vehicle_category_id,

                    name:
                      trip.vehicle_category_name ??
                      null,
                  }
                : null,

            model:
              trip.vehicle_model_id
                ? {
                    id:
                      trip.vehicle_model_id,

                    name:
                      trip.vehicle_model_name ??
                      null,

                    image:
                      trip.vehicle_model_image ??
                      null,
                  }
                : null,
          }
        : null;

    /*
     * ============================================================
     * RESPOSTA
     * ============================================================
     */

    const responseTrip = {
      id: trip.id,

      ref_id:
        trip.ref_id ?? null,

      entrance:
        trip.entrance ?? null,

      note:
        trip.note ?? null,

      /*
       * VALORES
       */
      estimated_fare:
        estimatedFare,

      paid_fare:
        paidFare,

      /*
       * DISTÂNCIAS
       */
      actual_distance:
        actualDistance,

      estimated_distance:
        estimatedDistance,

      /*
       * STATUS
       */
      current_status:
        trip.current_status ?? null,

      payment_status:
        trip.payment_status ?? null,

      payment_method:
        trip.payment_method ?? null,

      /*
       * DATA
       */
      created_at:
        trip.created_at ?? null,

      /*
       * ROTA
       */
      encoded_polyline:
        trip.encoded_polyline ?? null,

      pickup_address:
        trip.pickup_address ?? null,

      destination_address:
        trip.destination_address ?? null,

      pickup_lat:
        normalizarNumero(
          trip.pickup_lat
        ),

      pickup_lng:
        normalizarNumero(
          trip.pickup_lng
        ),

      destination_lat:
        normalizarNumero(
          trip.destination_lat
        ),

      destination_lng:
        normalizarNumero(
          trip.destination_lng
        ),

      /*
       * RELACIONAMENTOS
       */
      passenger,

      driver,

      vehicle,

      /*
       * COMPATIBILIDADE
       */
      vehicle_category:
        trip.vehicle_category_name ??
        null,

      vehicle_model:
        trip.vehicle_model_name ??
        null,

      vehicle_color:
        null,

      vehicle_plate:
        trip.vehicle_plate ?? null,

      vehicle_model_image:
        trip.vehicle_model_image ??
        null,
    };

    /*
     * LOG TEMPORÁRIO PARA CONFERIR O VALOR
     *
     * Se no banco estiver 6.23,
     * deverá aparecer:
     *
     * estimatedFare: 6.23
     */
    console.log(
      "VALOR DA CORRIDA:",
      {
        valorOriginal:
          trip.estimated_fare,

        valorNormalizado:
          estimatedFare,

        valorPago:
          paidFare,
      }
    );

    return NextResponse.json(
      {
        success: true,
        trip: responseTrip,
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(
      "ERRO AO BUSCAR DETALHES DA CORRIDA"
    );

    console.error(
      "Mensagem:",
      error?.message
    );

    console.error(
      "Código:",
      error?.code
    );

    console.error(
      "SQL State:",
      error?.sqlState
    );

    console.error(
      "SQL Message:",
      error?.sqlMessage
    );

    console.error(
      "Erro completo:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          process.env.NODE_ENV ===
          "development"
            ? error?.sqlMessage ||
              error?.message ||
              "Erro interno"
            : "Erro interno ao buscar os dados da corrida",
      },
      {
        status: 500,
      }
    );
  }
}
