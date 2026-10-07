import { NextRequest, NextResponse } from "next/server";
import { db } from "../../lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ajuste aqui se os nomes das tabelas forem diferentes no seu banco
const TABLE_BRANDS = "vehicle_brands";
const TABLE_MODELS = "vehicle_models";
const TABLE_CATEGORIES = "vehicle_categories";

type CreateVehicleBody = {
  brand_id: string;
  model_id: string;
  category_id: string;
  // o front envia "licence_*"; "license_*" continua aceito por compatibilidade
  licence_plate_number?: string;
  license_plate_number?: string;
  licence_expire_date?: string;
  license_expire_date?: string;
  vin_number: string;
  transmission: string;
  parcel_weight_capacity: number;
  fuel_type: string;
  ownership: string;
};

type ColumnRow = RowDataPacket & {
  Field: string;
};

type VehicleRow = RowDataPacket;

const PLATE_COLUMNS = [
  "licence_plate_number",
  "license_plate_number",
  "license_plate",
  "plate",
  "placa",
];

const EXPIRE_COLUMNS = [
  "licence_expire_date",
  "license_expire_date",
  "license_expiration_date",
  "licence_expiration_date",
];

const VIN_COLUMNS = ["vin_number", "vin", "chassis", "chassi"];

const WEIGHT_COLUMNS = ["parcel_weight_capacity", "weight_capacity"];

const FUEL_COLUMNS = ["fuel_type", "fuel"];

async function getVehicleColumns(): Promise<Set<string>> {
  const [rows] = await db.query<ColumnRow[]>("SHOW COLUMNS FROM vehicles");
  return new Set(rows.map((row) => row.Field));
}

async function tableHasColumn(table: string, column: string): Promise<boolean> {
  try {
    const [rows] = await db.query<ColumnRow[]>(
      `SHOW COLUMNS FROM ${columnName(table)}`
    );
    return rows.some((row) => row.Field === column);
  } catch {
    return false;
  }
}

function findColumn(columns: Set<string>, names: string[]): string | null {
  for (const name of names) {
    if (columns.has(name)) return name;
  }
  return null;
}

function columnName(name: string): string {
  return `\`${name.replace(/`/g, "``")}\``;
}

