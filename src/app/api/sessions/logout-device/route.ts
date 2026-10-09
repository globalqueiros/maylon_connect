import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const sessionId =
      body?.id ??
      body?.session_id;

    if (
      sessionId === undefined ||
      sessionId === null ||
      String(sessionId).trim() === ""
    ) {
      return NextResponse.json(
        {
          error: "ID da sessão não informado.",
        },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      `
      DELETE FROM sessions
      WHERE id = ?
      `,
      [sessionId]
    );

    if (!result || result.affectedRows === 0) {
      return NextResponse.json(
        {
          error: "Sessão não encontrada.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Sessão encerrada com sucesso.",
      deleted_id: sessionId,
    });
  } catch (error) {
    console.error(
      "[LOGOUT DEVICE] Erro:",
      error
    );

    return NextResponse.json(
      {
        error: "Erro interno do servidor.",
      },
      { status: 500 }
    );
  }
}
