import { NextResponse } from "next/server";
import { getAssinaturaById, getBeneficio } from "../../../lib/assinaturas";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assinaturaId = searchParams.get("assinatura_id");

    if (!assinaturaId) {
      return NextResponse.json(
        { error: "assinatura_id é obrigatório" },
        { status: 400 }
      );
    }

    const assinatura = await getAssinaturaById(Number(assinaturaId));
    if (!assinatura) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    const beneficio = await getBeneficio(assinatura.beneficio_id);

    return NextResponse.json({
      assinaturaId: assinatura.id,
      status: assinatura.status_assinatura,
      stage: assinatura.pix_stage,
      metodo: assinatura.metodo_pagamento,
      ativo: !!assinatura.ativo,
      authorizationId: assinatura.btg_authorization_id,
      txId: assinatura.btg_tx_id,
      emv: assinatura.btg_emv,
      qrUrl: assinatura.btg_qr_url,
      valor: Number(beneficio?.valor || 0),
      titulo: beneficio?.titulo || null,
      canChargeFirstMonth:
        assinatura.pix_stage === "autorizacao_aprovada" ||
        assinatura.status_assinatura === "aguardando_pagamento",
      approved: assinatura.status_assinatura === "aprovado",
      rejected: ["recusado", "erro", "cancelado", "expirado"].includes(
        assinatura.status_assinatura
      ),
    });
  } catch (error: any) {
    console.error("ERRO PIX STATUS:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao consultar status Pix" },
      { status: 500 }
    );
  }
}
