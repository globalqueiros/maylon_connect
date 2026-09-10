import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";
import { s3 } from "../../lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err: any) {
      // 🔥 TRATAMENTO DO TOKEN EXPIRADO
      if (err.name === "TokenExpiredError") {
        return NextResponse.json(
          { error: "Sessão expirada. Faça login novamente." },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não enviado" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `profile/${userId}-${Date.now()}-${file.name}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
        ACL: "public-read",
      })
    );

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    await db.execute(
      "UPDATE users SET profile_image = ? WHERE id = ?",
      [fileUrl, userId]
    );

    return NextResponse.json({
      success: true,
      url: fileUrl,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao enviar foto de perfil. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}