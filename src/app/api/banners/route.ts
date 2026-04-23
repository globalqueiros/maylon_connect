import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET() {
  try {
    const [rows]: any = await db.query(
      "SELECT * FROM banners WHERE ativo = 1 ORDER BY id DESC"
    );

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar banners" }, { status: 500 });
  }
}