import { NextResponse } from "next/server";
import {
  getAssinaturaById,
  getBeneficio,
  getUsuario,
  updateAssinaturaById,
} from "../../../lib/assinaturas";
import { createPixInstantCollection } from "../../../lib/btg";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assinatura_id } = body;

    if (!assinatura_id) {
      return NextResponse.json(
        { error: "assinatura_id é obrigatório" },
        { status: 400 }
      );
    }

    const assinatura = await getAssinaturaById(Number(assinatura_id));
    if (!assinatura) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    if (assinatura.metodo_pagamento !== "pix_btg") {
      return NextResponse.json(
        { error: "Assinatura não é Pix" },
        { status: 400 }
      );
    }

    const authorized =
      assinatura.pix_stage === "autorizacao_aprovada" ||
      assinatura.status_assinatura === "aguardando_pagamento";

    if (!authorized) {
      return NextResponse.json(
        { error: "Aguarde a aprovação da autorização Pix" },
        { status: 400 }
      );
    }

    const beneficio = await getBeneficio(assinatura.beneficio_id);
    if (!beneficio) {
      return NextResponse.json(
        { error: "Benefício não encontrado" },
        { status: 404 }
      );
    }

    if (
      assinatura.pix_stage === "primeira_mensalidade" &&
      assinatura.status_assinatura === "aguardando_pagamento" &&
      (assinatura.btg_emv || assinatura.btg_qr_url)
    ) {
      return NextResponse.json({
        assinaturaId: assinatura.id,
        stage: "primeira_mensalidade",
        txId: assinatura.btg_tx_id,
        emv: assinatura.btg_emv,
        qrUrl: assinatura.btg_qr_url,
        valor: Number(beneficio.valor),
        titulo: beneficio.titulo,
      });
    }

    const usuario = await getUsuario(assinatura.usuario_id);

    const collection = await createPixInstantCollection({
      amount: Number(beneficio.valor),
      displayText: `1a mensalidade - ${beneficio.titulo}`.slice(0, 140),
      payerName: usuario?.full_name,
      payerTaxId: usuario?.identification_number,
      tags: {
        assinatura_id: String(assinatura.id),
        usuario_id: String(assinatura.usuario_id),
        beneficio_id: String(assinatura.beneficio_id),
        stage: "primeira_mensalidade",
      },
    });

    const emv = collection.emv || null;
    const qrUrl = collection.location?.url || null;
    const txId = collection.txId || collection.id || null;

    await updateAssinaturaById(assinatura.id, {
      status_assinatura: "aguardando_pagamento",
      pix_stage: "primeira_mensalidade",
      btg_tx_id: txId,
      btg_emv: emv,
      btg_qr_url: qrUrl,
      ativo: 0,
    });

    return NextResponse.json({
      assinaturaId: assinatura.id,
      stage: "primeira_mensalidade",
      txId,
      emv,
      qrUrl,
      valor: Number(beneficio.valor),
      titulo: beneficio.titulo,
      status: collection.status,
    });
  } catch (error: any) {
    console.error("ERRO PIX CHARGE:", error);
    return NextResponse.json(
      {
        error: error?.message || "Erro ao criar cobrança Pix",
        details: error?.data || null,
      },
      { status: 500 }
    );
  }
}
