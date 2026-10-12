import { createHash, randomUUID } from "node:crypto";
import { jwtVerify, type JWTPayload } from "jose";
import { db } from "./db";

/**
 * Validador central de sessão (web e apps).
 *
 * - Token novo (com "sid"): só vale enquanto a linha em user_sessions com
 *   esse session_uuid estiver ativa, não expirada e for do mesmo usuário.
 * - Token antigo (sem "sid", emitido antes deste deploy): continua valendo
 *   até a própria expiração. No primeiro uso ganha uma linha em
 *   user_sessions (pelo hash do token), então também pode ser encerrado.
 * - Só é recusado: assinatura inválida/expirada ou sessão revogada,
 *   encerrada (logout) ou expirada.
 *
 * Cache curto (15 s) para não consultar o banco em toda requisição;
 * revogar/encerrar limpa o cache deste processo na hora.
 */

export type SessaoValida = {
  ok: true;
  userId: string;
  userType: string;
  sessionUuid: string;
  payload: JWTPayload & Record<string, unknown>;
};
export type SessaoInvalida = { ok: false; motivo: string };
export type ResultadoSessao = SessaoValida | SessaoInvalida;

const CACHE_MS = 15_000;
const cache = new Map<string, { ate: number; resultado: ResultadoSessao }>();
const emAndamento = new Map<string, Promise<ResultadoSessao>>();

function limparSecret(value?: string) {
  if (!value) return "";
  const cleaned = value.replace(/\r/g, "").trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    return cleaned.slice(1, -1);
  }
  return cleaned;
}

/**
 * Duração única da sessão: login, link mágico, /api/me e /api/refresh usam
 * este mesmo valor (antes o login dava 7 dias e o /api/me esticava pra 10).
 */
export const SESSAO_DIAS = 7;
export const SESSAO_SEGUNDOS = SESSAO_DIAS * 24 * 60 * 60;

export function fimDaSessao(): Date {
  return new Date(Date.now() + SESSAO_SEGUNDOS * 1000);
}

