import { db } from "./db";

export type StatusAssinatura =
  | "pendente"
  | "aguardando_autorizacao"
  | "aguardando_pagamento"
  | "aprovado"
  | "recusado"
  | "cancelado"
  | "erro"
  | "expirado";

export type MetodoPagamento = "stripe_recorrente" | "pix_btg";

export async function findActiveOrPending(
  usuarioId: number,
  beneficioId: number
) {
  const [rows]: any = await db.execute(
    `
    SELECT *
    FROM usuario_beneficios
    WHERE usuario_id = ?
      AND beneficio_id = ?
      AND status_assinatura IN (
        'pendente',
        'aguardando_autorizacao',
        'aguardando_pagamento',
        'aprovado'
      )
    LIMIT 1
    `,
    [usuarioId, beneficioId]
  );
  return rows[0] || null;
}

export async function upsertPendingAssinatura(params: {
  usuarioId: number;
  beneficioId: number;
  metodo: MetodoPagamento;
  status: StatusAssinatura;
  extras?: Record<string, any>;
}) {
  const existing = await findActiveOrPending(
    params.usuarioId,
    params.beneficioId
  );

  if (existing) {
    if (existing.status_assinatura === "aprovado") {
      throw new Error("Já existe uma assinatura aprovada para este benefício");
    }

    const fields = ["metodo_pagamento = ?", "status_assinatura = ?", "ativo = 0"];
    const values: any[] = [params.metodo, params.status];

    if (params.extras) {
      for (const [key, value] of Object.entries(params.extras)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    values.push(existing.id);

    await db.execute(
      `UPDATE usuario_beneficios SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return existing.id as number;
  }

  const columns = [
    "usuario_id",
    "beneficio_id",
    "ativo",
    "metodo_pagamento",
    "status_assinatura",
  ];
  const values: any[] = [
    params.usuarioId,
    params.beneficioId,
    0,
    params.metodo,
    params.status,
  ];

  if (params.extras) {
    for (const [key, value] of Object.entries(params.extras)) {
      columns.push(key);
      values.push(value);
    }
  }

  const [result]: any = await db.execute(
    `
    INSERT INTO usuario_beneficios (${columns.join(", ")})
    VALUES (${columns.map(() => "?").join(", ")})
    `,
    values
  );

  return result.insertId as number;
}

export async function updateAssinaturaById(
  id: number,
  data: Record<string, any>
) {
  const fields = Object.keys(data).map((k) => `${k} = ?`);
  const values = [...Object.values(data), id];
  await db.execute(
    `UPDATE usuario_beneficios SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
}

export async function getAssinaturaById(id: number) {
  const [rows]: any = await db.execute(
    `SELECT * FROM usuario_beneficios WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function getBeneficio(beneficioId: number) {
  const [rows]: any = await db.execute(
    `SELECT * FROM beneficios WHERE id = ? LIMIT 1`,
    [beneficioId]
  );
  return rows[0] || null;
}

export async function getUsuario(usuarioId: number) {
  const [rows]: any = await db.execute(
    `
    SELECT id, full_name, email, identification_number, identification_type
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [usuarioId]
  );
  return rows[0] || null;
}

export function formatBRL(valor: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor));
}
