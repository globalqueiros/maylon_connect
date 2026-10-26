import { NextResponse } from "next/server";

import { ehTipoMotorista } from "../../../lib/pareamento/genero";
import {
  obterGeneros,
  obterPreferencias,
  salvarSomentePassageiras,
} from "../../../lib/pareamento/repositorio";
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

/** Motorista que só quer atender passageiras. */
export async function GET(request: Request) {
  try {
    const usuario = await getUsuarioAutenticado(request);

    if (!usuario?.id) return erro("Usuário não autenticado.", 401);

    if (!ehTipoMotorista(usuario.tipo)) {
      return erro("Somente motoristas possuem esta preferência.", 403);
    }

    const [generos, preferencias] = await Promise.all([
      obterGeneros([usuario.id]),
      obterPreferencias([usuario.id]),
    ]);

    const generoConfirmado = generos.get(usuario.id) === "feminino";

    return NextResponse.json(
      {
        success: true,
        somente_passageiras:
          generoConfirmado &&
          (preferencias.get(usuario.id)?.somentePassageiras ?? false),
        genero_confirmado: generoConfirmado,
      },
      { headers: SEM_CACHE }
    );
  } catch (error) {
    console.error("Erro ao buscar preferência da motorista:", error);
    return erro("Erro ao buscar sua preferência de passageiras.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const usuario = await getUsuarioAutenticado(request);

    if (!usuario?.id) return erro("Usuário não autenticado.", 401);

    if (!ehTipoMotorista(usuario.tipo)) {
      return erro("Somente motoristas possuem esta preferência.", 403);
    }

    const body = await request.json().catch(() => null);

    if (typeof body?.somente_passageiras !== "boolean") {
      return erro("Informe somente_passageiras como verdadeiro ou falso.", 400);
    }

    // Desligar é sempre permitido; ligar exige o gênero feminino confirmado.
    if (body.somente_passageiras) {
      const generos = await obterGeneros([usuario.id]);

      if (generos.get(usuario.id) !== "feminino") {
        return erro(
          "Para atender somente passageiras, sua verificação de identidade precisa confirmar o gênero feminino.",
          403
        );
      }
    }

    await salvarSomentePassageiras(usuario.id, body.somente_passageiras);

    return NextResponse.json(
      {
        success: true,
        message: body.somente_passageiras
          ? "Você vai receber apenas passageiras."
          : "Você voltou a receber todos os passageiros.",
        somente_passageiras: body.somente_passageiras,
      },
      { headers: SEM_CACHE }
    );
  } catch (error) {
    console.error("Erro ao salvar preferência da motorista:", error);
    return erro("Erro ao salvar sua preferência de passageiras.", 500);
  }
}
