import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { carro_id, nome, telefone, email, mensagem } = body;

    if (!carro_id) {
      return NextResponse.json(
        { error: "Veículo não informado." },
        { status: 400 }
      );
    }

    if (!nome?.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório." },
        { status: 400 }
      );
    }

    if (!telefone?.trim()) {
      return NextResponse.json(
        { error: "Telefone é obrigatório." },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "E-mail é obrigatório." },
        { status: 400 }
      );
    }

    const idCarro = Number(carro_id);

    if (!Number.isInteger(idCarro) || idCarro <= 0) {
      return NextResponse.json(
        { error: "Veículo inválido." },
        { status: 400 }
      );
    }

    const [carRows] = await db.execute(
      `
        SELECT id
        FROM carros
        WHERE id = ?
        LIMIT 1
      `,
      [idCarro]
    );

    const cars = carRows as { id: number }[];

    if (cars.length === 0) {
      return NextResponse.json(
        { error: "Veículo não encontrado." },
        { status: 404 }
      );
    }

    await db.execute(
      `
        INSERT INTO interesses (
          carro_id,
          nome,
          telefone,
          email,
          mensagem
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        idCarro,
        nome.trim(),
        telefone.trim(),
        email.trim(),
        mensagem?.trim() || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Interesse cadastrado com sucesso.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao cadastrar interesse:", error);

    return NextResponse.json(
      { error: "Erro ao salvar seu interesse." },
      { status: 500 }
    );
  }
}