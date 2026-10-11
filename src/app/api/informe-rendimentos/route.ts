import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";
import type { RowDataPacket } from "mysql2";

type TokenPayload = {
  id?: string | null;
  user_id?: string | null;
  usuario_id?: string | null;
  userId?: string | null;
  sub?: string | null;
  email?: string | null;
  user_type?: string | null;
  exp?: number;
  iat?: number;
};

type UserRow = RowDataPacket & {
  id: string;
  full_name: string;
  email: string;
  identification_number: string | null;
  user_type: string | null;
};

type TripRow = RowDataPacket & {
  id: string;
  driver_id: string | null;
  paid_fare: number | string | null;
  actual_fare: number | string | null;
  estimated_fare: number | string | null;
  return_fee: number | string | null;
  created_at: Date | string;
};

function normalizeId(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const id = value.trim();

  return id || null;
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const email = value.trim().toLowerCase();

  if (!email || !email.includes("@")) return null;

  return email;
}

function numberValue(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Não autenticado",
          message: "Cookie access_token não encontrado.",
        },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return NextResponse.json(
        {
          error: "Erro de configuração",
          message: "JWT_SECRET não configurado no servidor.",
        },
        { status: 500 }
      );
    }

    let decoded: TokenPayload;

    try {
      decoded = jwt.verify(accessToken, jwtSecret) as TokenPayload;
    } catch {
      return NextResponse.json(
        {
          error: "Sessão inválida",
          message:
            "O token de acesso é inválido ou expirou. Faça login novamente.",
        },
        { status: 401 }
      );
    }

    const idsPossiveis = [
      decoded.id,
      decoded.user_id,
      decoded.usuario_id,
      decoded.userId,
      decoded.sub,
    ];

    let usuarioId: string | null = null;

    for (const valor of idsPossiveis) {
      const id = normalizeId(valor);

      if (id) {
        usuarioId = id;
        break;
      }
    }

    let usuario: UserRow | null = null;

    if (usuarioId) {
      const [rows] = await db.query<UserRow[]>(
        `
        SELECT
          id,
          full_name,
          email,
          identification_number,
          user_type
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [usuarioId]
      );

      if (rows.length > 0) {
        usuario = rows[0];
      }
    }

    if (!usuario) {
      const emailToken = normalizeEmail(decoded.email);

      if (emailToken) {
        const [rows] = await db.query<UserRow[]>(
          `
          SELECT
            id,
            full_name,
            email,
            identification_number,
            user_type
          FROM users
          WHERE LOWER(TRIM(email)) = ?
          LIMIT 1
          `,
          [emailToken]
        );

        if (rows.length > 0) {
          usuario = rows[0];
          usuarioId = rows[0].id;
        }
      }
    }

    if (!usuario) {
      return NextResponse.json(
        {
          error: "Usuário não identificado na sessão",
          message:
            "O usuário da sessão não foi localizado na tabela users.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const anoParam = searchParams.get("ano");

    const ano = anoParam
      ? Number.parseInt(anoParam, 10)
      : new Date().getFullYear();

    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
      return NextResponse.json(
        {
          error: "Ano inválido",
        },
        { status: 400 }
      );
    }

    const [viagens] = await db.query<TripRow[]>(
      `
      SELECT
        id,
        driver_id,
        paid_fare,
        actual_fare,
        estimated_fare,
        return_fee,
        created_at
      FROM trip_requests
      WHERE driver_id = ?
        AND YEAR(created_at) = ?
      ORDER BY created_at ASC
      `,
      [usuario.id, ano]
    );

    const nomesMeses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    const mensal = nomesMeses.map((mes, index) => {
      const numeroMes = index + 1;

      const viagensDoMes = viagens.filter((viagem) => {
        const data = new Date(viagem.created_at);

        return data.getMonth() + 1 === numeroMes;
      });

      const valor = viagensDoMes.reduce((total, viagem) => {
        return total + numberValue(viagem.paid_fare);
      }, 0);

      return {
        mes,
        valor: Number(valor.toFixed(2)),
      };
    });

    const corridas = viagens.reduce((total, viagem) => {
      return total + numberValue(viagem.paid_fare);
    }, 0);

    const taxas = viagens.reduce((total, viagem) => {
      return total + numberValue(viagem.return_fee);
    }, 0);

    const totalBruto = corridas;
    const totalLiquido = totalBruto - taxas;

    return NextResponse.json(
      {
        motorista: {
          id: usuario.id,
          nome: usuario.full_name,
          identification_number: usuario.identification_number,
          email: usuario.email,
          user_type: usuario.user_type,
        },
        ano,
        anoCalendario: ano,
        quantidadeViagens: viagens.length,
        corridas: Number(corridas.toFixed(2)),
        taxas: Number(taxas.toFixed(2)),
        totalBruto: Number(totalBruto.toFixed(2)),
        totalLiquido: Number(totalLiquido.toFixed(2)),
        mensal,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Erro /api/informe-rendimentos:", error);

    return NextResponse.json(
      {
        error: "Erro interno",
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao carregar o informe.",
      },
      { status: 500 }
    );
  }
}