import { db } from "./db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export type AssinaturaRow = RowDataPacket & {
  id: number;

  // Na sua tabela usuario_id é VARCHAR(150)
  usuario_id: string | number;

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
  btg_contract?: string | null;

  btg_txid?: string | null;
  btg_tx_id?: string | null;
  btg_charge_id?: string | null;

  btg_emv?: string | null;
  pix_emv?: string | null;

  pix_etapa?: string | null;
  pix_stage?: string | null;

  btg_qr_url?: string | null;

  pedido_codigo?: string | null;
  valor_cobrado?: number | string | null;

  criado_em?: Date | string | null;
  atualizado_em?: Date | string | null;
};

/**
 * Map logical field -> possible physical column names.
 *
 * Mantemos compatibilidade com nomes antigos da tabela.
 */
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
  btg_contract: ["btg_contract"],

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

/**
 * Normaliza nomes legados.
 */
function normalizeAssinaturaRow(
  row: AssinaturaRow | null
): AssinaturaRow | null {
  if (!row) {
    return null;
  }

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

/**
 * Atualiza campos individualmente respeitando aliases.
 *
 * Isso permite trabalhar com bancos que possuem nomes antigos
 * e novos de determinadas colunas.
 */
async function safeUpdate(
  id: number,
  fields: Record<string, unknown>
) {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) {
      continue;
    }

    const candidates = COLUMN_ALIASES[key] || [key];

    let written = false;

    for (const column of candidates) {
      try {
        await db.query(
          `
          UPDATE usuario_beneficios
          SET \`${column}\` = ?
          WHERE id = ?
          `,
          [value, id]
        );

        written = true;
      } catch (error: any) {
        /**
         * Se a coluna não existir, tenta o próximo alias.
         */
        if (error?.code !== "ER_BAD_FIELD_ERROR") {
          console.warn(
            `safeUpdate ${column}:`,
            error?.message || error
          );
        }
      }
    }

    if (!written) {
      console.warn(
        `safeUpdate skipped unknown field: ${key}`
      );
    }
  }
}

/**
 * Garante as colunas utilizadas pelo sistema de pagamentos.
 *
 * Pode ser mantido temporariamente durante desenvolvimento.
 * Em produção, o ideal é transformar isso em migration.
 */
export async function ensurePaymentColumns() {
  const alters = [
    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN metodo_pagamento VARCHAR(40) NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN status_assinatura VARCHAR(40)
    NOT NULL DEFAULT 'pendente'
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN stripe_customer_id VARCHAR(120) NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN stripe_subscription_id VARCHAR(120) NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN stripe_payment_method_id VARCHAR(120) NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN card_brand VARCHAR(40) NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN card_last4 VARCHAR(8) NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN btg_authorization_id VARCHAR(120) NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN btg_contract VARCHAR(40) NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN btg_tx_id VARCHAR(80) NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN btg_txid VARCHAR(80) NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN btg_charge_id VARCHAR(120) NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN btg_emv TEXT NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN pix_emv TEXT NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN btg_qr_url TEXT NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN pix_stage VARCHAR(40) NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN pix_etapa VARCHAR(40) NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN pedido_codigo VARCHAR(64) NULL
    `,

    `
    ALTER TABLE usuario_beneficios
    ADD COLUMN valor_cobrado DECIMAL(12,2) NULL
    `,
  ];

  for (const sql of alters) {
    try {
      await db.query(sql);
    } catch (error: any) {
      /**
       * ER_DUP_FIELDNAME = coluna já existe.
       *
       * Outros erros são ignorados para não derrubar
       * o checkout caso o usuário do banco não tenha
       * permissão para ALTER TABLE.
       */
      if (error?.code !== "ER_DUP_FIELDNAME") {
        console.warn(
          "ensurePaymentColumns:",
          error?.message || error
        );
      }
    }
  }

  /**
   * Tabela de histórico dos pagamentos.
   */
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

        KEY idx_pag_usuario (usuario_id),

        KEY idx_pag_external_id (external_id)

      ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
    `);
  } catch (error: any) {
    console.warn(
      "pagamento_assinaturas:",
      error?.message || error
    );
  }
}

/**
 * Procura assinatura ativa ou pendente.
 */
