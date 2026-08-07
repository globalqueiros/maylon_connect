import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      usuarioId,
      email = false,
      push = false,
      sms = false,
      notificacoes_viagens = false,
      compartilhar_localizacao = false,
      receber_promocoes = false,
    } = body;


    if (!usuarioId) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuário não informado",
        },
        {
          status: 400,
        }
      );
    }


    await db.query(
      `
      UPDATE configuracoes_notificacoes
      SET
        email = ?,
        push = ?,
        sms = ?,
        notificacoes_viagens = ?,
        compartilhar_localizacao = ?,
        receber_promocoes = ?,
        created_at = NOW()
      WHERE usuario_id = ?
      `,
      [
        email,
        push,
        sms,
        notificacoes_viagens,
        compartilhar_localizacao,
        receber_promocoes,
        usuarioId,
      ]
    );


    return NextResponse.json({
      success: true,
      message: "Preferências salvas com sucesso",
    });


  } catch (error) {
    console.error("Erro ao salvar notificações:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      {
        status: 500,
      }
    );
  }
}
