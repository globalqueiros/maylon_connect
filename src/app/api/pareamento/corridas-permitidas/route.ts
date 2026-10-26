import { NextResponse } from "next/server";

import { ehTipoMotorista } from "../../../lib/pareamento/genero";
import {
  avaliarPassageirasParaMotorista,
  listaDeIds,
  MAX_CANDIDATOS,
} from "../../../lib/pareamento/servico";
import { getUsuarioAutenticado } from "../../../lib/pareamento/usuarioApp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEM_CACHE = { "Cache-Control": "no-store" };

function erro(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: SEM_CACHE }
  );
}

/**
 * App da motorista: das corridas pendentes, quais ela pode atender. Barra a
 * corrida de passageira que pediu motorista mulher quando a motorista não tem
 * o gênero feminino confirmado, e passageiros quando a motorista só atende
 * passageiras.
 */
export async function POST(request: Request) {
  try {
    const usuario = await getUsuarioAutenticado(request);

    if (!usuario?.id) return erro("Usuário não autenticado.", 401);

    if (!ehTipoMotorista(usuario.tipo)) {
      return erro("Somente motoristas podem consultar corridas.", 403);
    }

    const body = await request.json().catch(() => null);
    const passageiroIds = listaDeIds(body?.passageiro_ids);

    if (!passageiroIds) {
      return erro(
        `Envie passageiro_ids (lista de até ${MAX_CANDIDATOS} ids de até 64 caracteres).`,
        400
      );
    }

    const resultado = await avaliarPassageirasParaMotorista(
      usuario.id,
      passageiroIds
    );

    return NextResponse.json(
      { success: true, ...resultado },
      { headers: SEM_CACHE }
    );
  } catch (error) {
    console.error("Erro ao filtrar corridas da motorista:", error);
    return erro("Erro ao avaliar as corridas.", 500);
  }
}
