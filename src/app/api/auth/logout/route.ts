
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { endCurrentSession } from "../../../lib/session-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  try {
    if (token) {
      await endCurrentSession(token, "logout");
    }
  } catch (error) {
    console.error("Erro ao registrar logout:", error);

    return NextResponse.json(
      { error: "Não foi possível registrar o encerramento da sessão." },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    success: true,
    message: "Sessão encerrada.",
  });

  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  // Se a aplicação também utiliza um cookie chamado "token",
  // remova-o com as mesmas opções de domínio e caminho
  // usadas na criação desse cookie.

  return response;
}
