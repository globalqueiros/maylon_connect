import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";

  try {
    const [rows] = await db.query(
      `SELECT * FROM produtos 
       WHERE nome LIKE ? 
       ORDER BY id DESC`,
      [`%${search}%`]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 }
    );
  }
}