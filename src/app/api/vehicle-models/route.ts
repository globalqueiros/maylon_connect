import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const brandId = searchParams.get("brand_id");

    // Sem marca informada, não retorna modelos
    if (!brandId) {
      return NextResponse.json({
        models: [],
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        id,
        name,
        brand_id
      FROM vehicle_models
      WHERE brand_id = ?
      ORDER BY name ASC
      `,
      [brandId]
    );

    return NextResponse.json({
      models: rows,
    });
  } catch (error) {
    console.error("Erro ao buscar modelos dos veículos:", error);

    return NextResponse.json(
      {
        error: "Não foi possível carregar os modelos dos veículos.",
      },
      { status: 500 }
    );
  }
}