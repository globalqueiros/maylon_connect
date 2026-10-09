import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(
      `
      SELECT id, name
      FROM vehicle_brands
      ORDER BY name ASC
      `
    );

    return NextResponse.json({ brands: rows });
  } catch (error) {
    console.error("Erro ao buscar marcas:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar as marcas." },
      { status: 500 }
    );
  }
}