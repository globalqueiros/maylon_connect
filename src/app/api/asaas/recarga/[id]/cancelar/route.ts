import { NextResponse } from "next/server";
import { AsaasError, cancelarRecarga } from "../../../../../lib/asaas/client";
import {
  atualizarStatusPorAsaasId,
  buscarTransacaoDoUsuario,
  usuarioLogadoId,
} from "../../../../../lib/asaas/transacoes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/asaas/recarga/{id}/cancelar
 * {id} é o id do histórico (asaas_transacoes.id). Só funciona enquanto a
 * Asaas ainda não executou a recarga.
 */
export async function POST(
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
    if (!transacao || transacao.tipo !== "recarga" || !transacao.asaas_id) {
      return NextResponse.json({ error: "Recarga não encontrada" }, { status: 404 });
    }

    const recarga = await cancelarRecarga(transacao.asaas_id);
    await atualizarStatusPorAsaasId(transacao.asaas_id, recarga.status);

    return NextResponse.json({ success: true, status: recarga.status });
  } catch (error: any) {
    console.error("Erro ao cancelar recarga:", error);
    const status = error instanceof AsaasError && error.status < 500 ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Erro ao cancelar a recarga" },
      { status }
    );
  }
}
