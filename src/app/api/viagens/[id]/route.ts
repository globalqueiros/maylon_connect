import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

type Row = Record<string, unknown>;

export async function GET(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const viagemId = String(id ?? "").trim();

    if (!viagemId) {
      return NextResponse.json(
        {
          success: false,
          error: "ID da viagem não informado.",
        },
        { status: 400 }
      );
    }

    const [tripRows] = await db.execute({
      sql: `
        SELECT *
        FROM trip_requests
        WHERE id = ?
           OR ref_id = ?
        LIMIT 1
      `,
      values: [viagemId, viagemId],
    });

    const viagens = tripRows as Row[];

    if (viagens.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Viagem não encontrada.",
          id: viagemId,
        },
        { status: 404 }
      );
    }

    const viagem = viagens[0];

    const tripRequestId = viagem.id;

    if (
      tripRequestId === null ||
      tripRequestId === undefined ||
      tripRequestId === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A viagem não possui um ID interno válido.",
          id: viagemId,
        },
        { status: 500 }
      );
    }

    const [
      coordinateResult,
      feeResult,
      statusResult,
    ] = await Promise.all([
      db.execute({
        sql: `
          SELECT *
          FROM trip_request_coordinates
          WHERE trip_request_id = ?
          ORDER BY id ASC
        `,
        values: [tripRequestId],
      }),

      db.execute({
        sql: `
          SELECT *
          FROM trip_request_fees
          WHERE trip_request_id = ?
          ORDER BY id ASC
        `,
        values: [tripRequestId],
      }),

      db.execute({
        sql: `
          SELECT *
          FROM trip_status
          WHERE trip_request_id = ?
          ORDER BY id ASC
        `,
        values: [tripRequestId],
      }),
    ]);

    const coordenadas = coordinateResult[0] as Row[];
    const taxas = feeResult[0] as Row[];
    const statusHistorico = statusResult[0] as Row[];

    const ultimoStatus =
      statusHistorico.length > 0
        ? statusHistorico[statusHistorico.length - 1]
        : null;

    const zoneId = viagem.zone_id;
    const vehicleCategoryId =
      viagem.vehicle_category_id;

    let tarifa: Row | null = null;
    let tarifas: Row[] = [];

    if (
      zoneId !== null &&
      zoneId !== undefined &&
      zoneId !== "" &&
      vehicleCategoryId !== null &&
      vehicleCategoryId !== undefined &&
      vehicleCategoryId !== ""
    ) {
      const [fareRows] = await db.execute({
        sql: `
          SELECT *
          FROM trip_fares
          WHERE zone_id = ?
            AND vehicle_category_id = ?
          ORDER BY id DESC
        `,
        values: [
          zoneId,
          vehicleCategoryId,
        ],
      });

      tarifas = fareRows as Row[];

      if (tarifas.length > 0) {
        tarifa = tarifas[0];
      }
    }

    const coordenada =
      coordenadas.length > 0
        ? coordenadas[0]
        : null;

    const data = {
      ...viagem,

      id: viagem.ref_id ?? viagem.id ?? viagemId,
      ref_id: viagem.ref_id ?? viagem.id ?? viagemId,

      internal_id: viagem.id,
      trip_request_id: viagem.id,

      coordinates: coordenadas,
      coordenadas,

      coordinate: coordenada,
      coordenada,

      fees: taxas,
      taxas,

      statuses: statusHistorico,
      status_history: statusHistorico,
      historico_status: statusHistorico,

      latest_status: ultimoStatus,
      ultimo_status: ultimoStatus,

      fare: tarifa,
      tarifa,

      fares: tarifas,
      tarifas,

      fare_id: tarifa?.id ?? null,

      fare_zone_id:
        tarifa?.zone_id ??
        zoneId ??
        null,

      fare_vehicle_category_id:
        tarifa?.vehicle_category_id ??
        vehicleCategoryId ??
        null,
    };

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: unknown) {
    console.error(
      "Erro em /api/viagens/[id]:",
      error
    );

    const err = error as {
      message?: string;
      sqlMessage?: string;
      code?: string;
      errno?: number;
      sqlState?: string;
    };

    return NextResponse.json(
      {
        success: false,
        error:
          err.sqlMessage ||
          err.message ||
          "Erro ao buscar viagem.",
        code: err.code || null,
        errno: err.errno || null,
        sqlState: err.sqlState || null,
      },
      { status: 500 }
    );
  }
}