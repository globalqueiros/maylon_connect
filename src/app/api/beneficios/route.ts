import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { toPositiveInt } from "../../lib/session";

type TipoUsuario = "motorista" | "passageiro" | "ambos";

async function loadBeneficios(usuarioId: number) {
  // Join only the latest usuario_beneficios row per benefit so history
  // (cancelado + novo pendente, etc.) never duplicates catalog rows.
  const attempts = [
    `
      SELECT
        b.id,
        b.imagem,
        b.titulo,
        b.descricao,
        b.valor,
        b.tipo,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM usuario_beneficios ubx
            WHERE ubx.usuario_id = ?
              AND ubx.beneficio_id = b.id
              AND ubx.ativo = 1
              AND (
                ubx.status_assinatura IN ('aprovado', 'autorizado')
                OR ubx.status_assinatura IS NULL
              )
          ) THEN 0
          ELSE 1
        END AS status,
        COALESCE(ub.status_assinatura, 'disponivel') AS status_assinatura
      FROM beneficios b
      LEFT JOIN usuario_beneficios ub
        ON ub.id = (
          SELECT MAX(ub2.id)
          FROM usuario_beneficios ub2
          WHERE ub2.usuario_id = ?
            AND ub2.beneficio_id = b.id
        )
      WHERE b.status = 1
    `,
    `
      SELECT
        b.id,
        NULL AS imagem,
        b.titulo,
        b.descricao,
        b.valor,
        b.tipo,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM usuario_beneficios ubx
            WHERE ubx.usuario_id = ?
              AND ubx.beneficio_id = b.id
              AND ubx.ativo = 1
          ) THEN 0
          ELSE 1
        END AS status,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM usuario_beneficios ubx
            WHERE ubx.usuario_id = ?
              AND ubx.beneficio_id = b.id
              AND ubx.ativo = 1
          ) THEN 'aprovado'
          ELSE 'disponivel'
        END AS status_assinatura
      FROM beneficios b
      WHERE b.status = 1
    `,
    `
      SELECT
        b.id,
        NULL AS imagem,
        b.titulo,
        COALESCE(b.descricao, '') AS descricao,
        b.valor,
        COALESCE(b.tipo, 'ambos') AS tipo,
        1 AS status,
        'disponivel' AS status_assinatura
      FROM beneficios b
      WHERE b.status = 1
    `,
    `
      SELECT
        b.id,
        NULL AS imagem,
        b.titulo,
        '' AS descricao,
        b.valor,
        'ambos' AS tipo,
        1 AS status,
        'disponivel' AS status_assinatura
      FROM beneficios b
    `,
  ];

  const paramsByAttempt = [
    [usuarioId, usuarioId],
    [usuarioId, usuarioId],
    [],
    [],
  ];

  let lastError: unknown = null;
  for (let i = 0; i < attempts.length; i++) {
    try {
      const [rows]: any = await db.query(attempts[i], paramsByAttempt[i]);
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function dedupeById(rows: any[]) {
  const map = new Map<number, any>();
  for (const row of rows) {
    const id = Number(row.id);
    if (!Number.isFinite(id)) continue;
    const prev = map.get(id);
    if (!prev) {
      map.set(id, row);
      continue;
    }
    // Prefer "ativo" (status 0 / false) over available duplicates
    const prevActive = Number(prev.status) === 0 || prev.status === false;
    const nextActive = Number(row.status) === 0 || row.status === false;
    if (nextActive && !prevActive) map.set(id, row);
  }
  return Array.from(map.values());
}

export async function POST(req: Request) {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) || {};
    } catch {
      body = {};
    }

    const usuario_id = toPositiveInt(
      body.usuario_id ?? body.usuarioId ?? body.user_id
    );

    if (!usuario_id) {
      return NextResponse.json(
        { error: "Usuário inválido" },
        { status: 400 }
      );
    }

    const [userRows]: any = await db.query(
      "SELECT user_type FROM users WHERE id = ? LIMIT 1",
      [usuario_id]
    );
    const user = userRows?.[0];

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const rawType = String(user.user_type || "").toLowerCase();
    let tipo: TipoUsuario = "ambos";
    if (rawType === "driver" || rawType === "motorista") tipo = "motorista";
    else if (
      rawType === "customer" ||
      rawType === "passageiro" ||
      rawType === "passenger"
    ) {
      tipo = "passageiro";
    }

    const rows = await loadBeneficios(usuario_id);

    const filtered = rows.filter((b: any) => {
      const t = String(b.tipo || "").toLowerCase();
      if (!t || t === "assinatura") return true;
      if (tipo === "ambos") return true;
      if (tipo === "passageiro") {
        return [
          "passageiro",
          "customer",
          "ambos",
          "both",
          "assinatura",
        ].includes(t);
      }
      if (tipo === "motorista") {
        return ["motorista", "driver", "ambos", "both", "assinatura"].includes(
          t
        );
      }
      return true;
    });

    const normalized = dedupeById(filtered).map((b: any) => ({
      ...b,
      id: Number(b.id),
      valor: b.valor == null ? null : String(b.valor),
      status: Boolean(Number(b.status)),
      titulo: b.titulo == null ? "" : String(b.titulo),
      descricao: b.descricao == null ? "" : String(b.descricao),
      imagem: b.imagem == null ? "" : String(b.imagem),
      tipo: b.tipo == null ? "" : String(b.tipo),
      status_assinatura:
        Number(b.status) === 0
          ? b.status_assinatura || "aprovado"
          : "disponivel",
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("/api/beneficios error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar benefícios" },
      { status: 500 }
    );
  }
}
