import nodemailer from "nodemailer";

type SendMagicLinkParams = {
  email: string;
  name?: string;
  link: string;
  ip?: string;
  location?: string;
  userAgent?: string;
};

function getDeviceAndBrowser(userAgent?: string) {
  if (!userAgent) {
    return { browser: "Desconhecido", device: "Desconhecido" };
  }

  let browser = "Desconhecido";
  let device = "Desktop";

  if (/android/i.test(userAgent)) device = "Android";
  else if (/iphone|ipad|ipod/i.test(userAgent)) device = "iPhone";

  if (userAgent.includes("Edg")) browser = "Microsoft Edge";
  else if (userAgent.includes("Chrome")) browser = "Google Chrome";
  else if (userAgent.includes("Firefox")) browser = "Mozilla Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";

  return { browser, device };
}

export function magicLinkTemplate(
  link: string,
  name?: string,
  ip?: string,
  location?: string,
  userAgent?: string
) {
  const userName = name || "usuário";
  const { browser, device } = getDeviceAndBrowser(userAgent);

  return `
      <div style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f6f8;padding:30px 15px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <!-- Cabeçalho -->
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#14b8a6,#0f766e);padding:35px 20px;">
                    <img src="https://auth.maylon.com.br/storage/app/public/business/2026-02-21-699a698c29d9b.webp"
                        alt="Maylon"
                        width="120"
                        style="display:block;border:0;max-width:120px;height:auto;margin-bottom:20px;" />
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">
                      Alerta de Segurança
                    </h1>
                  </td>
                </tr>
                <!-- Conteúdo -->
                <tr>
                  <td style="padding:40px 30px;">
                    <h2 style="margin-top:0;color:#111827;font-size:24px;">
                      Olá, ${userName}
                    </h2>
                    <p style="font-size:16px;line-height:1.7;color:#4b5563;margin-bottom:25px;">
                      Detectamos uma tentativa de acesso à sua conta Maylon. Confira abaixo os detalhes registrados:
                    </p>
                    <!-- Card -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                          style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:25px 0;">
                      <tr>
                        <td style="padding:20px;">
                          <h3 style="margin-top:0;color:#111827;font-size:18px;">
                            🔐 Detalhes do acesso
                          </h3>
                          <p style="margin:10px 0;color:#374151;font-size:15px;">
                            <strong>IP:</strong> ${ip || "Não identificado"}
                          </p>
                          <p style="margin:10px 0;color:#374151;font-size:15px;">
                            <strong>Dispositivo:</strong> ${browser} ${device}
                          </p>
                          <p style="margin:10px 0;color:#374151;font-size:15px;">
                            <strong>Localização:</strong> ${location || "Não identificada"}
                          </p>
                        </td>
                      </tr>
                    </table>
                    <!-- Botão -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding:15px 0 30px 0;">
                          <a href="${link}"
                            style="background:#14b8a6;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:10px;font-size:16px;font-weight:bold;display:inline-block;">
                            Acessar Minha Conta
                          </a>
                        </td>
                      </tr>
                    </table>
                    <!-- Avisos -->
                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                      ⏳ Este link permanecerá válido por apenas <strong>15 minutos</strong>.
                    </p>
                    <p style="font-size:14px;color:#dc2626;line-height:1.6;">
                      Caso você não reconheça esta tentativa de acesso, recomendamos alterar sua senha imediatamente e entrar em contato com nossa equipe de suporte.
                    </p>
                  </td>
                </tr>
                <!-- Rodapé -->
                <tr>
                  <td align="center" style="background:#f9fafb;padding:25px;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:13px;color:#6b7280;">
                      Este é um e-mail automático. Por favor, não responda esta mensagem.
                    </p>
                    <p style="margin:12px 0 0 0;font-size:13px;color:#9ca3af;">
                      © ${new Date().getFullYear()} Maylon. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
  `;
}

export async function sendMagicLink({
  email,
  name,
  link,
  ip,
  location,
  userAgent,
}: SendMagicLinkParams) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const html = magicLinkTemplate(link, name, ip, location, userAgent);

  await transporter.sendMail({
    from: `"Maylon" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Acesso seguro - Maylon",
    html,
  });
}