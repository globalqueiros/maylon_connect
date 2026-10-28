import { NextResponse } from "next/server";

import { obterNivelDoMotorista } from "../../../lib/nivelMotoristaDb";
import { ehTipoMotorista } from "../../../lib/pareamento/genero";
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

/** Nível atual do motorista, o próximo nível e o progresso (mesmas contas do app). */
export async function GET(request: Request) {
  try {
    const usuario = await getUsuarioAutenticado(request);

    if (!usuario?.id) return erro("Usuário não autenticado.", 401);

    if (!ehTipoMotorista(usuario.tipo)) {
      return erro("Somente motoristas possuem nível.", 403);
    }

    const nivel = await obterNivelDoMotorista(usuario.id);

    return NextResponse.json(
      {
        success: true,
        nivel_atual: nivel.nivelAtual,
        proximo_nivel: nivel.proximoNivel,
        progresso: nivel.progresso,
        nivel_concluido: nivel.nivelConcluido,
      },
      { headers: SEM_CACHE }
    );
  } catch (error) {
    console.error("Erro ao buscar o nível do motorista:", error);
    return erro("Erro ao buscar o seu nível.", 500);
  }
}
