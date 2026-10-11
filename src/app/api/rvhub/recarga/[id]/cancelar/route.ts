import { NextResponse } from "next/server";
import { estornarRecarga, RvhubError } from "../../../../../lib/rvhub/client";
import {
  atualizarStatusPorRvhubId,
  buscarTransacaoDoUsuario,
  usuarioLogadoId,
} from "../../../../../lib/rvhub/transacoes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/rvhub/recarga/{id}/cancelar
 * {id} é o id do histórico (rvhub_transacoes.id). Só funciona enquanto a
 * RVHub ainda permite o estorno.
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
    if (!transacao || transacao.tipo !== "recarga" || !transacao.rvhub_id) {
      return NextResponse.json({ error: "Recarga não encontrada" }, { status: 404 });
    }

    const recarga = await estornarRecarga(transacao.rvhub_id);
    await atualizarStatusPorRvhubId(transacao.rvhub_id, recarga.status, {
      statusReason: recarga.status_reason ?? null,
    });

    return NextResponse.json({ success: true, status: recarga.status });
  } catch (error: any) {
    console.error("Erro ao cancelar recarga RVHub:", error);
    const status = error instanceof RvhubError && error.status < 500 ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Erro ao cancelar a recarga" },
      { status }
    );
  }
}
