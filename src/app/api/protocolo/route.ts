import { NextResponse } from "next/server";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { db } from "../../lib/db";
import { uploadToS3 } from "../../lib/s3";

export const runtime = "nodejs";

type ProtocoloRow = RowDataPacket & {
  id: number;
  codigo: string;
  assunto: string;
  criado_em: string | Date;
  status: string;
  arquivo: string | null;
};

type UploadResult = {
  url: string;
};

function erroMensagem(
  error: unknown,
  fallback: string
): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

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
    const code = (
      error as {
        code?: unknown;
      }
    ).code;

    return code ? String(code) : null;
  }

  return null;
}

/* =========================================================
   GET - LISTAR PROTOCOLOS
   ========================================================= */

export async function GET() {
  try {
    const [rows] = await db.query(
      `
      SELECT
        id,
        codigo,
        assunto,
        criado_em,
        status,
        arquivo
      FROM smartmobility_db.protocolos
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

    return NextResponse.json(
      {
        success: false,
        error: erroMensagem(
          error,
          "Erro ao buscar protocolos."
        ),
        code: erroCodigo(error),
      },
      {
        status: 500,
      }
    );
  }
}

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

      const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];

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
        );
      }

      try {
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

        return NextResponse.json(
          {
            success: false,
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

    return NextResponse.json(
      {
        success: true,
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

    const code = erroCodigo(error);

    if (code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Este protocolo já existe.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
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
