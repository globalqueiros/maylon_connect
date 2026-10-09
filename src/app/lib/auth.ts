import { cookies } from "next/headers";
import { jwtVerify, type JWTPayload } from "jose";

const AUTH_COOKIE = "auth_token";

type AuthPayload = JWTPayload & {
  id?: number | string;
  usuario_id?: number | string;
};

export async function getUsuarioLogado(): Promise<{
  id: number;
  usuario_id: number;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET não configurado.");
      return null;
    }

    const encodedSecret = new TextEncoder().encode(secret);

    const { payload } = await jwtVerify<AuthPayload>(
      token,
      encodedSecret
    );

    const rawId = payload.usuario_id ?? payload.id;

    if (rawId === undefined || rawId === null) {
      return null;
    }

    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      return null;
    }

    return {
      id,
      usuario_id: id,
    };
  } catch (error) {
    console.error("Erro ao validar auth_token:", error);
    return null;
  }
}