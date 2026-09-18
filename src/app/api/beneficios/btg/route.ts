import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "../../../lib/db";

type BtgBody = {
  usuario_id?: string | number;
  beneficio_id?: number;
  nome?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
};

export async function POST(request: Request) {
  try {
    const body: BtgBody = await request.json();

    const usuarioId = body.usuario_id;
    const nome = body.nome?.trim();
    const cpf = body.cpf?.replace(/\D/g, "");
    const telefone = body.telefone?.replace(/\D/g, "");
    const email = body.email?.trim().toLowerCase();
    const observacoes = body.observacoes?.trim() || "";

    if (!usuarioId) {
      return NextResponse.json(
        { error: "Usuário não identificado." },
        { status: 401 },
      );
    }

    if (!nome) {
      return NextResponse.json(
        { error: "Informe seu nome completo." },
        { status: 400 },
      );
    }

    if (!cpf || cpf.length !== 11) {
      return NextResponse.json(
        { error: "CPF inválido." },
        { status: 400 },
      );
    }

    if (!telefone || (telefone.length !== 10 && telefone.length !== 11)) {
      return NextResponse.json(
        { error: "Telefone inválido." },
        { status: 400 },
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Informe seu e-mail." },
        { status: 400 },
      );
    }

    const codigo = `BTG-${Date.now()}-${randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase()}`;

    const mensagem = [
      "Solicitação de Previdência Privada / BTG Pactual.",
      "",
      `CPF: ${cpf}`,
      `Telefone: ${telefone}`,
      `Benefício ID: ${body.beneficio_id ?? "Não informado"}`,
      "",
      "Observações:",
      observacoes || "Nenhuma observação informada.",
    ].join("\n");

    await db.execute(
      `
        INSERT INTO protocolos (
          usuario_id,
          codigo,
          nome,
          email,
          categoria,
          assunto,
          mensagem
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        usuarioId,
        codigo,
        nome,
        email,
        "beneficio",
        "Solicitação BTG Pactual",
        mensagem,
      ],
    );

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: "Solicitação enviada com sucesso.",
        codigo,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar protocolo BTG:", error);

    return NextResponse.json(
      {
        error: "Não foi possível registrar sua solicitação.",
      },
      { status: 500 },
    );
  }
}