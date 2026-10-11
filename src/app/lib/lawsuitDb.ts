import crypto from "crypto";
import { db } from "./db";
import type { ProcessosJudiciaisStatus } from "./judit";

export type ConsultaProcessosSalva = {
  status: ProcessosJudiciaisStatus;
  total: number;
  checked_at: string | null;
};

let schemaReady = false;

export async function ensureLawsuitSchema(): Promise<void> {
  if (schemaReady) return;

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS driver_lawsuit_checks (
        id char(36) NOT NULL,
        driver_id char(36) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'nao_iniciado',
        total_lawsuits int NOT NULL DEFAULT 0,
        result longtext NULL,
        checked_at timestamp NULL,
        created_at timestamp NULL,
        updated_at timestamp NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_driver_lawsuit_checks_driver (driver_id)
      )
    `);

    schemaReady = true;
  } catch (error) {
    console.warn(
      "ensureLawsuitSchema:",
      (error as { message?: string })?.message || error
    );
  }
}

export async function salvarConsulta(
  driverId: string,
  dados: {
    status: ProcessosJudiciaisStatus;
    total: number;
    result?: unknown;
  }
): Promise<void> {
  await ensureLawsuitSchema();

  const result =
    dados.result == null ? null : JSON.stringify(dados.result);

  await db.query(
    `
    INSERT INTO driver_lawsuit_checks
      (id, driver_id, status, total_lawsuits, result, checked_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      total_lawsuits = VALUES(total_lawsuits),
      result = VALUES(result),
      checked_at = NOW(),
      updated_at = NOW()
    `,
    [crypto.randomUUID(), driverId, dados.status, dados.total, result]
  );
}

export async function obterConsulta(
  driverId: string
): Promise<ConsultaProcessosSalva | null> {
  try {
    await ensureLawsuitSchema();

    const [rows] = (await db.query(
      `
      SELECT status, total_lawsuits, checked_at
      FROM driver_lawsuit_checks
      WHERE driver_id = ?
      LIMIT 1
      `,
      [driverId]
    )) as unknown as [
      Array<{
        status?: string | null;
        total_lawsuits?: number | null;
        checked_at?: Date | string | null;
      }>
    ];

    const row = rows[0];

    if (!row) return null;

    const status = (row.status as ProcessosJudiciaisStatus) ?? "nao_iniciado";

    return {
      status,
      total: Number(row.total_lawsuits) || 0,
      checked_at: row.checked_at
        ? new Date(row.checked_at).toISOString()
        : null,
    };
  } catch (error) {
    console.error("obterConsulta: erro ao consultar processos:", error);
    return null;
  }
}
