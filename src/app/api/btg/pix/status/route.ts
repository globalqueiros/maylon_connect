import { NextResponse } from "next/server";
import {
  createPixInstantCharge,
  getPixAuthorization,
  getPixInstantCharge,
} from "../../../../lib/btg";
import {
  findByAuthorizationId,
  findByPedido,
  findByTxId,
  logPagamento,
  updateAssinaturaById,
} from "../../../../lib/assinaturaDb";
import { db } from "../../../../lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pedido = searchParams.get("pedido");
    const authorizationId = searchParams.get("authorization_id");
    const txId = searchParams.get("txid");

    let row =
      (pedido && (await findByPedido(pedido))) ||
      (authorizationId && (await findByAuthorizationId(authorizationId))) ||
      (txId && (await findByTxId(txId))) ||
      null;

    if (!row) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    // Step 1: wait authorization approval
    if (
      row.pix_etapa === "autorizacao" &&
      row.btg_authorization_id &&
      row.status_assinatura !== "aprovado"
    ) {
      const auth = await getPixAuthorization(row.btg_authorization_id);
      const status = String(auth?.status || "").toUpperCase();

      if (status === "APPROVED") {
        await updateAssinaturaById(row.id, {
          status_assinatura: "autorizado",
          pix_etapa: "autorizado",
        });

        // Auto-create first month charge (QR 2)
        const [userRows]: any = await db.query(
          `SELECT full_name, identification_number FROM users WHERE id = ? LIMIT 1`,
          [row.usuario_id]
        );
        const user = userRows?.[0];
        const amount = Number(row.valor_cobrado || 0);

        const charge = await createPixInstantCharge({
          amount,
          displayText: `1ª mensalidade ${row.pedido_codigo}`,
          payerName: user?.full_name || "Cliente",
          payerTaxId: String(user?.identification_number || ""),
          tags: {
            pedido: String(row.pedido_codigo || ""),
            usuario_id: String(row.usuario_id),
            beneficio_id: String(row.beneficio_id),
          },
        });

        const emv = charge?.emv;
        const chargeTxId = charge?.txId || charge?.id;

        await updateAssinaturaById(row.id, {
          pix_etapa: "pagamento",
          btg_txid: chargeTxId,
          btg_charge_id: charge?.id || null,
          pix_emv: emv,
          status_assinatura: "pendente",
        });

        await logPagamento({
          usuarioId: row.usuario_id,
          beneficioId: row.beneficio_id,
          usuarioBeneficioId: row.id,
          gateway: "btg",
          metodo: "pix",
          status: "primeira_mensalidade_criada",
          amount,
          externalId: chargeTxId,
          pedidoCodigo: row.pedido_codigo || undefined,
          payload: charge,
        });

        return NextResponse.json({
          etapa: "pagamento",
          status: "AUTHORIZED",
          pedido_codigo: row.pedido_codigo,
          authorization_id: row.btg_authorization_id,
          txid: chargeTxId,
          emv,
          qr_image: emv
            ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(emv)}`
            : null,
          message:
            "Autorização aprovada. Agora pague a primeira mensalidade com o QR Code abaixo.",
        });
      }

      if (["REJECTED", "CANCELED", "EXPIRED", "CANCELING"].includes(status)) {
        await updateAssinaturaById(row.id, {
          status_assinatura: "erro",
          ativo: 0,
          pix_etapa: "recusado",
        });
        return NextResponse.json({
          etapa: "autorizacao",
          status,
          rejected: true,
          pedido_codigo: row.pedido_codigo,
          message: "Autorização Pix recusada ou expirada.",
        });
      }

      return NextResponse.json({
        etapa: "autorizacao",
        status: status || "PENDING",
        pedido_codigo: row.pedido_codigo,
        authorization_id: row.btg_authorization_id,
        emv: row.pix_emv,
        qr_image: row.pix_emv
          ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(row.pix_emv)}`
          : null,
        message: "Aguardando autorização do Pix Automático...",
      });
    }

    // Step 2: wait first payment
    if (row.pix_etapa === "pagamento" && row.btg_txid) {
      let paid = false;
      let remoteStatus = "PENDING";

      try {
        const charge = await getPixInstantCharge(row.btg_txid);
        remoteStatus = String(charge?.status || "").toUpperCase();
        paid = ["PAID", "CONCLUIDA", "COMPLETED"].includes(remoteStatus);
      } catch (err) {
        console.warn("Falha ao consultar cobrança Pix:", err);
      }

      if (paid || row.status_assinatura === "aprovado") {
        await updateAssinaturaById(row.id, {
          ativo: 1,
          status_assinatura: "aprovado",
          pix_etapa: "pago",
        });

        return NextResponse.json({
          etapa: "pago",
          status: "PAID",
          paid: true,
          pedido_codigo: row.pedido_codigo,
          valor: row.valor_cobrado,
          message: "Pagamento da primeira mensalidade confirmado.",
        });
      }

      return NextResponse.json({
        etapa: "pagamento",
        status: remoteStatus,
        pedido_codigo: row.pedido_codigo,
        txid: row.btg_txid,
        emv: row.pix_emv,
        qr_image: row.pix_emv
          ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(row.pix_emv)}`
          : null,
        message: "Aguardando pagamento da primeira mensalidade...",
      });
    }

    if (row.status_assinatura === "aprovado" && row.ativo === 1) {
      return NextResponse.json({
        etapa: "pago",
        status: "PAID",
        paid: true,
        pedido_codigo: row.pedido_codigo,
        valor: row.valor_cobrado,
      });
    }

    return NextResponse.json({
      etapa: row.pix_etapa || "pendente",
      status: row.status_assinatura,
      pedido_codigo: row.pedido_codigo,
      emv: row.pix_emv,
      qr_image: row.pix_emv
        ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(row.pix_emv)}`
        : null,
    });
  } catch (error: any) {
    console.error("Erro Pix status:", error);
    return NextResponse.json(
      {
        error: error?.message || "Erro ao consultar status Pix",
        details: error?.payload || null,
      },
      { status: error?.status || 500 }
    );
  }
}
