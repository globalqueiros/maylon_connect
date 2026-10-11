import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      pedido,
      email,
      nome,
      valor,
      metodo,
      data,
      transaction_id,
      status,
    } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-mail não informado." },
        { status: 400 }
      );
    }

    const emailDestino = email.trim();

    if (!emailDestino) {
      return NextResponse.json(
        { error: "E-mail não informado." },
        { status: 400 }
      );
    }

    if (!process.env.SMTP_HOST) {
      console.error("SMTP_HOST não configurado.");
      return NextResponse.json(
        { error: "Servidor de e-mail não configurado." },
        { status: 500 }
      );
    }

    if (!process.env.SMTP_USER) {
      console.error("SMTP_USER não configurado.");
      return NextResponse.json(
        { error: "Conta de envio não configurada." },
        { status: 500 }
      );
    }

    if (!process.env.SMTP_PASS) {
      console.error("SMTP_PASS não configurado.");
      return NextResponse.json(
        { error: "Senha do servidor de e-mail não configurada." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `"Maylon" <${process.env.SMTP_USER}>`,
      to: emailDestino,
      subject: `Recibo da viagem #${pedido || "—"} - Maylon`,
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recibo Maylon</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#042f2e;
  font-family:Arial,Helvetica,sans-serif;
  color:#0f172a;
">

  <div style="padding:32px 14px;background:linear-gradient(135deg,#042f2e 0%,#115e59 55%,#0f766e 100%);">

    <div style="
      max-width:620px;
      margin:0 auto;
      background:#ffffff;
      border:1px solid #ccfbf1;
      border-radius:28px;
      overflow:hidden;
      box-shadow:0 24px 70px rgba(0,0,0,.30);
    ">

      <!-- Cabeçalho -->
      <div style="
        position:relative;
        padding:38px 28px 34px;
        text-align:center;
        background:linear-gradient(135deg,#0f766e,#0d9488,#14b8a6);
        color:#ffffff;
      ">

        <div style="
          display:inline-block;
          padding:10px 18px;
          border-radius:14px;
          background:rgba(255,255,255,.16);
          border:1px solid rgba(255,255,255,.25);
          color:#ffffff;
          font-size:18px;
          font-weight:800;
          letter-spacing:1px;
        ">
          MAYLON
        </div>

        <div style="
          width:64px;
          height:64px;
          margin:22px auto 14px;
          border-radius:20px;
          background:#ffffff;
          text-align:center;
          line-height:64px;
          font-size:32px;
          font-weight:bold;
          color:#0f766e;
        ">
          ✓
        </div>

        <h1 style="
          margin:0;
          font-size:26px;
          line-height:1.25;
          color:#ffffff;
        ">
          Pagamento Confirmado
        </h1>

        <p style="
          margin:10px 0 0;
          color:#ccfbf1;
          font-size:14px;
          line-height:1.6;
        ">
          Seu pagamento foi aprovado com sucesso.
        </p>
      </div>

      <!-- Cliente -->
      <div style="padding:28px 30px 22px;">

        <p style="
          margin:0 0 7px;
          color:#64748b;
          font-size:13px;
        ">
          Olá,
        </p>

        <p style="
          margin:0;
          font-size:19px;
          font-weight:800;
          color:#0f172a;
        ">
          ${nome || "Cliente"}
        </p>

        <p style="
          margin:6px 0 0;
          color:#64748b;
          font-size:14px;
        ">
          ${emailDestino}
        </p>
      </div>

      <!-- Dados do pagamento -->
      <div style="
        margin:0 30px;
        padding:22px;
        background:#f0fdfa;
        border:1px solid #ccfbf1;
        border-radius:22px;
      ">

        <div style="
          padding:0 0 14px;
          margin-bottom:14px;
          border-bottom:1px solid #ccfbf1;
        ">
          <span style="display:block;color:#64748b;font-size:12px;margin-bottom:5px;">
            Pedido
          </span>
          <strong style="font-size:16px;color:#0f172a;">
            #${pedido || "—"}
          </strong>
        </div>

        <div style="
          padding:0 0 14px;
          margin-bottom:14px;
          border-bottom:1px solid #ccfbf1;
        ">
          <span style="display:block;color:#64748b;font-size:12px;margin-bottom:5px;">
            Valor
          </span>
          <strong style="font-size:21px;color:#0f766e;">
            ${valor || "—"}
          </strong>
        </div>

        <div style="
          padding:0 0 14px;
          margin-bottom:14px;
          border-bottom:1px solid #ccfbf1;
        ">
          <span style="display:block;color:#64748b;font-size:12px;margin-bottom:5px;">
            Método de pagamento
          </span>
          <strong style="font-size:14px;color:#0f172a;">
            ${metodo || "—"}
          </strong>
        </div>

        <div style="
          padding:0 0 14px;
          margin-bottom:14px;
          border-bottom:1px solid #ccfbf1;
        ">
          <span style="display:block;color:#64748b;font-size:12px;margin-bottom:5px;">
            Data e hora
          </span>
          <strong style="font-size:14px;color:#0f172a;">
            ${data || "—"}
          </strong>
        </div>

        <div>
          <span style="display:block;color:#64748b;font-size:12px;margin-bottom:6px;">
            Status
          </span>

          <span style="
            display:inline-block;
            padding:7px 12px;
            border-radius:999px;
            background:#ccfbf1;
            color:#0f766e;
            font-size:12px;
            font-weight:800;
          ">
            ${status || "PAGO"}
          </span>
        </div>

      </div>

      <!-- Transação -->
      <div style="padding:28px 30px;">

        <div style="
          padding:18px;
          border:1px solid #e2e8f0;
          border-radius:18px;
          background:#ffffff;
        ">

          <p style="
            margin:0 0 7px;
            color:#64748b;
            font-size:12px;
            font-weight:700;
            text-transform:uppercase;
            letter-spacing:.5px;
          ">
            ID da transação
          </p>

          <p style="
            margin:0;
            color:#334155;
            font-size:12px;
            line-height:1.6;
            word-break:break-all;
          ">
            ${transaction_id || pedido || "—"}
          </p>

        </div>
      </div>

      <!-- Segurança -->
      <div style="
        margin:0 30px 28px;
        padding:16px 18px;
        border-radius:18px;
        background:#f8fafc;
        border:1px solid #e2e8f0;
      ">
        <p style="
          margin:0;
          color:#475569;
          font-size:12px;
          line-height:1.6;
          text-align:center;
        ">
          ✓ Pagamento processado com segurança pela Maylon.
        </p>
      </div>

      <!-- Rodapé -->
      <div style="
        padding:24px 28px;
        background:#042f2e;
        text-align:center;
      ">

        <p style="
          margin:0;
          color:#99f6e4;
          font-size:12px;
          line-height:1.7;
        ">
          Este é um e-mail automático enviado pela Maylon.
          <br />
          Não responda diretamente a esta mensagem.
        </p>

        <p style="
          margin:12px 0 0;
          color:#5eead4;
          font-size:11px;
        ">
          © ${new Date().getFullYear()} Maylon
        </p>

      </div>

    </div>
  </div>

</body>
</html>
      `,
    });

    console.log(`Recibo enviado com sucesso para ${emailDestino}`);

    return NextResponse.json({
      success: true,
      email: emailDestino,
      message: "Recibo enviado com sucesso.",
    });
  } catch (error) {
    console.error("ERRO AO ENVIAR RECIBO:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao enviar o recibo por e-mail.",
      },
      { status: 500 }
    );
  }
}
