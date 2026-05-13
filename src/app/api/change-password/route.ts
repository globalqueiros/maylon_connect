import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "../../lib/db";

export async function POST(req: Request) {
  try {
    const { senha } = await req.json();

    if (!senha || senha.length < 6) {
      return NextResponse.json(
        { message: "Senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const token = (await cookieStore).get("token");

    if (!token) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = Number(token.value);

    if (!userId) {
      return NextResponse.json(
        { message: "Sessão inválida" },
        { status: 401 }
      );
    }

    const hash = await bcrypt.hash(senha, 10);

    await db.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [hash, userId]
    );

    return NextResponse.json({
      message: "Senha atualizada com sucesso",
    });

  } catch (error) {
    console.error("Erro API change-password:", error);

    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}