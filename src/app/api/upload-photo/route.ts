import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { db } from "../../lib/db";

export const runtime = "nodejs";

const AWS_REGION = process.env.AWS_REGION_1;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID_1;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY_1;
const AWS_S3_BUCKET = process.env.AWS_BUCKET_NAME_1;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const s3 =
  AWS_REGION &&
  AWS_ACCESS_KEY_ID &&
  AWS_SECRET_ACCESS_KEY
    ? new S3Client({
        region: AWS_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
      })
    : null;

function isValidUuid(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== UPLOAD PHOTO ===");

    if (!AWS_REGION) {
      console.error("AWS_REGION_1 não configurada");

      return NextResponse.json(
        {
          success: false,
          message: "AWS_REGION_1 não configurada.",
        },
        { status: 500 }
      );
    }

    if (!AWS_ACCESS_KEY_ID) {
      console.error("AWS_ACCESS_KEY_ID_1 não configurada");

      return NextResponse.json(
        {
          success: false,
          message: "AWS_ACCESS_KEY_ID_1 não configurada.",
        },
        { status: 500 }
      );
    }

    if (!AWS_SECRET_ACCESS_KEY) {
      console.error("AWS_SECRET_ACCESS_KEY_1 não configurada");

      return NextResponse.json(
        {
          success: false,
          message: "AWS_SECRET_ACCESS_KEY_1 não configurada.",
        },
        { status: 500 }
      );
    }

    if (!AWS_S3_BUCKET) {
      console.error("AWS_BUCKET_NAME_1 não configurada");

      return NextResponse.json(
        {
          success: false,
          message: "AWS_BUCKET_NAME_1 não configurada.",
        },
        { status: 500 }
      );
    }

    if (!s3) {
      return NextResponse.json(
        {
          success: false,
          message: "Cliente S3 não foi inicializado.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    console.log(
      "Campos recebidos:",
      Array.from(formData.keys())
    );

    const userIdValue = formData.get("userId");

    const fileValue = formData.get("photo");

    console.log("userId recebido:", userIdValue);

    console.log(
      "arquivo recebido:",
      fileValue instanceof File
        ? {
            name: fileValue.name,
            type: fileValue.type,
            size: fileValue.size,
          }
        : fileValue
    );

    if (!userIdValue) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ID do usuário não foi enviado pelo frontend.",
          debug: {
            campos: Array.from(formData.keys()),
          },
        },
        { status: 400 }
      );
    }

    const userId = String(userIdValue).trim();

    if (!isValidUuid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "O ID recebido não é um UUID válido.",
          debug: {
            userId,
          },
        },
        { status: 400 }
      );
    }

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O campo 'photo' não contém um arquivo.",
          debug: {
            tipoRecebido: typeof fileValue,
          },
        },
        { status: 400 }
      );
    }

    const file = fileValue;

    if (!file.type) {
      return NextResponse.json(
        {
          success: false,
          message: "O arquivo não possui tipo MIME.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: `Formato inválido: ${file.type}. Use JPG, PNG ou WEBP.`,
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "A imagem enviada está vazia.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A imagem deve ter no máximo 5 MB.",
        },
        { status: 400 }
      );
    }

    console.log(
      "Procurando usuário:",
      userId
    );

    const [usuarios]: any = await db.query(
      `
      SELECT id
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    if (!Array.isArray(usuarios) || usuarios.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O UUID é válido, mas o usuário não existe na tabela users.",
          debug: {
            userId,
          },
        },
        { status: 404 }
      );
    }

    let extension = "jpg";

    if (file.type === "image/png") {
      extension = "png";
    }

    if (file.type === "image/webp") {
      extension = "webp";
    }

    const fileName = `${crypto
      .randomBytes(16)
      .toString("hex")}.${extension}`;

    const key = `users/${userId}/profile/${fileName}`;

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    console.log("Enviando para S3:", {
      bucket: AWS_S3_BUCKET,
      region: AWS_REGION,
      key,
      size: buffer.length,
    });

    await s3.send(
      new PutObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl:
          "public, max-age=31536000, immutable",
      })
    );

    const url = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;

    console.log("S3 enviado:", url);

    await db.query(
      `
      UPDATE users
      SET profile_image = ?
      WHERE id = ?
      `,
      [url, userId]
    );

    console.log(
      "Banco atualizado com sucesso."
    );

    return NextResponse.json({
      success: true,
      message: "Foto atualizada com sucesso.",
      url,
      key,
      userId,
    });
  } catch (error: any) {
    console.error(
      "=== ERRO UPLOAD PHOTO ===",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Não foi possível salvar a foto de perfil.",
      },
      { status: 500 }
    );
  }
}