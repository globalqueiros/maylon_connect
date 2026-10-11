import { NextResponse } from "next/server";
import {
  aprovarPagamentoConta,
  centavos,
  isTributo,
  reais,
  resultadoIncerto,
  RvhubError,
  solicitarPagamentoConta,
} from "../../../lib/rvhub/client";
import {
  criarTransacao,
  existeDuplicada,
  marcarEnviada,
  marcarErro,
  usuarioLogadoId,
} from "../../../lib/rvhub/transacoes";
import { db } from "../../../lib/db";
import { readJsonBody } from "../../../lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Dados do pagador (nome + documento) para aprovar o pagamento na RVHub. */
async function buscarPagador(usuarioId: string) {
  const [rows]: any = await db.query(
    `SELECT full_name, identification_number
       FROM users WHERE id = ? LIMIT 1`,
    [usuarioId]
  );
  const row = rows?.[0];
  return {
    name: row?.full_name ? String(row.full_name) : "",
    document: row?.identification_number
      ? String(row.identification_number).replace(/\D/g, "")
      : "",
  };
}

/**
 * POST /api/rvhub/contas
 * Body: { linhaDigitavel: "2379..." }
 * Solicita e aprova o pagamento da conta (Títulos e Consumo).
 * O valor sai do saldo pré-pago da conta RVHub.
 */
export async function POST(req: Request) {
  let transacaoId: number | null = null;
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

    const pagador = await buscarPagador(usuarioId);
    if (!pagador.name || pagador.document.length < 11) {
      return NextResponse.json(
        {
          error:
            "Complete seu cadastro (nome e CPF/CNPJ) antes de pagar contas.",
        },
        { status: 400 }
      );
    }

    if (await existeDuplicada({ usuarioId, tipo: "conta", linhaDigitavel: digitos })) {
      return NextResponse.json(
        { error: "Essa conta já foi paga ou está em processamento. Confira o histórico." },
        { status: 409 }
      );
    }

    // Consulta a conta antes: valor real e beneficiário ficam no histórico.
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
    const beneficiario = conta.payee_name || conta.payee_company_name || null;

    transacaoId = await criarTransacao({
      usuarioId,
      tipo: "conta",
      valor,
      linhaDigitavel: digitos,
      barcode: conta.barcode ?? undefined,
      beneficiario,
    });

    const pago = await aprovarPagamentoConta({
      id: conta.id,
      paidAmount: centavos(valor),
      payerName: pagador.name,
      payerDocument: pagador.document,
    });

    await marcarEnviada(transacaoId, pago.id, pago.status, {
      statusReason: pago.status_reason ?? null,
      payerName: pagador.name,
      payerDocument: pagador.document,
    });

    if (pago.status === "denied") {
      return NextResponse.json(
        {
          error: `Pagamento não aprovado (${pago.status_reason || "motivo não informado"}).`,
          transacao: { id: transacaoId, status: pago.status },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transacao: {
        id: transacaoId,
        status: pago.status,
        valor,
        beneficiario,
        vencimento: pago.due_date ?? null,
      },
    });
  } catch (error: any) {
    console.error("Erro no pagamento de conta RVHub:", error);
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
            "A RVHub demorou pra responder e o pagamento pode ter sido feito. Confira o histórico antes de tentar de novo.",
        },
        // 409 e não 5xx: a Cloudflare troca respostas 502/504 pela página dela.
        { status: 409 }
      );
    }
    const status = error instanceof RvhubError && error.status < 500 ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Erro ao pagar a conta" },
      { status }
    );
  }
}
