import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "../db";
import { JwtPayload, tokenFromCookieHeader } from "../session";

/**
 * Histórico das operações Asaas de cada usuário (tabela asaas_transacoes,
 * criada por sql/asaas_transacoes.sql).
 *
 * Status locais: CRIANDO (antes de chamar a Asaas) e ERRO (a Asaas recusou).
 * Depois disso o status é o que a Asaas devolve (PENDING, CONFIRMED, PAID,
 * CANCELLED, REFUNDED, FAILED...), atualizado pelo webhook.
 */

export type TipoTransacao = "recarga" | "conta";

export type Transacao = {
  id: number;
  usuario_id: string;
  tipo: TipoTransacao;
  asaas_id: string | null;
  status: string;
  valor: number;
  telefone: string | null;
  operadora: string | null;
  linha_digitavel: string | null;
  beneficiario: string | null;
  data_agendamento: string | null;
  erro: string | null;
  criado_em: string;
  atualizado_em: string;
};

/**
 * Id do usuário logado como texto, do jeito que está no token.
 * Não usa getSessionUser: ele converte o id para número, e os ids aqui são
 * UUID ("6b04746a-...") — viraria 6, misturando o histórico de usuários.
 */
export async function usuarioLogadoId(req: Request): Promise<string | null> {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) return null;

  let token = tokenFromCookieHeader(req.headers.get("cookie"));
  if (!token) {
    try {
      token = (await cookies()).get("access_token")?.value ?? null;
    } catch {
      token = null;
    }
  }
  if (!token) {
    const auth = req.headers.get("authorization") || "";
    if (auth.toLowerCase().startsWith("bearer ")) token = auth.slice(7).trim();
  }
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload & { usuario_id?: unknown };
    const id = decoded.id ?? decoded.usuario_id ?? decoded.userId ?? decoded.user_id ?? decoded.sub;
    const texto = id == null ? "" : String(id).trim();
    return texto && texto.length <= 36 ? texto : null;
  } catch {
    return null;
  }
}

export async function criarTransacao(dados: {
  usuarioId: string;
  tipo: TipoTransacao;
  valor: number;
  telefone?: string;
  operadora?: string;
  linhaDigitavel?: string;
  beneficiario?: string | null;
  dataAgendamento?: string;
}): Promise<number> {
  const [result]: any = await db.query(
    `INSERT INTO asaas_transacoes
       (usuario_id, tipo, status, valor, telefone, operadora, linha_digitavel, beneficiario, data_agendamento)
     VALUES (?, ?, 'CRIANDO', ?, ?, ?, ?, ?, ?)`,
    [
      dados.usuarioId,
      dados.tipo,
      dados.valor,
      dados.telefone ?? null,
      dados.operadora ?? null,
      dados.linhaDigitavel ?? null,
      dados.beneficiario ?? null,
      dados.dataAgendamento ?? null,
    ]
  );
  return Number(result.insertId);
}

export async function marcarEnviada(id: number, asaasId: string, status: string) {
  await db.query(
    `UPDATE asaas_transacoes SET asaas_id = ?, status = ?, erro = NULL WHERE id = ?`,
    [asaasId, status, id]
  );
}

/**
 * ERRO: a Asaas respondeu recusando (nada foi gasto).
 * VERIFICAR: a chamada caiu sem resposta (timeout, rede) e não dá pra saber
 * se a Asaas executou. Conferir no painel da Asaas antes de tentar de novo.
 */
export async function marcarErro(
  id: number,
  erro: string,
  status: "ERRO" | "VERIFICAR" = "ERRO"
) {
  await db.query(
    `UPDATE asaas_transacoes SET status = ?, erro = ? WHERE id = ?`,
    [status, erro.slice(0, 255), id]
  );
}

/** Usado pelo webhook: atualiza pelo id da Asaas. Retorna quantas linhas mudaram. */
export async function atualizarStatusPorAsaasId(
  asaasId: string,
  status: string,
  erro?: string | null
): Promise<number> {
  const [result]: any = await db.query(
    `UPDATE asaas_transacoes SET status = ?, erro = COALESCE(?, erro) WHERE asaas_id = ?`,
    [status, erro ? erro.slice(0, 255) : null, asaasId]
  );
  return Number(result.affectedRows || 0);
}

