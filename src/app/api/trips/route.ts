import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { db } from "../../lib/db";
import { toPositiveInt } from "../../lib/session";
import { authCookieOptions } from "../../lib/authCookies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type JwtPayloadCustom = jwt.JwtPayload & {
  id?: unknown;
  userId?: unknown;
  user_id?: unknown;
  sub?: unknown;
  email?: unknown;
  user_type?: unknown;
  matricula?: unknown;
};

function cleanSecret(value?: string): string {
  if (!value) return "";

  const cleaned = value.replace(/\r/g, "").trim();

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    return cleaned.slice(1, -1);
  }

  return cleaned;
}

function decodeUserToken(
  token: string
): JwtPayloadCustom | null {
  const jwtSecret = cleanSecret(process.env.JWT_SECRET);

  if (!jwtSecret || !token) {
    return null;
  }

  try {
    return jwt.verify(token, jwtSecret) as JwtPayloadCustom;
  } catch (error) {
    console.error("❌ JWT inválido ou expirado:", error);
    return null;
  }
}

async function findUserIdByEmail(
  email: string
): Promise<number | null> {
  if (!email) return null;

  try {
    const [rows]: any = await db.query(
      `
        SELECT id
        FROM users
        WHERE LOWER(email) = LOWER(?)
        LIMIT 1
      `,
      [email]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }

    return toPositiveInt(rows[0]?.id) || null;
  } catch (error) {
    console.error("❌ Erro ao procurar usuário:", error);
    throw error;
  }
}

async function resolveUserIdFromToken(
  token: string
): Promise<{
  userId: number | null;
  decoded: JwtPayloadCustom | null;
}> {
  const decoded = decodeUserToken(token);

  if (!decoded) {
    return { userId: null, decoded: null };
  }

  const possibleIds = [
    decoded.id,
    decoded.userId,
    decoded.user_id,
    decoded.sub,
  ];

  for (const value of possibleIds) {
    const userId = toPositiveInt(value);

    if (userId) {
      return { userId, decoded };
    }
  }

  const email =
    typeof decoded.email === "string"
      ? decoded.email.trim().toLowerCase()
      : "";

  if (email) {
    const userId = await findUserIdByEmail(email);

    if (userId) {
      return { userId, decoded };
    }
  }

  return { userId: null, decoded };
}

async function getTokenFromRequest(
  req: Request
): Promise<string | null> {
  const cookieHeader = req.headers.get("cookie");

  if (cookieHeader) {
    const cookiesList = cookieHeader.split(";");

    for (const item of cookiesList) {
      const separator = item.indexOf("=");

      if (separator === -1) continue;

      const name = item.slice(0, separator).trim();
      const value = item.slice(separator + 1).trim();

      if (name === "access_token" && value) {
        return value;
      }
    }
  }

  try {
    const cookieStore = await cookies();

    const accessToken =
      cookieStore.get("access_token")?.value;

    if (accessToken) {
      return accessToken;
    }
  } catch (error) {
    console.error("⚠️ Erro ao acessar cookies:", error);
  }

  const authorization = req.headers.get("authorization");

  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const token = authorization.slice(7).trim();

    if (token) {
      return token;
    }
  }

  return null;
}

async function getAuthenticatedUser(
  req: Request
): Promise<{
  userId: number;
  decoded: JwtPayloadCustom;
} | null> {
  const token = await getTokenFromRequest(req);

  if (!token) {
    return null;
  }

  const { userId, decoded } =
    await resolveUserIdFromToken(token);

  if (!userId || !decoded) {
    return null;
  }

  return { userId, decoded };
}

/**
 * Busca as viagens do usuário.
 *
 * IMPORTANTE:
 * Os endereços NÃO estão em trip_requests.
 * Eles estão em trip_request_coordinates.
 */
