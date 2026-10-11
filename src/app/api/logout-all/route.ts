import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { limparCookiesDeLogin, sair } from "../../lib/logoutServidor";
import { sessaoDaRequisicao } from "../../lib/sessaoServidor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Sai de todos os aparelhos: revoga todas as sessões do usuário. */
export async function POST(req: Request) {
  const sessao = await sessaoDaRequisicao(req);
  if (!sessao.ok) {
    return limparCookiesDeLogin(
      NextResponse.json({ message: "Sem sessão" }, { status: 401 })
    );
  }
  // Mantém a limpeza da tabela antiga, que outras telas ainda leem.
  await db
    .query("DELETE FROM sessions WHERE user_id = ?", [sessao.userId])
    .catch((error) => console.error("[logout-all] tabela sessions:", error));
  return sair(req, true);
}
