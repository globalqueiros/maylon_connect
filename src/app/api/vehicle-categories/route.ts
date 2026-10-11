import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        name,
        description,
        image,
        type,
        is_active
      FROM vehicle_categories
      WHERE is_active = 1
        AND deleted_at IS NULL
      ORDER BY name ASC
    `);

    return NextResponse.json({
      categories: rows,
    });
  } catch (error) {
    console.error("Erro ao buscar categorias dos veículos:", error);

    return NextResponse.json(
      {
        error: "Não foi possível carregar as categorias dos veículos.",
      },
      { status: 500 }
    );
  }
}