import { NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { db } from "../../../../lib/db";
import { getUsuarioLogado } from "../../../../lib/auth";
import { uploadToS3 } from "../../../../lib/s3";

export const runtime = "nodejs";

type AcessibilidadeRow = RowDataPacket & {
  id: number;
  usuario_id: number;
};

export async function POST(request: Request) {
  try {
    const usuario = await getUsuarioLogado();

    if (!usuario?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuário não autenticado.",
        },
        { status: 401 }
      );
    }

    const usuarioId = Number(usuario.id);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ID do usuário inválido.",
        },
        { status: 401 }
      );
    }

    const tipoUsuario = String(usuario.tipo ?? "")
      .trim()
      .toLowerCase();

    if (
      tipoUsuario === "driver" ||
      tipoUsuario === "motorista"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Somente passageiros podem enviar laudos.",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const documento = formData.get("documento");
    const tipo = formData.get("tipo");

    if (!(documento instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Nenhum documento foi selecionado.",
        },
        { status: 400 }
      );
    }

    if (
      tipo !== "laudo_pcd" &&
      tipo !== "laudo_autismo"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Tipo de laudo inválido.",
        },
        { status: 400 }
      );
    }

    const tiposPermitidos = new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

    if (!tiposPermitidos.has(documento.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Envie apenas PDF, JPG, PNG ou WEBP.",
        },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;

    if (documento.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "O arquivo selecionado está vazio.",
        },
        { status: 400 }
      );
    }

    if (documento.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "O arquivo deve ter no máximo 10 MB.",
        },
        { status: 400 }
      );
    }

    const [acessibilidadeRows] =
      await db.query<AcessibilidadeRow[]>(
        `
        SELECT
          id,
          usuario_id
        FROM passageiro_acessibilidade
        WHERE usuario_id = ?
        LIMIT 1
        `,
        [usuarioId]
      );

    let acessibilidadeId: number;

    if (acessibilidadeRows.length > 0) {
      acessibilidadeId = Number(
        acessibilidadeRows[0].id
      );
    } else {
      const [insertResult] =
        await db.query<ResultSetHeader>(
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
          `,
          [
            usuarioId,
            tipo === "laudo_pcd" ? 1 : 0,
            tipo === "laudo_autismo" ? 1 : 0,
            tipo === "laudo_pcd"
              ? "pendente"
              : "nao_solicitado",
            tipo === "laudo_autismo"
              ? "pendente"
              : "nao_solicitado",
          ]
        );

      acessibilidadeId = Number(
        insertResult.insertId
      );
    }

    const extensoes: Record<string, string> = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extensao = extensoes[documento.type];

    if (!extensao) {
      return NextResponse.json(
        {
          success: false,
          message: "Extensão do arquivo não suportada.",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(
      await documento.arrayBuffer()
    );

    const pasta =
      tipo === "laudo_pcd"
        ? "pcd"
        : "autismo";

    const nomeArquivo =
      `${Date.now()}-${crypto.randomUUID()}.${extensao}`;

    const key =
      `passageiros/${usuarioId}/acessibilidade/${pasta}/${nomeArquivo}`;

    const s3Result = await uploadToS3({
      key,
      body: buffer,
      contentType: documento.type,
    });

    if (!s3Result?.key) {
      throw new Error(
        "Não foi possível salvar o documento no S3."
      );
    }

    const s3Key = s3Result.key;
    const s3Url = s3Result.url ?? null;

    if (tipo === "laudo_pcd") {
      await db.query(
        `
        UPDATE passageiro_acessibilidade
        SET
          pcd = 1,
          pcd_status = 'pendente',
          pcd_verified = 0,
          pcd_laudo_key = ?,
          pcd_laudo_url = ?,
          pcd_laudo_nome = ?,
          pcd_laudo_status = 'pendente',
          atualizado_em = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [
          s3Key,
          s3Url,
          documento.name,
          acessibilidadeId,
        ]
      );
    }

    if (tipo === "laudo_autismo") {
      await db.query(
        `
        UPDATE passageiro_acessibilidade
        SET
          autista = 1,
          autista_status = 'pendente',
          autista_verified = 0,
          autista_laudo_key = ?,
          autista_laudo_url = ?,
          autista_laudo_nome = ?,
          autista_laudo_status = 'pendente',
          atualizado_em = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [
          s3Key,
          s3Url,
          documento.name,
          acessibilidadeId,
        ]
      );

      await db.query(
        `
        UPDATE usuarios
        SET passageiro_tea = 1
        WHERE id = ?
        `,
        [usuarioId]
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Laudo enviado com sucesso. Seu documento está em análise.",
        usuario_id: usuarioId,
        acessibilidade_id: acessibilidadeId,
        tipo,
        status: "pendente",
        status_label: "Em análise",
        arquivo_key: s3Key,
        arquivo_url: s3Url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Erro ao enviar documento de acessibilidade:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao enviar o laudo.",
      },
      { status: 500 }
    );
  }
}