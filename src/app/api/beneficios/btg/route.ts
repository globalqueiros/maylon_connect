import { NextResponse } from "next/server";
import {
  registrarSolicitacaoBeneficio,
  SolicitacaoError,
} from "../../../lib/solicitacaoBeneficio";
import { usuarioIdDaSessao } from "../../../lib/sessaoUsuario";

type BtgBody = {
  usuario_id?: string;
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

    const usuarioId = await usuarioIdDaSessao();
    const beneficioId = Number(body.beneficio_id);
    const nome = body.nome?.trim() ?? "";
    const cpf = body.cpf?.replace(/\D/g, "") ?? "";
    const telefone = body.telefone?.replace(/\D/g, "") ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!usuarioId) {
      return NextResponse.json(
        { error: "Sessão expirada. Faça login novamente." },
        { status: 401 },
      );
    }

    if (!Number.isFinite(beneficioId) || beneficioId <= 0) {
      return NextResponse.json(
        { error: "Benefício inválido." },
        { status: 400 },
      );
    }

    if (!nome) {
      return NextResponse.json(
        { error: "Informe seu nome completo." },
        { status: 400 },
      );
    }

    if (cpf.length !== 11) {
      return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
    }

    if (telefone.length !== 10 && telefone.length !== 11) {
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

    const { codigo } = await registrarSolicitacaoBeneficio({
      usuarioId,
      beneficioId,
      prefixo: "BTG",
      assunto: "Solicitação BTG Pactual",
      status: "pendente",
      nome,
      email,
      linhas: [
        "Previdência Privada / BTG Pactual.",
        "",
        `CPF: ${cpf}`,
        `Telefone: ${telefone}`,
        "",
        "Observações:",
        body.observacoes?.trim() || "Nenhuma observação informada.",
      ],
    });

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: "Solicitação enviada com sucesso.",
        codigo,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SolicitacaoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("Erro ao criar protocolo BTG:", error);

    return NextResponse.json(
      { error: "Não foi possível registrar sua solicitação." },
      { status: 500 },
    );
  }
}
