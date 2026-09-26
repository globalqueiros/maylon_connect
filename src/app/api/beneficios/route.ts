import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";
import { toPositiveInt } from "../../lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type JwtPayload = {
  id?: number | string | null;
  user_id?: number | string | null;
  usuario_id?: number | string | null;
};

async function getUsuarioId(body: Record<string, unknown>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (token) {
    const secret = process.env.JWT_SECRET;

    if (secret) {
      try {
        const decoded = jwt.verify(
          token,
          secret,
        ) as JwtPayload;

        const tokenId = toPositiveInt(
          decoded.id ??
            decoded.user_id ??
            decoded.usuario_id,
        );

        if (tokenId) {
          return tokenId;
        }
      } catch (error) {
        console.error(
          "[BENEFICIOS PASSAGEIRO] Erro ao validar token:",
          error,
        );
      }
    }
  }

  return toPositiveInt(
    body.usuario_id ??
      body.usuarioId ??
      body.user_id,
  );
}

async function loadBeneficios(usuarioId: number) {
  const attempts = [
    {
      sql: `
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
                  ubx.status_assinatura IN (
                    'aprovado',
                    'autorizado'
                  )
                  OR ubx.status_assinatura IS NULL
                )
            )
            THEN 0
            ELSE 1
          END AS status,

          COALESCE(
            ub.status_assinatura,
            'disponivel'
          ) AS status_assinatura

        FROM beneficios b

        LEFT JOIN usuario_beneficios ub
          ON ub.id = (
            SELECT MAX(ub2.id)
            FROM usuario_beneficios ub2
            WHERE ub2.usuario_id = ?
              AND ub2.beneficio_id = b.id
          )

        WHERE b.status = 1
          AND LOWER(TRIM(COALESCE(b.tipo, ''))) IN ('passageiro', 'ambos')
      `,
      params: [usuarioId, usuarioId],
    },

    {
      sql: `
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
            )
            THEN 0
            ELSE 1
          END AS status,

          CASE
            WHEN EXISTS (
              SELECT 1
              FROM usuario_beneficios ubx
              WHERE ubx.usuario_id = ?
                AND ubx.beneficio_id = b.id
                AND ubx.ativo = 1
            )
            THEN 'aprovado'
            ELSE 'disponivel'
          END AS status_assinatura

        FROM beneficios b

        WHERE b.status = 1
          AND LOWER(TRIM(COALESCE(b.tipo, ''))) = 'passageiro'
      `,
      params: [usuarioId, usuarioId],
    },

    {
      sql: `
        SELECT
          b.id,
          NULL AS imagem,
          b.titulo,
          COALESCE(b.descricao, '') AS descricao,
          b.valor,
          'passageiro' AS tipo,
          1 AS status,
          'disponivel' AS status_assinatura

        FROM beneficios b

        WHERE b.status = 1
          AND LOWER(TRIM(COALESCE(b.tipo, ''))) = 'passageiro'
      `,
      params: [],
    },
  ];

  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      const [rows]: any = await db.query(
        attempt.sql,
        attempt.params,
      );

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

    if (!Number.isFinite(id) || id <= 0) {
      continue;
    }

    const previous = map.get(id);

    if (!previous) {
      map.set(id, row);
      continue;
    }

    const previousActive =
      Number(previous.status) === 0 ||
      previous.status === false;

    const nextActive =
      Number(row.status) === 0 ||
      row.status === false;

    if (nextActive && !previousActive) {
      map.set(id, row);
    }
  }

  return Array.from(map.values());
}

export async function POST(req: Request) {
  try {
    let body: Record<string, unknown> = {};

    try {
      const json = await req.json();

      if (
        json &&
        typeof json === "object" &&
        !Array.isArray(json)
      ) {
        body = json as Record<string, unknown>;
      }
    } catch {
      body = {};
    }

    const usuario_id = await getUsuarioId(body);

    console.log(
      "[BENEFICIOS PASSAGEIRO] Usuário:",
      usuario_id,
    );

    if (!usuario_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário não autenticado.",
          beneficios: [],
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const rows = await loadBeneficios(usuario_id);

    const normalized = dedupeById(rows).map(
      (beneficio: any) => {
        const ativo =
          Number(beneficio.status) === 0 ||
          beneficio.status === false;

        return {
          ...beneficio,

          id: Number(beneficio.id),

          valor:
            beneficio.valor == null
              ? null
              : String(beneficio.valor),

          status: ativo ? false : true,

          titulo:
            beneficio.titulo == null
              ? ""
              : String(beneficio.titulo),

          descricao:
            beneficio.descricao == null
              ? ""
              : String(beneficio.descricao),

          imagem:
            beneficio.imagem == null
              ? ""
              : String(beneficio.imagem),

          tipo: "passageiro",

          status_assinatura: ativo
            ? beneficio.status_assinatura ||
              "aprovado"
            : "disponivel",
        };
      },
    );

    console.log(
      "[BENEFICIOS PASSAGEIRO] Total:",
      normalized.length,
    );

    return NextResponse.json(
      {
        success: true,
        usuario_id,
        tipo_usuario: "passageiro",
        beneficios: normalized,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error(
      "[BENEFICIOS PASSAGEIRO] ERRO COMPLETO:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao buscar benefícios.",
        beneficios: [],
      },
      {
        status: 500,
      },
    );
  }
}