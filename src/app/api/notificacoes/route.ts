import { NextRequest, NextResponse } from "next/server";
import { db } from "../../lib/db";

type Preferencias = {
  email: boolean;
  push: boolean;
  sms: boolean;
  notificacoes_viagens: boolean;
  compartilhar_localizacao: boolean;
  receber_promocoes: boolean;
};

const preferenciasPadrao: Preferencias = {
  email: false,
  push: false,
  sms: false,
  notificacoes_viagens: false,
  compartilhar_localizacao: false,
  receber_promocoes: false,
};

function booleano(valor: unknown): boolean {
  return valor === true || valor === 1 || valor === "1";
}

export async function GET(request: NextRequest) {
  try {
    const usuarioId = String(
      request.nextUrl.searchParams.get("usuario_id") || ""
    ).trim();

    if (!usuarioId) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuário não informado.",
        },
        { status: 400 }
      );
    }

    const [rows] = await db.query(
      `
      SELECT
        usuario_id,
        email,
        push,
        sms,
        notificacoes_viagens,
        compartilhar_localizacao,
        receber_promocoes
      FROM preferencias_notificacoes
      WHERE usuario_id = ?
      LIMIT 1
      `,
      [usuarioId]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      const row = rows[0] as Record<string, unknown>;

      return NextResponse.json({
        success: true,
        preferencias: {
          email: booleano(row.email),
          push: booleano(row.push),
          sms: booleano(row.sms),
          notificacoes_viagens: booleano(
            row.notificacoes_viagens
          ),
          compartilhar_localizacao: booleano(
            row.compartilhar_localizacao
          ),
          receber_promocoes: booleano(
            row.receber_promocoes
          ),
        },
      });
    }

    return NextResponse.json({
      success: true,
      preferencias: preferenciasPadrao,
    });
  } catch (error: unknown) {
    console.error("ERRO GET /api/notificacoes:", error);

    const erro = error as {
      message?: string;
      code?: string;
      sqlMessage?: string;
    };

    return NextResponse.json(
      {
        success: false,
        message:
          erro.sqlMessage ||
          erro.message ||
          "Erro ao carregar preferências.",
        error: erro.code || "DATABASE_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const usuarioId = String(
      body?.usuarioId || ""
    ).trim();

    if (!usuarioId) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuário não informado.",
        },
        { status: 400 }
      );
    }

    const email = body?.email ? 1 : 0;
    const push = body?.push ? 1 : 0;
    const sms = body?.sms ? 1 : 0;
    const notificacoesViagens =
      body?.notificacoes_viagens ? 1 : 0;
    const compartilharLocalizacao =
      body?.compartilhar_localizacao ? 1 : 0;
    const receberPromocoes =
      body?.receber_promocoes ? 1 : 0;

    await db.query(
      `
      INSERT INTO preferencias_notificacoes (
        usuario_id,
        email,
        push,
        sms,
        notificacoes_viagens,
        compartilhar_localizacao,
        receber_promocoes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        email = VALUES(email),
        push = VALUES(push),
        sms = VALUES(sms),
        notificacoes_viagens = VALUES(notificacoes_viagens),
        compartilhar_localizacao = VALUES(compartilhar_localizacao),
        receber_promocoes = VALUES(receber_promocoes)
      `,
      [
        usuarioId,
        email,
        push,
        sms,
        notificacoesViagens,
        compartilharLocalizacao,
        receberPromocoes,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Configurações salvas com sucesso!",
      preferencias: {
        email: Boolean(email),
        push: Boolean(push),
        sms: Boolean(sms),
        notificacoes_viagens: Boolean(
          notificacoesViagens
        ),
        compartilhar_localizacao: Boolean(
          compartilharLocalizacao
        ),
        receber_promocoes: Boolean(
          receberPromocoes
        ),
      },
    });
  } catch (error: unknown) {
    console.error("ERRO POST /api/notificacoes:", error);

    const erro = error as {
      message?: string;
      code?: string;
      errno?: number;
      sqlMessage?: string;
      sqlState?: string;
    };

    return NextResponse.json(
      {
        success: false,
        message:
          erro.sqlMessage ||
          erro.message ||
          "Não foi possível salvar as configurações.",
        error: erro.code || "DATABASE_ERROR",
      },
      { status: 500 }
    );
  }
}
