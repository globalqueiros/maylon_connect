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

export async function POST(request: NextRequest) {
  try {
    if (
      !AWS_REGION ||
      !AWS_ACCESS_KEY_ID ||
      !AWS_SECRET_ACCESS_KEY ||
      !AWS_S3_BUCKET ||
      !s3
    ) {
      console.error("Configuração do AWS S3 incompleta.");

      return NextResponse.json(
        {
          success: false,
          message: "Configuração do AWS S3 não encontrada.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const userIdValue = formData.get("userId");
    const file = formData.get("photo");

    if (!userIdValue) {
      return NextResponse.json(
        {
          success: false,
          message: "ID do usuário não informado.",
        },
        { status: 400 }
      );
    }

    const userId = Number(userIdValue);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ID do usuário inválido.",
        },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Nenhuma foto foi enviada.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Formato inválido. Use JPG, PNG ou WEBP.",
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
          message: "A imagem deve ter no máximo 5 MB.",
        },
        { status: 400 }
      );
    }

    const [usuarios] = await db.query(
      `
      SELECT id
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    const rows = usuarios as Array<{
      id: number;
    }>;

    if (!rows.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuário não encontrado.",
        },
        { status: 404 }
      );
    }

    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";

    const fileName = `${crypto
      .randomBytes(16)
      .toString("hex")}.${extension}`;

    const key = `users/${userId}/profile/${fileName}`;

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

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

    const url =
      `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}` +
      `.amazonaws.com/${key}`;

    await db.query(
      `
      UPDATE users
      SET profile_image = ?
      WHERE id = ?
      `,
      [url, userId]
    );

    return NextResponse.json({
      success: true,
      message: "Foto atualizada com sucesso.",
      url,
      key,
    });
  } catch (error) {
    console.error(
      "Erro ao enviar foto para o S3:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a foto de perfil.",
      },
      { status: 500 }
    );
  }
}