
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type {
  RowDataPacket,
  ResultSetHeader,
} from "mysql2";

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
  email?: unknown;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/* =====================================================
   HELPERS
===================================================== */

function erroMensagem(
  error: unknown,
  fallback: string
): string {
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
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
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
  if (value === null || value === undefined) {
    return null;
  }

  const result = String(value).trim();
  return result || null;
}

function isValidUserId(value: unknown): boolean {
  const normalized = safeString(value);

  if (!normalized) return false;

  // IDs numéricos positivos
  if (/^[0-9]+$/.test(normalized)) {
    const number = Number(normalized);

    return Number.isSafeInteger(number) && number > 0;
  }

  // UUID
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    normalized
  );
}

function normalizarNomeArquivo(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

function responderErro(
  error: string,
  status: number,
  code?: string | null
) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(code ? { code } : {}),
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

/* =====================================================
   AUTENTICAÇÃO
   Cookie access_token (JWT)
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
      console.error(
        "/api/protocolo: JWT_SECRET não configurada"
      );

      return null;
    }

    let decoded: JwtPayloadCustom;

    try {
      const payload = jwt.verify(token, jwtSecret);

      if (
        typeof payload !== "object" ||
        payload === null
      ) {
        return null;
      }

      decoded = payload as JwtPayloadCustom;
    } catch (error: unknown) {
      console.error(
        "/api/protocolo: token inválido",
        erroMensagem(error, "JWT inválido")
      );

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

    // Alternativa: localizar o usuário pelo e-mail do JWT.
    const email =
      typeof decoded.email === "string"
        ? decoded.email.trim().toLowerCase()
        : "";

    if (email) {
      const [rows] = await db.execute<RowDataPacket[]>(
        `
          SELECT id
          FROM users
          WHERE LOWER(email) = LOWER(?)
          LIMIT 1
        `,
        [email]
      );

      const id = safeString(rows[0]?.id);

      if (id && isValidUserId(id)) {
        return id;
      }
    }

    return null;
  } catch (error: unknown) {
    console.error(
      "/api/protocolo: erro de autenticação",
      erroMensagem(error, "Erro ao identificar usuário")
    );

    return null;
  }
}

function naoAutenticado() {
  return responderErro(
    "Usuário não autenticado.",
    401
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
      {
        success: true,
        data: rows,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error(
      "Erro ao buscar protocolos:",
      erroMensagem(error, "Erro desconhecido")
    );

    return responderErro(
      "Erro ao buscar protocolos.",
      500,
      erroCodigo(error)
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

    const nome = String(
      formData.get("nome") ?? ""
    ).trim();

    const email = String(
      formData.get("email") ?? ""
    ).trim();

    const categoria = String(
      formData.get("categoria") ?? ""
    ).trim();

    const assunto = String(
      formData.get("assunto") ?? ""
    ).trim();

    const mensagem = String(
      formData.get("mensagem") ?? ""
    ).trim();

    const codigo = String(
      formData.get("codigo") ?? ""
    ).trim();

    const arquivo = formData.get("arquivo");

    // Validação dos campos obrigatórios.
    if (
      !nome ||
      !email ||
      !categoria ||
      !assunto ||
      !mensagem ||
      !codigo
    ) {
      return responderErro(
        "Preencha nome, e-mail, categoria, assunto, mensagem e código.",
        400
      );
    }

    if (
      nome.length > 150 ||
      email.length > 254 ||
      categoria.length > 100 ||
      assunto.length > 255 ||
      codigo.length > 100
    ) {
      return responderErro(
        "Um ou mais campos excedem o tamanho permitido.",
        400
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return responderErro(
        "Informe um endereço de e-mail válido.",
        400
      );
    }

    if (mensagem.length > 20000) {
      return responderErro(
        "A mensagem excede o limite permitido.",
        400
      );
    }

    /* UPLOAD S3 */

    let arquivoUrl: string | null = null;

    if (arquivo instanceof File && arquivo.size > 0) {
      if (arquivo.size > MAX_FILE_SIZE) {
        return responderErro(
          "O arquivo não pode exceder 10 MB.",
          400
        );
      }

      if (!ALLOWED_FILE_TYPES.has(arquivo.type)) {
        return responderErro(
          "Formato não permitido. Envie PDF, JPG, PNG ou WEBP.",
          400
        );
      }

      try {
        const buffer = Buffer.from(
          await arquivo.arrayBuffer()
        );

        const nomeSeguro = normalizarNomeArquivo(
          arquivo.name
        );

        const codigoSeguro = normalizarNomeArquivo(
          codigo
        );

        const key =
          `protocolos/${usuario_id}/${codigoSeguro}/` +
          `${Date.now()}-${nomeSeguro}`;

        const upload = (await uploadToS3({
          key,
          body: buffer,
          contentType: arquivo.type,
        })) as UploadResult;

        if (!upload?.url) {
          throw new Error(
            "O S3 não retornou a URL do arquivo."
          );
        }

        arquivoUrl = upload.url;
      } catch (error: unknown) {
        console.error(
          "Erro no upload S3:",
          erroMensagem(error, "Erro desconhecido")
        );

        return responderErro(
          "Erro ao enviar arquivo para o S3.",
          500,
          erroCodigo(error)
        );
      }
    } else if (
      arquivo !== null &&
      !(arquivo instanceof File)
    ) {
      return responderErro(
        "O arquivo enviado é inválido.",
        400
      );
    }

    /* INSERT NO MYSQL */

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
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    const code = erroCodigo(error);

    console.error(
      "Erro ao criar protocolo:",
      erroMensagem(error, "Erro desconhecido")
    );

    if (code === "ER_DUP_ENTRY") {
      return responderErro(
        "Este código de protocolo já existe.",
        409,
        code
      );
    }

    return responderErro(
      "Erro interno ao criar protocolo.",
      500,
      code
    );
  }
}