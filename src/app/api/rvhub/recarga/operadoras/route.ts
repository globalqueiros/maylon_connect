import { NextResponse } from "next/server";
import { listarProviders, RvhubError } from "../../../../lib/rvhub/client";
import { usuarioLogadoId } from "../../../../lib/rvhub/transacoes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/rvhub/recarga/operadoras
 * Lista as operadoras de celular habilitadas na conta RVHub.
 * A habilitação é feita pela RV Tecnologia, então esta lista pode mudar:
 * a tela deve sempre buscar aqui em vez de ter uma lista fixa.
 */
export async function GET(req: Request) {
  try {
    const usuarioId = await usuarioLogadoId(req);
    if (!usuarioId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const providers = await listarProviders();
    const operadoras = providers
      .filter((p) => p.kind === "cellphone")
      .map((p) => ({
        // O nome exato do provider é o que a RVHub espera no filtro e no produto.
        provider: p.provider,
        nome: p.provider,
        id: p.provider.toLowerCase(),
      }));

    return NextResponse.json({ operadoras });
  } catch (error: any) {
    console.error("Erro ao listar operadoras RVHub:", error);
    const status = error instanceof RvhubError && error.status < 500 ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Erro ao listar operadoras" },
      { status }
    );
  }
}
