import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "../../lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

type ItemCarrinho = {
  id?: unknown;
  quantidade?: unknown;
};

function paraNumero(value: unknown): number {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/**
 * O total é calculado no servidor com o preço da tabela produtos.
 * O "preco" enviado no carrinho pelo navegador/app é ignorado
 * (antes dava pra pagar qualquer valor). A quantidade de cada item
 * agora entra no total, como a tela de checkout já mostra.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const carrinho: ItemCarrinho[] = Array.isArray(body?.carrinho)
      ? body.carrinho
      : [];

    const itens = carrinho
      .map((item) => ({
        id: Math.trunc(paraNumero(item?.id)),
        quantidade: Math.min(99, Math.max(1, Math.trunc(paraNumero(item?.quantidade)) || 1)),
      }))
      .filter((item) => item.id > 0);

    if (!itens.length) {
      return NextResponse.json(
        { success: false, error: "Carrinho vazio.", message: "Carrinho vazio." },
        { status: 400 }
      );
    }

    const ids = [...new Set(itens.map((item) => item.id))];
    const [rows]: any = await db.query(
      `SELECT id, preco FROM produtos WHERE id IN (?)`,
      [ids]
    );
    const precoPorId = new Map<number, number>(
      (rows as Array<{ id: number; preco: unknown }>).map((p) => [
        Number(p.id),
        paraNumero(p.preco),
      ])
    );

    // Produto que não existe mais no catálogo não é cobrado.
    const total = itens.reduce((acc, item) => {
      const preco = precoPorId.get(item.id) ?? 0;
      return preco > 0 ? acc + preco * item.quantidade : acc;
    }, 0);

    const amount = Math.round(total * 100);
    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Produtos não encontrados.",
          message: "Os produtos do carrinho não estão mais disponíveis.",
        },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "brl",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Erro no checkout da loja:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao iniciar o pagamento.",
        message: "Não foi possível iniciar o pagamento.",
      },
      { status: 500 }
    );
  }
}
