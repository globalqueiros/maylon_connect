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

          <body
            style="
              margin: 0;
              padding: 0;
              background: #f4f7f9;
              font-family: Arial, Helvetica, sans-serif;
              color: #1f2937;
            "
          >
            <div style="padding: 40px 20px;">
              <div
                style="
                  max-width: 600px;
                  margin: 0 auto;
                  background: #ffffff;
                  border-radius: 18px;
                  overflow: hidden;
                  border: 1px solid #e5e7eb;
                "
              >

                <!-- Cabeçalho -->
                <div
                  style="
                    padding: 32px;
                    text-align: center;
                    border-bottom: 1px solid #e5e7eb;
                  "
                >
                  <div
                    style="
                      display: inline-block;
                      padding: 10px 18px;
                      border-radius: 12px;
                      background: #073b70;
                      color: #ffffff;
                      font-size: 18px;
                      font-weight: bold;
                    "
                  >
                    MAYLON
                  </div>

                  <h1
                    style="
                      margin: 20px 0 8px;
                      font-size: 24px;
                      color: #111827;
                    "
                  >
                    Pagamento Confirmado
                  </h1>

                  <p
                    style="
                      margin: 0;
                      color: #6b7280;
                      font-size: 14px;
                    "
                  >
                    Seu pagamento foi aprovado com sucesso.
                  </p>
                </div>

                <!-- Cliente -->
                <div style="padding: 28px 32px;">
                  <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
                    Olá,
                  </p>

                  <p
                    style="
                      margin: 0;
                      font-size: 18px;
                      font-weight: bold;
                      color: #111827;
                    "
                  >
                    ${nome || "Cliente"}
                  </p>

                  <p
                    style="
                      margin: 6px 0 0;
                      color: #6b7280;
                      font-size: 14px;
                    "
                  >
                    ${emailDestino}
                  </p>
                </div>

                <!-- Dados do pagamento -->
                <div
                  style="
                    margin: 0 32px;
                    padding: 24px;
                    background: #f8fafc;
                    border-radius: 14px;
                  "
                >
                  <div
                    style="
                      display: flex;
                      justify-content: space-between;
                      padding-bottom: 14px;
                      margin-bottom: 14px;
                      border-bottom: 1px solid #e5e7eb;
                    "
                  >
                    <span style="color: #6b7280;">
                      Pedido
                    </span>

                    <strong style="color: #111827;">
                      #${pedido || "—"}
                    </strong>
                  </div>

                  <div
                    style="
                      display: flex;
                      justify-content: space-between;
                      padding-bottom: 14px;
                      margin-bottom: 14px;
                      border-bottom: 1px solid #e5e7eb;
                    "
                  >
                    <span style="color: #6b7280;">
                      Valor
                    </span>

                    <strong style="color: #073b70;">
                      ${valor || "—"}
                    </strong>
                  </div>

                  <div
                    style="
                      display: flex;
                      justify-content: space-between;
                      padding-bottom: 14px;
                      margin-bottom: 14px;
                      border-bottom: 1px solid #e5e7eb;
                    "
                  >
                    <span style="color: #6b7280;">
                      Método de pagamento
                    </span>

                    <strong style="color: #111827;">
                      ${metodo || "—"}
                    </strong>
                  </div>

                  <div
                    style="
                      display: flex;
                      justify-content: space-between;
                      padding-bottom: 14px;
                      margin-bottom: 14px;
                      border-bottom: 1px solid #e5e7eb;
                    "
                  >
                    <span style="color: #6b7280;">
                      Data
                    </span>

                    <strong style="color: #111827;">
                      ${data || "—"}
                    </strong>
                  </div>

                  <div
                    style="
                      display: flex;
                      justify-content: space-between;
                    "
                  >
                    <span style="color: #6b7280;">
                      Status
                    </span>

                    <strong style="color: #059669;">
                      ${status || "PAGO"}
                    </strong>
                  </div>
                </div>

                <!-- Transação -->
                <div style="padding: 28px 32px;">
                  <p
                    style="
                      margin: 0 0 6px;
                      color: #6b7280;
                      font-size: 13px;
                    "
                  >
                    ID da transação
                  </p>

                  <p
                    style="
                      margin: 0;
                      color: #111827;
                      font-size: 13px;
                      word-break: break-all;
                    "
                  >
                    ${transaction_id || pedido || "—"}
                  </p>
                </div>

                <!-- Rodapé -->
                <div
                  style="
                    padding: 24px 32px;
                    background: #f8fafc;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                  "
                >
                  <p
                    style="
                      margin: 0;
                      color: #6b7280;
                      font-size: 12px;
                      line-height: 1.6;
                    "
                  >
                    Este é um e-mail automático enviado pela Maylon.
                    <br />
                    Não responda diretamente a esta mensagem.
                  </p>
                </div>

              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log(
      `Recibo enviado com sucesso para ${emailDestino}`
    );

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