import { NextResponse } from "next/server";
import {
  listarProdutos,
  listarProviders,
  reais,
  RvhubError,
} from "../../../../lib/rvhub/client";
import { usuarioLogadoId } from "../../../../lib/rvhub/transacoes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Resolve o provider exato da RVHub a partir do que a tela enviou.
 * Aceita o nome exato ("VIVO") ou o id minúsculo ("vivo").
 */
async function resolverProvider(valorRecebido: string): Promise<string | null> {
  const alvo = valorRecebido.trim().toLowerCase();
  if (!alvo) return null;
  const providers = await listarProviders();
  const cell = providers.filter((p) => p.kind === "cellphone");
  return cell.find((p) => p.provider.toLowerCase() === alvo)?.provider ?? null;
}

/**
 * GET /api/rvhub/recarga/valores?ddd=11&operadora=vivo
 * Devolve os produtos de recarga (valores) da operadora para aquele DDD.
 * Valores chegam em centavos da RVHub e saem convertidos para reais.
 */
export async function GET(req: Request) {
  try {
    const usuarioId = await usuarioLogadoId(req);
    if (!usuarioId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const qs = new URL(req.url).searchParams;
    const ddd = (qs.get("ddd") || "").replace(/\D/g, "");
    const operadora = (qs.get("operadora") || qs.get("provider") || "").trim();

    if (!/^\d{2}$/.test(ddd)) {
      return NextResponse.json({ error: "DDD inválido." }, { status: 400 });
    }

    const provider = operadora ? await resolverProvider(operadora) : null;
    if (operadora && !provider) {
      return NextResponse.json(
        { error: "Operadora inválida ou não habilitada na conta." },
        { status: 400 }
      );
    }

    const produtos = await listarProdutos({
      kind: "cellphone",
      areaCode: ddd,
      provider: provider ?? undefined,
    });

    return NextResponse.json({
      operadora: provider ?? null,
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
    console.error("Erro ao buscar valores de recarga RVHub:", error);
    const status = error instanceof RvhubError && error.status < 500 ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar valores de recarga" },
      { status }
    );
  }
}
