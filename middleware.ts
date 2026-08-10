import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const pathname = req.nextUrl.pathname;

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Don't wipe the session if env is missing in Edge — let the page load.
    console.error("JWT_SECRET missing in middleware");
    return NextResponse.next();
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      id?: number | string;
      user_type?: string;
    };

    const userType = decoded.user_type;

    if (pathname === "/" || pathname.startsWith("/login")) {
      if (userType === "driver") {
        return NextResponse.redirect(new URL("/motorista", req.url));
      }
      if (userType === "customer") {
        return NextResponse.redirect(new URL("/passageiro", req.url));
      }
      return NextResponse.next();
    }

    // Only bounce when role is known AND wrong — never for missing user_type
    if (pathname.startsWith("/motorista") && userType === "customer") {
      return NextResponse.redirect(new URL("/passageiro", req.url));
    }

    if (pathname.startsWith("/passageiro") && userType === "driver") {
      return NextResponse.redirect(new URL("/motorista", req.url));
    }

    return NextResponse.next();
  } catch {
    // Invalid/expired token: send to login, clear cookie
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.set("access_token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
    return res;
  }
}

export const config = {
  matcher: ["/motorista/:path*", "/passageiro/:path*", "/login"],
};
