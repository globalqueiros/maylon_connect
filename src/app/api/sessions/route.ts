import { NextRequest, NextResponse } from "next/server";
import { db } from "../../lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          error: "userId não informado.",
        },
        { status: 400 }
      );
    }

    const [rows] = await db.query(
      `
        SELECT
          id,
          user_id,
          ip,
          user_agent,
          refresh_token,
          created_at
        FROM sessions
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
      [userId]
    );

    return NextResponse.json(rows, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("ERRO API /api/sessions:", error);

    return NextResponse.json(
      {
        error: "Erro ao buscar sessões.",
      },
      { status: 500 }
    );
  }
}