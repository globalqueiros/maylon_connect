import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "../../lib/db";
import type {
  ResultSetHeader,
  RowDataPacket,
} from "mysql2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

type CreateVehicleBody = {
  brand_id: string;
  model_id: string;
  category_id: string;

  license_plate_number: string;
  license_expire_date: string;

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

/*
|--------------------------------------------------------------------------
| FUNÇÕES AUXILIARES
|--------------------------------------------------------------------------
*/

/**
 * Retorna todas as colunas existentes na tabela vehicles.
 *
 * Isso evita que a API quebre caso o banco use um nome
 * diferente para placa, VIN, aprovação etc.
 */
async function getVehicleColumns(): Promise<Set<string>> {
  const [rows] = await db.query<ColumnRow[]>(
    `
      SHOW COLUMNS FROM vehicles
    `
  );

  return new Set(
    rows.map((row) => row.Field)
  );
}

/**
 * Procura a primeira coluna disponível.
 */
function findColumn(
  columns: Set<string>,
  names: string[]
): string | null {
  for (const name of names) {
    if (columns.has(name)) {
      return name;
    }
  }

  return null;
}

/**
 * Escapa nome de coluna.
 *
 * Os nomes usados aqui vêm exclusivamente do SHOW COLUMNS,
 * portanto não vêm diretamente do usuário.
 */
function columnName(name: string): string {
  return `\`${name.replace(/`/g, "``")}\``;
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
|
| Busca os veículos do motorista logado.
|
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    console.log("======================================");
    console.log("GET /api/vehicles");

    /*
    |--------------------------------------------------------------------------
    | COOKIE
    |--------------------------------------------------------------------------
    */

    const cookieStore = await cookies();

    const driverId =
      cookieStore.get("driver_id")?.value;

    console.log(
      "Motorista:",
      driverId || "não encontrado"
    );

    if (!driverId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Motorista não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DESCOBRIR COLUNAS
    |--------------------------------------------------------------------------
    */

    const columns =
      await getVehicleColumns();

    /*
    |--------------------------------------------------------------------------
    | COLUNAS PRINCIPAIS
    |--------------------------------------------------------------------------
    */

    const driverColumn =
      findColumn(columns, [
        "driver_id",
        "motorista_id",
      ]);

    if (!driverColumn) {
      throw new Error(
        "A tabela vehicles não possui coluna driver_id/motorista_id."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | COLUNA DELETE
    |--------------------------------------------------------------------------
    */

    const deletedColumn =
      findColumn(columns, [
        "deleted_at",
      ]);

    /*
    |--------------------------------------------------------------------------
    | SELECT
    |--------------------------------------------------------------------------
    */

    const possibleColumns = [
      "id",
      "ref_id",

      "brand_id",
      "model_id",
      "category_id",

      "license_plate_number",
      "license_plate",
      "plate",
      "placa",

      "license_expire_date",
      "license_expiration_date",

      "vin_number",
      "vin",
      "chassis",
      "chassi",

      "transmission",

      "parcel_weight_capacity",
      "weight_capacity",

      "fuel_type",
      "fuel",

      "ownership",

      "driver_id",
      "motorista_id",

      "is_active",

      "draft",

      "vehicle_request_status",

      "approved",

      "approved_at",

      "deny_note",

      "denied_note",

      "deleted_at",

      "created_at",
      "updated_at",
    ];

    const selectColumns =
      possibleColumns.filter(
        (column) =>
          columns.has(column)
      );

    if (
      !selectColumns.includes("id")
    ) {
      throw new Error(
        "A tabela vehicles não possui coluna id."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SQL
    |--------------------------------------------------------------------------
    */

    let sql = `
      SELECT
        ${selectColumns
          .map(columnName)
          .join(",\n        ")}
      FROM vehicles
      WHERE ${columnName(driverColumn)} = ?
    `;

    const params: unknown[] = [
      driverId,
    ];

    if (deletedColumn) {
      sql += `
        AND ${columnName(
          deletedColumn
        )} IS NULL
      `;
    }

    /*
    |--------------------------------------------------------------------------
    | ORDEM
    |--------------------------------------------------------------------------
    */

    if (columns.has("created_at")) {
      sql += `
        ORDER BY created_at DESC
      `;
    } else if (columns.has("id")) {
      sql += `
        ORDER BY id DESC
      `;
    }

    /*
    |--------------------------------------------------------------------------
    | EXECUTAR
    |--------------------------------------------------------------------------
    */

    const [rows] =
      await db.execute<VehicleRow[]>(
        sql,
        params
      );

    /*
    |--------------------------------------------------------------------------
    | RESPOSTA
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        vehicles: rows,

        total: rows.length,
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(
      "======================================"
    );

    console.error(
      "ERRO GET /api/vehicles:"
    );

    console.error(error);

    console.error(
      "Mensagem:",
      error?.message
    );

    console.error(
      "======================================"
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Não foi possível carregar os veículos.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
|
| Cadastra veículo.
|
| IMPORTANTE:
|
| O veículo NÃO fica aprovado automaticamente.
|
| Se existir:
|
| approved
|
| será criado com:
|
| approved = 0
|
| Se existir:
|
| vehicle_request_status
|
| será:
|
| pending
|
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  try {
    console.log(
      "======================================"
    );

    console.log(
      "POST /api/vehicles"
    );

    /*
    |--------------------------------------------------------------------------
    | COOKIE
    |--------------------------------------------------------------------------
    */

    const cookieStore =
      await cookies();

    const driverId =
      cookieStore.get("driver_id")?.value;

    console.log(
      "Motorista:",
      driverId || "não encontrado"
    );

    if (!driverId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Motorista não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | BODY
    |--------------------------------------------------------------------------
    */

    let body: CreateVehicleBody;

    try {
      body =
        (await request.json()) as CreateVehicleBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "JSON inválido.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDAÇÃO
    |--------------------------------------------------------------------------
    */

    if (
      !body.brand_id ||
      !body.model_id ||
      !body.category_id ||
      !body.license_plate_number ||
      !body.license_expire_date ||
      !body.vin_number ||
      !body.transmission ||
      !body.fuel_type ||
      !body.ownership
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Preencha todos os campos obrigatórios.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZAÇÃO
    |--------------------------------------------------------------------------
    */

    const placa =
      String(
        body.license_plate_number
      )
        .trim()
        .toUpperCase();

    const vin =
      String(body.vin_number)
        .trim()
        .toUpperCase();

    const transmission =
      String(body.transmission)
        .trim()
        .toLowerCase();

    const fuelType =
      String(body.fuel_type)
        .trim()
        .toLowerCase();

    const ownership =
      String(body.ownership)
        .trim()
        .toLowerCase();

    const peso =
      Number(
        body.parcel_weight_capacity
      );

    if (
      Number.isNaN(peso) ||
      peso < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A capacidade de peso é inválida.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | COLUNAS DO BANCO
    |--------------------------------------------------------------------------
    */

    const columns =
      await getVehicleColumns();

    /*
    |--------------------------------------------------------------------------
    | COLUNAS OBRIGATÓRIAS
    |--------------------------------------------------------------------------
    */

    const driverColumn =
      findColumn(columns, [
        "driver_id",
        "motorista_id",
      ]);

    if (!driverColumn) {
      throw new Error(
        "A tabela vehicles não possui driver_id/motorista_id."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PLACA
    |--------------------------------------------------------------------------
    */

    const plateColumn =
      findColumn(columns, [
        "license_plate_number",
        "license_plate",
        "plate",
        "placa",
      ]);

    /*
    |--------------------------------------------------------------------------
    | VIN
    |--------------------------------------------------------------------------
    */

    const vinColumn =
      findColumn(columns, [
        "vin_number",
        "vin",
        "chassis",
        "chassi",
      ]);

    /*
    |--------------------------------------------------------------------------
    | SE NÃO EXISTIR PLACA
    |--------------------------------------------------------------------------
    */

    if (!plateColumn) {
      throw new Error(
        "Não encontrei a coluna da placa na tabela vehicles. Verifique a estrutura da tabela."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SE NÃO EXISTIR VIN
    |--------------------------------------------------------------------------
    */

    if (!vinColumn) {
      throw new Error(
        "Não encontrei a coluna do VIN/chassi na tabela vehicles. Verifique a estrutura da tabela."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFICAR PLACA
    |--------------------------------------------------------------------------
    */

    const deletedColumn =
      findColumn(columns, [
        "deleted_at",
      ]);

    let checkPlateSql = `
      SELECT id
      FROM vehicles
      WHERE ${columnName(
        plateColumn
      )} = ?
    `;

    const checkPlateParams: unknown[] =
      [placa];

    if (deletedColumn) {
      checkPlateSql += `
        AND ${columnName(
          deletedColumn
        )} IS NULL
      `;
    }

    checkPlateSql += `
      LIMIT 1
    `;

    const [plateRows] =
      await db.execute<RowDataPacket[]>(
        checkPlateSql,
        checkPlateParams
      );

    if (plateRows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Esta placa já está cadastrada.",
        },
        {
          status: 409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFICAR VIN
    |--------------------------------------------------------------------------
    */

    let checkVinSql = `
      SELECT id
      FROM vehicles
      WHERE ${columnName(
        vinColumn
      )} = ?
    `;

    const checkVinParams: unknown[] =
      [vin];

    if (deletedColumn) {
      checkVinSql += `
        AND ${columnName(
          deletedColumn
        )} IS NULL
      `;
    }

    checkVinSql += `
      LIMIT 1
    `;

    const [vinRows] =
      await db.execute<RowDataPacket[]>(
        checkVinSql,
        checkVinParams
      );

    if (vinRows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Este chassi/VIN já está cadastrado.",
        },
        {
          status: 409,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | MONTAR INSERT
    |--------------------------------------------------------------------------
    */

    const insertColumns: string[] =
      [];

    const insertValues: string[] =
      [];

    const insertParams: unknown[] =
      [];

    /*
    |--------------------------------------------------------------------------
    | REF ID
    |--------------------------------------------------------------------------
    */

    if (columns.has("ref_id")) {
      insertColumns.push(
        "ref_id"
      );

      insertValues.push(
        "UUID()"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | BRAND
    |--------------------------------------------------------------------------
    */

    if (columns.has("brand_id")) {
      insertColumns.push(
        "brand_id"
      );

      insertValues.push("?");

      insertParams.push(
        body.brand_id
      );
    }

    /*
    |--------------------------------------------------------------------------
    | MODEL
    |--------------------------------------------------------------------------
    */

    if (columns.has("model_id")) {
      insertColumns.push(
        "model_id"
      );

      insertValues.push("?");

      insertParams.push(
        body.model_id
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORY
    |--------------------------------------------------------------------------
    */

    if (columns.has("category_id")) {
      insertColumns.push(
        "category_id"
      );

      insertValues.push("?");

      insertParams.push(
        body.category_id
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PLACA
    |--------------------------------------------------------------------------
    */

    insertColumns.push(
      plateColumn
    );

    insertValues.push("?");

    insertParams.push(
      placa
    );

    /*
    |--------------------------------------------------------------------------
    | DATA VALIDADE
    |--------------------------------------------------------------------------
    */

    const expireColumn =
      findColumn(columns, [
        "license_expire_date",
        "license_expiration_date",
      ]);

    if (expireColumn) {
      insertColumns.push(
        expireColumn
      );

      insertValues.push("?");

      insertParams.push(
        body.license_expire_date
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VIN
    |--------------------------------------------------------------------------
    */

    insertColumns.push(
      vinColumn
    );

    insertValues.push("?");

    insertParams.push(
      vin
    );

    /*
    |--------------------------------------------------------------------------
    | TRANSMISSÃO
    |--------------------------------------------------------------------------
    */

    if (columns.has("transmission")) {
      insertColumns.push(
        "transmission"
      );

      insertValues.push("?");

      insertParams.push(
        transmission
      );
    }

    /*
    |--------------------------------------------------------------------------
    | PESO
    |--------------------------------------------------------------------------
    */

    const weightColumn =
      findColumn(columns, [
        "parcel_weight_capacity",
        "weight_capacity",
      ]);

    if (weightColumn) {
      insertColumns.push(
        weightColumn
      );

      insertValues.push("?");

      insertParams.push(
        peso
      );
    }

    /*
    |--------------------------------------------------------------------------
    | COMBUSTÍVEL
    |--------------------------------------------------------------------------
    */

    const fuelColumn =
      findColumn(columns, [
        "fuel_type",
        "fuel",
      ]);

    if (fuelColumn) {
      insertColumns.push(
        fuelColumn
      );

      insertValues.push("?");

      insertParams.push(
        fuelType
      );
    }

    /*
    |--------------------------------------------------------------------------
    | OWNERSHIP
    |--------------------------------------------------------------------------
    */

    if (columns.has("ownership")) {
      insertColumns.push(
        "ownership"
      );

      insertValues.push("?");

      insertParams.push(
        ownership
      );
    }

    /*
    |--------------------------------------------------------------------------
    | MOTORISTA
    |--------------------------------------------------------------------------
    */

    insertColumns.push(
      driverColumn
    );

    insertValues.push("?");

    insertParams.push(
      driverId
    );

    /*
    |--------------------------------------------------------------------------
    | ATIVO
    |--------------------------------------------------------------------------
    */

    if (columns.has("is_active")) {
      insertColumns.push(
        "is_active"
      );

      insertValues.push("0");
    }

    /*
    |--------------------------------------------------------------------------
    | DRAFT
    |--------------------------------------------------------------------------
    */

    if (columns.has("draft")) {
      insertColumns.push(
        "draft"
      );

      insertValues.push("0");
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS DA SOLICITAÇÃO
    |--------------------------------------------------------------------------
    */

    if (
      columns.has(
        "vehicle_request_status"
      )
    ) {
      insertColumns.push(
        "vehicle_request_status"
      );

      insertValues.push(
        "'pending'"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | APPROVED
    |--------------------------------------------------------------------------
    |
    | Se sua tabela tiver approved:
    |
    | 0 = aguardando aprovação
    | 1 = aprovado
    |
    */

    if (columns.has("approved")) {
      insertColumns.push(
        "approved"
      );

      insertValues.push("0");
    }

    /*
    |--------------------------------------------------------------------------
    | DENY NOTE
    |--------------------------------------------------------------------------
    */

    const denyColumn =
      findColumn(columns, [
        "deny_note",
        "denied_note",
      ]);

    if (denyColumn) {
      insertColumns.push(
        denyColumn
      );

      insertValues.push(
        "NULL"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DELETED
    |--------------------------------------------------------------------------
    */

    if (deletedColumn) {
      insertColumns.push(
        deletedColumn
      );

      insertValues.push(
        "NULL"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATED
    |--------------------------------------------------------------------------
    */

    if (columns.has("created_at")) {
      insertColumns.push(
        "created_at"
      );

      insertValues.push(
        "NOW()"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATED
    |--------------------------------------------------------------------------
    */

    if (columns.has("updated_at")) {
      insertColumns.push(
        "updated_at"
      );

      insertValues.push(
        "NOW()"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SQL INSERT
    |--------------------------------------------------------------------------
    */

    const insertSql = `
      INSERT INTO vehicles (
        ${insertColumns
          .map(columnName)
          .join(",\n        ")}
      )
      VALUES (
        ${insertValues.join(",\n        ")}
      )
    `;

    console.log(
      "INSERT VEHICLE:",
      insertSql
    );

    /*
    |--------------------------------------------------------------------------
    | EXECUTAR
    |--------------------------------------------------------------------------
    */

    const [result] =
      await db.execute<ResultSetHeader>(
        insertSql,
        insertParams
      );

    /*
    |--------------------------------------------------------------------------
    | RESPOSTA
    |--------------------------------------------------------------------------
    */

    console.log(
      "Veículo cadastrado:",
      result.insertId
    );

    console.log(
      "======================================"
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "Veículo cadastrado e enviado para aprovação da equipe.",

        vehicle: {
          id: result.insertId,

          license_plate_number:
            placa,

          vin_number:
            vin,

          approved: 0,

          vehicle_request_status:
            "pending",

          is_active: 0,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "======================================"
    );

    console.error(
      "ERRO POST /api/vehicles:"
    );

    console.error(error);

    console.error(
      "Mensagem:",
      error?.message
    );

    console.error(
      "Código:",
      error?.code
    );

    console.error(
      "======================================"
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Não foi possível cadastrar o veículo.",
      },
      {
        status: 500,
      }
    );
  }
}
