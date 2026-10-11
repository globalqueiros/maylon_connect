
import { NextRequest, NextResponse } from "next/server";
import { verificarTokenAcesso } from "./src/app/lib/tokenAcesso";

type TipoUsuario = "motorista" | "passageiro";

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

  const redirecionarInicio = () => {
    const response = NextResponse.redirect(new URL("/", request.url));

    response.cookies.set("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  };

  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return redirecionarInicio();
  }

  let tipo: TipoUsuario;

  try {
    const resultado = await verificarTokenAcesso(token, request);

    if (!resultado?.valido) {
      return redirecionarInicio();
    }

    if (
      resultado.tipo !== "motorista" &&
      resultado.tipo !== "passageiro"
    ) {
      return redirecionarInicio();
    }

    tipo = resultado.tipo;
  } catch {
    return redirecionarInicio();
  }

  if (motorista && tipo !== "motorista") {
    return NextResponse.redirect(
      new URL(
        tipo === "passageiro" ? "/passageiro" : "/",
        request.url
      )
    );
  }

  if (passageiro && tipo !== "passageiro") {
    return NextResponse.redirect(
      new URL(
        tipo === "motorista" ? "/motorista" : "/",
        request.url
      )
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/motorista/:path*",
    "/passageiro/:path*",
  ],
};
