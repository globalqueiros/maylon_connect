import { NextResponse } from "next/server";
import {
  AsaasError,
  buscarPagamentoConta,
  buscarRecarga,
} from "../../../../lib/asaas/client";
import {
  atualizarStatusPorAsaasId,
  buscarTransacaoDoUsuario,
  usuarioLogadoId,
} from "../../../../lib/asaas/transacoes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/asaas/historico/{id}
 * Consulta uma operação e atualiza o status direto na Asaas
 * (útil se algum webhook se perdeu).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioId = await usuarioLogadoId(req);
    if (!usuarioId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const transacao = await buscarTransacaoDoUsuario(Number(id), usuarioId);
    if (!transacao) {
      return NextResponse.json({ error: "Operação não encontrada" }, { status: 404 });
    }

    let status = transacao.status;
    let podeCancelar = false;
    if (transacao.asaas_id) {
      const remoto =
        transacao.tipo === "recarga"
          ? await buscarRecarga(transacao.asaas_id)
          : await buscarPagamentoConta(transacao.asaas_id);
      status = remoto.status;
      podeCancelar = Boolean(remoto.canBeCancelled);
      if (status !== transacao.status) {
        await atualizarStatusPorAsaasId(transacao.asaas_id, status);
      }
    }

    return NextResponse.json({
      id: transacao.id,
      tipo: transacao.tipo,
      status,
      podeCancelar,
      valor: Number(transacao.valor),
      telefone: transacao.telefone,
      operadora: transacao.operadora,
      linhaDigitavel: transacao.linha_digitavel,
      beneficiario: transacao.beneficiario,
      dataAgendamento: transacao.data_agendamento,
      erro: transacao.erro,
      criadoEm: transacao.criado_em,
    });
  } catch (error: any) {
    console.error("Erro ao consultar operação Asaas:", error);
    const status = error instanceof AsaasError && error.status < 500 ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Erro ao consultar a operação" },
      { status }
    );
  }
}
