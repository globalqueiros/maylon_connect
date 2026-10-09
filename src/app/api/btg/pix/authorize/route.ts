import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { createPixAuthorization } from "../../../../lib/btg";
import {
  ensurePaymentColumns,
  findActiveOrPending,
  logPagamento,
  upsertPendente,
} from "../../../../lib/assinaturaDb";
import { makePedidoCodigo } from "../../../../lib/stripeServer";
import {
  getSessionUserId,
  pickBeneficioId,
  readJsonBody,
  toPositiveInt,
} from "../../../../lib/session";

export const dynamic = "force-dynamic";

function toAmount(value: unknown) {
  if (value == null || value === "") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(req: Request) {
  try {
    await ensurePaymentColumns();
    const body = await readJsonBody(req);
    const url = new URL(req.url);

    const usuario_id = await getSessionUserId(
      body.usuario_id ??
        body.usuarioId ??
        body.user_id ??
        url.searchParams.get("usuario_id"),
      req
    );

    const beneficioId =
      pickBeneficioId(body) ??
      toPositiveInt(url.searchParams.get("beneficio_id"));

    if (!usuario_id || !beneficioId) {
      console.error("PIX authorize missing ids", {
        usuario_id,
        beneficioId,
        body,
      });
      return NextResponse.json(
        {
          error: "Dados obrigatórios não enviados",
          details: {
            usuario_id: usuario_id ?? null,
            beneficio_id: beneficioId ?? null,
            received_keys: Object.keys(body),
            body,
          },
        },
        { status: 400 }
      );
    }

    const [beneficioRows]: any = await db.query(
      `SELECT id, titulo, valor, status FROM beneficios WHERE id = ? LIMIT 1`,
      [beneficioId]
    );
    const beneficio = beneficioRows?.[0];
    if (!beneficio || Number(beneficio.status) !== 1) {
      return NextResponse.json(
        { error: "Benefício não encontrado" },
        { status: 404 }
      );
    }

    const amount = toAmount(body.valor) ?? toAmount(beneficio.valor);
    if (!amount) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    const beneficioTitulo = String(
      body.titulo || beneficio.titulo || "Assinatura Maylon"
    );

    const existing = await findActiveOrPending(usuario_id, beneficioId);
    if (existing?.status_assinatura === "aprovado" && existing.ativo === 1) {
      return NextResponse.json(
        { error: "Já existe uma assinatura ativa para este benefício" },
        { status: 400 }
      );
    }

    const [userRows]: any = await db.query(
      `
      SELECT id, full_name, email, identification_number
      FROM users WHERE id = ? LIMIT 1
      `,
      [usuario_id]
    );
    const user = userRows?.[0];
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const taxId = String(user.identification_number || "").replace(/\D/g, "");
    if (!taxId) {
      return NextResponse.json(
        {
          error:
            "CPF/CNPJ do usuário é obrigatório para autorização Pix. Atualize o perfil.",
        },
        { status: 400 }
      );
    }

    const pedidoCodigo = makePedidoCodigo("MLP");
    const contract = `${pedidoCodigo}${beneficioId}`.slice(0, 35);

    const auth = await createPixAuthorization({
      contract,
      amount,
      debtorName: user.full_name || user.email || "Cliente",
      debtorTaxId: taxId,
      description: beneficioTitulo.slice(0, 35),
    });

    const emv = auth?.qrCodeInfo?.emv || auth?.emv || null;
    const authorizationId = auth?.authorizationId || auth?.id;

    if (!authorizationId || !emv) {
      console.error("BTG auth response unexpected:", auth);
      return NextResponse.json(
        { error: "BTG não retornou QR Code de autorização", details: auth },
        { status: 502 }
      );
    }

    const assinaturaId = await upsertPendente({
      usuarioId: usuario_id,
      beneficioId,
      metodo: "pix_btg",
      pedidoCodigo,
      valor: amount,
      extra: {
        pix_etapa: "autorizacao",
        btg_authorization_id: authorizationId,
        pix_emv: emv,
      },
    });

    await logPagamento({
      usuarioId: usuario_id,
      beneficioId,
      usuarioBeneficioId: assinaturaId,
      gateway: "btg",
      metodo: "pix",
      status: "autorizacao_pendente",
      amount,
      externalId: authorizationId,
      pedidoCodigo,
      payload: auth,
    });

    const isMock = Boolean(auth?.mock);
    return NextResponse.json({
      etapa: "autorizacao",
      pedido_codigo: pedidoCodigo,
      authorization_id: authorizationId,
      emv,
      qr_image: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(emv)}`,
      status: auth?.status || "CREATED",
      mock: isMock,
      message: isMock
        ? "Modo demonstração PIX (BTG_MOCK). Configure BTG_ACCOUNT_NUMBER e BTG_PIX_KEY no servidor para PIX real."
        : "Escaneie o QR Code para autorizar os débitos mensais automáticos via Pix.",
      usuario_id,
      beneficio_id: toPositiveInt(beneficio.id) ?? beneficioId,
    });
  } catch (error: any) {
    console.error("Erro Pix authorize:", error);
    return NextResponse.json(
      {
        error: error?.message || "Erro ao criar autorização Pix",
        details: error?.payload || null,
      },
      { status: error?.status || 500 }
    );
  }
}
