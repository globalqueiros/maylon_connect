import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT * FROM faq"
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erro ao buscar FAQ:", error);

    return NextResponse.json(
      { error: "Erro ao carregar perguntas frequentes." },
      { status: 500 }
    );
  }
}