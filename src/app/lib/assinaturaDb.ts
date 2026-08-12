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
  btg_tx_id?: string | null;
  btg_charge_id?: string | null;
  pix_emv?: string | null;
  btg_emv?: string | null;
  pix_etapa?: string | null;
  pix_stage?: string | null;
  pedido_codigo?: string | null;
  valor_cobrado?: number | string | null;
};

/** Map logical field → possible physical column names (legacy + current). */
const COLUMN_ALIASES: Record<string, string[]> = {
  pedido_codigo: ["pedido_codigo"],
  valor_cobrado: ["valor_cobrado"],
  pix_etapa: ["pix_etapa", "pix_stage"],
  pix_stage: ["pix_stage", "pix_etapa"],
  pix_emv: ["pix_emv", "btg_emv"],
  btg_emv: ["btg_emv", "pix_emv"],
  btg_txid: ["btg_txid", "btg_tx_id"],
  btg_tx_id: ["btg_tx_id", "btg_txid"],
  btg_charge_id: ["btg_charge_id"],
  btg_authorization_id: ["btg_authorization_id"],
  btg_qr_url: ["btg_qr_url", "pix_qr_url"],
  stripe_customer_id: ["stripe_customer_id"],
  stripe_subscription_id: ["stripe_subscription_id"],
  stripe_payment_method_id: ["stripe_payment_method_id"],
  card_brand: ["card_brand"],
  card_last4: ["card_last4"],
  metodo_pagamento: ["metodo_pagamento"],
  status_assinatura: ["status_assinatura"],
  ativo: ["ativo"],
};

function normalizeAssinaturaRow(row: AssinaturaRow | null): AssinaturaRow | null {
  if (!row) return null;
  return {
    ...row,
    pix_emv: row.pix_emv ?? row.btg_emv ?? null,
    btg_emv: row.btg_emv ?? row.pix_emv ?? null,
    btg_txid: row.btg_txid ?? row.btg_tx_id ?? null,
    btg_tx_id: row.btg_tx_id ?? row.btg_txid ?? null,
    pix_etapa: row.pix_etapa ?? row.pix_stage ?? null,
    pix_stage: row.pix_stage ?? row.pix_etapa ?? null,
  };
}

async function safeUpdate(id: number, fields: Record<string, unknown>) {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    const candidates = COLUMN_ALIASES[key] || [key];
    let written = false;
    for (const column of candidates) {
      try {
        await db.query(
          `UPDATE usuario_beneficios SET \`${column}\` = ? WHERE id = ?`,
          [value, id]
        );
        written = true;
      } catch (error: any) {
        if (error?.code !== "ER_BAD_FIELD_ERROR") {
          console.warn(`safeUpdate ${column}:`, error?.message || error);
        }
      }
    }
    if (!written) {
      console.warn(`safeUpdate skipped unknown field: ${key}`);
    }
  }
}

export async function ensurePaymentColumns() {
  const alters = [
    "ALTER TABLE usuario_beneficios ADD COLUMN metodo_pagamento VARCHAR(40) NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN status_assinatura VARCHAR(40) NOT NULL DEFAULT 'pendente'",
    "ALTER TABLE usuario_beneficios ADD COLUMN stripe_customer_id VARCHAR(120) NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN stripe_subscription_id VARCHAR(120) NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN stripe_payment_method_id VARCHAR(120) NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN card_brand VARCHAR(40) NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN card_last4 VARCHAR(8) NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN btg_authorization_id VARCHAR(120) NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN btg_contract VARCHAR(40) NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN btg_tx_id VARCHAR(80) NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN btg_txid VARCHAR(80) NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN btg_charge_id VARCHAR(120) NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN btg_emv TEXT NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN pix_emv TEXT NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN btg_qr_url TEXT NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN pix_stage VARCHAR(40) NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN pix_etapa VARCHAR(40) NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN pedido_codigo VARCHAR(64) NULL",
    "ALTER TABLE usuario_beneficios ADD COLUMN valor_cobrado DECIMAL(12,2) NULL",
  ];

  for (const sql of alters) {
    try {
      await db.query(sql);
    } catch (error: any) {
      if (error?.code !== "ER_DUP_FIELDNAME") {
        // table missing or no privilege — ignore; callers still work with fallbacks
      }
    }
  }

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS pagamento_assinaturas (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        usuario_id BIGINT UNSIGNED NOT NULL,
        beneficio_id BIGINT UNSIGNED NOT NULL,
        usuario_beneficio_id BIGINT UNSIGNED NULL,
        gateway VARCHAR(40) NOT NULL,
        metodo VARCHAR(40) NOT NULL,
        status VARCHAR(60) NOT NULL,
        amount DECIMAL(12,2) NULL,
        external_id VARCHAR(120) NULL,
        pedido_codigo VARCHAR(64) NULL,
        payload_json LONGTEXT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_pag_pedido (pedido_codigo),
        KEY idx_pag_usuario (usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  } catch {
    // ignore
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
    return normalizeAssinaturaRow(rows[0] || null);
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
    return normalizeAssinaturaRow(rows[0] || null);
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
  await ensurePaymentColumns();

  const existing = await findActiveOrPending(
    params.usuarioId,
    params.beneficioId
  );

  if (existing?.status_assinatura === "aprovado" && existing.ativo === 1) {
    throw Object.assign(
      new Error("Já existe uma assinatura ativa para este benefício"),
      { status: 400 }
    );
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
      await db.query(`UPDATE usuario_beneficios SET ativo = 0 WHERE id = ?`, [
        id,
      ]);
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
    pix_stage: params.extra?.pix_etapa ?? null,
    btg_authorization_id: params.extra?.btg_authorization_id ?? null,
    btg_txid: params.extra?.btg_txid ?? null,
    btg_tx_id: params.extra?.btg_txid ?? null,
    btg_charge_id: params.extra?.btg_charge_id ?? null,
    pix_emv: params.extra?.pix_emv ?? null,
    btg_emv: params.extra?.pix_emv ?? null,
    stripe_customer_id: params.extra?.stripe_customer_id ?? null,
    stripe_subscription_id: params.extra?.stripe_subscription_id ?? null,
  });

  return id!;
}

export async function updateAssinaturaById(
  id: number,
  fields: Record<string, unknown>
) {
  await ensurePaymentColumns();
  await safeUpdate(id, fields);
}

export async function findByPedido(pedidoCodigo: string) {
  try {
    const [rows] = await db.query<AssinaturaRow[]>(
      `SELECT * FROM usuario_beneficios WHERE pedido_codigo = ? LIMIT 1`,
      [pedidoCodigo]
    );
    return normalizeAssinaturaRow(rows[0] || null);
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
    return normalizeAssinaturaRow(rows[0] || null);
  } catch {
    return null;
  }
}

export async function findByTxId(txId: string) {
  try {
    const [rows] = await db.query<AssinaturaRow[]>(
      `SELECT * FROM usuario_beneficios
       WHERE btg_txid = ? OR btg_tx_id = ?
       LIMIT 1`,
      [txId, txId]
    );
    return normalizeAssinaturaRow(rows[0] || null);
  } catch {
    try {
      const [rows] = await db.query<AssinaturaRow[]>(
        `SELECT * FROM usuario_beneficios WHERE btg_tx_id = ? LIMIT 1`,
        [txId]
      );
      return normalizeAssinaturaRow(rows[0] || null);
    } catch {
      return null;
    }
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
    await ensurePaymentColumns();
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
