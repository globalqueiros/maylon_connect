import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { toPositiveInt } from "../../lib/session";

function getDataSP() {
  const data = new Date();
  const sp = new Date(
    data.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  const yyyy = sp.getFullYear();
  const mm = String(sp.getMonth() + 1).padStart(2, "0");
  const dd = String(sp.getDate()).padStart(2, "0");
  const hh = String(sp.getHours()).padStart(2, "0");
  const min = String(sp.getMinutes()).padStart(2, "0");
  const ss = String(sp.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

async function getUserFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id?: number | string;
    };
    const id = toPositiveInt(decoded.id);
    if (!id) return null;
    return { id };
  } catch {
    return null;
  }
}

async function ensureProtocolosTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS protocolos (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      usuario_id BIGINT UNSIGNED NOT NULL,
      codigo VARCHAR(64) NOT NULL,
      nome VARCHAR(255) NULL,
      email VARCHAR(255) NULL,
      assunto VARCHAR(255) NULL,
      mensagem TEXT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'Aberto',
      criado_em DATETIME NULL,
      atualizado_em TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_protocolos_codigo (codigo),
      KEY idx_protocolos_usuario (usuario_id),
      KEY idx_protocolos_criado (criado_em)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) || {};
    } catch {
      body = {};
    }

    const nome = String(body.nome || "").trim();
    const email = String(body.email || "").trim();
    const assunto = String(body.assunto || "").trim();
    const mensagem = String(body.mensagem || "").trim();
    const codigoFinal =
      String(body.codigo || "").trim() || `PRT-${Date.now()}`;
    const dataSP = getDataSP();

    await ensureProtocolosTable();

    await db.query(
      `INSERT INTO protocolos
      (usuario_id, codigo, nome, email, assunto, mensagem, criado_em, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        codigoFinal,
        nome,
        email,
        assunto,
        mensagem,
        dataSP,
        "Aberto",
      ]
    );

    return NextResponse.json({
      codigo: codigoFinal,
      criado_em: dataSP,
    });
  } catch (error) {
    console.error("/api/protocolo POST error:", error);
    return NextResponse.json(
      { error: "Erro ao criar protocolo" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    try {
      await ensureProtocolosTable();
      const [rows]: any = await db.query(
        `SELECT id, codigo, assunto, status, criado_em
         FROM protocolos
         WHERE usuario_id = ?
         ORDER BY criado_em DESC`,
        [user.id]
      );
      return NextResponse.json(Array.isArray(rows) ? rows : []);
    } catch (dbError: any) {
      // Missing table / empty local DB should not break the help center UI.
      if (
        dbError?.code === "ER_NO_SUCH_TABLE" ||
        dbError?.code === "ER_BAD_FIELD_ERROR"
      ) {
        console.warn("/api/protocolo GET fallback empty:", dbError.code);
        return NextResponse.json([]);
      }
      throw dbError;
    }
  } catch (error) {
    console.error("/api/protocolo GET error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar protocolos" },
      { status: 500 }
    );
  }
}
