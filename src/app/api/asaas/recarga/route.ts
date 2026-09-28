import { NextResponse } from "next/server";
import { AsaasError, buscarOperadora, criarRecarga } from "../../../lib/asaas/client";
import {
  criarTransacao,
  existeDuplicada,
  marcarEnviada,
  marcarErro,
  usuarioLogadoId,
} from "../../../lib/asaas/transacoes";
import { readJsonBody } from "../../../lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/asaas/recarga
 * Body: { telefone: "11987654321", valor: 20 }
 * O valor sai do saldo da conta Asaas.
 */
export async function POST(req: Request) {
  let transacaoId: number | null = null;
  try {
    const usuarioId = await usuarioLogadoId(req);
    if (!usuarioId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await readJsonBody(req);
    const telefone = String(body.telefone ?? "").replace(/\D/g, "");
    const valor = Number(body.valor);

    if (!/^\d{10,11}$/.test(telefone)) {
      return NextResponse.json(
        { error: "Telefone inválido. Use DDD + número." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    }

    // Confere o valor com a lista da operadora antes de gastar saldo.
    const operadora = await buscarOperadora(telefone);
    const aceito = operadora.values.some(
      (v) => valor >= v.minValue && valor <= v.maxValue
    );
    if (!aceito) {
      return NextResponse.json(
        {
          error: `A ${operadora.name} não aceita recarga de R$ ${valor.toFixed(2)}.`,
          valores: operadora.values.map((v) => v.minValue),
        },
        { status: 400 }
      );
    }

    if (await existeDuplicada({ usuarioId, tipo: "recarga", telefone, valor })) {
      return NextResponse.json(
        { error: "Essa recarga acabou de ser feita. Confira o histórico." },
        { status: 409 }
      );
    }

    // Registra antes de chamar a Asaas: se algo cair no meio, fica rastro.
    transacaoId = await criarTransacao({
      usuarioId,
      tipo: "recarga",
      valor,
      telefone,
      operadora: operadora.name,
    });

    const recarga = await criarRecarga(telefone, valor);
    await marcarEnviada(transacaoId, recarga.id, recarga.status);

    return NextResponse.json({
      success: true,
      transacao: {
        id: transacaoId,
        status: recarga.status,
        valor,
        telefone,
        operadora: operadora.name,
      },
    });
  } catch (error: any) {
    console.error("Erro na recarga de celular:", error);
    if (transacaoId) {
      await marcarErro(
        transacaoId,
        error?.message || "Erro desconhecido",
        error instanceof AsaasError ? "ERRO" : "VERIFICAR"
      ).catch(() => {});
    }
    const status = error instanceof AsaasError && error.status < 500 ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Erro ao fazer a recarga" },
      { status }
    );
  }
}
