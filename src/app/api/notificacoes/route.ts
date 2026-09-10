import { NextRequest, NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const usuarioId = Number(
      request.nextUrl.searchParams.get("usuario_id")
    );

    if (!usuarioId) {
      return NextResponse.json(
        { success: false, message: "Usuário não informado." },
        { status: 400 }
      );
    }

    const [rows] = await db.query(
      `
      SELECT
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

    const preferencias = Array.isArray(rows) && rows.length > 0
      ? rows[0]
      : {
          email: false,
          push: false,
          sms: false,
          notificacoes_viagens: false,
          compartilhar_localizacao: false,
          receber_promocoes: false,
        };

    return NextResponse.json({
      success: true,
      preferencias,
    });
  } catch (error) {
    console.error("GET /api/notificacoes:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao carregar preferências.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const usuarioId = Number(body.usuarioId);

    if (!usuarioId) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuário não informado.",
        },
        { status: 400 }
      );
    }

    const email = Boolean(body.email);
    const push = Boolean(body.push);
    const sms = Boolean(body.sms);
    const notificacoesViagens = Boolean(body.notificacoes_viagens);
    const compartilharLocalizacao = Boolean(
      body.compartilhar_localizacao
    );
    const receberPromocoes = Boolean(body.receber_promocoes);

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
        email,
        push,
        sms,
        notificacoes_viagens: notificacoesViagens,
        compartilhar_localizacao: compartilharLocalizacao,
        receber_promocoes: receberPromocoes,
      },
    });
  } catch (error) {
    console.error("POST /api/notificacoes:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Não foi possível salvar as configurações.",
      },
      { status: 500 }
    );
  }
}