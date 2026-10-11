import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/**
 * ID do motorista logado, lido sempre do cookie de sessão.
 *
 * O id que vem no corpo do request não é confiável: qualquer pessoa consegue
 * trocar o valor e pedir benefício no lugar de outro motorista.
 */
export async function usuarioIdDaSessao(): Promise<string | null> {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("token")?.value ||
    cookieStore.get("auth_token")?.value ||
    cookieStore.get("access_token")?.value ||
    cookieStore.get("jwt")?.value;

  if (!token) {
    return null;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET não configurado.");
    return null;
  }

  try {
    const resultado = jwt.verify(token, secret);

    if (typeof resultado === "string") {
      return null;
    }

    const id = String(
      resultado.id ??
        resultado.user_id ??
        resultado.usuario_id ??
        resultado.sub ??
        "",
    ).trim();

    return id || null;
  } catch (error) {
    console.error("Erro ao validar JWT:", error);
    return null;
  }
}
