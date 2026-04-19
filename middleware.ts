import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const pathname = req.nextUrl.pathname;

  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth");

  if (!token) {
    if (!isPublic) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const { user_type } = decoded;

    if (pathname === "/" || pathname.startsWith("/login")) {
      if (user_type === "driver") {
        return NextResponse.redirect(new URL("/motorista", req.url));
      }
      if (user_type === "customer") {
        return NextResponse.redirect(new URL("/passageiro", req.url));
      }
    }

    if (pathname.startsWith("/motorista") && user_type !== "driver") {
      return NextResponse.redirect(new URL("/passageiro", req.url));
    }

    if (pathname.startsWith("/passageiro") && user_type !== "customer") {
      return NextResponse.redirect(new URL("/motorista", req.url));
    }

    return NextResponse.next();

  } catch (err) {
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: [
    "/motorista/:path*",
    "/passageiro/:path*",
    "/login",
  ],
};