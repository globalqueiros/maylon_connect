import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/**
 * Código de confirmação de e-mail sem tabela nova: o desafio vai num cookie
 * httpOnly assinado. O código entra só como HMAC com o segredo do servidor,
 * então quem lê o próprio cookie não consegue testar os códigos fora do site.
 */

export const VALIDADE_CODIGO_MS = 10 * 60 * 1000;
export const INTERVALO_REENVIO_MS = 60 * 1000;
export const MAX_TENTATIVAS = 5;

type Desafio = {
  /** Identificador do desafio, usado para contar as tentativas. */
  id: string;
  uid: string;
  email: string;
  hash: string;
  criadoEm: number;
  expiraEm: number;
};

export type ResultadoConferencia =
  | { ok: true; id: string }
  | { ok: false; motivo: "invalido" | "expirado" | "codigo_errado"; id?: string };

const b64 = (texto: string) => Buffer.from(texto).toString("base64url");

function chave(segredo: string) {
  if (!segredo) throw new Error("Segredo de verificação não configurado.");
  return createHmac("sha256", segredo).update("maylon:verificacao-email").digest();
}

function assinar(segredo: string, conteudo: string) {
  return createHmac("sha256", chave(segredo)).update(conteudo).digest("base64url");
}

function hashCodigo(segredo: string, d: Pick<Desafio, "id" | "uid" | "email">, codigo: string) {
  return assinar(segredo, `${d.id}:${d.uid}:${d.email}:${codigo}`);
}

function iguais(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const normalizarEmail = (email: string) => email.trim().toLowerCase();

export function gerarCodigo() {
  return String(randomInt(100000, 1000000));
}

export function criarDesafio(params: {
  segredo: string;
  uid: string;
  email: string;
  codigo: string;
  agora?: number;
}): string {
  const agora = params.agora ?? Date.now();
  const base = {
    id: randomBytes(12).toString("base64url"),
    uid: params.uid,
    email: normalizarEmail(params.email),
  };

  const desafio: Desafio = {
    ...base,
    hash: hashCodigo(params.segredo, base, params.codigo),
    criadoEm: agora,
    expiraEm: agora + VALIDADE_CODIGO_MS,
  };

  const conteudo = b64(JSON.stringify(desafio));
  return `${conteudo}.${assinar(params.segredo, conteudo)}`;
}

function lerDesafio(segredo: string, token: string | undefined): Desafio | null {
  if (!token) return null;

  const [conteudo, assinatura, sobra] = token.split(".");
  if (!conteudo || !assinatura || sobra !== undefined) return null;
  if (!iguais(assinatura, assinar(segredo, conteudo))) return null;

  try {
    const d = JSON.parse(Buffer.from(conteudo, "base64url").toString("utf8"));
    if (typeof d?.id !== "string" || typeof d?.uid !== "string" || typeof d?.email !== "string") {
      return null;
    }
    return d as Desafio;
  } catch {
    return null;
  }
}

/** Ainda dentro do intervalo de reenvio para este usuário e e-mail? */
export function reenvioBloqueado(params: {
  segredo: string;
  token: string | undefined;
  uid: string;
  email: string;
  agora?: number;
}) {
  const d = lerDesafio(params.segredo, params.token);
  if (!d || d.uid !== params.uid || d.email !== normalizarEmail(params.email)) return false;
  return (params.agora ?? Date.now()) - d.criadoEm < INTERVALO_REENVIO_MS;
}

export function conferirDesafio(params: {
  segredo: string;
  token: string | undefined;
  uid: string;
  email: string;
  codigo: string;
  agora?: number;
}): ResultadoConferencia {
  const d = lerDesafio(params.segredo, params.token);

  // Desafio de outra conta ou de um e-mail que mudou depois do envio não vale.
  if (!d || d.uid !== params.uid || d.email !== normalizarEmail(params.email)) {
    return { ok: false, motivo: "invalido" };
  }

  if ((params.agora ?? Date.now()) > d.expiraEm) {
    return { ok: false, motivo: "expirado", id: d.id };
  }

  if (!/^\d{6}$/.test(params.codigo) || !iguais(d.hash, hashCodigo(params.segredo, d, params.codigo))) {
    return { ok: false, motivo: "codigo_errado", id: d.id };
  }

  return { ok: true, id: d.id };
}
