import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

import { db } from "../../../lib/db";
import { getUsuarioAutenticado } from "../../../lib/pareamento/usuarioApp";

export const runtime = "nodejs";

type AcessibilidadeRow = RowDataPacket & {
  id: number;
  usuario_id: number;
  pcd: number;
  autista: number;
  pcd_status: string | null;
  autista_status: string | null;
  pcd_verified: number;
  autista_verified: number;
  pcd_laudo_key: string | null;
  pcd_laudo_url: string | null;
  pcd_laudo_nome: string | null;
  pcd_laudo_status: string | null;
  autista_laudo_key: string | null;
  autista_laudo_url: string | null;
  autista_laudo_nome: string | null;
  autista_laudo_status: string | null;
  atualizado_em: string | null;
};

export async function GET(req: Request) {
  try {
    const usuario = await getUsuarioAutenticado(req);

    if (!usuario?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário não autenticado.",
        },
        { status: 401 }
      );
    }

    const [rows] = await db.query<AcessibilidadeRow[]>(
      `
      SELECT
        id,
        usuario_id,
        pcd,
        autista,
        pcd_status,
        autista_status,
        pcd_verified,
        autista_verified,
        pcd_laudo_key,
        pcd_laudo_url,
        pcd_laudo_nome,
        pcd_laudo_status,
        autista_laudo_key,
        autista_laudo_url,
        autista_laudo_nome,
        autista_laudo_status,
        atualizado_em
      FROM passageiro_acessibilidade
      WHERE usuario_id = ?
      LIMIT 1
      `,
      [usuario.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        existe: false,
        usuario_id: usuario.id,
        acessibilidade: {
          id: null,
          usuario_id: usuario.id,
          pcd: 0,
          autista: 0,
          pcd_status: "nao_solicitado",
          autista_status: "nao_solicitado",
          pcd_verified: 0,
          autista_verified: 0,
          pcd_laudo_key: null,
          pcd_laudo_url: null,
          pcd_laudo_nome: null,
          pcd_laudo_status: null,
          autista_laudo_key: null,
          autista_laudo_url: null,
          autista_laudo_nome: null,
          autista_laudo_status: null,
          atualizado_em: null,
        },
      });
    }

    const acessibilidade = rows[0];

    return NextResponse.json({
      success: true,
      existe: true,
      usuario_id: usuario.id,
      acessibilidade,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar acessibilidade:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar dados de acessibilidade.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const usuario = await getUsuarioAutenticado(req);

    if (!usuario?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário não autenticado.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const pcd = body.pcd ? 1 : 0;
    const autista = body.autista ? 1 : 0;

    await db.query(
      `
      INSERT INTO passageiro_acessibilidade (
        usuario_id,
        pcd,
        autista,
        pcd_status,
        autista_status,
        pcd_verified,
        autista_verified
      )
      VALUES (?, ?, ?, ?, ?, 0, 0)
      ON DUPLICATE KEY UPDATE
        -- Os status vêm antes de pcd/autista: o MySQL avalia da esquerda para
        -- a direita, então aqui pcd/autista ainda têm o valor salvo. Quem já
        -- estava selecionado mantém o status (aprovado não volta a pendente).
        pcd_status = IF(
          VALUES(pcd) = 1,
          IF(pcd = 1 AND pcd_status IS NOT NULL, pcd_status, 'pendente'),
          'nao_solicitado'
        ),
        autista_status = IF(
          VALUES(autista) = 1,
          IF(autista = 1 AND autista_status IS NOT NULL, autista_status, 'pendente'),
          'nao_solicitado'
        ),
        pcd = VALUES(pcd),
        autista = VALUES(autista),
        atualizado_em = CURRENT_TIMESTAMP
      `,
      [
        usuario.id,
        pcd,
        autista,
        pcd ? "pendente" : "nao_solicitado",
        autista ? "pendente" : "nao_solicitado",
      ]
    );

    // Espelho opcional: a tabela/coluna pode não existir neste banco, e a
    // fonte de verdade é passageiro_acessibilidade, já gravada acima.
    try {
      await db.query(
        `
        UPDATE usuarios
        SET passageiro_tea = ?
        WHERE id = ?
        `,
        [autista, usuario.id]
      );
    } catch (error) {
      console.error("Não foi possível atualizar passageiro_tea:", error);
    }

    const [rows] = await db.query<AcessibilidadeRow[]>(
      `
      SELECT
        id,
        usuario_id,
        pcd,
        autista,
        pcd_status,
        autista_status,
        pcd_verified,
        autista_verified,
        pcd_laudo_key,
        pcd_laudo_url,
        pcd_laudo_nome,
        pcd_laudo_status,
        autista_laudo_key,
        autista_laudo_url,
        autista_laudo_nome,
        autista_laudo_status,
        atualizado_em
      FROM passageiro_acessibilidade
      WHERE usuario_id = ?
      LIMIT 1
      `,
      [usuario.id]
    );

    return NextResponse.json({
      success: true,
      message: "Dados de acessibilidade salvos.",
      usuario_id: usuario.id,
      pcd,
      autista,
      acessibilidade: rows[0] ?? null,
    });
  } catch (error) {
    console.error(
      "Erro ao salvar acessibilidade:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao salvar dados de acessibilidade.",
      },
      { status: 500 }
    );
  }
}