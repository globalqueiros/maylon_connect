import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { error: "ID do produto inválido" },
        { status: 400 }
      );
    }

    const [rows]: any = await db.query(
      `
      SELECT
        id,
        nome,
        descricao,
        categoria,
        imagem_principal,
        imagem_2,
        imagem_3,
        imagem_4,
        preco
      FROM produtos
      WHERE id = ?
      LIMIT 1
      `,
      [productId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);

    return NextResponse.json(
      { error: "Erro ao carregar produto" },
      { status: 500 }
    );
  }
}
