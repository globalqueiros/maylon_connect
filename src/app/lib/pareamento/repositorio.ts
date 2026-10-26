import type { RowDataPacket } from "mysql2";

import { db } from "../db";
import {
  normalizarGenero,
  type FonteGenero,
  type Genero,
} from "./genero";

type GeneroRow = RowDataPacket & { user_id: string; genero: string };

type PreferenciasRow = RowDataPacket & {
  user_id: string;
  motorista_feminina: number;
  somente_passageiras: number;
};

export type Preferencias = {
  motoristaFeminina: boolean;
  somentePassageiras: boolean;
};

let tabelasProntas: Promise<void> | null = null;

/** Cria as tabelas na primeira chamada; ver sql/pareamento_motorista_feminina.sql. */
export function garantirTabelas(): Promise<void> {
  if (!tabelasProntas) {
    tabelasProntas = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS usuario_genero (
          user_id VARCHAR(64) NOT NULL,
          genero ENUM('feminino', 'masculino', 'outro') NOT NULL,
          fonte VARCHAR(20) NOT NULL,
          atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id)
        )
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS preferencias_pareamento (
          user_id VARCHAR(64) NOT NULL,
          motorista_feminina TINYINT(1) NOT NULL DEFAULT 0,
          somente_passageiras TINYINT(1) NOT NULL DEFAULT 0,
          atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id)
        )
      `);
    })().catch((error) => {
      tabelasProntas = null;
      throw error;
    });
  }

  return tabelasProntas;
}

let colunaGeneroUsers: Promise<string | null> | null = null;

/** O cadastro (users) pode ter a coluna de gênero com nomes diferentes. */
function descobrirColunaGeneroUsers(): Promise<string | null> {
  if (!colunaGeneroUsers) {
    colunaGeneroUsers = (async () => {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'`
      );
      const colunas = rows.map((row) => String(row.COLUMN_NAME));
      return (
        ["gender", "genero", "sexo"].find((nome) => colunas.includes(nome)) ??
        null
      );
    })().catch((error) => {
      colunaGeneroUsers = null;
      throw error;
    });
  }

  return colunaGeneroUsers;
}

/**
 * Gênero confirmado de cada usuário. O documento verificado (usuario_genero)
 * vale mais que o cadastro; sem nenhum dos dois o valor é null, e null nunca
 * conta como feminino.
 */
export async function obterGeneros(
  ids: string[]
): Promise<Map<string, Genero | null>> {
  const resultado = new Map<string, Genero | null>();
  const unicos = [...new Set(ids)];

  for (const id of unicos) resultado.set(id, null);
  if (unicos.length === 0) return resultado;

  await garantirTabelas();

  const [confirmados] = await db.query<GeneroRow[]>(
    "SELECT user_id, genero FROM usuario_genero WHERE user_id IN (?)",
    [unicos]
  );

  for (const row of confirmados) {
    resultado.set(String(row.user_id), normalizarGenero(row.genero));
  }

  const semRegistro = unicos.filter((id) => resultado.get(id) === null);
  if (semRegistro.length === 0) return resultado;

  const coluna = await descobrirColunaGeneroUsers();
  if (!coluna) return resultado;

  // A coluna vem de uma lista fixa acima, nunca da requisição.
  const [cadastro] = await db.query<RowDataPacket[]>(
    `SELECT id, ${coluna} AS genero FROM users WHERE id IN (?)`,
    [semRegistro]
  );

  for (const row of cadastro) {
    resultado.set(String(row.id), normalizarGenero(row.genero));
  }

  return resultado;
}

export async function registrarGenero(
  userId: string,
  genero: Genero,
  fonte: FonteGenero
): Promise<void> {
  await garantirTabelas();

  await db.query(
    `INSERT INTO usuario_genero (user_id, genero, fonte)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE genero = VALUES(genero), fonte = VALUES(fonte)`,
    [userId, genero, fonte]
  );
}

export async function obterPreferencias(
  ids: string[]
): Promise<Map<string, Preferencias>> {
  const resultado = new Map<string, Preferencias>();
  const unicos = [...new Set(ids)];

  for (const id of unicos) {
    resultado.set(id, { motoristaFeminina: false, somentePassageiras: false });
  }
  if (unicos.length === 0) return resultado;

  await garantirTabelas();

  const [rows] = await db.query<PreferenciasRow[]>(
    `SELECT user_id, motorista_feminina, somente_passageiras
     FROM preferencias_pareamento
     WHERE user_id IN (?)`,
    [unicos]
  );

  for (const row of rows) {
    resultado.set(String(row.user_id), {
      motoristaFeminina: Number(row.motorista_feminina) === 1,
      somentePassageiras: Number(row.somente_passageiras) === 1,
    });
  }

  return resultado;
}

export async function salvarMotoristaFeminina(
  userId: string,
  valor: boolean
): Promise<void> {
  await garantirTabelas();

  await db.query(
    `INSERT INTO preferencias_pareamento (user_id, motorista_feminina)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE motorista_feminina = VALUES(motorista_feminina)`,
    [userId, valor ? 1 : 0]
  );
}

export async function salvarSomentePassageiras(
  userId: string,
  valor: boolean
): Promise<void> {
  await garantirTabelas();

  await db.query(
    `INSERT INTO preferencias_pareamento (user_id, somente_passageiras)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE somente_passageiras = VALUES(somente_passageiras)`,
    [userId, valor ? 1 : 0]
  );
}

type AcessibilidadeApoioRow = RowDataPacket & {
  autista: number;
  autista_status: string | null;
};

/** Só os dois campos que definem o apoio; o laudo nunca sai daqui. */
export async function obterAcessibilidadeParaApoio(
  passageiroId: string
): Promise<{ autista: boolean; autistaStatus: string | null } | null> {
  try {
    const [rows] = await db.query<AcessibilidadeApoioRow[]>(
      `SELECT autista, autista_status
       FROM passageiro_acessibilidade
       WHERE usuario_id = ?
       LIMIT 1`,
      [passageiroId]
    );

    if (rows.length === 0) return null;

    return {
      autista: Number(rows[0].autista) === 1,
      autistaStatus: rows[0].autista_status ?? null,
    };
  } catch (error) {
    // Tabela ainda não criada = ninguém pediu apoio; qualquer outro erro sobe.
    if ((error as { code?: string })?.code === "ER_NO_SUCH_TABLE") return null;
    throw error;
  }
}
