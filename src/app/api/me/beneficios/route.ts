import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded: any = jwt.verify(token!, process.env.JWT_SECRET!);

    const [rows]: any = await db.query(
      "SELECT beneficio_id, ativo FROM usuario_beneficios WHERE usuario_id = ?",
      [decoded.id]
    );

    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: "Erro ao buscar benefícios" }, { status: 401 });
  }
}