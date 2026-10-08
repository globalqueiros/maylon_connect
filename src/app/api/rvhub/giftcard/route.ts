import { NextResponse } from "next/server";
import {
  centavos,
  confirmarPin,
  listarProdutos,
  reais,
  resultadoIncerto,
  RvhubError,
  solicitarPin,
} from "../../../lib/rvhub/client";
import { resolverPinProvider } from "../../../lib/rvhub/giftcard";
import {
  criarTransacao,
  existeDuplicada,
  marcarEnviada,
  marcarErro,
  usuarioLogadoId,
} from "../../../lib/rvhub/transacoes";
import { readJsonBody } from "../../../lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/rvhub/giftcard
 * Body: { operadora: "NETFLIX", productId: "100040", valor?: 25 }
 * ("provider" também é aceito no lugar de "operadora".)
 *
 * Flow RVHub (PIN): solicita a recarga e, se autorizada, confirma (/capture).
 * O valor sai do saldo pré-pago da conta RVHub (sem checar a carteira).
 */
export async function POST(req: Request) {
  let transacaoId: number | null = null;
  try {
    const usuarioId = await usuarioLogadoId(req);
    if (!usuarioId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await readJsonBody(req);
    const operadoraRecebida = String(
      body.operadora ?? body.provider ?? ""
    ).trim();
    const productId = String(body.productId ?? body.product_id ?? "").trim();
    const valorInformado = Number(body.valor);

    if (!productId) {
      return NextResponse.json(
        { error: "Produto do gift card não informado." },
        { status: 400 }
      );
    }

    const provider = await resolverPinProvider(operadoraRecebida);
    if (!provider) {
      return NextResponse.json(
        { error: "Gift card inválido ou não habilitado na conta." },
        { status: 400 }
      );
    }

    const produtos = await listarProdutos({ kind: "pin", provider });
    const produto = produtos.find((p) => p.product_id === productId);
    if (!produto) {
      return NextResponse.json(
        { error: "Produto não encontrado para este gift card." },
        { status: 400 }
      );
    }

    // Produto fixo: valor vem do catálogo. Variável: confere a faixa.
    let valorCentavos: number;
    if (produto.fixed_amount) {
      valorCentavos = Number(produto.amount);
    } else {
      if (!Number.isFinite(valorInformado) || valorInformado <= 0) {
        return NextResponse.json(
          { error: "Informe um valor válido para este gift card." },
          { status: 400 }
        );
      }
      valorCentavos = centavos(valorInformado);
      const min = Number(produto.minimum_amount ?? 0);
      const max = Number(produto.maximum_amount ?? Number.MAX_SAFE_INTEGER);
      const inc = Number(produto.incremental_rate || 0);
      const foraDaFaixa = valorCentavos < min || valorCentavos > max;
      const incrementoInvalido =
        inc > 0 && (valorCentavos - min) % inc !== 0;
      if (foraDaFaixa || incrementoInvalido) {
        return NextResponse.json(
          {
            error: `O valor de R$ ${valorInformado.toFixed(2)} não é aceito pela ${provider}.`,
          },
          { status: 400 }
        );
      }
    }

    const valor = reais(valorCentavos);

    if (
      await existeDuplicada({
        usuarioId,
        tipo: "giftcard",
        operadora: provider,
        valor,
      })
    ) {
      return NextResponse.json(
        { error: "Essa compra acabou de ser feita. Confira o histórico." },
        { status: 409 }
      );
    }

    // Registra antes de chamar a RVHub: se algo cair no meio, fica rastro.
    transacaoId = await criarTransacao({
      usuarioId,
      tipo: "giftcard",
      valor,
      operadora: produto.provider || provider,
      productId: produto.product_id,
    });

    const solicitacao = await solicitarPin({
      productId: produto.product_id,
      amount: produto.fixed_amount ? undefined : valorCentavos,
    });

    // Negada pela operadora: nada é capturado.
    if (solicitacao.status === "denied") {
      await marcarEnviada(transacaoId, solicitacao.id, solicitacao.status, {
        statusReason: solicitacao.status_reason ?? null,
      });
      return NextResponse.json(
        {
          error: `Compra não autorizada (${solicitacao.status_reason || "motivo não informado"}).`,
          transacao: { id: transacaoId, status: solicitacao.status },
        },
        { status: 400 }
      );
    }

    // Confirma a compra (etapa obrigatória do RVHub).
    const confirmacao = await confirmarPin(solicitacao.id);

    await marcarEnviada(transacaoId, confirmacao.id, confirmacao.status, {
      statusReason: confirmacao.status_reason ?? null,
      authorizationCode:
        confirmacao.authorization_code != null
          ? String(confirmacao.authorization_code)
          : null,
      pin: confirmacao.pin ?? solicitacao.pin ?? null,
    });

    return NextResponse.json({
      success: true,
      transacao: {
        id: transacaoId,
        status: confirmacao.status,
        valor,
        operadora: produto.provider || provider,
        pin: confirmacao.pin ?? solicitacao.pin ?? null,
        authorizationCode: confirmacao.authorization_code ?? null,
        mensagem: confirmacao.message ?? null,
      },
    });
  } catch (error: any) {
    console.error("Erro na compra de gift card RVHub:", error);
    if (transacaoId) {
      await marcarErro(
        transacaoId,
        error?.message || "Erro desconhecido",
        resultadoIncerto(error) ? "VERIFICAR" : "ERRO"
      ).catch(() => {});
    }
    if (transacaoId && resultadoIncerto(error)) {
      return NextResponse.json(
        {
          error:
            "A RVHub demorou pra responder e a compra pode ter sido feita. Confira o histórico antes de tentar de novo.",
        },
        // 409 e não 5xx: a Cloudflare troca respostas 502/504 pela página dela.
        { status: 409 }
      );
    }
    const status = error instanceof RvhubError && error.status < 500 ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Erro ao comprar o gift card" },
      { status }
    );
  }
}
