import { NextResponse } from "next/server";
import { listarProdutos, reais, RvhubError } from "../../../../lib/rvhub/client";
import { resolverPinProvider } from "../../../../lib/rvhub/giftcard";
import { usuarioLogadoId } from "../../../../lib/rvhub/transacoes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/rvhub/giftcard/valores?operadora=NETFLIX
 * Devolve os produtos (valores) do gift card para o provider informado.
 * Valores chegam em centavos da RVHub e saem convertidos para reais.
 */
export async function GET(req: Request) {
  try {
    const usuarioId = await usuarioLogadoId(req);
    if (!usuarioId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const qs = new URL(req.url).searchParams;
    const operadora = (qs.get("operadora") || qs.get("provider") || "").trim();

    const provider = await resolverPinProvider(operadora);
    if (!provider) {
      return NextResponse.json(
        { error: "Gift card inválido ou não habilitado na conta." },
        { status: 400 }
      );
    }

    const produtos = await listarProdutos({ kind: "pin", provider });

    return NextResponse.json({
      operadora: provider,
      produtos: produtos.map((p) => ({
        productId: p.product_id,
        provider: p.provider,
        nome: p.name,
        valor: reais(p.amount),
        valorMinimo: reais(p.minimum_amount ?? p.amount),
        valorMaximo: reais(p.maximum_amount ?? p.amount),
        incremento: reais(p.incremental_rate),
        fixo: Boolean(p.fixed_amount),
      })),
    });
  } catch (error: any) {
    console.error("Erro ao buscar valores de gift card RVHub:", error);
    const status = error instanceof RvhubError && error.status < 500 ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar valores do gift card" },
      { status }
    );
  }
}
