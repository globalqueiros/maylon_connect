import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { db } from "../../../lib/db";
import { ehTipoMotorista } from "../../../lib/pareamento/genero";
import { apoioParaMotorista } from "../../../lib/pareamento/regras";
import { obterAcessibilidadeParaApoio } from "../../../lib/pareamento/repositorio";
import { idValido } from "../../../lib/pareamento/servico";
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

type CorridaRow = RowDataPacket & {
  customer_id: string | null;
  driver_id: string | null;
};

/**
 * App da motorista: preferências de conduta da passageira desta corrida
 * (viagem silenciosa, sem mudar a rota). Só responde para a motorista que está
 * atribuída à corrida, e nunca devolve diagnóstico nem laudo.
 */
export async function GET(request: Request) {
  try {
    const usuario = await getUsuarioAutenticado(request);

    if (!usuario?.id) return erro("Usuário não autenticado.", 401);

    if (!ehTipoMotorista(usuario.tipo)) {
      return erro("Somente motoristas podem consultar o apoio da viagem.", 403);
    }

    const corridaId = new URL(request.url).searchParams.get("trip_request_id");

    if (!idValido(corridaId)) {
      return erro("Informe trip_request_id.", 400);
    }

    const [rows] = await db.query<CorridaRow[]>(
      "SELECT customer_id, driver_id FROM trip_requests WHERE id = ? LIMIT 1",
      [corridaId]
    );

    const corrida = rows[0];

    // Mesma resposta para corrida inexistente e de outra motorista.
    if (
      !corrida?.customer_id ||
      String(corrida.driver_id ?? "") !== usuario.id
    ) {
      return erro("Corrida não encontrada para esta motorista.", 404);
    }

    const acessibilidade = await obterAcessibilidadeParaApoio(
      String(corrida.customer_id)
    );

    return NextResponse.json(
      { success: true, apoio_viagem: apoioParaMotorista(acessibilidade) },
      { headers: SEM_CACHE }
    );
  } catch (error) {
    console.error("Erro ao buscar apoio da viagem:", error);
    return erro("Erro ao buscar o apoio da viagem.", 500);
  }
}
