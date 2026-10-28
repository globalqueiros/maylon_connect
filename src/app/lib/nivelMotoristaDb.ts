import type { RowDataPacket } from "mysql2";

import { db } from "./db";
import {
  calcularProgressoNivel,
  taxaDeCancelamento,
  type ProgressoNivel,
} from "./nivelMotorista";

const COLUNAS_NIVEL = `
  id, sequence, name, reward_type, reward_amount, image,
  targeted_ride, targeted_ride_point,
  targeted_amount, targeted_amount_point,
  targeted_cancel, targeted_cancel_point,
  targeted_review, targeted_review_point,
  user_type, is_active
`;

type NivelRow = RowDataPacket & {
  id: string;
  sequence: number;
  name: string;
  targeted_ride: number | string | null;
  targeted_ride_point: number | string | null;
  targeted_amount: number | string | null;
  targeted_amount_point: number | string | null;
  targeted_cancel: number | string | null;
  targeted_cancel_point: number | string | null;
  targeted_review: number | string | null;
  targeted_review_point: number | string | null;
};

export type NivelDoMotorista = {
  nivelAtual: NivelRow | null;
  proximoNivel: NivelRow | null;
  progresso: ProgressoNivel | null;
  nivelConcluido: boolean;
};

async function primeiraLinha<T extends RowDataPacket>(
  sql: string,
  params: unknown[]
): Promise<T | null> {
  const [rows] = await db.query<T[]>(sql, params);
  return rows[0] ?? null;
}

/**
 * Nível atual do motorista (users.user_level_id), o próximo nível ativo e o
 * progresso, com as mesmas contas do backend. Só leitura: a subida de nível
 * continua sendo feita pelo backend.
 */
export async function obterNivelDoMotorista(userId: string): Promise<NivelDoMotorista> {
  const usuario = await primeiraLinha<RowDataPacket & { user_level_id: string | null }>(
    "SELECT user_level_id FROM users WHERE id = ? LIMIT 1",
    [userId]
  );

  const nivelAtual = usuario?.user_level_id
    ? await primeiraLinha<NivelRow>(
        `SELECT ${COLUNAS_NIVEL} FROM user_levels WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
        [usuario.user_level_id]
      )
    : null;

  if (!nivelAtual) {
    return { nivelAtual: null, proximoNivel: null, progresso: null, nivelConcluido: false };
  }

  const [proximoNivel, corridas, comissao, avaliacoes, historico] = await Promise.all([
    primeiraLinha<NivelRow>(
      `SELECT ${COLUNAS_NIVEL} FROM user_levels
        WHERE user_type = 'driver' AND is_active = 1 AND deleted_at IS NULL AND sequence > ?
        ORDER BY sequence ASC LIMIT 1`,
      [nivelAtual.sequence]
    ),
    primeiraLinha<RowDataPacket & {
      total: number | string;
      concluidas: number | string | null;
      canceladas: number | string | null;
      pagas: number | string | null;
    }>(
      `SELECT
          COUNT(*) AS total,
          SUM(current_status = 'completed') AS concluidas,
          SUM(current_status = 'cancelled') AS canceladas,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN paid_fare ELSE 0 END), 0) AS pagas
        FROM trip_requests
        WHERE driver_id = ? AND deleted_at IS NULL`,
      [userId]
    ),
    primeiraLinha<RowDataPacket & { total: number | string | null }>(
      `SELECT COALESCE(SUM(f.admin_commission), 0) AS total
        FROM trip_request_fees f
        JOIN trip_requests t ON t.id = f.trip_request_id
        WHERE t.driver_id = ? AND t.payment_status = 'paid' AND t.deleted_at IS NULL`,
      [userId]
    ),
    primeiraLinha<RowDataPacket & { total: number | string }>(
      "SELECT COUNT(*) AS total FROM reviews WHERE given_by = ?",
      [userId]
    ),
    primeiraLinha<RowDataPacket>(
      "SELECT 1 AS existe FROM user_level_histories WHERE user_id = ? AND user_level_id = ? LIMIT 1",
      [userId, nivelAtual.id]
    ),
  ]);

  const nivelConcluido = Boolean(historico);

  const progresso = calcularProgressoNivel(
    nivelAtual,
    {
      corridasConcluidas: Number(corridas?.concluidas ?? 0),
      ganhos: Number(corridas?.pagas ?? 0) - Number(comissao?.total ?? 0),
      taxaCancelamento: taxaDeCancelamento(
        Number(corridas?.total ?? 0),
        Number(corridas?.canceladas ?? 0)
      ),
      avaliacoesFeitas: Number(avaliacoes?.total ?? 0),
    },
    nivelConcluido
  );

  return { nivelAtual, proximoNivel, progresso, nivelConcluido };
}
