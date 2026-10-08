import { db } from "../db";

// A resolução do usuário logado é genérica (lê o cookie/JWT) e é a mesma
// usada pela integração Asaas. Reexportamos para manter os imports coerentes.
export { usuarioLogadoId } from "../asaas/transacoes";

/**
 * Histórico das operações RVHub de cada usuário (tabela rvhub_transacoes,
 * criada por sql/rvhub_transacoes.sql).
 *
 * Status locais: CRIANDO (antes de chamar a RVHub) e ERRO (a RVHub recusou).
 * Depois disso o status é o que a RVHub devolve (awaiting_payment, authorized,
 * captured, approved, denied, refunded...), atualizado pela consulta/webhook.
 */

export type TipoTransacao = "recarga" | "conta" | "giftcard";

export type Transacao = {
  id: number;
  usuario_id: string;
  tipo: TipoTransacao;
  rvhub_id: string | null;
  status: string;
  status_reason: string | null;
  valor: number;
  telefone: string | null;
  operadora: string | null;
  product_id: string | null;
  linha_digitavel: string | null;
  barcode: string | null;
  beneficiario: string | null;
  payer_name: string | null;
  payer_document: string | null;
  authorization_code: string | null;
  nsu: string | null;
  pin: string | null;
  erro: string | null;
  criado_em: string;
  atualizado_em: string;
};

export async function criarTransacao(dados: {
  usuarioId: string;
  tipo: TipoTransacao;
  valor: number;
  telefone?: string;
  operadora?: string;
  productId?: string;
  linhaDigitavel?: string;
  barcode?: string;
  beneficiario?: string | null;
}): Promise<number> {
  const [result]: any = await db.query(
    `INSERT INTO rvhub_transacoes
       (usuario_id, tipo, status, valor, telefone, operadora, product_id, linha_digitavel, barcode, beneficiario)
     VALUES (?, ?, 'CRIANDO', ?, ?, ?, ?, ?, ?, ?)`,
    [
      dados.usuarioId,
      dados.tipo,
      dados.valor,
      dados.telefone ?? null,
      dados.operadora ?? null,
      dados.productId ?? null,
      dados.linhaDigitavel ?? null,
      dados.barcode ?? null,
      dados.beneficiario ?? null,
    ]
  );
  return Number(result.insertId);
}

export async function marcarEnviada(
  id: number,
  rvhubId: string,
  status: string,
  extras?: {
    statusReason?: string | null;
    authorizationCode?: string | null;
    nsu?: string | null;
    pin?: string | null;
    payerName?: string | null;
    payerDocument?: string | null;
  }
) {
  await db.query(
    `UPDATE rvhub_transacoes
        SET rvhub_id = ?, status = ?, erro = NULL,
            status_reason = COALESCE(?, status_reason),
            authorization_code = COALESCE(?, authorization_code),
            nsu = COALESCE(?, nsu),
            pin = COALESCE(?, pin),
            payer_name = COALESCE(?, payer_name),
            payer_document = COALESCE(?, payer_document)
      WHERE id = ?`,
    [
      rvhubId,
      status,
      extras?.statusReason ?? null,
      extras?.authorizationCode ?? null,
      extras?.nsu ?? null,
      extras?.pin ?? null,
      extras?.payerName ?? null,
      extras?.payerDocument ?? null,
      id,
    ]
  );
}

/**
 * ERRO: a RVHub respondeu recusando (nada foi gasto).
 * VERIFICAR: a chamada caiu sem resposta (timeout, rede) e não dá pra saber
 * se a RVHub executou. Conferir no painel antes de tentar de novo.
 */
export async function marcarErro(
  id: number,
  erro: string,
  status: "ERRO" | "VERIFICAR" = "ERRO"
) {
  await db.query(
    `UPDATE rvhub_transacoes SET status = ?, erro = ? WHERE id = ?`,
    [status, erro.slice(0, 255), id]
  );
}

/** Atualiza pelo id da RVHub. Retorna quantas linhas mudaram. */
export async function atualizarStatusPorRvhubId(
  rvhubId: string,
  status: string,
  detalhes?: { statusReason?: string | null; erro?: string | null }
): Promise<number> {
  const [result]: any = await db.query(
    `UPDATE rvhub_transacoes
        SET status = ?,
            status_reason = COALESCE(?, status_reason),
            erro = COALESCE(?, erro)
      WHERE rvhub_id = ?`,
    [
      status,
      detalhes?.statusReason ?? null,
      detalhes?.erro ? detalhes.erro.slice(0, 255) : null,
      rvhubId,
    ]
  );
  return Number(result.affectedRows || 0);
}

export async function buscarPorRvhubId(rvhubId: string): Promise<Transacao | null> {
  const [rows]: any = await db.query(
    `SELECT * FROM rvhub_transacoes WHERE rvhub_id = ? LIMIT 1`,
    [rvhubId]
  );
  return rows?.[0] ?? null;
}

export async function buscarTransacaoDoUsuario(
  id: number,
  usuarioId: string
): Promise<Transacao | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const [rows]: any = await db.query(
    `SELECT * FROM rvhub_transacoes WHERE id = ? AND usuario_id = ? LIMIT 1`,
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
    `SELECT COUNT(*) AS total FROM rvhub_transacoes WHERE ${whereSql}`,
    args
  );
  const [rows]: any = await db.query(
    `SELECT * FROM rvhub_transacoes WHERE ${whereSql}
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
  operadora?: string;
  linhaDigitavel?: string;
}): Promise<boolean> {
  if (params.tipo === "recarga") {
    const [rows]: any = await db.query(
      `SELECT id FROM rvhub_transacoes
         WHERE usuario_id = ? AND tipo = 'recarga' AND telefone = ? AND valor = ?
           AND status NOT IN ('ERRO', 'denied', 'refunded')
           AND criado_em > NOW() - INTERVAL 2 MINUTE LIMIT 1`,
      [params.usuarioId, params.telefone, params.valor]
    );
    return Boolean(rows?.length);
  }

  if (params.tipo === "giftcard") {
    const [rows]: any = await db.query(
      `SELECT id FROM rvhub_transacoes
         WHERE usuario_id = ? AND tipo = 'giftcard' AND operadora = ? AND valor = ?
           AND status NOT IN ('ERRO', 'denied', 'refunded')
           AND criado_em > NOW() - INTERVAL 2 MINUTE LIMIT 1`,
      [params.usuarioId, params.operadora, params.valor]
    );
    return Boolean(rows?.length);
  }

  const [rows]: any = await db.query(
    `SELECT id FROM rvhub_transacoes
       WHERE usuario_id = ? AND tipo = 'conta' AND linha_digitavel = ?
         AND status NOT IN ('ERRO', 'denied', 'refunded') LIMIT 1`,
    [params.usuarioId, params.linhaDigitavel]
  );
  return Boolean(rows?.length);
}
