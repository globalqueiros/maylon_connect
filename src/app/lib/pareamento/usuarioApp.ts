import { getUsuarioLogado } from "../auth";
import { identificarNoLaravel, tokenBearer } from "./laravel";

const BASE_URL = (
  process.env.MAYLON_API_URL?.trim() || "https://auth.maylon.com.br"
).replace(/\/+$/, "");

/**
 * Quem está chamando: sessão do portal (cookie ou Bearer do portal) ou, para
 * os apps, o token do backend de despacho confirmado pelo próprio backend.
 */
export async function getUsuarioAutenticado(
  req: Request
): Promise<{ id: string; tipo: string } | null> {
  const sessao = await getUsuarioLogado(req);
  if (sessao?.id) return { id: sessao.id, tipo: sessao.tipo };

  const token = tokenBearer(req);
  if (!token) return null;

  return identificarNoLaravel(token, { baseUrl: BASE_URL });
}
