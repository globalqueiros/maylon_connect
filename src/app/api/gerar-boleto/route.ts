import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cria boleto na BTG em nome da Maylon. É uma rota interna (usada pelo job de
 * cobrança recorrente): exige o cabeçalho x-internal-token igual ao
 * INTERNAL_API_TOKEN do .env. Antes qualquer pessoa conseguia gerar boleto
 * real com qualquer pagador, valor e descrição.
 */
function autorizado(req: Request) {
  const esperado = process.env.INTERNAL_API_TOKEN?.trim();
  if (!esperado) return false;
  const recebido = req.headers.get("x-internal-token") || "";
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!process.env.INTERNAL_API_TOKEN?.trim()) {
    console.error("[gerar-boleto] INTERNAL_API_TOKEN não configurado: rota bloqueada.");
    return NextResponse.json({ error: "Rota indisponível" }, { status: 503 });
  }
  if (!autorizado(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const response = await fetch(
    "https://api.btgpactual.com/cobranca/v1/boletos",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.BTG_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pagador: {
          nome: body.nome,
          cpfCnpj: body.cpf,
        },
        valor: body.valor,
        vencimento: body.vencimento,
        descricao: body.descricao,
      }),
    }
  );

  const data = await response.json();

  return NextResponse.json(data);
}