async function loadTripsForUser(userId: number) {
  const [rows]: any = await db.query(
    `
      SELECT
        tr.id AS trip_request_id,

        tr.ref_id,
        tr.customer_id,
        tr.driver_id,
        tr.vehicle_category_id,
        tr.vehicle_id,
        tr.zone_id,
        tr.area_id,

        COALESCE(
          tr.actual_fare,
          tr.estimated_fare,
          0
        ) AS valor,

        tr.estimated_fare,
        tr.actual_fare,
        tr.estimated_distance,
        tr.paid_fare,
        tr.return_fee,
        tr.cancellation_fee,
        tr.extra_fare_fee,
        tr.extra_fare_amount,
        tr.surge_percentage,
        tr.return_time,
        tr.due_amount,
        tr.actual_distance,
        tr.encoded_polyline,
        tr.accepted_by,
        tr.payment_method,
        tr.payment_status,
        tr.coupon_id,
        tr.coupon_amount,
        tr.discount_id,
        tr.discount_amount,
        tr.note,
        tr.entrance,
        tr.otp,
        tr.rise_request_count,
        tr.type,
        tr.ride_request_type,
        tr.scheduled_at,
        tr.current_status,
        tr.is_notification_sent,
        tr.sending_notification_at,
        tr.checked,
        tr.tips,
        tr.deleted_at,
        tr.created_at,
        tr.updated_at,
        tr.is_paused,
        tr.map_screenshot,
        tr.trip_cancellation_reason,

        /* ENDEREÇOS REAIS */
        c.pickup_address,
        c.destination_address,

        /* COORDENADAS */
        c.pickup_coordinates,
        c.destination_coordinates,

        /* DESTINO ALCANÇADO */
        c.is_reached_destination,

        /* PARADAS INTERMEDIÁRIAS */
        c.intermediate_coordinates,
        c.int_coordinate_1,
        c.is_reached_1,
        c.int_coordinate_2,
        c.is_reached_2,
        c.intermediate_addresses,

        /* COORDENADAS ADICIONAIS */
        c.start_coordinates,
        c.drop_coordinates,
        c.driver_accept_coordinates,
        c.customer_request_coordinates

      FROM trip_requests tr

      LEFT JOIN trip_request_coordinates c
        ON c.trip_request_id = tr.id

      WHERE
        (
          tr.customer_id = ?
          OR tr.driver_id = ?
        )

        AND tr.deleted_at IS NULL

      ORDER BY tr.created_at DESC
    `,
    [userId, userId]
  );

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows;
}

function createAccessToken(
  userId: number,
  decoded: JwtPayloadCustom
): string | null {
  const jwtSecret = cleanSecret(process.env.JWT_SECRET);

  if (!jwtSecret) {
    return null;
  }

  const email =
    typeof decoded.email === "string"
      ? decoded.email
      : undefined;

  const userType =
    typeof decoded.user_type === "string"
      ? decoded.user_type
      : undefined;

  return jwt.sign(
    {
      id: userId,
      user_type: userType,
      email,
    },
    jwtSecret,
    {
      expiresIn: "10d",
    }
  );
}

/**
 * GET /api/trips
 */
export async function GET(req: Request) {
  try {
    const jwtSecret = cleanSecret(process.env.JWT_SECRET);

    if (!jwtSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "JWT_SECRET não configurada no servidor.",
        },
        { status: 500 }
      );
    }

    const authenticated =
      await getAuthenticatedUser(req);

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Não autorizado",
          message: "Sessão ausente ou expirada.",
        },
        { status: 401 }
      );
    }

    const { userId, decoded } = authenticated;

    const trips = await loadTripsForUser(userId);

    const ultimasViagens = trips.slice(0, 5);

    const tokenId = toPositiveInt(decoded.id);

    const needsTokenRefresh = tokenId !== userId;

    const newToken = needsTokenRefresh
      ? createAccessToken(userId, decoded)
      : null;

    const response = NextResponse.json(
      {
        success: true,
        userId,
        trips,
        viagens: trips,
        totalViagens: trips.length,
        ultimasViagens,
      },
      { status: 200 }
    );

    if (newToken) {
      response.cookies.set(
        "access_token",
        newToken,
        authCookieOptions(60 * 60 * 24 * 10)
      );
    }

    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error: any) {
    console.error("❌ ERRO COMPLETO /api/trips:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar viagens.",
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido.",
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