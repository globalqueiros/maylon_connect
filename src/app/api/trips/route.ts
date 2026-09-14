import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DbRow = Record<string, any>;

type JwtPayload = {
    id?: number | string;
    user_id?: number | string;
    driver_id?: string;
};

function findColumn(columns: string[], names: string[]) {
    return names.find((name) => columns.includes(name));
}

async function getColumns(table: string): Promise<string[]> {
    const [rows] = await db.query(
        `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
        `,
        [table]
    );

    return (rows as DbRow[]).map((row) =>
        String(row.COLUMN_NAME)
    );
}

/*
 * Procura o driver relacionado ao usuário logado.
 *
 * Primeiro tenta tabelas comuns:
 * drivers
 * driver
 * driver_profiles
 * driver_profile
 */
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

            if (!columns.length) {
                continue;
            }

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

            if (!idColumn || !userColumn) {
                continue;
            }

            const [rows] = await db.query(
                `
                SELECT ${idColumn} AS driver_id
                FROM ${table}
                WHERE ${userColumn} = ?
                LIMIT 1
                `,
                [userId]
            );

            const result = rows as DbRow[];

            if (result.length && result[0]?.driver_id != null) {
                return result[0].driver_id;
            }
        } catch (error) {
            console.log(
                `[TRIPS] Não foi possível consultar ${table}:`,
                error
            );
        }
    }

    return null;
}

export async function GET() {
    try {
        /*
         * =========================================================
         * 1. PEGAR USUÁRIO LOGADO
         * =========================================================
         */

        const cookieStore = await cookies();

        const token =
            cookieStore.get("access_token")?.value;

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

        /*
         * =========================================================
         * 2. VALIDAR JWT
         * =========================================================
         */

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            console.error(
                "[TRIPS] JWT_SECRET não configurado."
            );

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
        } catch (error) {
            console.error(
                "[TRIPS] Token inválido:",
                error
            );

            return NextResponse.json(
                {
                    success: false,
                    trips: [],
                    message: "Sessão inválida ou expirada.",
                },
                { status: 401 }
            );
        }

        /*
         * =========================================================
         * 3. ID DO USUÁRIO LOGADO
         * =========================================================
         */

        const userId =
            decoded.id ??
            decoded.user_id;

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

        console.log(
            "[TRIPS] Usuário logado:",
            userId
        );

        /*
         * =========================================================
         * 4. DESCOBRIR DRIVER_ID
         * =========================================================
         *
         * Se o JWT já tiver driver_id, usamos ele.
         *
         * Caso contrário, procuramos o motorista associado
         * ao usuário no banco.
         */

        let driverId =
            decoded.driver_id ?? null;

        if (!driverId) {
            driverId =
                (await getDriverIdFromUser(userId)) as
                    | string
                    | null;
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

        console.log(
            "[TRIPS] Driver logado:",
            driverId
        );

        /*
         * =========================================================
         * 5. DESCOBRIR COLUNAS
         * =========================================================
         */

        const requestColumns =
            await getColumns("trip_requests");

        const fareColumns =
            await getColumns("trip_fares");

        const statusColumns =
            await getColumns("trip_status");

        const coordinateColumns =
            await getColumns(
                "trip_request_coordinates"
            );

        /*
         * =========================================================
         * 6. DRIVER COLUMN
         * =========================================================
         */

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

        /*
         * =========================================================
         * 7. ID DA VIAGEM
         * =========================================================
         */

        const requestIdColumn =
            findColumn(
                requestColumns,
                [
                    "id",
                    "trip_request_id",
                    "request_id",
                ]
            );

        if (!requestIdColumn) {
            throw new Error(
                "A tabela trip_requests não possui uma coluna de ID compatível."
            );
        }

        /*
         * =========================================================
         * 8. COORDENADAS
         * =========================================================
         */

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
                    ON tc.${coordinateRequestColumn}
                    = tr.${requestIdColumn}
            `;
        }

        const pickupColumn =
            findColumn(
                coordinateColumns,
                [
                    "pickup_address",
                    "origin",
                    "pickup_location",
                    "pickup",
                ]
            );

        const destinationColumn =
            findColumn(
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

        /*
         * =========================================================
         * 9. STATUS
         * =========================================================
         */

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
                    ON ts.${statusRequestColumn}
                    = tr.${requestIdColumn}
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

        let statusSelect =
            "NULL AS status";

        if (
            directStatusColumn &&
            statusRequestColumn
        ) {
            statusSelect =
                `ts.${directStatusColumn} AS status`;
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

        /*
         * =========================================================
         * 10. VALOR
         * =========================================================
         */

        let fareJoin = "";

        if (
            fareColumns.includes(
                "trip_request_id"
            )
        ) {
            fareJoin = `
                LEFT JOIN trip_fares tf
                    ON tf.trip_request_id
                    = tr.${requestIdColumn}
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
                    ON tf.zone_wise_default_trip_fare_id
                    = tr.zone_wise_default_trip_fare_id
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

        const fareColumn =
            findColumn(
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

        const requestFareColumn =
            findColumn(
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
                ]
            );

        let fareSelect =
            "NULL AS fare";

        if (
            fareJoin &&
            fareColumn
        ) {
            fareSelect =
                `tf.${fareColumn} AS fare`;
        } else if (
            requestFareColumn
        ) {
            fareSelect =
                `tr.${requestFareColumn} AS fare`;
        }

        /*
         * =========================================================
         * 11. DATA
         * =========================================================
         */

        const createdAtColumn =
            requestColumns.includes("created_at")
                ? "tr.created_at"
                : `tr.${requestIdColumn}`;

        /*
         * =========================================================
         * 12. QUERY
         * =========================================================
         */

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

            WHERE tr.${driverColumn} = ?

            ORDER BY ${createdAtColumn} DESC
        `;

        console.log(
            "[TRIPS] user_id:",
            userId
        );

        console.log(
            "[TRIPS] driver_id:",
            driverId
        );

        console.log(
            "[TRIPS] driver_column:",
            driverColumn
        );

        const [rows] =
            await db.query(
                sql,
                [driverId]
            );

        /*
         * =========================================================
         * 13. NORMALIZAÇÃO
         * =========================================================
         */

        const trips =
            (rows as DbRow[]).map(
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
                        trip_request_id:
                            Number(id),

                        driver_id:
                            driverId,

                        pickup_address:
                            String(
                                origin ||
                                    "Não informado"
                            ),

                        destination_address:
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
                    };
                }
            );

        console.log(
            "[TRIPS] Total:",
            trips.length
        );

        /*
         * =========================================================
         * 14. RESPOSTA
         * =========================================================
         */

        return NextResponse.json(
            {
                success: true,
                user_id: userId,
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
        console.error(
            "[TRIPS] ERRO:",
            error
        );

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