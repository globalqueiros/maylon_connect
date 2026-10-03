import { NextResponse } from "next/server";
import {
  listarTransacoes,
  TipoTransacao,
} from "../../../lib/rvhub/transacoes";
import { usuarioLogadoId } from "../../../lib/rvhub/transacoes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/rvhub/historico?tipo=recarga|conta&pagina=1&porPagina=20
 * Só as operações do usuário logado, mais recentes primeiro.
 */
export async function GET(req: Request) {
  try {
    const usuarioId = await usuarioLogadoId(req);
    if (!usuarioId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const qs = new URL(req.url).searchParams;
    const tipoParam = qs.get("tipo");
    const tipo: TipoTransacao | undefined =
      tipoParam === "recarga" || tipoParam === "conta" ? tipoParam : undefined;
    const pagina = Math.max(1, Math.trunc(Number(qs.get("pagina")) || 1));
    const porPagina = Math.min(
      100,
      Math.max(1, Math.trunc(Number(qs.get("porPagina")) || 20))
    );

    const { total, itens } = await listarTransacoes({
      usuarioId,
      tipo,
      limite: porPagina,
      offset: (pagina - 1) * porPagina,
    });

    return NextResponse.json({
      pagina,
      porPagina,
      total,
      itens: itens.map((t) => ({
        id: t.id,
        tipo: t.tipo,
        status: t.status,
        statusReason: t.status_reason,
        valor: Number(t.valor),
        telefone: t.telefone,
        operadora: t.operadora,
        linhaDigitavel: t.linha_digitavel,
        beneficiario: t.beneficiario,
        authorizationCode: t.authorization_code,
        nsu: t.nsu,
        erro: t.erro,
        criadoEm: t.criado_em,
        atualizadoEm: t.atualizado_em,
      })),
    });
  } catch (error: any) {
    console.error("Erro ao listar histórico RVHub:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar o histórico" },
      { status: 500 }
    );
  }
}
