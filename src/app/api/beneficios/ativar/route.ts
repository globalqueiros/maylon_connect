import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../../lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const beneficioId = Number(body?.beneficio_id);

    if (!Number.isInteger(beneficioId) || beneficioId <= 0) {
      return NextResponse.json(
        { error: "beneficio_id inválido." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    const token =
      cookieStore.get("token")?.value ||
      cookieStore.get("auth_token")?.value ||
      cookieStore.get("access_token")?.value ||
      cookieStore.get("jwt")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Sessão não encontrada. Faça login novamente." },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET não configurado.");

      return NextResponse.json(
        { error: "Configuração de autenticação não encontrada." },
        { status: 500 }
      );
    }

    let decoded: jwt.JwtPayload;

    try {
      const result = jwt.verify(token, secret);

      if (typeof result === "string") {
        return NextResponse.json(
          { error: "Sessão inválida. Faça login novamente." },
          { status: 401 }
        );
      }

      decoded = result;
    } catch (error) {
      console.error("Erro ao validar JWT:", error);

      return NextResponse.json(
        { error: "Sessão expirada. Faça login novamente." },
        { status: 401 }
      );
    }

    const usuarioId = String(
      decoded.id ??
        decoded.user_id ??
        decoded.usuario_id ??
        decoded.sub ??
        ""
    ).trim();

    if (!usuarioId) {
      console.error("JWT sem ID do usuário:", decoded);

      return NextResponse.json(
        { error: "Usuário da sessão inválido. Faça login novamente." },
        { status: 401 }
      );
    }

    const [usuarios]: any = await db.query(
      `
        SELECT id
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [usuarioId]
    );

    if (!usuarios || usuarios.length === 0) {
      console.error("Usuário não encontrado:", usuarioId);

      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    const [beneficios]: any = await db.query(
      `
        SELECT
          id,
          titulo,
          status
        FROM beneficios
        WHERE id = ?
        LIMIT 1
      `,
      [beneficioId]
    );

    if (!beneficios || beneficios.length === 0) {
      return NextResponse.json(
        { error: "Benefício não encontrado." },
        { status: 404 }
      );
    }

    const beneficio = beneficios[0];

    const [existente]: any = await db.query(
      `
        SELECT
          id,
          usuario_id,
          beneficio_id,
          valor,
          status
        FROM beneficio_assinaturas
        WHERE usuario_id = ?
          AND beneficio_id = ?
        LIMIT 1
      `,
      [usuarioId, beneficioId]
    );

    if (existente && existente.length > 0) {
      const registro = existente[0];

      if (Number(registro.status) === 1) {
        return NextResponse.json(
          { error: "Este benefício já está ativo." },
          { status: 409 }
        );
      }

      await db.query(
        `
          UPDATE beneficio_assinaturas
          SET
            status = 1,
            data_cancelamento = NULL,
            updated_at = NOW()
          WHERE id = ?
        `,
        [registro.id]
      );

      return NextResponse.json({
        success: true,
        message: `${beneficio.titulo} ativado com sucesso!`,
      });
    }

    await db.query(
      `
        INSERT INTO beneficio_assinaturas (
          usuario_id,
          beneficio_id,
          valor,
          data_ativacao,
          data_cancelamento,
          status,
          created_at,
          updated_at
        )
        VALUES (?, ?, 0.00, NOW(), NULL, 1, NOW(), NOW())
      `,
      [usuarioId, beneficioId]
    );

    return NextResponse.json({
      success: true,
      message: `${beneficio.titulo} ativado com sucesso!`,
    });
  } catch (error) {
    console.error("Erro ao ativar benefício:", error);

    return NextResponse.json(
      { error: "Erro interno ao ativar benefício." },
      { status: 500 }
    );
  }
}