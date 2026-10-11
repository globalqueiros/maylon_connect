import { NextResponse } from "next/server";
import { estornarPin, RvhubError } from "../../../../../lib/rvhub/client";
import {
  atualizarStatusPorRvhubId,
  buscarTransacaoDoUsuario,
  usuarioLogadoId,
} from "../../../../../lib/rvhub/transacoes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/rvhub/giftcard/{id}/cancelar
 * {id} é o id do histórico (rvhub_transacoes.id). Como confirmamos a compra
 * automaticamente, o estorno normalmente já não é permitido pela RVHub.
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
    if (!transacao || transacao.tipo !== "giftcard" || !transacao.rvhub_id) {
      return NextResponse.json(
        { error: "Compra não encontrada" },
        { status: 404 }
      );
    }

    const pin = await estornarPin(transacao.rvhub_id);
    await atualizarStatusPorRvhubId(transacao.rvhub_id, pin.status, {
      statusReason: pin.status_reason ?? null,
    });

    return NextResponse.json({ success: true, status: pin.status });
  } catch (error: any) {
    console.error("Erro ao cancelar gift card RVHub:", error);
    const status = error instanceof RvhubError && error.status < 500 ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Erro ao cancelar a compra" },
      { status }
    );
  }
}
