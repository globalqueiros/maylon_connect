import { NextResponse } from "next/server";
import { AsaasError, simularConta } from "../../../../lib/asaas/client";
import { usuarioLogadoId } from "../../../../lib/asaas/transacoes";
import { readJsonBody } from "../../../../lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/asaas/contas/simular
 * Body: { linhaDigitavel: "2379..." }
 * Mostra valor, vencimento e beneficiário antes de pagar. Não paga nada.
 */
export async function POST(req: Request) {
  try {
    const usuarioId = await usuarioLogadoId(req);
    if (!usuarioId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await readJsonBody(req);
    const linhaDigitavel = String(body.linhaDigitavel ?? "").replace(/\D/g, "");
    if (linhaDigitavel.length < 44) {
      return NextResponse.json(
        { error: "Linha digitável inválida." },
        { status: 400 }
      );
    }

    const sim = await simularConta(linhaDigitavel);
    const info = sim.bankSlipInfo;
    return NextResponse.json({
      linhaDigitavel: info.identificationField,
      valor: info.value,
      vencimento: info.dueDate,
      beneficiario: info.beneficiaryName || info.companyName,
      vencida: info.isOverdue,
      permiteAlterarValor: info.allowChangeValue,
      valorMinimo: info.minValue,
      valorMaximo: info.maxValue,
      dataMinimaAgendamento: sim.minimumScheduleDate,
      taxa: sim.fee,
    });
  } catch (error: any) {
    console.error("Erro ao simular conta:", error);
    const status = error instanceof AsaasError && error.status < 500 ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Erro ao consultar a conta" },
      { status }
    );
  }
}