export async function findActiveOrPending(
  usuarioId: string | number,
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
          status_assinatura IN (
            'pendente',
            'aprovado',
            'autorizado'
          )
          OR ativo = 1
        )
      ORDER BY id DESC
      LIMIT 1
      `,
      [usuarioId, beneficioId]
    );

    return normalizeAssinaturaRow(
      rows[0] || null
    );
  } catch (error: any) {
    /**
     * Fallback para bancos antigos que ainda não
     * possuem status_assinatura.
     */
    if (error?.code !== "ER_BAD_FIELD_ERROR") {
      console.warn(
        "findActiveOrPending:",
        error?.message || error
      );
    }

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

    return normalizeAssinaturaRow(
      rows[0] || null
    );
  }
}

/**
 * Cria ou reutiliza uma assinatura pendente.
 *
 * IMPORTANTE:
 *
 * A combinação:
 *
 * usuario_id + beneficio_id
 *
 * possui UNIQUE KEY na sua tabela.
 *
 * Por isso usamos:
 *
 * ON DUPLICATE KEY UPDATE
 *
 * evitando:
 *
 * ER_DUP_ENTRY
 * Duplicate entry '6-2'
 */
export async function upsertPendente(params: {
  usuarioId: string | number;
  beneficioId: number;
  metodo: string;
  pedidoCodigo: string;
  valor: number;
  extra?: Record<string, unknown>;
}) {
  await ensurePaymentColumns();

  /**
   * Primeiro verifica se já existe uma assinatura ativa.
   *
   * Se estiver ativa, não permitimos criar outro checkout.
   */
  const existing = await findActiveOrPending(
    params.usuarioId,
    params.beneficioId
  );

  if (
    existing?.status_assinatura === "aprovado" &&
    Number(existing.ativo) === 1
  ) {
    throw Object.assign(
      new Error(
        "Já existe uma assinatura ativa para este benefício"
      ),
      {
        status: 400,
      }
    );
  }

  /**
   * Dados opcionais Stripe.
   */
  const stripeCustomerId =
    params.extra?.stripe_customer_id ?? null;

  const stripeSubscriptionId =
    params.extra?.stripe_subscription_id ?? null;

  const stripePaymentMethodId =
    params.extra?.stripe_payment_method_id ?? null;

  /**
   * AQUI ESTÁ A CORREÇÃO PRINCIPAL.
   *
   * Se usuario_id + beneficio_id não existir:
   *
   * INSERT
   *
   * Se já existir:
   *
   * UPDATE
   *
   * E:
   *
   * id = LAST_INSERT_ID(id)
   *
   * faz o MySQL retornar o ID existente em result.insertId.
   */
  const [result] = await db.query<ResultSetHeader>(
    `
    INSERT INTO usuario_beneficios
    (
      usuario_id,
      beneficio_id,
      ativo,
      metodo_pagamento,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_payment_method_id,
      status_assinatura,
      pedido_codigo,
      valor_cobrado,
      criado_em,
      atualizado_em
    )
    VALUES
    (
      ?,
      ?,
      0,
      ?,
      ?,
      ?,
      ?,
      'pendente',
      ?,
      ?,
      NOW(),
      NOW()
    )

    ON DUPLICATE KEY UPDATE

      ativo = 0,

      metodo_pagamento =
        VALUES(metodo_pagamento),

      stripe_customer_id =
        COALESCE(
          VALUES(stripe_customer_id),
          stripe_customer_id
        ),

      stripe_subscription_id =
        COALESCE(
          VALUES(stripe_subscription_id),
          stripe_subscription_id
        ),

      stripe_payment_method_id =
        COALESCE(
          VALUES(stripe_payment_method_id),
          stripe_payment_method_id
        ),

      status_assinatura = 'pendente',

      pedido_codigo =
        VALUES(pedido_codigo),

      valor_cobrado =
        VALUES(valor_cobrado),

      atualizado_em = NOW(),

      id = LAST_INSERT_ID(id)
    `,
    [
      params.usuarioId,
      params.beneficioId,
      params.metodo,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePaymentMethodId,
      params.pedidoCodigo,
      params.valor,
    ]
  );

  const id = Number(result.insertId);

  if (!id || id <= 0) {
    throw new Error(
      "Não foi possível obter o ID de usuario_beneficios"
    );
  }

  /**
   * Atualiza campos complementares.
   *
   * Mantemos essa parte separada porque sua estrutura
   * possui campos BTG/Pix legados e atuais.
   */
  await safeUpdate(id, {
    pedido_codigo: params.pedidoCodigo,

    valor_cobrado: params.valor,

    pix_etapa:
      params.extra?.pix_etapa ?? undefined,

    pix_stage:
      params.extra?.pix_stage ??
      params.extra?.pix_etapa ??
      undefined,

    btg_authorization_id:
      params.extra?.btg_authorization_id ??
      undefined,

    btg_txid:
      params.extra?.btg_txid ??
      undefined,

    btg_tx_id:
      params.extra?.btg_tx_id ??
      params.extra?.btg_txid ??
      undefined,

    btg_charge_id:
      params.extra?.btg_charge_id ??
      undefined,

    pix_emv:
      params.extra?.pix_emv ??
      undefined,

    btg_emv:
      params.extra?.btg_emv ??
      params.extra?.pix_emv ??
      undefined,

    btg_qr_url:
      params.extra?.btg_qr_url ??
      undefined,

    stripe_customer_id:
      params.extra?.stripe_customer_id ??
      undefined,

    stripe_subscription_id:
      params.extra?.stripe_subscription_id ??
      undefined,

    stripe_payment_method_id:
      params.extra?.stripe_payment_method_id ??
      undefined,

    card_brand:
      params.extra?.card_brand ??
      undefined,

    card_last4:
      params.extra?.card_last4 ??
      undefined,

    atualizado_em:
      undefined,
  });

  return id;
}

/**
 * Atualiza uma assinatura pelo ID.
 */
export async function updateAssinaturaById(
  id: number,
  fields: Record<string, unknown>
) {
  await ensurePaymentColumns();

  await safeUpdate(id, fields);

  /**
   * Atualiza o timestamp real da sua tabela.
   */
  try {
    await db.query(
      `
      UPDATE usuario_beneficios
      SET atualizado_em = NOW()
      WHERE id = ?
      `,
      [id]
    );
  } catch (error: any) {
    if (error?.code !== "ER_BAD_FIELD_ERROR") {
      console.warn(
        "updateAssinaturaById timestamp:",
        error?.message || error
      );
    }
  }
}

/**
 * Busca assinatura pelo código do pedido.
 */
export async function findByPedido(
  pedidoCodigo: string
) {
  try {
    const [rows] =
      await db.query<AssinaturaRow[]>(
        `
        SELECT *
        FROM usuario_beneficios
        WHERE pedido_codigo = ?
        ORDER BY id DESC
        LIMIT 1
        `,
        [pedidoCodigo]
      );

    return normalizeAssinaturaRow(
      rows[0] || null
    );
  } catch (error: any) {
    if (error?.code !== "ER_BAD_FIELD_ERROR") {
      console.warn(
        "findByPedido:",
        error?.message || error
      );
    }

    return null;
  }
}

/**
 * Busca pelo authorization_id do BTG.
 */
export async function findByAuthorizationId(
  authorizationId: string
) {
  try {
    const [rows] =
      await db.query<AssinaturaRow[]>(
        `
        SELECT *
        FROM usuario_beneficios
        WHERE btg_authorization_id = ?
        LIMIT 1
        `,
        [authorizationId]
      );

    return normalizeAssinaturaRow(
      rows[0] || null
    );
  } catch (error: any) {
    if (error?.code !== "ER_BAD_FIELD_ERROR") {
      console.warn(
        "findByAuthorizationId:",
        error?.message || error
      );
    }

    return null;
  }
}

/**
 * Busca pelo TXID do BTG/Pix.
 */
export async function findByTxId(
  txId: string
) {
  try {
    const [rows] =
      await db.query<AssinaturaRow[]>(
        `
        SELECT *
        FROM usuario_beneficios
        WHERE btg_txid = ?
           OR btg_tx_id = ?
        ORDER BY id DESC
        LIMIT 1
        `,
        [txId, txId]
      );

    return normalizeAssinaturaRow(
      rows[0] || null
    );
  } catch (error: any) {
    if (error?.code !== "ER_BAD_FIELD_ERROR") {
      console.warn(
        "findByTxId:",
        error?.message || error
      );
    }

    try {
      const [rows] =
        await db.query<AssinaturaRow[]>(
          `
          SELECT *
          FROM usuario_beneficios
          WHERE btg_tx_id = ?
          ORDER BY id DESC
          LIMIT 1
          `,
          [txId]
        );

      return normalizeAssinaturaRow(
        rows[0] || null
      );
    } catch {
      return null;
    }
  }
}

/**
 * Registra histórico do pagamento.
 */
export async function logPagamento(params: {
  usuarioId: number | string;
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
      VALUES
      (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
      )
      `,
      [
        params.usuarioId,
        params.beneficioId,
        params.usuarioBeneficioId ?? null,
        params.gateway,
        params.metodo,
        params.status,
        params.amount ?? null,
        params.externalId ?? null,
        params.pedidoCodigo ?? null,
        params.payload
          ? JSON.stringify(params.payload)
          : null,
      ]
    );
  } catch (error: any) {
    console.warn(
      "logPagamento skipped:",
      error?.message || error
    );
  }
}