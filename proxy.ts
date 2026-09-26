import { NextRequest, NextResponse } from "next/server";

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

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

  if (!token) {
    return NextResponse.redirect(
      new URL("/", request.url)
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
        new URL("/", request.url)
      );
    }

    const data = await response.json();

    const user =
      data?.user ??
      data?.usuario ??
      data?.data ??
      data;

    const userType = normalize(
      user?.user_type ??
        user?.tipo ??
        data?.user_type ??
        data?.tipo
    );

    const isDriver =
      userType === "driver" ||
      userType === "motorista" ||
      userType === "1";

    const isCustomer =
      userType === "customer" ||
      userType === "passageiro" ||
      userType === "passenger" ||
      userType === "2";

    if (motorista && !isDriver) {
      if (isCustomer) {
        return NextResponse.redirect(
          new URL("/passageiro", request.url)
        );
      }

      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }

    if (passageiro && !isCustomer) {
      if (isDriver) {
        return NextResponse.redirect(
          new URL("/motorista", request.url)
        );
      }

      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(
      new URL("/", request.url)
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