import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }

    const [rows] = await db.query(
      "SELECT user_id, ip, user_agent, refresh_token, created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erro ao buscar sessões:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}