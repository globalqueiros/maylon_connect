import { NextRequest, NextResponse } from "next/server";
import { verificarTokenAcesso } from "./src/app/lib/tokenAcesso";

// Valida o access_token aqui mesmo, sem chamar o /api/me
// (a chamada ao próprio site falhava no servidor e dava 307 pro login).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const motorista =
    pathname === "/motorista" ||
    pathname.startsWith("/motorista/");

  const passageiro =
    pathname === "/passageiro" ||
    pathname.startsWith("/passageiro/");

  if (!motorista && !passageiro) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;
  const { valido, tipo } = await verificarTokenAcesso(token);

  if (!valido) {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }

  if (motorista && tipo !== "motorista") {
    return NextResponse.redirect(
      new URL(tipo === "passageiro" ? "/passageiro" : "/", request.url)
    );
  }

  if (passageiro && tipo !== "passageiro") {
    return NextResponse.redirect(
      new URL(tipo === "motorista" ? "/motorista" : "/", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/motorista",
    "/motorista/:path*",
    "/passageiro",
    "/passageiro/:path*",
  ],
};
