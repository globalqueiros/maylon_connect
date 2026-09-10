import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { transporter, getClientIP } from "../../lib/email";
import { db } from "../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email obrigatório" },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await db.query(
      "UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?",
      [token, expires, email]
    );

    const ipValue = getClientIP(req);
    const deviceValue = req.headers.get("user-agent") || "Não identificado";
    const locationValue = "Brasil";

    const link = `${process.env.NEXT_PUBLIC_URL}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial; background:#f4f4f4; padding:20px;">
        <div style="max-width:500px;margin:auto;background:#fff;padding:20px;border-radius:10px;">       
          <h2 style="color:#0f766e;">Recuperação de senha</h2>
          <p>Recebemos uma solicitação para redefinir sua senha.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; font-size:14px;">
            <tr style="background:#f9fafb;">
              <td style="padding:12px;font-weight:bold;color:#111;">
                🔐 Acesso detectado
              </td>
            </tr>
            <tr>
              <td style="padding:8px 12px;color:#374151;">
                <strong>IP:</strong> ${ipValue}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 12px;color:#374151;">
                <strong>Navegador:</strong> ${deviceValue}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 12px;color:#374151;">
                <strong>Localização:</strong> ${locationValue}
              </td>
            </tr>
          </table>
          <a href="${link}" 
             style="display:inline-block;margin-top:15px;padding:12px 20px;
             background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;">
             Redefinir Senha
          </a>
          <p style="margin-top:20px;font-size:12px;color:#000;">
            Por segurança, este link é válido por apenas 15 minutos.
          </p>
          <p style="font-size:10px;color:red;">
            ⚠️ Se você não reconhece esta solicitação, desconsidere este e-mail. Caso tenha realizado alguma ação suspeita, entre em contato imediatamente com a Central de Atendimento da Maylon.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Maylon" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Recuperação de senha",
      html,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao enviar link" },
      { status: 500 }
    );
  }
}