async function getAuthenticatedDriverId(request: NextRequest): Promise<string | null> {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) return null;

    const meUrl = new URL("/api/me", request.url);
    const response = await fetch(meUrl, {
      method: "GET",
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = await response.json();
    const usuario = data?.usuario ?? data?.user ?? data?.data ?? data;
    const driverId =
      usuario?.id ??
      usuario?.user_id ??
      usuario?.usuario_id ??
      data?.driver_id ??
      data?.user_id;

    return driverId ? String(driverId) : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const driverId = await getAuthenticatedDriverId(request);

    if (!driverId) {
      return NextResponse.json(
        { success: false, message: "Motorista não autenticado." },
        { status: 401 }
      );
    }

    const columns = await getVehicleColumns();
    const driverColumn = findColumn(columns, ["driver_id", "motorista_id"]);

    if (!driverColumn) {
      throw new Error("A tabela vehicles não possui coluna driver_id/motorista_id.");
    }

    if (!columns.has("id")) {
      throw new Error("A tabela vehicles não possui coluna id.");
    }

    const deletedColumn = findColumn(columns, ["deleted_at"]);
    const plateColumn = findColumn(columns, PLATE_COLUMNS);
    const expireColumn = findColumn(columns, EXPIRE_COLUMNS);
    const vinColumn = findColumn(columns, VIN_COLUMNS);
    const weightColumn = findColumn(columns, WEIGHT_COLUMNS);
    const fuelColumn = findColumn(columns, FUEL_COLUMNS);
    const denyColumn = findColumn(columns, ["deny_note", "denied_note"]);

    const hasBrand = columns.has("brand_id");
    const hasModel = columns.has("model_id");
    const hasCategory = columns.has("category_id");

    const selectParts: string[] = ["v.*"];
    const joinParts: string[] = [];

    if (hasBrand) {
      selectParts.push("b.name AS brand_name");
      joinParts.push(
        `LEFT JOIN ${columnName(TABLE_BRANDS)} b ON b.id = v.brand_id`
      );
    }

    // só seleciona a coluna image se ela existir na tabela
    const hasModelImage = hasModel
      ? await tableHasColumn(TABLE_MODELS, "image")
      : false;

    if (hasModel) {
      selectParts.push("m.name AS model_name");
      if (hasModelImage) selectParts.push("m.image AS model_image");
      joinParts.push(
        `LEFT JOIN ${columnName(TABLE_MODELS)} m ON m.id = v.model_id`
      );
    }

    if (hasCategory) {
      selectParts.push("c.name AS category_name", "c.image AS category_image");
      joinParts.push(
        `LEFT JOIN ${columnName(TABLE_CATEGORIES)} c ON c.id = v.category_id`
      );
    }

    let sql = `
      SELECT ${selectParts.join(", ")}
      FROM vehicles v
      ${joinParts.join("\n      ")}
      WHERE v.${columnName(driverColumn)} = ?
    `;

    const params: unknown[] = [driverId];

    if (deletedColumn) {
      sql += ` AND v.${columnName(deletedColumn)} IS NULL`;
    }

    if (columns.has("created_at")) {
      sql += ` ORDER BY v.${columnName("created_at")} DESC`;
    } else {
      sql += ` ORDER BY v.${columnName("id")} DESC`;
    }

    const [rows] = await db.execute<VehicleRow[]>(sql, params);

    // Normaliza os nomes das colunas para o que o front espera,
    // independente de como estão no banco (licence/license, vin/chassi, etc.)
    const vehicles = rows.map((row) => ({
      ...row,
      licence_plate_number: plateColumn ? row[plateColumn] : null,
      licence_expire_date: expireColumn ? row[expireColumn] : null,
      vin_number: vinColumn ? row[vinColumn] : null,
      parcel_weight_capacity: weightColumn ? row[weightColumn] : null,
      fuel_type: fuelColumn ? row[fuelColumn] : null,
      deny_note: denyColumn ? row[denyColumn] : null,
      brand_name: row.brand_name ?? null,
      model_name: row.model_name ?? null,
      category_name: row.category_name ?? null,
      category_image: row.category_image ?? null,
      model_image: row.model_image ?? null,
    }));

    return NextResponse.json({
      success: true,
      vehicles,
      total: vehicles.length,
    });
  } catch (error: any) {
    console.error("ERRO GET /api/vehicles:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message || "Não foi possível carregar os veículos.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const driverId = await getAuthenticatedDriverId(request);

    if (!driverId) {
      return NextResponse.json(
        { success: false, message: "Motorista não autenticado." },
        { status: 401 }
      );
    }

    let body: CreateVehicleBody;

    try {
      body = (await request.json()) as CreateVehicleBody;
    } catch {
      return NextResponse.json(
        { success: false, message: "JSON inválido." },
        { status: 400 }
      );
    }

    const plateInput = body.licence_plate_number ?? body.license_plate_number;
    const expireInput = body.licence_expire_date ?? body.license_expire_date;

    if (
      !body.brand_id ||
      !body.model_id ||
      !body.category_id ||
      !plateInput ||
      !expireInput ||
      !body.vin_number ||
      !body.transmission ||
      !body.fuel_type ||
      !body.ownership
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Preencha todos os campos obrigatórios.",
        },
        { status: 400 }
      );
    }

    const placa = String(plateInput).trim().toUpperCase();

    const vin = String(body.vin_number).trim().toUpperCase();

    const transmission = String(body.transmission).trim().toLowerCase();

    const fuelType = String(body.fuel_type).trim().toLowerCase();

    const ownership = String(body.ownership).trim().toLowerCase();

    const peso = Number(body.parcel_weight_capacity);

    if (Number.isNaN(peso) || peso < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "A capacidade de peso é inválida.",
        },
        { status: 400 }
      );
    }

    const columns = await getVehicleColumns();
    const driverColumn = findColumn(columns, ["driver_id", "motorista_id"]);

    if (!driverColumn) {
      throw new Error("A tabela vehicles não possui driver_id/motorista_id.");
    }

    const plateColumn = findColumn(columns, PLATE_COLUMNS);
    const vinColumn = findColumn(columns, VIN_COLUMNS);

    if (!plateColumn) {
      throw new Error("Não encontrei a coluna da placa na tabela vehicles.");
    }

    if (!vinColumn) {
      throw new Error("Não encontrei a coluna do VIN/chassi na tabela vehicles.");
    }

    const deletedColumn = findColumn(columns, ["deleted_at"]);

    let checkPlateSql = `
      SELECT id
      FROM vehicles
      WHERE ${columnName(plateColumn)} = ?
    `;

    const checkPlateParams: unknown[] = [placa];

    if (deletedColumn) {
      checkPlateSql += ` AND ${columnName(deletedColumn)} IS NULL`;
    }

    checkPlateSql += " LIMIT 1";

    const [plateRows] = await db.execute<RowDataPacket[]>(
      checkPlateSql,
      checkPlateParams
    );

    if (plateRows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Esta placa já está cadastrada.",
        },
        { status: 409 }
      );
    }

    let checkVinSql = `
      SELECT id
      FROM vehicles
      WHERE ${columnName(vinColumn)} = ?
    `;

    const checkVinParams: unknown[] = [vin];

    if (deletedColumn) {
      checkVinSql += ` AND ${columnName(deletedColumn)} IS NULL`;
    }

    checkVinSql += " LIMIT 1";

    const [vinRows] = await db.execute<RowDataPacket[]>(
      checkVinSql,
      checkVinParams
    );

    if (vinRows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Este chassi/VIN já está cadastrado.",
        },
        { status: 409 }
      );
    }

    const insertColumns: string[] = [];
    const insertValues: string[] = [];
    const insertParams: unknown[] = [];

    if (columns.has("ref_id")) {
      insertColumns.push("ref_id");
      insertValues.push("UUID()");
    }

    if (columns.has("brand_id")) {
      insertColumns.push("brand_id");
      insertValues.push("?");
      insertParams.push(body.brand_id);
    }

    if (columns.has("model_id")) {
      insertColumns.push("model_id");
      insertValues.push("?");
      insertParams.push(body.model_id);
    }

    if (columns.has("category_id")) {
      insertColumns.push("category_id");
      insertValues.push("?");
      insertParams.push(body.category_id);
    }

    insertColumns.push(plateColumn);
    insertValues.push("?");
    insertParams.push(placa);

    const expireColumn = findColumn(columns, EXPIRE_COLUMNS);

    if (expireColumn) {
      insertColumns.push(expireColumn);
      insertValues.push("?");
      insertParams.push(expireInput);
    }

    insertColumns.push(vinColumn);
    insertValues.push("?");
    insertParams.push(vin);

    if (columns.has("transmission")) {
      insertColumns.push("transmission");
      insertValues.push("?");
      insertParams.push(transmission);
    }

    const weightColumn = findColumn(columns, WEIGHT_COLUMNS);

    if (weightColumn) {
      insertColumns.push(weightColumn);
      insertValues.push("?");
      insertParams.push(peso);
    }

    const fuelColumn = findColumn(columns, FUEL_COLUMNS);

    if (fuelColumn) {
      insertColumns.push(fuelColumn);
      insertValues.push("?");
      insertParams.push(fuelType);
    }

    if (columns.has("ownership")) {
      insertColumns.push("ownership");
      insertValues.push("?");
      insertParams.push(ownership);
    }

    insertColumns.push(driverColumn);
    insertValues.push("?");
    insertParams.push(driverId);

    if (columns.has("is_active")) {
      insertColumns.push("is_active");
      insertValues.push("0");
    }

    if (columns.has("draft")) {
      insertColumns.push("draft");
      insertValues.push("0");
    }

    if (columns.has("vehicle_request_status")) {
      insertColumns.push("vehicle_request_status");
      insertValues.push("'pending'");
    }

    if (columns.has("approved")) {
      insertColumns.push("approved");
      insertValues.push("0");
    }

    const denyColumn = findColumn(columns, ["deny_note", "denied_note"]);

    if (denyColumn) {
      insertColumns.push(denyColumn);
      insertValues.push("NULL");
    }

    if (deletedColumn) {
      insertColumns.push(deletedColumn);
      insertValues.push("NULL");
    }

    if (columns.has("created_at")) {
      insertColumns.push("created_at");
      insertValues.push("NOW()");
    }

    if (columns.has("updated_at")) {
      insertColumns.push("updated_at");
      insertValues.push("NOW()");
    }

    const insertSql = `
      INSERT INTO vehicles (${insertColumns.map(columnName).join(", ")})
      VALUES (${insertValues.join(", ")})
    `;

    const [result] = await db.execute<ResultSetHeader>(
      insertSql,
      insertParams
    );

    return NextResponse.json(
      {
        success: true,
        message: "Veículo cadastrado e enviado para aprovação da equipe.",
        vehicle: {
          id: result.insertId,
          licence_plate_number: placa,
          vin_number: vin,
          approved: 0,
          vehicle_request_status: "pending",
          is_active: 0,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("ERRO POST /api/vehicles:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message || "Não foi possível cadastrar o veículo.",
      },
      { status: 500 }
    );
  }
}