import { NextResponse } from "next/server";
import {
  centavos,
  confirmarRecarga,
  listarProdutos,
  listarProviders,
  resultadoIncerto,
  RvhubError,
  solicitarRecarga,
} from "../../../lib/rvhub/client";
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
 * Resolve o provider exato da RVHub a partir do que a tela enviou.
 * Aceita o nome exato ("VIVO", "CLARO") ou o id minúsculo ("vivo").
 * A lista de operadoras habilitadas vem da própria RVHub, então não
 * mantemos um mapa fixo: apenas casamos com o catálogo da conta.
 */
async function resolverProvider(valorRecebido: string): Promise<string | null> {
  const alvo = valorRecebido.trim().toLowerCase();
  if (!alvo) return null;
  const providers = await listarProviders();
  const cell = providers.filter((p) => p.kind === "cellphone");
  const exato = cell.find((p) => p.provider.toLowerCase() === alvo);
  return exato?.provider ?? null;
}

/**
 * POST /api/rvhub/recarga
 * Body: { telefone: "11987654321", valor: 20, provider: "VIVO" }
 * ("operadora": "vivo" também é aceito, por compatibilidade.)
 * Fluxo RVHub: solicita a recarga e, se autorizada, confirma (/capture).
 */
export async function POST(req: Request) {
  let transacaoId: number | null = null;
  try {
    const usuarioId = await usuarioLogadoId(req);
    if (!usuarioId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await readJsonBody(req);
    const telefone = String(body.telefone ?? "").replace(/\D/g, "");
    const valor = Number(body.valor);
    const operadoraRecebida = String(
      body.provider ?? body.operadora ?? ""
    ).trim();

    if (!/^\d{10,11}$/.test(telefone)) {
      return NextResponse.json(
        { error: "Telefone inválido. Use DDD + número." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    }

    const areaCode = telefone.slice(0, 2);
    const cellPhoneNumber = telefone.slice(2);

    // Descobre o provider exato a partir do catálogo da conta RVHub.
    const provider = await resolverProvider(operadoraRecebida);
    if (!provider) {
      return NextResponse.json(
        { error: "Operadora inválida ou não habilitada na conta." },
        { status: 400 }
      );
    }

    // Confere o valor com o portfólio antes de gastar saldo.
    const produtos = await listarProdutos({
      kind: "cellphone",
      areaCode,
      provider,
    });

    const valorCentavos = centavos(valor);
    const produto = produtos.find((p) => {
      if (p.fixed_amount) {
        return Number(p.amount) === valorCentavos;
      }
      const min = Number(p.minimum_amount ?? 0);
      const max = Number(p.maximum_amount ?? Number.MAX_SAFE_INTEGER);
      const inc = Number(p.incremental_rate || 0);
      if (valorCentavos < min || valorCentavos > max) return false;
      if (inc > 0 && (valorCentavos - min) % inc !== 0) return false;
      return true;
    });

    if (!produto) {
      return NextResponse.json(
        {
          error: `O valor de R$ ${valor.toFixed(2)} não é aceito pela ${provider} para este número.`,
        },
        { status: 400 }
      );
    }

    if (await existeDuplicada({ usuarioId, tipo: "recarga", telefone, valor })) {
      return NextResponse.json(
        { error: "Essa recarga acabou de ser feita. Confira o histórico." },
        { status: 409 }
      );
    }

    // Registra antes de chamar a RVHub: se algo cair no meio, fica rastro.
    transacaoId = await criarTransacao({
      usuarioId,
      tipo: "recarga",
      valor,
      telefone,
      operadora: produto.provider || provider,
      productId: produto.product_id,
    });

    const solicitacao = await solicitarRecarga({
      productId: produto.product_id,
      areaCode,
      cellPhoneNumber,
      amount: produto.fixed_amount ? undefined : valorCentavos,
    });

    // Negada pela operadora: nada é capturado.
    if (solicitacao.status === "denied") {
      await marcarEnviada(transacaoId, solicitacao.id, solicitacao.status, {
        statusReason: solicitacao.status_reason ?? null,
      });
      return NextResponse.json(
        {
          error: `Recarga não autorizada (${solicitacao.status_reason || "motivo não informado"}).`,
          transacao: { id: transacaoId, status: solicitacao.status },
        },
        { status: 400 }
      );
    }

    // Confirma a recarga (etapa obrigatória do RVHub).
    const confirmacao = await confirmarRecarga(solicitacao.id);

    await marcarEnviada(transacaoId, confirmacao.id, confirmacao.status, {
      statusReason: confirmacao.status_reason ?? null,
      authorizationCode:
        confirmacao.authorization_code != null
          ? String(confirmacao.authorization_code)
          : null,
      nsu: confirmacao.nsu ?? null,
    });

    return NextResponse.json({
      success: true,
      transacao: {
        id: transacaoId,
        status: confirmacao.status,
        valor,
        telefone,
        operadora: produto.provider || provider,
        authorizationCode: confirmacao.authorization_code ?? null,
        nsu: confirmacao.nsu ?? null,
        mensagem: confirmacao.message ?? null,
      },
    });
  } catch (error: any) {
    console.error("Erro na recarga de celular RVHub:", error);
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
            "A RVHub demorou pra responder e a recarga pode ter sido feita. Confira o histórico antes de tentar de novo.",
        },
        // 409 e não 5xx: a Cloudflare troca respostas 502/504 pela página dela.
        { status: 409 }
      );
    }
    const status = error instanceof RvhubError && error.status < 500 ? 400 : 500;
    return NextResponse.json(
      { error: error?.message || "Erro ao fazer a recarga" },
      { status }
    );
  }
}
