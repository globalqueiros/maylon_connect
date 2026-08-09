import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

/**
 * Toggle is only for free/admin activation.
 * Paid Stripe/Pix subscriptions must go through checkout APIs.
 */
export async function POST(req: Request) {
  try {
    const { usuario_id, beneficio_id, metodo_pagamento } = await req.json();

    if (!usuario_id || !beneficio_id) {
      return NextResponse.json(
        { error: "Dados obrigatórios não enviados" },
        { status: 400 }
      );
    }

    if (
      metodo_pagamento === "stripe_recorrente" ||
      metodo_pagamento === "pix_btg" ||
      metodo_pagamento === "boleto_btg"
    ) {
      return NextResponse.json(
        {
          error:
            "Este benefício exige checkout de pagamento. Use Cartão (Stripe) ou Pix (BTG).",
        },
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
      "SELECT id, tipo FROM beneficios WHERE id = ?",
      [beneficio_id]
    );

    if (!beneficioRows.length) {
      return NextResponse.json(
        { error: "Benefício não encontrado" },
        { status: 404 }
      );
    }

    const tipoBeneficio = normalizar(beneficioRows[0].tipo);

    if (tipoBeneficio !== "ambos" && tipoUsuario !== tipoBeneficio) {
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
      "SELECT id, ativo, metodo_pagamento, status_assinatura FROM usuario_beneficios WHERE usuario_id = ? AND beneficio_id = ?",
      [usuario_id, beneficio_id]
    );

    if (rows.length > 0) {
      const row = rows[0];
      if (
        row.ativo &&
        (row.metodo_pagamento === "stripe_recorrente" ||
          row.metodo_pagamento === "pix_btg")
      ) {
        return NextResponse.json(
          {
            error:
              "Assinatura paga ativa. Use o cancelamento de assinatura para desativar.",
          },
          { status: 400 }
        );
      }

      const novoStatus = row.ativo ? 0 : 1;
      await db.query(
        "UPDATE usuario_beneficios SET ativo = ? WHERE id = ?",
        [novoStatus, row.id]
      );

      return NextResponse.json({
        ativo: !!novoStatus,
        status_assinatura: novoStatus ? "aprovado" : "cancelado",
        message: novoStatus
          ? "Benefício ativado com sucesso"
          : "Benefício desativado com sucesso",
      });
    }

    await db.query(
      "INSERT INTO usuario_beneficios (usuario_id, beneficio_id, ativo, status_assinatura) VALUES (?, ?, 1, 'aprovado')",
      [usuario_id, beneficio_id]
    );

    return NextResponse.json({
      ativo: true,
      status_assinatura: "aprovado",
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