export async function buscarPorAsaasId(asaasId: string): Promise<Transacao | null> {
  const [rows]: any = await db.query(
    `SELECT * FROM asaas_transacoes WHERE asaas_id = ? LIMIT 1`,
    [asaasId]
  );
  return rows?.[0] ?? null;
}

/**
 * Quando a chamada à Asaas caiu sem resposta (VERIFICAR), a operação pode ter
 * sido criada mesmo assim, só que sem o asaas_id no histórico. Aqui ligamos a
 * operação da Asaas à linha pendente mais recente que bate com ela.
 */
export async function vincularPendente(params: {
  asaasId: string;
  status: string;
  tipo: TipoTransacao;
  valor: number;
  telefone?: string;
  linhaDigitavel?: string;
}): Promise<Transacao | null> {
  const [rows]: any = await db.query(
    params.tipo === "recarga"
      ? `SELECT * FROM asaas_transacoes
         WHERE tipo = 'recarga' AND asaas_id IS NULL AND status IN ('CRIANDO', 'VERIFICAR')
           AND telefone = ? AND valor = ? AND criado_em > NOW() - INTERVAL 10 MINUTE
         ORDER BY id DESC LIMIT 1`
      : `SELECT * FROM asaas_transacoes
         WHERE tipo = 'conta' AND asaas_id IS NULL AND status IN ('CRIANDO', 'VERIFICAR')
           AND linha_digitavel = ? AND valor = ? AND criado_em > NOW() - INTERVAL 10 MINUTE
         ORDER BY id DESC LIMIT 1`,
    [params.tipo === "recarga" ? params.telefone : params.linhaDigitavel, params.valor]
  );
  const row: Transacao | undefined = rows?.[0];
  if (!row) return null;
  await marcarEnviada(row.id, params.asaasId, params.status);
  return { ...row, asaas_id: params.asaasId, status: params.status };
}

export async function buscarTransacaoDoUsuario(
  id: number,
  usuarioId: string
): Promise<Transacao | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const [rows]: any = await db.query(
    `SELECT * FROM asaas_transacoes WHERE id = ? AND usuario_id = ? LIMIT 1`,
    [id, usuarioId]
  );
  return rows?.[0] ?? null;
}

export async function listarTransacoes(params: {
  usuarioId: string;
  tipo?: TipoTransacao;
  limite: number;
  offset: number;
}): Promise<{ total: number; itens: Transacao[] }> {
  const where = ["usuario_id = ?"];
  const args: unknown[] = [params.usuarioId];
  if (params.tipo) {
    where.push("tipo = ?");
    args.push(params.tipo);
  }
  const whereSql = where.join(" AND ");

  const [[{ total }]]: any = await db.query(
    `SELECT COUNT(*) AS total FROM asaas_transacoes WHERE ${whereSql}`,
    args
  );
  const [rows]: any = await db.query(
    `SELECT * FROM asaas_transacoes WHERE ${whereSql}
     ORDER BY criado_em DESC, id DESC LIMIT ? OFFSET ?`,
    [...args, params.limite, params.offset]
  );
  return { total: Number(total), itens: rows };
}

/**
 * Evita cobrar duas vezes por clique duplo: existe a mesma operação
 * do mesmo usuário nos últimos 2 minutos que não deu erro?
 */
export async function existeDuplicada(params: {
  usuarioId: string;
  tipo: TipoTransacao;
  valor?: number;
  telefone?: string;
  linhaDigitavel?: string;
}): Promise<boolean> {
  const [rows]: any = await db.query(
    params.tipo === "recarga"
      ? `SELECT id FROM asaas_transacoes
         WHERE usuario_id = ? AND tipo = 'recarga' AND telefone = ? AND valor = ?
           AND status NOT IN ('ERRO', 'CANCELLED', 'REFUNDED')
           AND criado_em > NOW() - INTERVAL 2 MINUTE LIMIT 1`
      : `SELECT id FROM asaas_transacoes
         WHERE usuario_id = ? AND tipo = 'conta' AND linha_digitavel = ?
           AND status NOT IN ('ERRO', 'CANCELLED', 'FAILED', 'REFUNDED') LIMIT 1`,
    params.tipo === "recarga"
      ? [params.usuarioId, params.telefone, params.valor]
      : [params.usuarioId, params.linhaDigitavel]
  );
  return Boolean(rows?.length);
}
