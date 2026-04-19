import { NextResponse } from "next/server";
import { db } from "../../lib/db";

type TipoUsuario = "motorista" | "passageiro" | "ambos";

export async function POST(req: Request) {
  try {
    const { usuario_id } = await req.json();

    if (!usuario_id) {
      return NextResponse.json(
        { error: "Usuário inválido" },
        { status: 400 }
      );
    }

    const [[user]]: any = await db.query(
      "SELECT user_type FROM users WHERE id = ?",
      [usuario_id]
    );

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    let tipo: TipoUsuario;

    if (user.user_type === "driver") {
      tipo = "motorista";
    } else if (user.user_type === "customer") {
      tipo = "passageiro";
    } else {
      tipo = "ambos";
    }

    const [rows]: any = await db.query(
      `
      SELECT 
        b.id,
        b.imagem,
        b.titulo,
        b.descricao,
        b.valor,
        b.tipo,
        IFNULL(ub.ativo, false) as ativo
      FROM beneficios b
      LEFT JOIN usuario_beneficios ub 
        ON ub.beneficio_id = b.id 
        AND ub.usuario_id = ?
      WHERE 
        b.ativo = true
        AND (
          b.tipo = 'ambos'
          OR b.tipo = ?
        )
      `,
      [usuario_id, tipo]
    );

    return NextResponse.json(Array.isArray(rows) ? rows : []);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao buscar benefícios" },
      { status: 500 }
    );
  }
}