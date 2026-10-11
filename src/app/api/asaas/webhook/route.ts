import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { atualizarStatusPorAsaasId } from "../../../lib/asaas/transacoes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function tokenValido(recebido: string, esperado: string) {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * POST /api/asaas/webhook
 * Cadastrar na Asaas (Integrações > Webhooks) com o mesmo token de
 * ASAAS_WEBHOOK_TOKEN, marcando os eventos de Recarga de celular e
 * Pagamento de contas. Atualiza o status no histórico.
 */
export async function POST(req: Request) {
  // Sem token configurado, recusa tudo: senão qualquer um marca operação como paga.
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN?.trim();
  if (!esperado) {
    console.error("ASAAS_WEBHOOK_TOKEN não configurado");
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 500 });
  }
  const recebido = req.headers.get("asaas-access-token") || "";
  if (!tokenValido(recebido, esperado)) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const evento = String(payload?.event || "");
    const objeto = payload?.mobilePhoneRecharge || payload?.bill;

    if (objeto?.id && objeto?.status) {
      const alteradas = await atualizarStatusPorAsaasId(
        String(objeto.id),
        String(objeto.status),
        objeto.failReasons ? String(objeto.failReasons) : null
      );
      console.log(`Asaas webhook ${evento}: ${objeto.id} -> ${objeto.status} (${alteradas})`);
    }

    // Sempre 200 para eventos que não são nossos: a Asaas pausa a fila
    // de webhooks quando recebe erros seguidos.
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Erro webhook Asaas:", error);
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }
}
