import { NextResponse } from "next/server";
<<<<<<< HEAD
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket, ResultSetHeader } from "mysql2";

=======
import { RowDataPacket, ResultSetHeader } from "mysql2";
>>>>>>> bf7afa0b6409237a274208cf0288ae1bf31835e9
import { db } from "../../lib/db";
import { uploadToS3 } from "../../lib/s3";

export const runtime = "nodejs";
<<<<<<< HEAD
export const dynamic = "force-dynamic";

type ProtocoloRow = RowDataPacket & {
  id: number;
  usuario_id: string;
=======

type ProtocoloRow = RowDataPacket & {
  id: number;
>>>>>>> bf7afa0b6409237a274208cf0288ae1bf31835e9
  codigo: string;
  assunto: string;
  criado_em: string | Date;
  status: string;
  arquivo: string | null;
};

type UploadResult = {
  url: string;
};

<<<<<<< HEAD
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
=======
function erroMensagem(
  error: unknown,
  fallback: string
): string {
>>>>>>> bf7afa0b6409237a274208cf0288ae1bf31835e9
  if (error instanceof Error && error.message) {
    return error.message;
  }

<<<<<<< HEAD
  if (typeof error === "object" && error !== null) {
    if ("sqlMessage" in error && error.sqlMessage) {
      return String(error.sqlMessage);
    }

    if ("message" in error && error.message) {
      return String(error.message);
=======
  if (
    typeof error === "object" &&
    error !== null &&
    "sqlMessage" in error
  ) {
    const sqlMessage = (
      error as {
        sqlMessage?: unknown;
      }
    ).sqlMessage;

    if (sqlMessage) {
      return String(sqlMessage);
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const message = (
      error as {
        message?: unknown;
      }
    ).message;

    if (message) {
      return String(message);
>>>>>>> bf7afa0b6409237a274208cf0288ae1bf31835e9
    }
  }

  return fallback;
}

function erroCodigo(error: unknown): string | null {
<<<<<<< HEAD
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code;
=======
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    const code = (
      error as {
        code?: unknown;
      }
    ).code;

>>>>>>> bf7afa0b6409237a274208cf0288ae1bf31835e9
    return code ? String(code) : null;
  }

  return null;
}

<<<<<<< HEAD
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
=======
/* =========================================================
   GET - LISTAR PROTOCOLOS
   ========================================================= */

export async function GET() {
  try {
    const [rows] = await db.query(
      `
      SELECT
        id,
>>>>>>> bf7afa0b6409237a274208cf0288ae1bf31835e9
        codigo,
        assunto,
        criado_em,
        status,
        arquivo
      FROM smartmobility_db.protocolos
<<<<<<< HEAD
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
=======
      ORDER BY id DESC
      `
    );

    const protocolos = rows as ProtocoloRow[];

    return NextResponse.json({
      success: true,
      data: protocolos,
    });
  } catch (error: unknown) {
    console.error(
      "Erro ao buscar protocolos:",
      error
    );
>>>>>>> bf7afa0b6409237a274208cf0288ae1bf31835e9

    return NextResponse.json(
      {
        success: false,
<<<<<<< HEAD
        error: erroMensagem(error, "Erro ao buscar protocolos."),
        code: erroCodigo(error),
      },
      { status: 500 }
=======
        error: erroMensagem(
          error,
          "Erro ao buscar protocolos."
        ),
        code: erroCodigo(error),
      },
      {
        status: 500,
      }
>>>>>>> bf7afa0b6409237a274208cf0288ae1bf31835e9
    );
  }
}

<<<<<<< HEAD
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
=======
/* =========================================================
   POST - CRIAR PROTOCOLO
   ========================================================= */

export async function POST(request: Request) {
  try {
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

    /* =====================================================
       VALIDAÇÕES
       ===================================================== */

    if (!nome) {
      return NextResponse.json(
        {
          success: false,
          error: "Nome não informado.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "E-mail não informado.",
        },
        {
          status: 400,
        }
      );
    }

    if (!categoria) {
      return NextResponse.json(
        {
          success: false,
          error: "Categoria não informada.",
        },
        {
          status: 400,
        }
      );
    }

    if (!assunto) {
      return NextResponse.json(
        {
          success: false,
          error: "Assunto não informado.",
        },
        {
          status: 400,
        }
      );
    }

    if (!mensagem) {
      return NextResponse.json(
        {
          success: false,
          error: "Mensagem não informada.",
        },
        {
          status: 400,
        }
      );
    }

    if (!codigo) {
      return NextResponse.json(
        {
          success: false,
          error: "Código do protocolo não informado.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       ARQUIVO
       ===================================================== */

    let arquivoUrl: string | null = null;

    if (arquivo instanceof File) {
      const tamanhoMaximo =
        10 * 1024 * 1024;
>>>>>>> bf7afa0b6409237a274208cf0288ae1bf31835e9

      const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];

<<<<<<< HEAD
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
=======
      if (arquivo.size <= 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "O arquivo enviado está vazio.",
          },
          {
            status: 400,
          }
        );
      }

      if (arquivo.size > tamanhoMaximo) {
        return NextResponse.json(
          {
            success: false,
            error:
              "O arquivo não pode ter mais de 10 MB.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        arquivo.type &&
        !tiposPermitidos.includes(
          arquivo.type
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Formato de arquivo não permitido. Envie PDF, JPG, PNG ou WEBP.",
          },
          {
            status: 400,
          }
>>>>>>> bf7afa0b6409237a274208cf0288ae1bf31835e9
        );
      }

      try {
<<<<<<< HEAD
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
=======
        const buffer = Buffer.from(
          await arquivo.arrayBuffer()
        );

        const nomeSeguro =
          arquivo.name
            .normalize("NFD")
            .replace(
              /[\u0300-\u036f]/g,
              ""
            )
            .replace(
              /[^a-zA-Z0-9._-]/g,
              "_"
            );

        const key =
          `protocolos/${codigo}/` +
          `${Date.now()}-${nomeSeguro}`;

        const upload =
          (await uploadToS3({
            key,
            body: buffer,
            contentType:
              arquivo.type ||
              "application/octet-stream",
          })) as UploadResult;

        if (!upload?.url) {
          throw new Error(
            "O upload foi realizado, mas nenhuma URL foi retornada."
          );
        }

        arquivoUrl = upload.url;
      } catch (s3Error: unknown) {
        console.error(
          "Erro ao enviar arquivo para S3:",
          s3Error
        );
>>>>>>> bf7afa0b6409237a274208cf0288ae1bf31835e9

        return NextResponse.json(
          {
            success: false,
<<<<<<< HEAD
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
=======
            error: erroMensagem(
              s3Error,
              "Erro ao enviar arquivo para o S3."
            ),
            code: erroCodigo(s3Error),
          },
          {
            status: 500,
          }
        );
      }
    }

    /* =====================================================
       INSERT
       ===================================================== */

    const [result] =
      await db.execute<ResultSetHeader>(
        `
        INSERT INTO smartmobility_db.protocolos (
          codigo,
          nome,
          email,
          categoria,
          assunto,
          mensagem,
          arquivo,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
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

    /* =====================================================
       RESPOSTA
       ===================================================== */
>>>>>>> bf7afa0b6409237a274208cf0288ae1bf31835e9

    return NextResponse.json(
      {
        success: true,
<<<<<<< HEAD
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
=======
        message:
          "Protocolo criado com sucesso.",
        id: result.insertId,
        codigo,
        arquivo: arquivoUrl,
      },
      {
        status: 201,
      }
    );
  } catch (error: unknown) {
    console.error(
      "Erro interno ao criar protocolo:",
      error
    );
>>>>>>> bf7afa0b6409237a274208cf0288ae1bf31835e9

    const code = erroCodigo(error);

    if (code === "ER_DUP_ENTRY") {
      return NextResponse.json(
<<<<<<< HEAD
        { success: false, error: "Este código de protocolo já existe." },
        { status: 409 }
=======
        {
          success: false,
          error:
            "Este protocolo já existe.",
        },
        {
          status: 409,
        }
>>>>>>> bf7afa0b6409237a274208cf0288ae1bf31835e9
      );
    }

    return NextResponse.json(
      {
        success: false,
<<<<<<< HEAD
        error: erroMensagem(error, "Erro interno ao criar protocolo."),
        code,
      },
      { status: 500 }
    );
  }
}
=======
        error: erroMensagem(
          error,
          "Erro interno ao criar protocolo."
        ),
        code,
      },
      {
        status: 500,
      }
    );
  }
}
>>>>>>> bf7afa0b6409237a274208cf0288ae1bf31835e9
