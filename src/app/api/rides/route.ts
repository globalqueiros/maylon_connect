import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const { searchParams } = new URL(req.url);
    const days = searchParams.get("days");

    let query = `
      SELECT 
        id,
        pickup_address AS origem,
        dropoff_address AS destino,
        actual_fare AS valor,
        created_at AS data
      FROM trip_requests
      WHERE customer_id = ?
    `;

    const params: any[] = [decoded.id];

    if (days) {
      query += ` AND created_at >= NOW() - INTERVAL ? DAY`;
      params.push(Number(days));
    }

    query += ` ORDER BY created_at DESC`;

    const [rows]: any = await db.execute(query, params);

    return NextResponse.json(rows || []);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar corridas" },
      { status: 500 }
    );
  }
}