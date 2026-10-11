import { NextResponse } from "next/server";
import {
  registrarSolicitacaoBeneficio,
  SolicitacaoError,
} from "../../../lib/solicitacaoBeneficio";
import { usuarioIdDaSessao } from "../../../lib/sessaoUsuario";

type ConectCarBody = {
  usuario_id?: string;
  beneficio_id?: number;
  nome_completo?: string;
  email?: string;
  cpf?: string;
  placa?: string;
  telefone?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
};

export async function POST(request: Request) {
  try {
    const body: ConectCarBody = await request.json();

    const usuarioId = await usuarioIdDaSessao();
    const beneficioId = Number(body.beneficio_id);
    const nome = body.nome_completo?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const cpf = body.cpf?.replace(/\D/g, "") ?? "";
    const telefone = body.telefone?.replace(/\D/g, "") ?? "";
    const placa = body.placa?.replace(/[^A-Za-z0-9]/g, "").toUpperCase() ?? "";
    const cep = body.cep?.replace(/\D/g, "") ?? "";
    const estado = body.estado?.trim().toUpperCase() ?? "";

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

    if (placa.length !== 7) {
      return NextResponse.json(
        { error: "Informe uma placa válida." },
        { status: 400 },
      );
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

    if (cep.length !== 8) {
      return NextResponse.json({ error: "CEP inválido." }, { status: 400 });
    }

    if (!body.endereco?.trim() || !body.numero?.trim()) {
      return NextResponse.json(
        { error: "Informe o endereço completo." },
        { status: 400 },
      );
    }

    const { codigo } = await registrarSolicitacaoBeneficio({
      usuarioId,
      beneficioId,
      prefixo: "CONECTCAR",
      assunto: "Solicitação ConectCar",
      status: "pendente",
      nome,
      email,
      linhas: [
        `CPF: ${cpf}`,
        `Telefone: ${telefone}`,
        `Placa do veículo: ${placa}`,
        "",
        "Endereço de entrega da tag:",
        `CEP: ${cep}`,
        `${body.endereco.trim()}, ${body.numero.trim()}`,
        `Complemento: ${body.complemento?.trim() || "Não informado"}`,
        `Bairro: ${body.bairro?.trim() || "Não informado"}`,
        `Cidade: ${body.cidade?.trim() || "Não informada"} - ${estado}`,
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

    console.error("Erro ao registrar solicitação ConectCar:", error);

    return NextResponse.json(
      { error: "Não foi possível registrar sua solicitação." },
      { status: 500 },
    );
  }
}
