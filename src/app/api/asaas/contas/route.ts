import { NextResponse } from "next/server";
import {
  AsaasError,
  criarPagamentoConta,
  resultadoIncerto,
  simularConta,
} from "../../../lib/asaas/client";
import {
  criarTransacao,
  existeDuplicada,
  marcarEnviada,
  marcarErro,
  usuarioLogadoId,
} from "../../../lib/asaas/transacoes";
import { readJsonBody } from "../../../lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/asaas/contas
 * Body: { linhaDigitavel: "2379...", dataAgendamento?: "2026-10-05", descricao?: "Luz", valor?: 150 }
 * O valor sai do saldo da conta Asaas. "valor" só é usado quando o boleto
 * permite alterar o valor; nos outros casos vale o valor do boleto.
 */
export async function POST(req: Request) {
  let transacaoId: number | null = null;
  try {
    const usuarioId = await usuarioLogadoId(req);
    if (!usuarioId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await readJsonBody(req);
    const linhaDigitavel = String(body.linhaDigitavel ?? "").replace(/\D/g, "");
    const dataAgendamento = body.dataAgendamento
      ? String(body.dataAgendamento)
      : undefined;
    const descricao = body.descricao ? String(body.descricao).slice(0, 100) : undefined;

    if (linhaDigitavel.length < 44) {
      return NextResponse.json({ error: "Linha digitável inválida." }, { status: 400 });
    }
    if (dataAgendamento && !/^\d{4}-\d{2}-\d{2}$/.test(dataAgendamento)) {
      return NextResponse.json(
        { error: "Data de agendamento inválida. Use AAAA-MM-DD." },
        { status: 400 }
      );
    }

    if (await existeDuplicada({ usuarioId, tipo: "conta", linhaDigitavel })) {
      return NextResponse.json(
        { error: "Essa conta já foi paga ou está em processamento. Confira o histórico." },
        { status: 409 }
      );
    }

    // Consulta o boleto antes: valor real e beneficiário ficam no histórico.
    const sim = await simularConta(linhaDigitavel);
    const info = sim.bankSlipInfo;

    let valor = info.value;
    if (info.allowChangeValue && body.valor != null) {
      valor = Number(body.valor);
      const min = info.minValue ?? 0;
      const max = info.maxValue ?? Number.MAX_SAFE_INTEGER;
      if (!Number.isFinite(valor) || valor < min || valor > max) {
        return NextResponse.json(
          { error: `Valor fora do permitido pelo boleto (R$ ${min} a R$ ${max}).` },
          { status: 400 }
        );
      }
    }

    transacaoId = await criarTransacao({
      usuarioId,
      tipo: "conta",
      valor,
      linhaDigitavel,
      beneficiario: info.beneficiaryName || info.companyName,
      dataAgendamento,
    });

    const conta = await criarPagamentoConta({
      linhaDigitavel,
      dataAgendamento,
      descricao,
      valor: info.allowChangeValue ? valor : undefined,
    });
    await marcarEnviada(transacaoId, conta.id, conta.status);

    return NextResponse.json({
      success: true,
      transacao: {
        id: transacaoId,
        status: conta.status,
        valor,
        beneficiario: info.beneficiaryName || info.companyName,
        dataAgendamento: conta.scheduleDate ?? dataAgendamento ?? null,
      },
    });
  } catch (error: any) {
    console.error("Erro no pagamento de conta:", error);
    if (transacaoId) {
      await marcarErro(
        transacaoId,
        error?.message || "Erro desconhecido",
        resultadoIncerto(error) ? "VERIFICAR" : "ERRO"
      ).catch(() => {});
    }
    if (transacaoId && resultadoIncerto(error)) {
      return NextResponse.json(
        {
          error:
            "A Asaas demorou pra responder e o pagamento pode ter sido feito. Confira o histórico antes de tentar de novo.",
        },
        { status: 502 }
      );
    }
    const status = error instanceof AsaasError && error.status < 500 ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Erro ao pagar a conta" },
      { status }
    );
  }
}
