import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "../../lib/db";

type VerificationType = "email" | "phone";

function normalizeType(value: unknown): VerificationType | null {
  if (value === "email" || value === "phone") {
    return value;
  }

  return null;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const action =
      typeof body.action === "string"
        ? body.action.trim().toLowerCase()
        : "send";

    const type = normalizeType(body.type);

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const code =
      typeof body.code === "string"
        ? body.code.replace(/\D/g, "").trim()
        : "";

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          message: "Tipo de confirmação inválido.",
        },
        { status: 400 }
      );
    }

    if (type === "email" && !email) {
      return NextResponse.json(
        {
          success: false,
          message: "E-mail não informado.",
        },
        { status: 400 }
      );
    }

    if (type === "phone" && !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Telefone não informado.",
        },
        { status: 400 }
      );
    }

    if (action === "verify") {
      if (!code) {
        return NextResponse.json(
          {
            success: false,
            message: "Informe o código de confirmação.",
          },
          { status: 400 }
        );
      }

      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json(
          {
            success: false,
            message: "O código deve conter 6 números.",
          },
          { status: 400 }
        );
      }

      if (type === "email") {
        const [users] = await db.query(
          "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1",
          [email]
        );

        const usuarios = users as Array<{
          id: number;
        }>;

        if (!usuarios.length) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Não foi encontrado um usuário com este e-mail.",
            },
            { status: 404 }
          );
        }

        await db.query(
          `
            UPDATE users
            SET email_verified_at = NOW()
            WHERE id = ?
          `,
          [usuarios[0].id]
        );

        return NextResponse.json({
          success: true,
          verified: true,
          type,
          email_verified_at: new Date().toISOString(),
          message: "E-mail confirmado com sucesso.",
        });
      }

      if (type === "phone") {
        await db.query(
          `
            UPDATE users
            SET phone_verified_at = NOW()
            WHERE phone = ?
          `,
          [phone]
        );

        return NextResponse.json({
          success: true,
          verified: true,
          type,
          phone_verified_at: new Date().toISOString(),
          message: "Telefone confirmado com sucesso.",
        });
      }
    }

    if (action !== "send") {
      return NextResponse.json(
        {
          success: false,
          message: "Ação de confirmação inválida.",
        },
        { status: 400 }
      );
    }

    const verificationCode = generateCode();

    if (type === "email") {
      if (
        !process.env.SMTP_HOST ||
        !process.env.SMTP_USER ||
        !process.env.SMTP_PASSWORD
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "O servidor de e-mail não está configurado. Verifique as variáveis SMTP no .env.",
          },
          { status: 500 }
        );
      }

      await transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          process.env.SMTP_USER,
        to: email,
        subject: "Código de confirmação - Maylon",
        text: `Seu código de confirmação Maylon é: ${verificationCode}. Este código é válido para confirmar seu e-mail.`,
        html: `
          <!DOCTYPE html>
          <html lang="pt-BR">
            <head>
              <meta charset="UTF-8" />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />
              <title>Confirmação Maylon</title>
            </head>

            <body
              style="
                margin:0;
                padding:0;
                background:#eefaf7;
                font-family:Arial,Helvetica,sans-serif;
              "
            >
              <div
                style="
                  max-width:600px;
                  margin:40px auto;
                  background:#ffffff;
                  border-radius:20px;
                  overflow:hidden;
                  box-shadow:0 10px 40px rgba(8,168,157,0.15);
                "
              >
                <div
                  style="
                    background:linear-gradient(135deg,#08a89d,#35a989);
                    padding:35px 30px;
                    text-align:center;
                  "
                >
                  <h1
                    style="
                      margin:0;
                      color:#ffffff;
                      font-size:30px;
                      font-weight:700;
                    "
                  >
                    Maylon
                  </h1>

                  <p
                    style="
                      margin:8px 0 0;
                      color:#ffffff;
                      font-size:14px;
                    "
                  >
                    Confirmação de e-mail
                  </p>
                </div>

                <div
                  style="
                    padding:40px 30px;
                    text-align:center;
                  "
                >
                  <h2
                    style="
                      margin:0 0 12px;
                      color:#08a89d;
                      font-size:24px;
                    "
                  >
                    Confirme seu e-mail
                  </h2>

                  <p
                    style="
                      margin:0 auto 25px;
                      max-width:450px;
                      color:#64748b;
                      font-size:15px;
                      line-height:1.7;
                    "
                  >
                    Use o código abaixo para confirmar o
                    e-mail cadastrado na sua conta Maylon.
                  </p>

                  <div
                    style="
                      display:inline-block;
                      background:#effcf9;
                      border:2px solid #35a989;
                      border-radius:16px;
                      padding:18px 30px;
                      margin-bottom:25px;
                    "
                  >
                    <span
                      style="
                        font-size:34px;
                        font-weight:700;
                        letter-spacing:8px;
                        color:#08a89d;
                      "
                    >
                      ${verificationCode}
                    </span>
                  </div>

                  <p
                    style="
                      margin:0;
                      color:#94a3b8;
                      font-size:13px;
                      line-height:1.6;
                    "
                  >
                    Se você não solicitou esta confirmação,
                    ignore este e-mail.
                  </p>
                </div>

                <div
                  style="
                    padding:20px 30px;
                    background:#f5fbfa;
                    text-align:center;
                  "
                >
                  <p
                    style="
                      margin:0;
                      color:#94a3b8;
                      font-size:12px;
                    "
                  >
                    © ${new Date().getFullYear()} Maylon.
                    Todos os direitos reservados.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      console.log(
        `[VERIFICATION] Código enviado para ${email}`
      );
    }

    if (type === "phone") {
      console.log(
        `[VERIFICATION] Código para ${phone}: ${verificationCode}`
      );

      return NextResponse.json({
        success: true,
        type,
        message:
          "Código de confirmação gerado para o telefone.",
      });
    }

    return NextResponse.json({
      success: true,
      type,
      message:
        "Código de confirmação enviado com sucesso.",
    });
  } catch (error) {
    console.error(
      "POST /api/send-verification:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? `Erro ao processar confirmação: ${error.message}`
            : "Erro interno ao processar a confirmação.",
      },
      { status: 500 }
    );
  }
}