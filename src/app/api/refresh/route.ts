import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const refreshToken = req.headers.get("cookie")
    ?.split("; ")
    .find(c => c.startsWith("refresh_token="))
    ?.split("=")[1];

  if (!refreshToken) {
    return NextResponse.json({ error: "Sem refresh token" }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    );

    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    const res = NextResponse.json({ success: true });

    res.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: true,
      path: "/",
    });

    return res;

  } catch {
    return NextResponse.json({ error: "Refresh inválido" }, { status: 403 });
  }
}