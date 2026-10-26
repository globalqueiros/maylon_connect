import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import {
  avaliarMotoristasParaPassageira,
  idValido,
  listaDeIds,
  MAX_CANDIDATOS,
} from "../../../lib/pareamento/servico";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEM_CACHE = { "Cache-Control": "no-store" };

/**
 * Rota interna do despacho de corridas: recebe a passageira e as motoristas
 * que o app já achou dentro do raio de busca e devolve quem pode atender.
 * Exige o x-internal-token igual ao INTERNAL_API_TOKEN do .env.
 */
function autorizado(req: Request) {
  const esperado = process.env.INTERNAL_API_TOKEN?.trim();
  if (!esperado) return false;
  const recebido = req.headers.get("x-internal-token") || "";
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!process.env.INTERNAL_API_TOKEN?.trim()) {
    console.error(
      "[pareamento] INTERNAL_API_TOKEN não configurado: rota bloqueada."
    );
    return NextResponse.json({ error: "Rota indisponível" }, { status: 503 });
  }

  if (!autorizado(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);

    const motoristaIds = listaDeIds(body?.motorista_ids);

    if (!idValido(body?.passageiro_id) || !motoristaIds) {
      return NextResponse.json(
        {
          success: false,
          message: `Envie passageiro_id e motorista_ids (lista de até ${MAX_CANDIDATOS} ids de até 64 caracteres).`,
        },
        { status: 400 }
      );
    }

    if (
      body.motorista_feminina !== undefined &&
      typeof body.motorista_feminina !== "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "motorista_feminina deve ser verdadeiro ou falso.",
        },
        { status: 400 }
      );
    }

    const resultado = await avaliarMotoristasParaPassageira(
      body.passageiro_id,
      motoristaIds,
      body.motorista_feminina
    );

    return NextResponse.json(
      { success: true, ...resultado },
      { headers: SEM_CACHE }
    );
  } catch (error) {
    console.error("Erro ao avaliar elegibilidade de pareamento:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao avaliar as motoristas." },
      { status: 500 }
    );
  }
}
