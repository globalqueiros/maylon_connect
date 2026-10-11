import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT categoria
      FROM produtos
      WHERE categoria IS NOT NULL
        AND categoria <> ''
      ORDER BY categoria ASC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);

    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );
  }
}
