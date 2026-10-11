import { NextResponse } from "next/server";
import {
  criarSessaoDidit,
  salvarSessaoVerificacao,
  usuarioDoToken,
} from "../../lib/diditServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TIPOS_PERMITIDOS = [
  "driver",
  "motorista",
  "1",
  "customer",
  "passageiro",
  "passenger",
  "2",
];

export async function POST() {
  try {
    const { id: userId, tipo } = await usuarioDoToken();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Não autenticado." },
        { status: 401 }
      );
    }

    if (tipo && !TIPOS_PERMITIDOS.includes(tipo)) {
      return NextResponse.json(
        { success: false, message: "Acesso não permitido." },
        { status: 403 }
      );
    }

    const sessao = await criarSessaoDidit(userId);

    if (!sessao.ok) {
      if (sessao.error === "not_configured") {
        return NextResponse.json(
          { success: false, message: "Verificação não configurada." },
          { status: 500 }
        );
      }

      if (sessao.error === "session_create_failed") {
        return NextResponse.json(
          {
            success: false,
            message: "Não foi possível iniciar a verificação.",
            error: "session_create_failed",
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Resposta inesperada da verificação.",
        },
        { status: 502 }
      );
    }

    await salvarSessaoVerificacao(userId, sessao.sessionId, sessao.url);

    return NextResponse.json({
      success: true,
      url: sessao.url,
      session_id: sessao.sessionId,
    });
  } catch (error) {
    console.error("POST /api/verificacao - ERRO INTERNO:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno." },
      { status: 500 }
    );
  }
}
