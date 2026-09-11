import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export const dynamic = "force-dynamic";

type DbRow = Record<string, any>;

function hasColumn(columns: string[], names: string[]) {
  return names.find((name) => columns.includes(name));
}

export async function GET() {
  try {
    const [tripRequestColumnsRows] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'trip_requests'
    `);

    const [tripFareColumnsRows] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'trip_fares'
    `);

    const [tripStatusColumnsRows] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'trip_status'
    `);

    const [tripCoordinatesColumnsRows] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'trip_request_coordinates'
    `);

    const requestColumns = (tripRequestColumnsRows as DbRow[]).map((row) =>
      String(row.COLUMN_NAME)
    );

    const fareColumns = (tripFareColumnsRows as DbRow[]).map((row) =>
      String(row.COLUMN_NAME)
    );

    const statusColumns = (tripStatusColumnsRows as DbRow[]).map((row) =>
      String(row.COLUMN_NAME)
    );

    const coordinateColumns = (
      tripCoordinatesColumnsRows as DbRow[]
    ).map((row) => String(row.COLUMN_NAME));

    const requestIdColumn = hasColumn(requestColumns, [
      "id",
      "trip_request_id",
      "request_id",
    ]);

    if (!requestIdColumn) {
      throw new Error(
        "A tabela trip_requests não possui uma coluna de ID compatível."
      );
    }

    const coordinateRequestColumn = hasColumn(coordinateColumns, [
      "trip_request_id",
      "trip_request",
      "request_id",
    ]);

    let coordinateJoin = "";

    if (coordinateRequestColumn) {
      coordinateJoin = `
        LEFT JOIN trip_request_coordinates tc
          ON tc.${coordinateRequestColumn} = tr.${requestIdColumn}
      `;
    }

    const hasPickupAddress = coordinateColumns.includes("pickup_address");
    const hasDestinationAddress = coordinateColumns.includes(
      "destination_address"
    );

    let originSelect = "NULL AS origin";
    let destinationSelect = "NULL AS destination";

    if (coordinateJoin && hasPickupAddress) {
      originSelect = "tc.pickup_address AS origin";
    }

    if (coordinateJoin && hasDestinationAddress) {
      destinationSelect = "tc.destination_address AS destination";
    }

    const statusRequestColumn = hasColumn(statusColumns, [
      "trip_request_id",
      "trip_request",
      "request_id",
    ]);

    let statusJoin = "";

    if (statusRequestColumn) {
      statusJoin = `
        LEFT JOIN trip_status ts
          ON ts.${statusRequestColumn} = tr.${requestIdColumn}
      `;
    }

    let fareJoin = "";

    if (fareColumns.includes("trip_request_id")) {
      fareJoin = `
        LEFT JOIN trip_fares tf
          ON tf.trip_request_id = tr.${requestIdColumn}
      `;
    } else if (
      requestColumns.includes("trip_fare_id") &&
      fareColumns.includes("id")
    ) {
      fareJoin = `
        LEFT JOIN trip_fares tf
          ON tf.id = tr.trip_fare_id
      `;
    } else if (
      requestColumns.includes("zone_wise_default_trip_fare_id") &&
      fareColumns.includes("zone_wise_default_trip_fare_id")
    ) {
      fareJoin = `
        LEFT JOIN trip_fares tf
          ON tf.zone_wise_default_trip_fare_id =
             tr.zone_wise_default_trip_fare_id
      `;
    } else if (
      requestColumns.includes("default_trip_fare_id") &&
      fareColumns.includes("id")
    ) {
      fareJoin = `
        LEFT JOIN trip_fares tf
          ON tf.id = tr.default_trip_fare_id
      `;
    }

    const fareColumn = hasColumn(fareColumns, [
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
    ]);

    const requestFareColumn = hasColumn(requestColumns, [
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
    ]);

    let fareSelect = "NULL AS fare";

    if (fareJoin && fareColumn) {
      fareSelect = `tf.${fareColumn} AS fare`;
    } else if (requestFareColumn) {
      fareSelect = `tr.${requestFareColumn} AS fare`;
    }

    const directStatusColumn = hasColumn(statusColumns, [
      "status",
      "trip_status",
      "current_status",
    ]);

    let statusSelect = "NULL AS status";

    if (directStatusColumn && statusRequestColumn) {
      statusSelect = `ts.${directStatusColumn} AS status`;
    } else if (statusRequestColumn) {
      const statusCases: string[] = [];

      if (statusColumns.includes("returned")) {
        statusCases.push("WHEN ts.returned = 1 THEN 'returned'");
      }

      if (statusColumns.includes("returning")) {
        statusCases.push("WHEN ts.returning = 1 THEN 'returning'");
      }

      if (statusColumns.includes("completed")) {
        statusCases.push("WHEN ts.completed = 1 THEN 'completed'");
      }

      if (statusColumns.includes("cancelled")) {
        statusCases.push("WHEN ts.cancelled = 1 THEN 'cancelled'");
      }

      if (statusColumns.includes("failed")) {
        statusCases.push("WHEN ts.failed = 1 THEN 'failed'");
      }

      if (statusColumns.includes("ongoing")) {
        statusCases.push("WHEN ts.ongoing = 1 THEN 'ongoing'");
      }

      if (statusColumns.includes("picked_up")) {
        statusCases.push("WHEN ts.picked_up = 1 THEN 'picked_up'");
      }

      if (statusColumns.includes("out_for_pickup")) {
        statusCases.push(
          "WHEN ts.out_for_pickup = 1 THEN 'out_for_pickup'"
        );
      }

      if (statusColumns.includes("accepted")) {
        statusCases.push("WHEN ts.accepted = 1 THEN 'accepted'");
      }

      if (statusColumns.includes("pending")) {
        statusCases.push("WHEN ts.pending = 1 THEN 'pending'");
      }

      if (statusCases.length > 0) {
        statusSelect = `
          CASE
            ${statusCases.join("\n")}
            ELSE NULL
          END AS status
        `;
      }
    }

    const requestStatusColumn = hasColumn(requestColumns, [
      "status",
      "trip_status",
      "current_status",
    ]);

    if (
      requestStatusColumn &&
      !directStatusColumn &&
      !statusRequestColumn
    ) {
      statusSelect = `tr.${requestStatusColumn} AS status`;
    }

    const [rows] = await db.query(`
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
      ORDER BY tr.created_at DESC
    `);

    const trips: DbRow[] = (rows as DbRow[]).map(
      (trip: DbRow): DbRow => {
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
          null;

        const destination =
          trip.destination ??
          trip.destination_address ??
          trip.dropoff_address ??
          trip.dropoff_location ??
          trip.dropoff ??
          null;

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
          null;

        let fare: number | null = null;

        if (
          rawFare !== null &&
          rawFare !== undefined &&
          rawFare !== ""
        ) {
          const parsed = Number(rawFare);

          if (!Number.isNaN(parsed)) {
            fare = parsed;
          }
        }

        const rawStatus =
          trip.status ??
          trip.trip_status ??
          trip.current_status ??
          null;

        return {
          ...trip,
          id,
          trip_request_id: trip.trip_request_id ?? id,
          origin,
          destination,
          fare,
          amount: fare,
          status:
            rawStatus !== null && rawStatus !== undefined
              ? String(rawStatus)
              : null,
        };
      }
    );

    return NextResponse.json({
      success: true,
      trips,
    });
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
      {
        status: 500,
      }
    );
  }
}