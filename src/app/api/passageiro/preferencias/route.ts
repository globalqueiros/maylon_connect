import { NextResponse } from "next/server";

import { ehTipoMotorista } from "../../../lib/pareamento/genero";
import {
  obterPreferencias,
  salvarMotoristaFeminina,
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

/** Padrão da passageira: sempre pedir motorista mulher. */
export async function GET(request: Request) {
  try {
    const usuario = await getUsuarioAutenticado(request);

    if (!usuario?.id) return erro("Usuário não autenticado.", 401);

    if (ehTipoMotorista(usuario.tipo)) {
      return erro("Somente passageiros possuem esta preferência.", 403);
    }

    const preferencias = (await obterPreferencias([usuario.id])).get(
      usuario.id
    );

    return NextResponse.json(
      {
        success: true,
        motorista_feminina: preferencias?.motoristaFeminina ?? false,
      },
      { headers: SEM_CACHE }
    );
  } catch (error) {
    console.error("Erro ao buscar preferência de motorista:", error);
    return erro("Erro ao buscar sua preferência de motorista.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const usuario = await getUsuarioAutenticado(request);

    if (!usuario?.id) return erro("Usuário não autenticado.", 401);

    if (ehTipoMotorista(usuario.tipo)) {
      return erro("Somente passageiros possuem esta preferência.", 403);
    }

    const body = await request.json().catch(() => null);

    if (typeof body?.motorista_feminina !== "boolean") {
      return erro("Informe motorista_feminina como verdadeiro ou falso.", 400);
    }

    await salvarMotoristaFeminina(usuario.id, body.motorista_feminina);

    return NextResponse.json(
      {
        success: true,
        message: body.motorista_feminina
          ? "Você vai receber motoristas mulheres nas suas corridas."
          : "Preferência por motorista mulher desativada.",
        motorista_feminina: body.motorista_feminina,
      },
      { headers: SEM_CACHE }
    );
  } catch (error) {
    console.error("Erro ao salvar preferência de motorista:", error);
    return erro("Erro ao salvar sua preferência de motorista.", 500);
  }
}
