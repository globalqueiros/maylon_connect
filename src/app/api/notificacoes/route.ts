import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { getSessionUserId, readJsonBody } from "../../lib/session";

export const dynamic = "force-dynamic";

async function ensureNotificacoesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS configuracoes_notificacoes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      email TINYINT(1) NOT NULL DEFAULT 0,
      push TINYINT(1) NOT NULL DEFAULT 0,
      sms TINYINT(1) NOT NULL DEFAULT 0,
      notificacoes_viagens TINYINT(1) NOT NULL DEFAULT 0,
      compartilhar_localizacao TINYINT(1) NOT NULL DEFAULT 0,
      receber_promocoes TINYINT(1) NOT NULL DEFAULT 0,
      updated_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_usuario (usuario_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

function toBool(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true";
}

export async function GET(req: Request) {
  try {
    await ensureNotificacoesTable();

    const url = new URL(req.url);
    const usuario_id = await getSessionUserId(
      url.searchParams.get("usuario_id") ??
        url.searchParams.get("usuarioId") ??
        url.searchParams.get("user_id"),
      req
    );

    if (!usuario_id) {
      return NextResponse.json(
        { success: false, message: "Não autenticado" },
        { status: 401 }
      );
    }

    const [rows]: any = await db.query(
      `
      SELECT
        email,
        push,
        sms,
        notificacoes_viagens,
        compartilhar_localizacao,
        receber_promocoes
      FROM configuracoes_notificacoes
      WHERE usuario_id = ?
      LIMIT 1
      `,
      [usuario_id]
    );

    const row = rows?.[0];
    return NextResponse.json({
      success: true,
      preferencias: {
        email: toBool(row?.email),
        push: toBool(row?.push),
        sms: toBool(row?.sms),
        notificacoes_viagens: toBool(row?.notificacoes_viagens),
        compartilhar_localizacao: toBool(row?.compartilhar_localizacao),
        receber_promocoes: toBool(row?.receber_promocoes),
      },
    });
  } catch (error) {
    console.error("Erro ao carregar notificações:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureNotificacoesTable();

    const body = await readJsonBody(req);
    const usuarioId = await getSessionUserId(
      body.usuarioId ?? body.usuario_id ?? body.user_id,
      req
    );

    if (!usuarioId) {
      return NextResponse.json(
        { success: false, message: "Usuário não informado" },
        { status: 400 }
      );
    }

    const email = toBool(body.email);
    const push = toBool(body.push);
    const sms = toBool(body.sms);
    const notificacoes_viagens = toBool(body.notificacoes_viagens);
    const compartilhar_localizacao = toBool(body.compartilhar_localizacao);
    const receber_promocoes = toBool(body.receber_promocoes);

    await db.query(
      `
      INSERT INTO configuracoes_notificacoes (
        usuario_id,
        email,
        push,
        sms,
        notificacoes_viagens,
        compartilhar_localizacao,
        receber_promocoes,
        updated_at,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        email = VALUES(email),
        push = VALUES(push),
        sms = VALUES(sms),
        notificacoes_viagens = VALUES(notificacoes_viagens),
        compartilhar_localizacao = VALUES(compartilhar_localizacao),
        receber_promocoes = VALUES(receber_promocoes),
        updated_at = NOW()
      `,
      [
        usuarioId,
        email ? 1 : 0,
        push ? 1 : 0,
        sms ? 1 : 0,
        notificacoes_viagens ? 1 : 0,
        compartilhar_localizacao ? 1 : 0,
        receber_promocoes ? 1 : 0,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Preferências salvas com sucesso",
      preferencias: {
        email,
        push,
        sms,
        notificacoes_viagens,
        compartilhar_localizacao,
        receber_promocoes,
      },
    });
  } catch (error) {
    console.error("Erro ao salvar notificações:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
