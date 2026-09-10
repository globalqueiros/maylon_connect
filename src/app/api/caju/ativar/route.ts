import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const {
      usuario_id,
      beneficio_id,
      cep,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
    } = await req.json();

    if (!usuario_id || !beneficio_id) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    await db.query(
      `
      INSERT INTO caju_beneficios (
        usuario_id,
        beneficio_id,
        cep,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        criado_em
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        usuario_id,
        beneficio_id,
        cep,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      ]
    );

    await db.query(
      `
      INSERT INTO usuario_beneficios
      (usuario_id, beneficio_id, ativo)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE
      ativo = 1
      `,
      [usuario_id, beneficio_id]
    );

    return NextResponse.json({
      success: true,
      ativo: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Erro ao ativar benefício",
      },
      {
        status: 500,
      }
    );
  }
}