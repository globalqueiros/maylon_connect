import { sair } from "../../lib/logoutServidor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Mesmo comportamento de /api/auth/logout (mantido por compatibilidade com os apps). */
export async function POST(req: Request) {
  return sair(req);
}

export async function GET(req: Request) {
  return sair(req);
}
