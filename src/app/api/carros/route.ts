import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        nome,
        modelo,
        preco,
        ano,
        km,
        cidade,
        imagens,
        descricao
      FROM carros
      ORDER BY id DESC
    `);

    return NextResponse.json(rows, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "Erro ao buscar carros",
      },
      {
        status: 500,
      }
    );
  }
}