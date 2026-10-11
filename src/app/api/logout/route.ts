import { NextResponse } from "next/server";
import { clearAuthCookieOptions } from "../../lib/authCookies";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const clear = clearAuthCookieOptions();
  res.cookies.set("access_token", "", clear);
  res.cookies.set("refresh_token", "", clear);
  return res;
}

export async function GET() {
  return POST();
}
