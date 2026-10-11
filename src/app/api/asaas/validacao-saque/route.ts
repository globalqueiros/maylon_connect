import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  buscarPorAsaasId,
  TipoTransacao,
  vincularPendente,
} from "../../../lib/asaas/transacoes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/asaas/validacao-saque
 *
 * Aprovação automática de recargas e contas, no lugar do SMS/token no painel.
 * Ativar na Asaas: Menu do usuário > Integrações > Mecanismos de segurança >
 * Validação de saque via webhook, com esta URL e o token ASAAS_VALIDACAO_TOKEN.
 *
 * A Asaas chama esta rota uns 5 segundos depois de criar a operação.
 * Só aprovamos o que foi criado pelo app (está no histórico com o mesmo valor).
 * Qualquer outra coisa é recusada: assim, mesmo com a chave vazada, ninguém
 * gasta o saldo por fora do app. Se esta rota falhar 3 vezes, a Asaas cancela.
 */

type Resposta = { status: "APPROVED" | "REFUSED"; refuseReason?: string };

function tokenValido(recebido: string, esperado: string) {
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

function recusar(motivo: string) {
  console.warn("Asaas validação de saque RECUSADA:", motivo);
  return NextResponse.json<Resposta>({ status: "REFUSED", refuseReason: motivo });
}

export async function POST(req: Request) {
  const esperado = (
    process.env.ASAAS_VALIDACAO_TOKEN || process.env.ASAAS_WEBHOOK_TOKEN
  )?.trim();
  if (!esperado) {
    console.error("ASAAS_VALIDACAO_TOKEN não configurado");
    return NextResponse.json({ error: "Validação não configurada" }, { status: 500 });
  }
  if (!tokenValido(req.headers.get("asaas-access-token") || "", esperado)) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const tipoAsaas = String(payload?.type || "");

    let tipo: TipoTransacao;
    let objeto: any;
    if (tipoAsaas === "MOBILE_PHONE_RECHARGE") {
      tipo = "recarga";
      objeto = payload.mobilePhoneRecharge;
    } else if (tipoAsaas === "BILL") {
      tipo = "conta";
      objeto = payload.bill;
    } else {
      // Transferências, Pix etc. não passam por este app.
      if (process.env.ASAAS_VALIDACAO_OUTROS === "aprovar") {
        console.log("Asaas validação de saque: aprovado (outro tipo)", tipoAsaas);
        return NextResponse.json<Resposta>({ status: "APPROVED" });
      }
      return recusar(`Operação ${tipoAsaas || "desconhecida"} não foi criada pelo app.`);
    }

    if (!objeto?.id) return recusar("Payload sem id da operação.");
    const valor = Number(objeto.value);

    let transacao = await buscarPorAsaasId(String(objeto.id));
    if (!transacao) {
      transacao = await vincularPendente({
        asaasId: String(objeto.id),
        status: String(objeto.status || "PENDING"),
        tipo,
        valor,
        telefone: String(objeto.phoneNumber || "").replace(/\D/g, ""),
        linhaDigitavel: String(objeto.identificationField || "").replace(/\D/g, ""),
      });
    }

    if (!transacao || transacao.tipo !== tipo) {
      return recusar("Operação não encontrada no histórico do app.");
    }
    if (Math.abs(Number(transacao.valor) - valor) > 0.009) {
      return recusar("Valor diferente do registrado no app.");
    }
    if (["ERRO", "CANCELLED", "FAILED", "REFUNDED"].includes(transacao.status)) {
      return recusar(`Operação está com status ${transacao.status} no app.`);
    }

    console.log("Asaas validação de saque APROVADA:", tipoAsaas, objeto.id);
    return NextResponse.json<Resposta>({ status: "APPROVED" });
  } catch (error: any) {
    // Erro 500 faz a Asaas tentar de novo (até 3 vezes) antes de cancelar.
    console.error("Erro na validação de saque Asaas:", error);
    return NextResponse.json({ error: "Erro ao validar" }, { status: 500 });
  }
}
