import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/session-auth";
import { db } from "../../../../lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    session_uuid: string;
  }>;
};

type UpdateResult = {
  affectedRows: number;
};

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authenticated = await getAuthenticatedUser();

    if (!authenticated?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const { session_uuid } = await context.params;

    if (
      !session_uuid ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        session_uuid
      )
    ) {
      return NextResponse.json(
        { error: "Identificador de sessão inválido." },
        { status: 400 }
      );
    }

    const userId = authenticated.user.id;

    const [result] = await db.execute(
      `UPDATE user_sessions
       SET status = 'revoked',
           ended_at = NOW(),
           end_reason = 'Encerrada pelo usuário'
       WHERE session_uuid = ?
         AND user_id = ?
         AND status = 'active'
         AND expires_at > NOW()`,
      [session_uuid, userId]
    );

    const updateResult = result as UpdateResult;

    if (updateResult.affectedRows === 0) {
      const [rows] = await db.execute(
        `SELECT session_uuid, status, expires_at
         FROM user_sessions
         WHERE session_uuid = ?
           AND user_id = ?
         LIMIT 1`,
        [session_uuid, userId]
      );

      const sessions = rows as Array<{
        session_uuid: string;
        status: string;
        expires_at: string | Date;
      }>;

      if (sessions.length === 0) {
        return NextResponse.json(
          { error: "Sessão não encontrada ou não pertence à sua conta." },
          { status: 404 }
        );
      }

      if (sessions[0].status?.toLowerCase() === "revoked") {
        return NextResponse.json(
          { error: "Esta sessão já foi revogada." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Esta sessão não está mais ativa ou já expirou." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sessão encerrada com sucesso.",
        session_uuid,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "[DELETE /api/motorista/sessoes/[session_uuid]]",
      error
    );

    return NextResponse.json(
      { error: "Erro interno ao encerrar a sessão." },
      { status: 500 }
    );
  }
}