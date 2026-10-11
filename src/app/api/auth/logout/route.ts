import { sair } from "../../../lib/logoutServidor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Encerra a sessão deste aparelho e apaga os cookies de login. */
export async function POST(req: Request) {
  return sair(req);
}
