import { db } from "./db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export type AssinaturaRow = RowDataPacket & {
  id: number;
  usuario_id: number;
  beneficio_id: number;
  ativo: number;
  metodo_pagamento?: string | null;
  status_assinatura?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_payment_method_id?: string | null;
  card_brand?: string | null;
  card_last4?: string | null;
  btg_authorization_id?: string | null;
  btg_txid?: string | null;
  btg_charge_id?: string | null;
  pix_emv?: string | null;
  pix_etapa?: string | null;
  pedido_codigo?: string | null;
  valor_cobrado?: number | string | null;
};

async function safeUpdate(id: number, fields: Record<string, unknown>) {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    try {
      await db.query(`UPDATE usuario_beneficios SET \`${key}\` = ? WHERE id = ?`, [
        value,
        id,
      ]);
    } catch (error: any) {
      // Ignore unknown column until migration is applied
      if (error?.code !== "ER_BAD_FIELD_ERROR") {
        console.warn(`safeUpdate ${key}:`, error?.message || error);
      }
    }
  }
}

export async function findActiveOrPending(
  usuarioId: number,
  beneficioId: number
) {
  try {
    const [rows] = await db.query<AssinaturaRow[]>(
      `
      SELECT *
      FROM usuario_beneficios
      WHERE usuario_id = ?
        AND beneficio_id = ?
        AND (
          status_assinatura IN ('pendente', 'aprovado', 'autorizado')
          OR ativo = 1
        )
      ORDER BY id DESC
      LIMIT 1
      `,
      [usuarioId, beneficioId]
    );
    return rows[0] || null;
  } catch {
    const [rows] = await db.query<AssinaturaRow[]>(
      `
      SELECT *
      FROM usuario_beneficios
      WHERE usuario_id = ?
        AND beneficio_id = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [usuarioId, beneficioId]
    );
    return rows[0] || null;
  }
}

export async function upsertPendente(params: {
  usuarioId: number;
  beneficioId: number;
  metodo: string;
  pedidoCodigo: string;
  valor: number;
  extra?: Record<string, unknown>;
}) {
  const existing = await findActiveOrPending(
    params.usuarioId,
    params.beneficioId
  );

  if (existing?.status_assinatura === "aprovado" && existing.ativo === 1) {
    throw new Error("Já existe uma assinatura ativa para este benefício");
  }

  let id = existing?.id;

  if (id) {
    try {
      await db.query(
        `
        UPDATE usuario_beneficios
        SET ativo = 0, metodo_pagamento = ?, status_assinatura = 'pendente'
        WHERE id = ?
        `,
        [params.metodo, id]
      );
    } catch {
      await db.query(
        `UPDATE usuario_beneficios SET ativo = 0 WHERE id = ?`,
        [id]
      );
    }
  } else {
    const [result] = await db.query<ResultSetHeader>(
      `
      INSERT INTO usuario_beneficios
        (usuario_id, beneficio_id, ativo, metodo_pagamento, status_assinatura)
      VALUES (?, ?, 0, ?, 'pendente')
      `,
      [params.usuarioId, params.beneficioId, params.metodo]
    );
    id = result.insertId;
  }

  await safeUpdate(id!, {
    pedido_codigo: params.pedidoCodigo,
    valor_cobrado: params.valor,
    pix_etapa: params.extra?.pix_etapa ?? null,
    btg_authorization_id: params.extra?.btg_authorization_id ?? null,
    btg_txid: params.extra?.btg_txid ?? null,
    btg_charge_id: params.extra?.btg_charge_id ?? null,
    pix_emv: params.extra?.pix_emv ?? null,
    stripe_customer_id: params.extra?.stripe_customer_id ?? null,
    stripe_subscription_id: params.extra?.stripe_subscription_id ?? null,
  });

  return id!;
}

export async function updateAssinaturaById(
  id: number,
  fields: Record<string, unknown>
) {
  await safeUpdate(id, fields);
}

export async function findByPedido(pedidoCodigo: string) {
  try {
    const [rows] = await db.query<AssinaturaRow[]>(
      `SELECT * FROM usuario_beneficios WHERE pedido_codigo = ? LIMIT 1`,
      [pedidoCodigo]
    );
    return rows[0] || null;
  } catch {
    return null;
  }
}

export async function findByAuthorizationId(authorizationId: string) {
  try {
    const [rows] = await db.query<AssinaturaRow[]>(
      `SELECT * FROM usuario_beneficios WHERE btg_authorization_id = ? LIMIT 1`,
      [authorizationId]
    );
    return rows[0] || null;
  } catch {
    return null;
  }
}

export async function findByTxId(txId: string) {
  try {
    const [rows] = await db.query<AssinaturaRow[]>(
      `SELECT * FROM usuario_beneficios WHERE btg_txid = ? LIMIT 1`,
      [txId]
    );
    return rows[0] || null;
  } catch {
    return null;
  }
}

export async function logPagamento(params: {
  usuarioId: number;
  beneficioId: number;
  usuarioBeneficioId?: number | null;
  gateway: string;
  metodo: string;
  status: string;
  amount?: number;
  externalId?: string;
  pedidoCodigo?: string;
  payload?: unknown;
}) {
  try {
    await db.query(
      `
      INSERT INTO pagamento_assinaturas
      (
        usuario_id,
        beneficio_id,
        usuario_beneficio_id,
        gateway,
        metodo,
        status,
        amount,
        external_id,
        pedido_codigo,
        payload_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        params.usuarioId,
        params.beneficioId,
        params.usuarioBeneficioId || null,
        params.gateway,
        params.metodo,
        params.status,
        params.amount ?? null,
        params.externalId || null,
        params.pedidoCodigo || null,
        params.payload ? JSON.stringify(params.payload) : null,
      ]
    );
  } catch (error) {
    console.warn("logPagamento skipped:", error);
  }
}
