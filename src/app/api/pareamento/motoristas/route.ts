import { NextResponse } from "next/server";

import { ehTipoMotorista } from "../../../lib/pareamento/genero";
import {
  avaliarMotoristasParaPassageira,
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
 * App da passageira: das motoristas que deram lance, quais ela pode receber
 * segundo a preferência "motorista mulher" salva no perfil.
 */
export async function POST(request: Request) {
  try {
    const usuario = await getUsuarioAutenticado(request);

    if (!usuario?.id) return erro("Usuário não autenticado.", 401);

    if (ehTipoMotorista(usuario.tipo)) {
      return erro("Somente passageiros podem consultar motoristas.", 403);
    }

    const body = await request.json().catch(() => null);
    const motoristaIds = listaDeIds(body?.motorista_ids);

    if (!motoristaIds) {
      return erro(
        `Envie motorista_ids (lista de até ${MAX_CANDIDATOS} ids de até 64 caracteres).`,
        400
      );
    }

    const resultado = await avaliarMotoristasParaPassageira(
      usuario.id,
      motoristaIds
    );

    return NextResponse.json(
      {
        success: true,
        exige_motorista_feminina: resultado.exige_motorista_feminina,
        elegiveis: resultado.elegiveis,
        sem_motorista_feminina: resultado.sem_motorista_feminina,
        opcoes_sem_motorista: resultado.opcoes_sem_motorista,
      },
      { headers: SEM_CACHE }
    );
  } catch (error) {
    console.error("Erro ao filtrar motoristas da passageira:", error);
    return erro("Erro ao avaliar as motoristas.", 500);
  }
}
