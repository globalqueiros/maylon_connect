import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function POST(req: Request) {
  try {
    const { usuario_id, beneficio_id } = await req.json();

    if (!usuario_id || !beneficio_id) {
      return NextResponse.json(
        { error: "Dados obrigatórios não enviados" },
        { status: 400 }
      );
    }

    const normalizar = (tipo: string) => {
      if (!tipo) return "";

      const t = tipo.toLowerCase();

      if (t === "motorista" || t === "driver") return "driver";
      if (t === "passageiro" || t === "customer") return "customer";
      if (t === "ambos") return "ambos";

      return t;
    };

    const [userRows]: any = await db.query(
      "SELECT id, user_type FROM users WHERE id = ?",
      [usuario_id]
    );

    if (!userRows.length) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const tipoUsuario = normalizar(userRows[0].user_type);

    const [beneficioRows]: any = await db.query(
      "SELECT tipo FROM beneficios WHERE id = ?",
      [beneficio_id]
    );

    if (!beneficioRows.length) {
      return NextResponse.json(
        { error: "Benefício não encontrado" },
        { status: 404 }
      );
    }

    const tipoBeneficio = normalizar(beneficioRows[0].tipo);

    if (
      tipoBeneficio !== "ambos" &&
      tipoUsuario !== tipoBeneficio
    ) {
      return NextResponse.json(
        {
          error:
            tipoUsuario === "driver"
              ? "Motorista não pode ativar benefício de passageiro"
              : "Passageiro não pode ativar benefício de motorista",
        },
        { status: 403 }
      );
    }

    const [rows]: any = await db.query(
      "SELECT id, ativo FROM usuario_beneficios WHERE usuario_id = ? AND beneficio_id = ?",
      [usuario_id, beneficio_id]
    );

    if (rows.length > 0) {
      const novoStatus = !rows[0].ativo;

      await db.query(
        "UPDATE usuario_beneficios SET ativo = ? WHERE id = ?",
        [novoStatus, rows[0].id]
      );

      return NextResponse.json({
        ativo: novoStatus,
        message: novoStatus
          ? "Benefício ativado com sucesso"
          : "Benefício desativado com sucesso",
      });
    }

    await db.query(
      "INSERT INTO usuario_beneficios (usuario_id, beneficio_id, ativo) VALUES (?, ?, ?)",
      [usuario_id, beneficio_id, true]
    );

    return NextResponse.json({
      ativo: true,
      message: "Benefício ativado com sucesso",
    });

  } catch (error) {
    console.error("Erro na API:", error);

    return NextResponse.json(
      { error: "Erro interno ao atualizar benefício" },
      { status: 500 }
    );
  }
}