import { NextResponse } from "next/server";
import { AsaasError, buscarOperadora } from "../../../../lib/asaas/client";
import { usuarioLogadoId } from "../../../../lib/asaas/transacoes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/asaas/recarga/valores?telefone=11987654321
 * Devolve a operadora do número e os valores que ela aceita.
 * Cada operadora tem valores fixos (ex.: Vivo 12, 15, 20...), então a tela
 * deve mostrar esta lista em vez de valores escolhidos à mão.
 */
export async function GET(req: Request) {
  try {
    const usuarioId = await usuarioLogadoId(req);
    if (!usuarioId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const telefone = new URL(req.url).searchParams.get("telefone")?.replace(/\D/g, "") || "";
    if (!/^\d{10,11}$/.test(telefone)) {
      return NextResponse.json(
        { error: "Telefone inválido. Use DDD + número." },
        { status: 400 }
      );
    }

    const operadora = await buscarOperadora(telefone);
    return NextResponse.json({
      operadora: operadora.name,
      valores: operadora.values.map((v) => ({
        nome: v.name,
        valorMinimo: v.minValue,
        valorMaximo: v.maxValue,
        bonus: v.bonus,
        descricao: v.description,
      })),
    });
  } catch (error: any) {
    console.error("Erro ao buscar valores de recarga:", error);
    const status = error instanceof AsaasError && error.status < 500 ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar valores de recarga" },
      { status }
    );
  }
}
