import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

function getDataSP() {
  const data = new Date();
  const sp = new Date(
    data.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  const yyyy = sp.getFullYear();
  const mm = String(sp.getMonth() + 1).padStart(2, "0");
  const dd = String(sp.getDate()).padStart(2, "0");
  const hh = String(sp.getHours()).padStart(2, "0");
  const min = String(sp.getMinutes()).padStart(2, "0");
  const ss = String(sp.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

async function getUserFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    return decoded;
  } catch {
    return null;
  }
} 

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }
    const { nome, email, assunto, mensagem, codigo } = await req.json();
    const codigoFinal = codigo || `PRT-${Date.now()}`;
    const dataSP = getDataSP();
    await db.query(
      `INSERT INTO protocolos 
      (usuario_id, codigo, nome, email, assunto, mensagem, criado_em, status)  
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        codigoFinal,
        nome,
        email,
        assunto,
        mensagem,
        dataSP,
        "Aberto",
      ]
    );
    return NextResponse.json({
      codigo: codigoFinal,
      criado_em: dataSP,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar protocolo" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }
    const [rows]: any = await db.query(
      `SELECT id, codigo, assunto, status, criado_em 
       FROM protocolos 
       WHERE usuario_id = ? 
       ORDER BY criado_em DESC`,
      [user.id]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar protocolos" },
      { status: 500 }
    );
  }
}