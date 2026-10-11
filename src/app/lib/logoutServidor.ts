import { NextResponse } from "next/server";
import {
  encerrarSessao,
  revogarSessoesDoUsuario,
  sessaoDaRequisicao,
} from "./sessaoServidor";

const LIMPAR = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
  expires: new Date(0),
};

/** Apaga os cookies de login (access e refresh). */
export function limparCookiesDeLogin(res: NextResponse) {
  res.cookies.set("access_token", "", LIMPAR);
  res.cookies.set("refresh_token", "", LIMPAR);
  return res;
}

/**
 * Encerra a sessão atual (ou todas do usuário) e apaga os cookies.
 * Os cookies são apagados mesmo se o banco falhar, pra pessoa sair de qualquer jeito.
 */
export async function sair(req: Request, todas = false) {
  try {
    const sessao = await sessaoDaRequisicao(req);
    if (sessao.ok) {
      if (todas) {
        await revogarSessoesDoUsuario(sessao.userId, "Saiu de todos os aparelhos");
      } else {
        await encerrarSessao(sessao.sessionUuid, "inactive", "logout", sessao.userId);
      }
    }
  } catch (error) {
    console.error("[logout] erro ao encerrar sessão:", error);
  }
  return limparCookiesDeLogin(
    NextResponse.json({ success: true, ok: true, message: "Sessão encerrada." })
  );
}
