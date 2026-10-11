import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "../../lib/db";
import { revogarSessoesDoUsuario, sessaoDaRequisicao } from "../../lib/sessaoServidor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Troca a senha do usuário logado (pela sessão, não por id enviado).
 * Antes lia um cookie "token" com o id puro, que ninguém recebia no login
 * (e que qualquer um poderia criar). Depois de trocar, os outros aparelhos
 * são desconectados; este continua logado.
 */
export async function POST(req: Request) {
  try {
    const sessao = await sessaoDaRequisicao(req);

    if (!sessao.ok) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const senha = typeof body?.senha === "string" ? body.senha : "";

    if (!senha || senha.length < 6) {
      return NextResponse.json(
        { message: "Senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(senha, 10);

    await db.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [hash, sessao.userId]
    );

    await revogarSessoesDoUsuario(
      sessao.userId,
      "Senha alterada",
      sessao.sessionUuid
    );

    return NextResponse.json({
      message: "Senha atualizada com sucesso",
    });
  } catch (error) {
    console.error("Erro API change-password:", error);

    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
