import { NextResponse } from "next/server";
import { db } from "../../lib/db";

type TipoUsuario = "motorista" | "passageiro" | "ambos";

export async function POST(req: Request) {
  try {
    const { usuario_id } = await req.json();

    if (!usuario_id) {
      return NextResponse.json(
        { error: "Usuário inválido" },
        { status: 400 }
      );
    }

    const [[user]]: any = await db.query(
      "SELECT user_type FROM users WHERE id = ?",
      [usuario_id]
    );

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    let tipo: TipoUsuario;
    if (user.user_type === "driver") tipo = "motorista";
    else if (user.user_type === "customer") tipo = "passageiro";
    else tipo = "ambos";

    let rows: any[] = [];

    try {
      const [result]: any = await db.query(
        `
        SELECT
          b.id,
          b.imagem,
          b.titulo,
          b.descricao,
          b.valor,
          b.tipo,
          CASE
            WHEN ub.id IS NOT NULL
              AND ub.ativo = 1
              AND (ub.status_assinatura = 'aprovado' OR ub.status_assinatura IS NULL)
            THEN 0
            ELSE 1
          END AS status,
          COALESCE(ub.status_assinatura, 'disponivel') AS status_assinatura
        FROM beneficios b
        LEFT JOIN usuario_beneficios ub
          ON ub.beneficio_id = b.id
          AND ub.usuario_id = ?
        WHERE b.status = 1
        `,
        [usuario_id]
      );
      rows = result;
    } catch {
      const [result]: any = await db.query(
        `
        SELECT
          b.id,
          b.imagem,
          b.titulo,
          b.descricao,
          b.valor,
          b.tipo,
          CASE
            WHEN ub.id IS NOT NULL AND ub.ativo = 1 THEN 0
            ELSE 1
          END AS status,
          CASE
            WHEN ub.id IS NOT NULL AND ub.ativo = 1 THEN 'aprovado'
            ELSE 'disponivel'
          END AS status_assinatura
        FROM beneficios b
        LEFT JOIN usuario_beneficios ub
          ON ub.beneficio_id = b.id
          AND ub.usuario_id = ?
        WHERE b.status = 1
        `,
        [usuario_id]
      );
      rows = result;
    }

    const filtered = (Array.isArray(rows) ? rows : []).filter((b: any) => {
      const t = String(b.tipo || "").toLowerCase();
      if (tipo === "ambos") return true;
      if (tipo === "passageiro") {
        return ["passageiro", "customer", "ambos", "both"].includes(t);
      }
      if (tipo === "motorista") {
        return ["motorista", "driver", "ambos", "both"].includes(t);
      }
      return true;
    });

    const normalized = filtered.map((b: any) => ({
      ...b,
      id: Number(b.id),
      valor: b.valor == null ? null : String(b.valor),
      status: Boolean(Number(b.status)),
      titulo: b.titulo == null ? "" : String(b.titulo),
      descricao: b.descricao == null ? "" : String(b.descricao),
      imagem: b.imagem == null ? "" : String(b.imagem),
      tipo: b.tipo == null ? "" : String(b.tipo),
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar benefícios" },
      { status: 500 }
    );
  }
}
