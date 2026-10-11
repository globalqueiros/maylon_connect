import { NextResponse } from "next/server";
import {
  findActiveOrPending,
  getBeneficio,
  getUsuario,
  upsertPendingAssinatura,
  updateAssinaturaById,
} from "../../../lib/assinaturas";
import {
  buildPixContractId,
  createPixAuthorization,
} from "../../../lib/btg";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { usuario_id, beneficio_id } = body;

    if (!usuario_id || !beneficio_id) {
      return NextResponse.json(
        { error: "Dados obrigatórios não enviados" },
        { status: 400 }
      );
    }

    const usuario = await getUsuario(Number(usuario_id));
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const beneficio = await getBeneficio(Number(beneficio_id));
    if (!beneficio) {
      return NextResponse.json(
        { error: "Benefício não encontrado" },
        { status: 404 }
      );
    }

    const taxId = String(usuario.identification_number || "").replace(
      /\D/g,
      ""
    );
    if (!taxId) {
      return NextResponse.json(
        {
          error:
            "CPF/CNPJ do usuário é obrigatório para autorização Pix. Atualize o perfil.",
        },
        { status: 400 }
      );
    }

    const existing = await findActiveOrPending(
      Number(usuario_id),
      Number(beneficio_id)
    );

    if (existing?.status_assinatura === "aprovado") {
      return NextResponse.json(
        { error: "Já existe uma assinatura aprovada para este benefício" },
        { status: 400 }
      );
    }

    // Retoma autorização pendente se ainda houver QR
    if (
      existing &&
      existing.metodo_pagamento === "pix_btg" &&
      existing.status_assinatura === "aguardando_autorizacao" &&
      (existing.btg_emv || existing.btg_qr_url)
    ) {
      return NextResponse.json({
        assinaturaId: existing.id,
        stage: "autorizacao",
        authorizationId: existing.btg_authorization_id,
        emv: existing.btg_emv,
        qrUrl: existing.btg_qr_url,
        valor: Number(beneficio.valor),
        titulo: beneficio.titulo,
      });
    }

    const contract = buildPixContractId(
      Number(usuario_id),
      Number(beneficio_id)
    );

    const auth = await createPixAuthorization({
      contract,
      debtorName: usuario.full_name || "Cliente Maylon",
      debtorTaxId: taxId,
      amount: Number(beneficio.valor),
      description: String(beneficio.titulo || "Assinatura Maylon").slice(0, 35),
    });

    const emv = auth?.qrCodeInfo?.emv || auth?.emv || null;
    const qrUrl =
      auth?.location?.url ||
      auth?.qrCodeInfo?.url ||
      auth?.location?.path ||
      null;

    const assinaturaId = await upsertPendingAssinatura({
      usuarioId: Number(usuario_id),
      beneficioId: Number(beneficio_id),
      metodo: "pix_btg",
      status: "aguardando_autorizacao",
      extras: {
        btg_authorization_id: auth.authorizationId || auth.id || null,
        btg_contract: contract,
        btg_emv: emv,
        btg_qr_url: qrUrl,
        pix_stage: "autorizacao",
      },
    });

    await updateAssinaturaById(assinaturaId, {
      btg_authorization_id: auth.authorizationId || auth.id || null,
      btg_contract: contract,
      btg_emv: emv,
      btg_qr_url: qrUrl,
      pix_stage: "autorizacao",
      status_assinatura: "aguardando_autorizacao",
    });

    return NextResponse.json({
      assinaturaId,
      stage: "autorizacao",
      authorizationId: auth.authorizationId || auth.id,
      status: auth.status,
      emv,
      qrUrl,
      valor: Number(beneficio.valor),
      titulo: beneficio.titulo,
    });
  } catch (error: any) {
    console.error("ERRO PIX AUTHORIZE:", error);
    return NextResponse.json(
      {
        error: error?.message || "Erro ao criar autorização Pix",
        details: error?.data || null,
      },
      { status: 500 }
    );
  }
}
