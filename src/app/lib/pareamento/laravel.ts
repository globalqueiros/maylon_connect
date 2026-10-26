import { createHash } from "node:crypto";

/**
 * Os apps entram pelo backend de despacho (auth.maylon.com.br) e levam o token
 * dele, que o portal não consegue validar sozinho. Em vez de compartilhar
 * segredo, o portal pergunta ao próprio backend quem é o dono do token.
 */
export type UsuarioDoApp = { id: string; tipo: "customer" | "driver" };

type Fetch = typeof fetch;

type Opcoes = {
  baseUrl: string;
  fetchImpl?: Fetch;
  agora?: () => number;
};

const CACHE_OK_MS = 60_000;
const CACHE_FALHA_MS = 15_000;
const TIMEOUT_MS = 5_000;

const cache = new Map<string, { ate: number; usuario: UsuarioDoApp | null }>();

async function perguntar(
  fetchImpl: Fetch,
  baseUrl: string,
  caminho: string,
  token: string
): Promise<Record<string, unknown> | null> {
  try {
    const resposta = await fetchImpl(`${baseUrl}${caminho}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });

    if (!resposta.ok) return null;

    const json = (await resposta.json()) as { data?: Record<string, unknown> };
    return json?.data && typeof json.data === "object" ? json.data : null;
  } catch {
    return null;
  }
}

export function tokenBearer(req: Request): string | null {
  const cabecalho = req.headers.get("authorization") || "";
  const partes = cabecalho.split(" ");
  if (partes.length !== 2 || partes[0].toLowerCase() !== "bearer") return null;
  return partes[1].trim() || null;
}

export async function identificarNoLaravel(
  token: string,
  { baseUrl, fetchImpl = fetch, agora = Date.now }: Opcoes
): Promise<UsuarioDoApp | null> {
  const chave = createHash("sha256").update(token).digest("hex");

  const guardado = cache.get(chave);
  if (guardado && guardado.ate > agora()) return guardado.usuario;

  let usuario: UsuarioDoApp | null = null;

  for (const [caminho, tipo] of [
    ["/api/customer/info", "customer"],
    ["/api/driver/info", "driver"],
  ] as const) {
    const dados = await perguntar(fetchImpl, baseUrl, caminho, token);
    const id = dados?.id;

    if (typeof id === "string" && id.trim() !== "") {
      usuario = { id: id.trim(), tipo };
      break;
    }
  }

  if (cache.size > 5000) cache.clear();
  cache.set(chave, {
    ate: agora() + (usuario ? CACHE_OK_MS : CACHE_FALHA_MS),
    usuario,
  });

  return usuario;
}

export function limparCacheLaravel() {
  cache.clear();
}