export function jwtSecret(): string {
  return limparSecret(process.env.JWT_SECRET);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function novoSessionUuid() {
  return randomUUID();
}

/** Lê o token do cookie access_token (Cookie header) ou do Authorization: Bearer. */
export function tokenDaRequisicao(req?: Request | null): string | null {
  if (!req) return null;
  const cookieHeader = req.headers.get("cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    if (part.slice(0, i).trim() !== "access_token") continue;
    const value = part.slice(i + 1).trim();
    if (!value) continue;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const bearer = auth.slice(7).trim();
    if (bearer) return bearer;
  }
  return null;
}

/** Igual ao tokenDaRequisicao, mas também tenta cookies() do Next (server components/rotas sem req). */
export async function tokenAtual(req?: Request | null): Promise<string | null> {
  const doReq = tokenDaRequisicao(req);
  if (doReq) return doReq;
  try {
    const { cookies } = await import("next/headers");
    const value = (await cookies()).get("access_token")?.value;
    return value || null;
  } catch {
    return null;
  }
}

function idDoPayload(payload: Record<string, unknown>): string | null {
  for (const key of ["id", "sub", "usuario_id", "userId", "user_id"]) {
    const v = payload[key];
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

export function infoDispositivo(userAgent: string | null) {
  const agent = userAgent || "";
  const device_name = /ipad|tablet/i.test(agent)
    ? "Tablet"
    : /mobile|android|iphone|okhttp|dart/i.test(agent)
      ? "Celular"
      : "Computador";
  const browser_name = /okhttp|dart/i.test(agent)
    ? "App Maylon"
    : /Edg\//i.test(agent)
      ? "Microsoft Edge"
      : /OPR\//i.test(agent)
        ? "Opera"
        : /Firefox\//i.test(agent)
          ? "Mozilla Firefox"
          : /Chrome\//i.test(agent)
            ? "Google Chrome"
            : /Safari\//i.test(agent)
              ? "Safari"
              : "Outro";
  const operating_system = /Windows/i.test(agent)
    ? "Windows"
    : /Android|okhttp/i.test(agent)
      ? "Android"
      : /iPhone|iPad|iPod/i.test(agent)
        ? "iOS"
        : /Mac OS|Macintosh/i.test(agent)
          ? "macOS"
          : /Linux/i.test(agent)
            ? "Linux"
            : "Outro";
  return { device_name, browser_name, operating_system };
}

/**
 * IP real do cliente. No servidor o site fica atrás de Cloudflare + Nginx, então
 * a ordem é: CF-Connecting-IP (Cloudflare), X-Forwarded-For (1º da lista),
 * X-Real-IP (Nginx). Sem isso todas as sessões mostrariam o IP do proxy.
 * (Rotas do Next não expõem o IP do socket; o X-Real-IP do Nginx é esse IP.)
 */
export function ipDaRequisicao(req?: Request | null): string | null {
  if (!req) return null;
  const candidatos = [
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-forwarded-for")?.split(",")[0],
    req.headers.get("x-real-ip"),
  ];
  for (const c of candidatos) {
    const ip = c?.trim();
    // ip_address é varchar(45): só aceita algo com cara de IPv4/IPv6 que caiba.
    if (ip && ip.length <= 45 && /^[0-9a-f:.]+$/i.test(ip)) return ip;
  }
  return null;
}

/** Cria a linha da sessão. Usado no login (senha e link mágico). */
export async function criarSessao(params: {
  sessionUuid: string;
  userId: string;
  token: string;
  expiresAt: Date;
  req?: Request | null;
}) {
  const userAgent = params.req?.headers.get("user-agent") || null;
  const info = infoDispositivo(userAgent);
  await db.execute(
    `INSERT INTO user_sessions (
       session_uuid, user_id, token_hash, ip_address, user_agent,
       device_name, browser_name, operating_system,
       status, created_at, last_activity_at, expires_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW(), ?)`,
    [
      params.sessionUuid,
      params.userId,
      hashToken(params.token),
      ipDaRequisicao(params.req),
      userAgent,
      info.device_name,
      info.browser_name,
      info.operating_system,
      params.expiresAt,
    ]
  );
}

type LinhaSessao = {
  session_uuid: string;
  user_id: string;
  status: string;
  expires_at: Date | string;
  last_activity_at: Date | string | null;
};

function ativa(row: LinhaSessao) {
  return (
    String(row.status).toLowerCase() === "active" &&
    new Date(row.expires_at).getTime() > Date.now()
  );
}

async function tocarAtividade(row: LinhaSessao, req?: Request | null) {
  const ultima = row.last_activity_at ? new Date(row.last_activity_at).getTime() : 0;
  if (Date.now() - ultima < 60_000) return;
  await db
    .execute(
      `UPDATE user_sessions
          SET last_activity_at = NOW(),
              ip_address = COALESCE(?, ip_address)
        WHERE session_uuid = ?`,
      [ipDaRequisicao(req), row.session_uuid]
    )
    .catch(() => {});
}

/**
 * Valida o token e a sessão. Nunca lança erro: devolve { ok: false } com o motivo.
 */
export async function validarSessao(
  token: string | null | undefined,
  req?: Request | null
): Promise<ResultadoSessao> {
  if (!token) return { ok: false, motivo: "sem_token" };

  const emCache = cache.get(token);
  if (emCache && emCache.ate > Date.now()) return emCache.resultado;

  // Requisições simultâneas com o mesmo token esperam a mesma validação:
  // assim um token antigo nunca ganha duas linhas (token_hash duplicado).
  const pendente = emAndamento.get(token);
  if (pendente) return pendente;

  const promessa = validarSemCache(token, req)
    .then((resultado) => {
      if (cache.size > 5000) cache.clear();
      cache.set(token, { ate: Date.now() + CACHE_MS, resultado });
      return resultado;
    })
    .finally(() => emAndamento.delete(token));
  emAndamento.set(token, promessa);
  return promessa;
}

async function validarSemCache(token: string, req?: Request | null): Promise<ResultadoSessao> {
  const secret = jwtSecret();
  if (!secret) return { ok: false, motivo: "sem_secret" };

  let payload: JWTPayload & Record<string, unknown>;
  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    payload = verified.payload as JWTPayload & Record<string, unknown>;
  } catch {
    return { ok: false, motivo: "token_invalido" };
  }

  const userId = idDoPayload(payload);
  if (!userId) return { ok: false, motivo: "token_sem_usuario" };
  const userType = String(payload.user_type ?? "").trim().toLowerCase();

  try {
    const sid = typeof payload.sid === "string" ? payload.sid : null;

    if (sid) {
      const [rows]: any = await db.execute(
        `SELECT session_uuid, user_id, status, expires_at, last_activity_at
           FROM user_sessions WHERE session_uuid = ? LIMIT 1`,
        [sid]
      );
      const row: LinhaSessao | undefined = rows?.[0];
      if (!row || String(row.user_id) !== userId || !ativa(row)) {
        return { ok: false, motivo: "sessao_encerrada" };
      }
      await tocarAtividade(row, req);
      return { ok: true, userId, userType, sessionUuid: row.session_uuid, payload };
    }

    // Token antigo, sem sid: procura (ou cria) a sessão pelo hash do token.
    const tokenHash = hashToken(token);
    const buscarPeloHash = async (): Promise<ResultadoSessao | null> => {
      const [rows]: any = await db.execute(
        `SELECT session_uuid, user_id, status, expires_at, last_activity_at
           FROM user_sessions WHERE token_hash = ? LIMIT 1`,
        [tokenHash]
      );
      const row: LinhaSessao | undefined = rows?.[0];
      if (!row) return null;
      if (String(row.user_id) !== userId || !ativa(row)) {
        return { ok: false, motivo: "sessao_encerrada" };
      }
      await tocarAtividade(row, req);
      return { ok: true, userId, userType, sessionUuid: row.session_uuid, payload };
    };
    const existente = await buscarPeloHash();
    if (existente) return existente;

    const expiresAt =
      typeof payload.exp === "number"
        ? new Date(payload.exp * 1000)
        : fimDaSessao();
    const sessionUuid = novoSessionUuid();
    const userAgent = req?.headers.get("user-agent") || null;
    const info = infoDispositivo(userAgent);
    try {
      await db.execute(
        `INSERT INTO user_sessions (
           session_uuid, user_id, token_hash, ip_address, user_agent,
           device_name, browser_name, operating_system,
           status, created_at, last_activity_at, expires_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW(), ?)`,
        [
          sessionUuid,
          userId,
          tokenHash,
          ipDaRequisicao(req),
          userAgent,
          info.device_name,
          info.browser_name,
          info.operating_system,
          expiresAt,
        ]
      );
    } catch (error: any) {
      // Outra requisição criou a linha deste token ao mesmo tempo: usa a dela.
      if (error?.code === "ER_DUP_ENTRY") {
        const outra = await buscarPeloHash();
        if (outra) return outra;
      }
      throw error;
    }
    return { ok: true, userId, userType, sessionUuid, payload };
  } catch (error) {
    console.error("[sessao] erro ao validar sessão:", error);
    return { ok: false, motivo: "erro_banco" };
  }
}

/**
 * Substituto direto de jwt.verify(token, secret) nas rotas antigas: devolve o
 * mesmo payload do token, mas lança erro (como o jwt.verify) se o token for
 * inválido OU se a sessão estiver revogada/encerrada.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function payloadDaSessao(token: string | null | undefined): Promise<any> {
  const sessao = await validarSessao(token);
  if (!sessao.ok) throw new Error(`Sessão inválida: ${sessao.motivo}`);
  return { ...sessao.payload, id: sessao.userId };
}

/** Atalho: token da requisição (cookie/Bearer ou cookies()) + validação. */
export async function sessaoDaRequisicao(req?: Request | null): Promise<ResultadoSessao> {
  return validarSessao(await tokenAtual(req), req);
}

function limparCache() {
  cache.clear();
}

/** Encerra uma sessão (logout = 'inactive', revogação = 'revoked'). */
export async function encerrarSessao(
  sessionUuid: string,
  status: "inactive" | "revoked",
  motivo: string,
  userId?: string
) {
  const [result]: any = await db.execute(
    `UPDATE user_sessions
        SET status = ?, ended_at = NOW(), end_reason = ?
      WHERE session_uuid = ?
        ${userId ? "AND user_id = ?" : ""}
        AND status = 'active'`,
    userId
      ? [status, motivo.slice(0, 100), sessionUuid, userId]
      : [status, motivo.slice(0, 100), sessionUuid]
  );
  limparCache();
  return Number(result?.affectedRows || 0);
}

/** Revoga todas as sessões do usuário, menos a atual (troca de senha, "sair de todos"). */
export async function revogarSessoesDoUsuario(
  userId: string,
  motivo: string,
  exceto?: string | null
) {
  const [result]: any = await db.execute(
    `UPDATE user_sessions
        SET status = 'revoked', ended_at = NOW(), end_reason = ?
      WHERE user_id = ? AND status = 'active'
        ${exceto ? "AND session_uuid <> ?" : ""}`,
    exceto ? [motivo.slice(0, 100), userId, exceto] : [motivo.slice(0, 100), userId]
  );
  limparCache();
  return Number(result?.affectedRows || 0);
}

/** Usado quando um token novo é reemitido (ex.: /api/me): estende a validade da sessão. */
export async function estenderSessao(sessionUuid: string, novoExpira: Date) {
  await db.execute(
    `UPDATE user_sessions
        SET expires_at = GREATEST(expires_at, ?)
      WHERE session_uuid = ? AND status = 'active'`,
    [novoExpira, sessionUuid]
  );
}
