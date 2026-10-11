import { NextResponse } from "next/server";
import {
  registrarSolicitacaoBeneficio,
  SolicitacaoError,
} from "../../../lib/solicitacaoBeneficio";
import { usuarioIdDaSessao } from "../../../lib/sessaoUsuario";

type Beneficiario = {
  nome?: string;
  parentesco?: string;
  percentual?: number;
};

type SeguroVidaBody = {
  usuario_id?: string;
  beneficio_id?: number;
  nome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  data_nascimento?: string;
  observacoes?: string;
  beneficiarios?: Beneficiario[];
};

export async function POST(request: Request) {
  try {
    const body: SeguroVidaBody = await request.json();

    const usuarioId = await usuarioIdDaSessao();
    const beneficioId = Number(body.beneficio_id);
    const nome = body.nome?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const cpf = body.cpf?.replace(/\D/g, "") ?? "";
    const telefone = body.telefone?.replace(/\D/g, "") ?? "";
    const dataNascimento = body.data_nascimento?.trim() ?? "";
    const beneficiarios = Array.isArray(body.beneficiarios)
      ? body.beneficiarios
      : [];

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

    if (!dataNascimento) {
      return NextResponse.json(
        { error: "Informe sua data de nascimento." },
        { status: 400 },
      );
    }

    if (beneficiarios.length === 0) {
      return NextResponse.json(
        { error: "Informe ao menos um beneficiário." },
        { status: 400 },
      );
    }

    const totalPercentual = beneficiarios.reduce(
      (soma, beneficiario) => soma + Number(beneficiario.percentual ?? 0),
      0,
    );

    if (Math.round(totalPercentual) !== 100) {
      return NextResponse.json(
        { error: "A soma dos percentuais dos beneficiários deve ser 100%." },
        { status: 400 },
      );
    }

    const linhasBeneficiarios = beneficiarios.map(
      (beneficiario, indice) =>
        `${indice + 1}. ${beneficiario.nome?.trim() || "Sem nome"} - ` +
        `${beneficiario.parentesco?.trim() || "Parentesco não informado"} - ` +
        `${Number(beneficiario.percentual ?? 0)}%`,
    );

    const { codigo } = await registrarSolicitacaoBeneficio({
      usuarioId,
      beneficioId,
      prefixo: "SEGURO",
      assunto: "Solicitação Seguro de Vida",
      status: "pendente",
      nome,
      email,
      linhas: [
        `CPF: ${cpf}`,
        `Telefone: ${telefone}`,
        `Data de nascimento: ${dataNascimento}`,
        "",
        "Beneficiários:",
        ...linhasBeneficiarios,
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

    console.error("Erro ao registrar solicitação de seguro de vida:", error);

    return NextResponse.json(
      { error: "Não foi possível registrar sua solicitação." },
      { status: 500 },
    );
  }
}
