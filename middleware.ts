import { NextRequest, NextResponse } from "next/server";

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export async function middleware(request: NextRequest) {
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

  if (!token) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  try {
    const response = await fetch(
      new URL("/api/me", request.url),
      {
        method: "GET",
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    const data = await response.json();

    const user =
      data?.user ||
      data?.usuario ||
      data?.data ||
      data;

    const userType = normalize(
      user?.user_type
    );

    console.log(
      "======================================"
    );
    console.log(
      "🔐 PROTEÇÃO DE ROTAS"
    );
    console.log(
      "📍 ROTA:",
      pathname
    );
    console.log(
      "👤 USER:",
      user?.id
    );
    console.log(
      "👤 USER TYPE:",
      userType
    );
    console.log(
      "======================================"
    );

    const isDriver =
      userType === "driver" ||
      userType === "motorista";

    const isCustomer =
      userType === "customer" ||
      userType === "passageiro" ||
      userType === "passenger";

    if (!isDriver && !isCustomer) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    if (motorista && !isDriver) {
      console.log(
        "🚫 CUSTOMER BLOQUEADO DE /motorista"
      );

      return NextResponse.redirect(
        new URL("/passageiro", request.url)
      );
    }

    if (passageiro && !isCustomer) {
      console.log(
        "🚫 DRIVER BLOQUEADO DE /passageiro"
      );

      return NextResponse.redirect(
        new URL("/motorista", request.url)
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error(
      "❌ Erro na proteção:",
      error
    );

    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }
}

export const config = {
  matcher: [
    "/motorista",
    "/motorista/:path*",
    "/passageiro",
    "/passageiro/:path*",
  ],
};