import { db } from "../db";
import { getSessionUser } from "../session";

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

/** Id do usuário logado como texto (a tabela aceita id numérico ou UUID). */
export async function usuarioLogadoId(req: Request): Promise<string | null> {
  const user = await getSessionUser(req);
  return user?.id ? String(user.id) : null;
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

export async function buscarTransacaoDoUsuario(
  id: number,
  usuarioId: string
): Promise<Transacao | null> {
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
