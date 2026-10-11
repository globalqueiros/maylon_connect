import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";
import { authCookieOptions } from "../../lib/authCookies";
import {
  estenderSessao,
  fimDaSessao,
  jwtSecret,
  SESSAO_SEGUNDOS,
} from "../../lib/sessaoServidor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Gera um novo access_token a partir do refresh_token.
 * O refresh precisa estar ligado a uma sessão ativa ("sid"): sessão
 * revogada ou encerrada não gera token novo.
 * (Antes verificava com JWT_REFRESH_SECRET, mas o login assina com
 * JWT_SECRET, e convertia o id UUID em número — falhava sempre.)
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "Sem refresh token" }, { status: 401 });
    }

    const secret = jwtSecret();
    if (!secret) {
      return NextResponse.json(
        { error: "Secrets JWT não configuradas" },
        { status: 500 }
      );
    }

    type RefreshPayload = { id?: unknown; sid?: unknown; type?: unknown };
    let decoded: RefreshPayload | null = null;
    for (const s of [secret, process.env.JWT_REFRESH_SECRET?.trim()].filter(Boolean) as string[]) {
      try {
        const result = jwt.verify(refreshToken, s, { algorithms: ["HS256"] });
        decoded = typeof result === "string" ? null : (result as RefreshPayload);
        break;
      } catch {
        decoded = null;
      }
    }

    const userId = decoded?.id != null ? String(decoded.id).trim() : "";
    const sid = typeof decoded?.sid === "string" ? decoded.sid : "";
    if (!userId || !sid) {
      return NextResponse.json({ error: "Refresh inválido" }, { status: 403 });
    }

    const [sessoes]: any = await db.execute(
      `SELECT user_id, status, expires_at FROM user_sessions WHERE session_uuid = ? LIMIT 1`,
      [sid]
    );
    const sessao = sessoes?.[0];
    if (!sessao || String(sessao.user_id) !== userId || String(sessao.status) !== "active") {
      return NextResponse.json({ error: "Sessão encerrada" }, { status: 401 });
    }

    const [rows]: any = await db.query(
      `SELECT id, email, user_type FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    const user = rows?.[0];
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 });
    }

    const newAccessToken = jwt.sign(
      {
        id: String(user.id),
        user_type: String(user.user_type || "").trim().toLowerCase(),
        email: user.email,
        sid,
      },
      secret,
      { expiresIn: SESSAO_SEGUNDOS }
    );

    await estenderSessao(sid, fimDaSessao());

    const res = NextResponse.json({ success: true });
    res.cookies.set(
      "access_token",
      newAccessToken,
      authCookieOptions(SESSAO_SEGUNDOS)
    );
    return res;
  } catch {
    return NextResponse.json({ error: "Refresh inválido" }, { status: 403 });
  }
}
