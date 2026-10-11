import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { sessaoDaRequisicao } from "../../../lib/sessaoServidor";

export const runtime = "nodejs";

/**
 * Remove um registro da tabela antiga "sessions" — só do próprio usuário.
 * (Antes apagava qualquer sessão de qualquer pessoa, sem login.)
 * Para desconectar um aparelho de verdade use DELETE /api/motorista/sessoes/{session_uuid}.
 */
export async function POST(req: NextRequest) {
  try {
    const sessao = await sessaoDaRequisicao(req);
    if (!sessao.ok) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

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
      WHERE id = ? AND CAST(user_id AS CHAR) = ?
      `,
      [sessionId, sessao.userId]
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
