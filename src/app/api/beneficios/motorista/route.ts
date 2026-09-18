import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type JwtPayload = {
  id?: number | string | null;
  user_id?: number | string | null;
  usuario_id?: number | string | null;
};

function normalizarId(
  value: unknown
): string | number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const valor = String(value).trim();

  if (!valor) {
    return null;
  }

  if (/^\d+$/.test(valor)) {
    const numero = Number(valor);

    if (Number.isSafeInteger(numero) && numero > 0) {
      return numero;
    }

    return null;
  }

  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      valor
    )
  ) {
    return valor;
  }

  return null;
}

async function getUsuarioId(
  body: Record<string, unknown>
): Promise<string | number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (token) {
      const secret = process.env.JWT_SECRET;

      if (secret) {
        try {
          const decoded = jwt.verify(
            token,
            secret
          ) as JwtPayload;

          const tokenId = normalizarId(
            decoded.id ??
            decoded.user_id ??
            decoded.usuario_id
          );

          if (tokenId !== null) {
            return tokenId;
          }
        } catch { }
      }
    }
  } catch { }

  return normalizarId(
    body.usuario_id ??
    body.usuarioId ??
    body.user_id
  );
}

async function loadBeneficios(
  usuarioId: string | number
) {
  const sql = `
    SELECT
      b.id,
      b.imagem,
      b.titulo,
      b.descricao,
      b.valor,
      b.status,
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
      END AS status_usuario,
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
      AND LOWER(TRIM(b.tipo)) = 'motorista'
    ORDER BY
  CASE
    WHEN LOWER(TRIM(b.titulo)) LIKE '%btg pactual%' THEN 0
    ELSE 1
  END,
  b.id DESC
  `;

  const [rows]: any = await db.query(sql, [
    usuarioId,
    usuarioId,
  ]);

  return Array.isArray(rows) ? rows : [];
}

function normalizarImagem(
  imagem: unknown
): string {
  if (
    imagem === null ||
    imagem === undefined
  ) {
    return "";
  }

  let valor = String(imagem).trim();

  if (!valor) {
    return "";
  }

  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://")
  ) {
    return valor;
  }

  if (!valor.startsWith("/")) {
    valor = `/${valor}`;
  }

  return valor;
}

function dedupeById(rows: any[]) {
  const map = new Map<number, any>();

  for (const row of rows) {
    const id = Number(row?.id);

    if (!Number.isFinite(id) || id <= 0) {
      continue;
    }

    if (!map.has(id)) {
      map.set(id, row);
    }
  }

  return Array.from(map.values());
}

function normalizeBeneficios(rows: any[]) {
  return dedupeById(rows).map(
    (beneficio: any) => {
      const ativo =
        Number(beneficio.status_usuario) === 0;

      return {
        id: Number(beneficio.id),
        imagem: normalizarImagem(
          beneficio.imagem
        ),
        titulo:
          beneficio.titulo == null
            ? ""
            : String(beneficio.titulo),
        descricao:
          beneficio.descricao == null
            ? ""
            : String(beneficio.descricao),
        valor:
          beneficio.valor == null
            ? null
            : String(beneficio.valor),
        tipo: "motorista",
        status: ativo ? false : true,
        status_assinatura: ativo
          ? beneficio.status_assinatura ||
          "aprovado"
          : "disponivel",
      };
    }
  );
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
        body =
          json as Record<string, unknown>;
      }
    } catch {
      body = {};
    }

    const usuarioId =
      await getUsuarioId(body);

    if (usuarioId === null) {
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
        }
      );
    }

    const rows =
      await loadBeneficios(usuarioId);

    const beneficios =
      normalizeBeneficios(rows);

    return NextResponse.json(
      {
        success: true,
        usuario_id: usuarioId,
        tipo_usuario: "motorista",
        beneficios,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
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
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Utilize POST para consultar os benefícios.",
      beneficios: [],
    },
    {
      status: 405,
      headers: {
        Allow: "POST",
        "Cache-Control": "no-store",
      },
    }
  );
}