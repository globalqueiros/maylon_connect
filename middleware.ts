import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const pathname = req.nextUrl.pathname;

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id?: number | string;
      user_type?: string;
    };

    const userType = decoded.user_type;

    // Only redirect when role is known AND clearly wrong.
    // Tokens without user_type must still access the app (legacy cookies).
    if (pathname === "/" || pathname.startsWith("/login")) {
      if (userType === "driver") {
        return NextResponse.redirect(new URL("/motorista", req.url));
      }
      if (userType === "customer") {
        return NextResponse.redirect(new URL("/passageiro", req.url));
      }
      return NextResponse.next();
    }

    if (pathname.startsWith("/motorista") && userType === "customer") {
      return NextResponse.redirect(new URL("/passageiro", req.url));
    }

    if (pathname.startsWith("/passageiro") && userType === "driver") {
      return NextResponse.redirect(new URL("/motorista", req.url));
    }

    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.set("access_token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
    return res;
  }
}

export const config = {
  matcher: ["/motorista/:path*", "/passageiro/:path*", "/login"],
};
