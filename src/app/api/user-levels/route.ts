import { NextResponse } from "next/server";
import { db  }from "../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rows] = await db.query(
      `
        SELECT
          id,
          sequence,
          name,
          reward_type,
          reward_amount,
          image,
          targeted_ride,
          targeted_ride_point,
          targeted_amount,
          targeted_amount_point,
          targeted_cancel,
          targeted_cancel_point,
          targeted_review,
          targeted_review_point,
          user_type,
          is_active,
          deleted_at,
          created_at,
          updated_at
        FROM user_levels
        WHERE user_type = ?
          AND is_active = 1
          AND deleted_at IS NULL
        ORDER BY sequence ASC
      `,
      ["driver"],
    );

    return NextResponse.json({
      success: true,
      user_type: "driver",
      total: Array.isArray(rows) ? rows.length : 0,
      data: rows,
    });
  } catch (error) {
    console.error("Erro ao buscar níveis dos motoristas:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar níveis dos motoristas.",
      },
      { status: 500 },
    );
  }
}