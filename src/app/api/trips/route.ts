import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DbRow = Record<string, any>;

type JwtPayload = {
  id?: number | string | null;
  user_id?: number | string | null;
  driver_id?: string | number | null;
  user_type?: string | null;
  role?: string | null;
  type?: string | null;
};

function findColumn(
  columns: string[],
  names: string[]
): string | null {
  return names.find((name) => columns.includes(name)) ?? null;
}

async function getColumns(table: string): Promise<string[]> {
  try {
    const [rows] = await db.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
      [table]
    );

    return (rows as DbRow[]).map((row) =>
      String(row.COLUMN_NAME)
    );
  } catch {
    return [];
  }
}

async function getDriverIdFromUser(
  userId: number | string
): Promise<string | number | null> {
  const possibleTables = [
    "drivers",
    "driver",
    "driver_profiles",
    "driver_profile",
  ];

  for (const table of possibleTables) {
    try {
      const columns = await getColumns(table);

      if (!columns.length) continue;

      const idColumn = findColumn(columns, [
        "id",
        "driver_id",
        "driver_uuid",
      ]);

      const userColumn = findColumn(columns, [
        "user_id",
        "userId",
        "user",
        "account_id",
      ]);

      if (!idColumn || !userColumn) continue;

      const [rows] = await db.query(
        `SELECT ${idColumn} AS driver_id
         FROM ${table}
         WHERE ${userColumn} = ?
         LIMIT 1`,
        [userId]
      );

      const result = rows as DbRow[];

      if (
        result.length &&
        result[0]?.driver_id != null
      ) {
        return result[0].driver_id;
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function getUserType(
  userId: number | string
): Promise<string | null> {
  try {
    const columns = await getColumns("users");

    if (!columns.length) return null;

    const idColumn = findColumn(columns, [
      "id",
      "user_id",
      "usuario_id",
    ]);

    const typeColumn = findColumn(columns, [
      "user_type",
      "userType",
      "tipo_usuario",
      "tipo",
      "role",
      "perfil",
    ]);

    if (!idColumn || !typeColumn) return null;

    const [rows] = await db.query(
      `SELECT ${typeColumn} AS user_type
       FROM users
       WHERE ${idColumn} = ?
       LIMIT 1`,
      [userId]
    );

    const result = rows as DbRow[];

    if (
      result.length &&
      result[0]?.user_type != null
    ) {
      return String(result[0].user_type)
        .trim()
        .toLowerCase();
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeUserType(
  value: unknown
): "driver" | "passenger" | "unknown" {
  const type = String(value ?? "")
    .trim()
    .toLowerCase();

  if (
    [
      "motorista",
      "driver",
      "motorista parceiro",
      "motorista_parceiro",
    ].includes(type)
  ) {
    return "driver";
  }

  if (
    [
      "passageiro",
      "passenger",
      "cliente",
      "customer",
      "usuario",
      "usuário",
    ].includes(type)
  ) {
    return "passenger";
  }

  return "unknown";
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          trips: [],
          message: "Não autenticado.",
        },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return NextResponse.json(
        {
          success: false,
          trips: [],
          message:
            "JWT_SECRET não configurado no servidor.",
        },
        { status: 500 }
      );
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(
        token,
        secret
      ) as JwtPayload;
    } catch {
      return NextResponse.json(
        {
          success: false,
          trips: [],
          message: "Sessão inválida ou expirada.",
        },
        { status: 401 }
      );
    }

    const userId = decoded.id ?? decoded.user_id;

    if (
      userId === undefined ||
      userId === null ||
      userId === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          trips: [],
          message:
            "Não foi possível identificar o usuário logado.",
        },
        { status: 401 }
      );
    }

    let rawUserType =
      decoded.user_type ??
      decoded.role ??
      decoded.type ??
      null;

    if (!rawUserType) {
      rawUserType = await getUserType(userId);
    }

    let userType = normalizeUserType(rawUserType);

    const requestColumns =
      await getColumns("trip_requests");

    if (!requestColumns.length) {
      return NextResponse.json(
        {
          success: false,
          trips: [],
          message:
            "A tabela trip_requests não foi encontrada ou não possui colunas.",
        },
        { status: 500 }
      );
    }

    const requestIdColumn = findColumn(
      requestColumns,
      [
        "id",
        "trip_request_id",
        "request_id",
      ]
    );

    if (!requestIdColumn) {
      return NextResponse.json(
        {
          success: false,
          trips: [],
          message:
            "A tabela trip_requests não possui uma coluna de ID compatível.",
          columns: requestColumns,
        },
        { status: 500 }
      );
    }

    const driverColumn = findColumn(
      requestColumns,
      [
        "driver_id",
        "driver_uuid",
        "assigned_driver_id",
        "assigned_driver",
        "trip_driver_id",
      ]
    );

    const passengerColumn = findColumn(
      requestColumns,
      [
        "passenger_id",
        "passenger_uuid",
        "customer_id",
        "customer_uuid",
        "user_id",
        "usuario_id",
        "user",
        "account_id",
        "requester_id",
        "client_id",
        "cliente_id",
      ]
    );

    if (userType === "unknown") {
      const foundDriverId =
        await getDriverIdFromUser(userId);

      if (foundDriverId) {
        userType = "driver";
      } else if (passengerColumn) {
        userType = "passenger";
      }
    }

    let whereColumn: string | null = null;
    let whereValue: string | number | null = null;
    let driverId: string | number | null = null;

    if (userType === "driver") {
      driverId = decoded.driver_id ?? null;

      if (!driverId) {
        driverId =
          await getDriverIdFromUser(userId);
      }

      if (!driverId) {
        return NextResponse.json(
          {
            success: false,
            trips: [],
            message:
              "Motorista não encontrado para o usuário logado.",
            user_id: userId,
          },
          { status: 404 }
        );
      }

      if (!driverColumn) {
        return NextResponse.json(
          {
            success: false,
            trips: [],
            message:
              "Não encontrei uma coluna de motorista em trip_requests.",
            columns: requestColumns,
          },
          { status: 500 }
        );
      }

      whereColumn = driverColumn;
      whereValue = driverId;
    } else {
      if (!passengerColumn) {
        return NextResponse.json(
          {
            success: false,
            trips: [],
            message:
              "Não encontrei uma coluna de passageiro/usuário em trip_requests.",
            columns: requestColumns,
          },
          { status: 500 }
        );
      }

      whereColumn = passengerColumn;
      whereValue = userId;
    }

    const coordinateColumns =
      await getColumns(
        "trip_request_coordinates"
      );

    const coordinateRequestColumn =
      findColumn(
        coordinateColumns,
        [
          "trip_request_id",
          "trip_request",
          "request_id",
        ]
      );

    let coordinateJoin = "";

    if (coordinateRequestColumn) {
      coordinateJoin = `
        LEFT JOIN trip_request_coordinates tc
          ON tc.${coordinateRequestColumn} = tr.${requestIdColumn}
      `;
    }

    const pickupColumn = findColumn(
      coordinateColumns,
      [
        "pickup_address",
        "origin",
        "pickup_location",
        "pickup",
      ]
    );

    const destinationColumn = findColumn(
      coordinateColumns,
      [
        "destination_address",
        "destination",
        "dropoff_address",
        "dropoff_location",
        "dropoff",
      ]
    );

    const originSelect =
      coordinateJoin && pickupColumn
        ? `tc.${pickupColumn} AS origin`
        : "NULL AS origin";

    const destinationSelect =
      coordinateJoin && destinationColumn
        ? `tc.${destinationColumn} AS destination`
        : "NULL AS destination";

    const statusColumns =
      await getColumns("trip_status");

    const statusRequestColumn =
      findColumn(
        statusColumns,
        [
          "trip_request_id",
          "trip_request",
          "request_id",
        ]
      );

    let statusJoin = "";

    if (statusRequestColumn) {
      statusJoin = `
        LEFT JOIN trip_status ts
          ON ts.${statusRequestColumn} = tr.${requestIdColumn}
      `;
    }

    const directStatusColumn =
      findColumn(
        statusColumns,
        [
          "status",
          "trip_status",
          "current_status",
        ]
      );

    let statusSelect = "NULL AS status";

    if (
      directStatusColumn &&
      statusRequestColumn
    ) {
      statusSelect = `ts.${directStatusColumn} AS status`;
    } else if (statusRequestColumn) {
      const cases: string[] = [];

      const statusMap = [
        ["returned", "returned"],
        ["returning", "returning"],
        ["completed", "completed"],
        ["cancelled", "cancelled"],
        ["failed", "failed"],
        ["ongoing", "ongoing"],
        ["picked_up", "picked_up"],
        ["out_for_pickup", "out_for_pickup"],
        ["accepted", "accepted"],
        ["pending", "pending"],
      ];

      for (const [column, value] of statusMap) {
        if (statusColumns.includes(column)) {
          cases.push(
            `WHEN ts.${column} = 1 THEN '${value}'`
          );
        }
      }

      if (cases.length > 0) {
        statusSelect = `
          CASE
            ${cases.join("\n")}
            ELSE NULL
          END AS status
        `;
      }
    }

    const requestStatusColumn =
      findColumn(
        requestColumns,
        [
          "status",
          "trip_status",
          "current_status",
        ]
      );

    if (
      requestStatusColumn &&
      !directStatusColumn &&
      !statusRequestColumn
    ) {
      statusSelect =
        `tr.${requestStatusColumn} AS status`;
    }

    const fareColumns =
      await getColumns("trip_fares");

    let fareJoin = "";

    if (
      fareColumns.includes(
        "trip_request_id"
      )
    ) {
      fareJoin = `
        LEFT JOIN trip_fares tf
          ON tf.trip_request_id = tr.${requestIdColumn}
      `;
    } else if (
      requestColumns.includes(
        "trip_fare_id"
      ) &&
      fareColumns.includes("id")
    ) {
      fareJoin = `
        LEFT JOIN trip_fares tf
          ON tf.id = tr.trip_fare_id
      `;
    } else if (
      requestColumns.includes(
        "zone_wise_default_trip_fare_id"
      ) &&
      fareColumns.includes(
        "zone_wise_default_trip_fare_id"
      )
    ) {
      fareJoin = `
        LEFT JOIN trip_fares tf
          ON tf.zone_wise_default_trip_fare_id =
             tr.zone_wise_default_trip_fare_id
      `;
    } else if (
      requestColumns.includes(
        "default_trip_fare_id"
      ) &&
      fareColumns.includes("id")
    ) {
      fareJoin = `
        LEFT JOIN trip_fares tf
          ON tf.id = tr.default_trip_fare_id
      `;
    }

    const fareColumn = findColumn(
      fareColumns,
      [
        "base_fare",
        "total_fare",
        "fare",
        "amount",
        "total",
        "price",
        "cost",
        "estimated_fare",
        "final_fare",
        "actual_fare",
        "fare_amount",
      ]
    );

    const requestFareColumn = findColumn(
      requestColumns,
      [
        "base_fare",
        "total_fare",
        "fare",
        "amount",
        "total",
        "price",
        "cost",
        "estimated_fare",
        "final_fare",
        "actual_fare",
        "fare_amount",
        "trip_fare",
        "valor",
        "valor_viagem",
      ]
    );

    let fareSelect = "NULL AS fare";

    if (fareJoin && fareColumn) {
      fareSelect =
        `tf.${fareColumn} AS fare`;
    } else if (requestFareColumn) {
      fareSelect =
        `tr.${requestFareColumn} AS fare`;
    }

    const createdAtColumn =
      requestColumns.includes("created_at")
        ? "tr.created_at"
        : requestColumns.includes("updated_at")
          ? "tr.updated_at"
          : `tr.${requestIdColumn}`;

    const sql = `
      SELECT
        tr.*,
        ${originSelect},
        ${destinationSelect},
        ${fareSelect},
        ${statusSelect}
      FROM trip_requests tr
      ${coordinateJoin}
      ${fareJoin}
      ${statusJoin}
      WHERE tr.${whereColumn} = ?
      ORDER BY ${createdAtColumn} DESC
    `;

    const [rows] = await db.query(
      sql,
      [whereValue]
    );

    const trips = (rows as DbRow[]).map(
      (trip) => {
        const id =
          trip.id ??
          trip.trip_request_id ??
          trip.request_id ??
          null;

        const origin =
          trip.origin ??
          trip.pickup_address ??
          trip.pickup_location ??
          trip.pickup ??
          "";

        const destination =
          trip.destination ??
          trip.destination_address ??
          trip.dropoff_address ??
          trip.dropoff_location ??
          trip.dropoff ??
          "";

        const rawFare =
          trip.fare ??
          trip.base_fare ??
          trip.total_fare ??
          trip.amount ??
          trip.total ??
          trip.price ??
          trip.cost ??
          trip.estimated_fare ??
          trip.final_fare ??
          trip.actual_fare ??
          trip.fare_amount ??
          trip.valor ??
          trip.valor_viagem ??
          null;

        const fare =
          rawFare !== null &&
          rawFare !== undefined &&
          rawFare !== ""
            ? Number(rawFare)
            : 0;

        const status =
          trip.status ??
          trip.trip_status ??
          trip.current_status ??
          "pending";

        return {
          ...trip,
          id,
          trip_request_id: id,
          driver_id:
            trip.driver_id ??
            driverId ??
            null,
          passenger_id:
            trip.passenger_id ??
            trip.customer_id ??
            trip.user_id ??
            trip.usuario_id ??
            null,
          pickup_address:
            String(
              origin || "Não informado"
            ),
          destination_address:
            String(
              destination || "Não informado"
            ),
          origin:
            String(
              origin || "Não informado"
            ),
          destination:
            String(
              destination ||
                "Não informado"
            ),
          valor:
            Number.isFinite(fare)
              ? fare
              : 0,
          current_status:
            String(status),
          status:
            String(status),
          created_at:
            trip.created_at ??
            trip.updated_at ??
            null,
        };
      }
    );

    return NextResponse.json(
      {
        success: true,
        user_id: userId,
        user_type: userType,
        driver_id: driverId,
        trips,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        trips: [],
        message:
          error instanceof Error
            ? error.message
            : "Erro ao carregar viagens.",
      },
      { status: 500 }
    );
  }
}