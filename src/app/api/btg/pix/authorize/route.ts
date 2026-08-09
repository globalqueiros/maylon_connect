import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../../../lib/db";
import { createPixAuthorization } from "../../../../lib/btg";
import {
  findActiveOrPending,
  logPagamento,
  upsertPendente,
} from "../../../../lib/assinaturaDb";
import { makePedidoCodigo } from "../../../../lib/stripeServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { beneficio_id, titulo, valor, usuario_id: bodyUserId } = body;

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    let usuario_id = Number(bodyUserId);

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET!
        ) as { id: number };
        usuario_id = Number(decoded.id);
      } catch {
        // keep body id
      }
    }

    if (!usuario_id || !beneficio_id || valor == null) {
      return NextResponse.json(
        { error: "Dados obrigatórios não enviados" },
        { status: 400 }
      );
    }

    const existing = await findActiveOrPending(usuario_id, Number(beneficio_id));
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
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
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

    const amount = Number(String(valor).replace(",", "."));
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    const pedidoCodigo = makePedidoCodigo("MLP");
    const contract = `${pedidoCodigo}${beneficio_id}`.slice(0, 35);

    const auth = await createPixAuthorization({
      contract,
      amount,
      debtorName: user.full_name || user.email || "Cliente",
      debtorTaxId: taxId,
      description: String(titulo || "Assinatura Maylon").slice(0, 35),
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
      beneficioId: Number(beneficio_id),
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
      beneficioId: Number(beneficio_id),
      usuarioBeneficioId: assinaturaId,
      gateway: "btg",
      metodo: "pix",
      status: "autorizacao_pendente",
      amount,
      externalId: authorizationId,
      pedidoCodigo,
      payload: auth,
    });

    return NextResponse.json({
      etapa: "autorizacao",
      pedido_codigo: pedidoCodigo,
      authorization_id: authorizationId,
      emv,
      qr_image: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(emv)}`,
      status: auth?.status || "CREATED",
      message:
        "Escaneie o QR Code para autorizar os débitos mensais automáticos via Pix.",
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
