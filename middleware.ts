import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function cleanSecret(value?: string) {
  if (!value) return "";
  const cleaned = value.replace(/\r/g, "").trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    return cleaned.slice(1, -1);
  }
  return cleaned;
}

function base64UrlToBytes(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Edge-safe HS256 JWT verify (no Node crypto / jsonwebtoken). */
async function verifyAccessToken(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("invalid_token");

  const [headerB64, payloadB64, signatureB64] = parts;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signatureB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  );
  if (!valid) throw new Error("invalid_signature");

  const json = new TextDecoder().decode(base64UrlToBytes(payloadB64));
  const payload = JSON.parse(json) as {
    id?: number | string;
    user_type?: string;
    exp?: number;
  };

  if (payload.exp && Date.now() / 1000 >= payload.exp) {
    throw new Error("token_expired");
  }

  return payload;
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const pathname = req.nextUrl.pathname;

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const secret = cleanSecret(process.env.JWT_SECRET);
  if (!secret) {
    // Don't wipe the session if env is missing in Edge — let the page load.
    console.error("JWT_SECRET missing in middleware");
    return NextResponse.next();
  }

  try {
    const decoded = await verifyAccessToken(token, secret);

    const userType = String(decoded.user_type || "").toLowerCase();
    const isDriver = userType === "driver" || userType === "motorista";
    const isPassenger =
      userType === "customer" ||
      userType === "passageiro" ||
      userType === "passenger";

    if (pathname === "/" || pathname.startsWith("/login")) {
      if (isDriver) {
        return NextResponse.redirect(new URL("/motorista", req.url));
      }
      if (isPassenger) {
        return NextResponse.redirect(new URL("/passageiro", req.url));
      }
      return NextResponse.next();
    }

    // Only bounce when role is known AND wrong — never for missing user_type
    if (pathname.startsWith("/motorista") && isPassenger) {
      return NextResponse.redirect(new URL("/passageiro", req.url));
    }

    if (pathname.startsWith("/passageiro") && isDriver) {
      return NextResponse.redirect(new URL("/motorista", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("middleware jwt verify failed:", error);
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.set("access_token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
    res.cookies.set("refresh_token", "", {
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
