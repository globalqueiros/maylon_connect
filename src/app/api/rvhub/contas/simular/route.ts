import { NextResponse } from "next/server";
import {
  isTributo,
  reais,
  RvhubError,
  solicitarPagamentoConta,
} from "../../../../lib/rvhub/client";
import { usuarioLogadoId } from "../../../../lib/rvhub/transacoes";
import { readJsonBody } from "../../../../lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/rvhub/contas/simular
 * Body: { linhaDigitavel: "2379..." }
 * Consulta a conta na RVHub (status awaiting_payment) e devolve valor,
 * vencimento e beneficiário. NÃO aprova o pagamento.
 */
export async function POST(req: Request) {
  try {
    const usuarioId = await usuarioLogadoId(req);
    if (!usuarioId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await readJsonBody(req);
    const digitos = String(body.linhaDigitavel ?? "").replace(/\D/g, "");
    if (digitos.length < 44 || digitos.length > 48) {
      return NextResponse.json(
        { error: "Linha digitável inválida. Use 44 a 48 números." },
        { status: 400 }
      );
    }

    const conta = await solicitarPagamentoConta({ digitableLine: digitos });

    if (conta.status === "denied") {
      return NextResponse.json(
        {
          error: `Conta não pode ser paga (${conta.status_reason || "motivo não informado"}).`,
        },
        { status: 400 }
      );
    }

    if (isTributo(conta.bill_type)) {
      return NextResponse.json(
        {
          error:
            "Pagamento de tributos (DARF/DAS/FGTS/DAMSP) ainda não disponível. Use boletos ou contas de consumo.",
        },
        { status: 400 }
      );
    }

    const valor = reais(conta.total_amount ?? conta.amount);

    return NextResponse.json({
      id: conta.id,
      linhaDigitavel: conta.digitable_line ?? digitos,
      barcode: conta.barcode ?? null,
      valor,
      valorBase: reais(conta.amount),
      vencimento: conta.due_date ?? null,
      beneficiario: conta.payee_name || conta.payee_company_name || null,
      permiteAlterarValor: Boolean(conta.total_amount_can_be_changed),
      valorMinimo: conta.min_amount != null ? reais(conta.min_amount) : null,
      valorMaximo: conta.max_amount != null ? reais(conta.max_amount) : null,
      tipo: conta.bill_type ?? null,
    });
  } catch (error: any) {
    console.error("Erro ao simular conta RVHub:", error);
    const status = error instanceof RvhubError && error.status < 500 ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Erro ao consultar a conta" },
      { status }
    );
  }
}
