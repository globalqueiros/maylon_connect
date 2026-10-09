import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket, ResultSetHeader } from "mysql2";

import { db } from "../../lib/db";
import { uploadToS3 } from "../../lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProtocoloRow = RowDataPacket & {
  id: number;
  usuario_id: string;
  codigo: string;
  assunto: string;
  criado_em: string | Date;
  status: string;
  arquivo: string | null;
};

type UploadResult = {
  url: string;
};

type JwtPayloadCustom = jwt.JwtPayload & {
  id?: unknown;
  userId?: unknown;
  user_id?: unknown;
  usuario_id?: unknown;
  sub?: unknown;
  email?: unknown;
};

/* =====================================================
   HELPERS
   ===================================================== */

function erroMensagem(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    if ("sqlMessage" in error && error.sqlMessage) {
      return String(error.sqlMessage);
    }

    if ("message" in error && error.message) {
      return String(error.message);
    }
  }

  return fallback;
}

function erroCodigo(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code;
    return code ? String(code) : null;
  }

  return null;
}

function cleanSecret(value?: string): string {
  if (!value) return "";

  const cleaned = value.replace(/\r/g, "").trim();

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    return cleaned.slice(1, -1);
  }

  return cleaned;
}

function safeString(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const result = String(value).trim();

  return result || null;
}

/* Mesma regra do /api/me: aceita ID numérico ou UUID */
function isValidUserId(value: unknown): boolean {
  const normalized = safeString(value);

  if (!normalized) return false;

  if (/^[0-9]+$/.test(normalized)) {
    const number = Number(normalized);

    return Number.isSafeInteger(number) && number > 0;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    normalized
  );
}

/* =====================================================
   AUTENTICAÇÃO
   Valida o cookie access_token (JWT), igual ao /api/me.
   ===================================================== */

async function obterUsuarioIdAutenticado(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return null;
    }

    const jwtSecret = cleanSecret(process.env.JWT_SECRET);

    if (!jwtSecret) {
      console.error("/api/protocolo: JWT_SECRET não configurada");
      return null;
    }

    let decoded: JwtPayloadCustom;

    try {
      decoded = jwt.verify(token, jwtSecret) as JwtPayloadCustom;
    } catch (error) {
      console.error("/api/protocolo: token inválido:", error);
      return null;
    }

    const candidates = [
      decoded.id,
      decoded.usuario_id,
      decoded.userId,
      decoded.user_id,
      decoded.sub,
    ];

    for (const candidate of candidates) {
      if (isValidUserId(candidate)) {
        return safeString(candidate);
      }
    }

    /* Fallback por e-mail, igual ao /api/me */
    const email =
      typeof decoded.email === "string"
        ? decoded.email.trim().toLowerCase()
        : "";

    if (email) {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
        [email]
      );

      const id = safeString(rows?.[0]?.id);

      if (id && isValidUserId(id)) {
        return id;
      }
    }

    return null;
  } catch (error) {
    console.error("/api/protocolo: erro ao identificar usuário:", error);
    return null;
  }
}

function naoAutenticado() {
  return NextResponse.json(
    { success: false, error: "Usuário não autenticado." },
    { status: 401, headers: { "Cache-Control": "no-store" } }
  );
}

/* =====================================================
   GET - LISTAR PROTOCOLOS DO USUÁRIO AUTENTICADO
   ===================================================== */

export async function GET() {
  try {
    const usuario_id = await obterUsuarioIdAutenticado();

    if (!usuario_id) {
      return naoAutenticado();
    }

    const [rows] = await db.execute<ProtocoloRow[]>(
      `
      SELECT
        id,
        usuario_id,
        codigo,
        assunto,
        criado_em,
        status,
        arquivo
      FROM smartmobility_db.protocolos
      WHERE usuario_id = ?
      ORDER BY id DESC
      `,
      [usuario_id]
    );

    return NextResponse.json(
      { success: true, data: rows },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error: unknown) {
    console.error("Erro ao buscar protocolos:", error);

    return NextResponse.json(
      {
        success: false,
        error: erroMensagem(error, "Erro ao buscar protocolos."),
        code: erroCodigo(error),
      },
      { status: 500 }
    );
  }
}

/* =====================================================
   POST - CRIAR PROTOCOLO
   ===================================================== */

export async function POST(request: Request) {
  try {
    const usuario_id = await obterUsuarioIdAutenticado();

    if (!usuario_id) {
      return naoAutenticado();
    }

    const formData = await request.formData();

    const nome = String(formData.get("nome") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const categoria = String(formData.get("categoria") ?? "").trim();
    const assunto = String(formData.get("assunto") ?? "").trim();
    const mensagem = String(formData.get("mensagem") ?? "").trim();
    const codigo = String(formData.get("codigo") ?? "").trim();
    const arquivo = formData.get("arquivo");

    if (!nome || !email || !categoria || !assunto || !mensagem || !codigo) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Preencha nome, e-mail, categoria, assunto, mensagem e código.",
        },
        { status: 400 }
      );
    }

    /* UPLOAD S3 */

    let arquivoUrl: string | null = null;

    if (arquivo instanceof File && arquivo.size > 0) {
      const tamanhoMaximo = 10 * 1024 * 1024;

      const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];

      if (arquivo.size > tamanhoMaximo) {
        return NextResponse.json(
          { success: false, error: "O arquivo não pode exceder 10 MB." },
          { status: 400 }
        );
      }

      if (!tiposPermitidos.includes(arquivo.type)) {
        return NextResponse.json(
          {
            success: false,
            error: "Formato não permitido. Envie PDF, JPG, PNG ou WEBP.",
          },
          { status: 400 }
        );
      }

      try {
        const buffer = Buffer.from(await arquivo.arrayBuffer());

        const nomeSeguro = arquivo.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, "_");

        const codigoSeguro = codigo.replace(/[^a-zA-Z0-9._-]/g, "_");

        const key =
          `protocolos/${usuario_id}/${codigoSeguro}/` +
          `${Date.now()}-${nomeSeguro}`;

        const upload = (await uploadToS3({
          key,
          body: buffer,
          contentType: arquivo.type,
        })) as UploadResult;

        if (!upload?.url) {
          throw new Error("O S3 não retornou a URL do arquivo.");
        }

        arquivoUrl = upload.url;
      } catch (error: unknown) {
        console.error("Erro no upload S3:", error);

        return NextResponse.json(
          {
            success: false,
            error: erroMensagem(error, "Erro ao enviar arquivo para o S3."),
            code: erroCodigo(error),
          },
          { status: 500 }
        );
      }
    } else if (arquivo instanceof File && arquivo.size === 0) {
      return NextResponse.json(
        { success: false, error: "O arquivo enviado está vazio." },
        { status: 400 }
      );
    }

    /* INSERT */

    const [result] = await db.execute<ResultSetHeader>(
      `
      INSERT INTO smartmobility_db.protocolos (
        usuario_id,
        codigo,
        nome,
        email,
        categoria,
        assunto,
        mensagem,
        arquivo,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        usuario_id,
        codigo,
        nome,
        email,
        categoria,
        assunto,
        mensagem,
        arquivoUrl,
        "Aberto",
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Protocolo criado com sucesso.",
        id: result.insertId,
        codigo,
        arquivo: arquivoUrl,
        status: "Aberto",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Erro ao criar protocolo:", error);

    const code = erroCodigo(error);

    if (code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, error: "Este código de protocolo já existe." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: erroMensagem(error, "Erro interno ao criar protocolo."),
        code,
      },
      { status: 500 }
    );
  }
}