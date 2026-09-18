import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { uploadToS3 } from "../../lib/s3";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT codigo, assunto, criado_em, status, arquivo
      FROM smartmobility_db.protocolos
      ORDER BY id DESC
    `);

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Erro ao buscar protocolos.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const nome = String(formData.get("nome") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const categoria = String(formData.get("categoria") ?? "").trim();
    const assunto = String(formData.get("assunto") ?? "").trim();
    const mensagem = String(formData.get("mensagem") ?? "").trim();
    const codigo = String(formData.get("codigo") ?? "").trim();
    const arquivo = formData.get("arquivo");

    if (!nome) {
      return NextResponse.json(
        { success: false, error: "Nome não informado." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: "E-mail não informado." },
        { status: 400 }
      );
    }

    if (!categoria) {
      return NextResponse.json(
        { success: false, error: "Categoria não informada." },
        { status: 400 }
      );
    }

    if (!assunto) {
      return NextResponse.json(
        { success: false, error: "Assunto não informado." },
        { status: 400 }
      );
    }

    if (!mensagem) {
      return NextResponse.json(
        { success: false, error: "Mensagem não informada." },
        { status: 400 }
      );
    }

    if (!codigo) {
      return NextResponse.json(
        { success: false, error: "Código do protocolo não informado." },
        { status: 400 }
      );
    }

    let arquivoUrl: string | null = null;

    if (arquivo instanceof File) {
      if (arquivo.size <= 0) {
        return NextResponse.json(
          { success: false, error: "O arquivo enviado está vazio." },
          { status: 400 }
        );
      }

      try {
        const buffer = Buffer.from(await arquivo.arrayBuffer());

        const nomeSeguro = arquivo.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, "_");

        const key = `protocolos/${codigo}/${Date.now()}-${nomeSeguro}`;

        const upload = await uploadToS3({
          key,
          body: buffer,
          contentType:
            arquivo.type || "application/octet-stream",
        });

        arquivoUrl = upload.url;
      } catch (s3Error: any) {
        return NextResponse.json(
          {
            success: false,
            error:
              s3Error?.message ||
              "Erro ao enviar arquivo para o S3.",
            code: s3Error?.code || null,
          },
          { status: 500 }
        );
      }
    }

    const [result] = await db.execute(
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

    return NextResponse.json(
      {
        success: true,
        message: "Protocolo criado com sucesso.",
        id: (result as any).insertId,
        codigo,
        arquivo: arquivoUrl,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          success: false,
          error: "Este protocolo já existe.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          error?.sqlMessage ||
          "Erro interno ao criar protocolo.",
        code: error?.code || null,
      },
      { status: 500 }
    );
  }
}
