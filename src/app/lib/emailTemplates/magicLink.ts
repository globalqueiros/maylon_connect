import nodemailer from "nodemailer";

type SendMagicLinkParams = {
  email: string;
  name?: string;
  link: string;
  ip?: string;
  location?: string;
  userAgent?: string;
};

function escapeHtml(value?: string): string {
  if (!value) return "";

  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getDeviceAndBrowser(userAgent?: string) {
  if (!userAgent) {
    return {
      browser: "Desconhecido",
      device: "Desconhecido",
    };
  }

  let browser = "Desconhecido";
  let device = "Desktop";

  if (/ipad/i.test(userAgent)) {
    device = "iPad";
  } else if (/iphone/i.test(userAgent)) {
    device = "iPhone";
  } else if (/ipod/i.test(userAgent)) {
    device = "iPod";
  } else if (/android/i.test(userAgent)) {
    device = "Android";
  } else if (/windows phone/i.test(userAgent)) {
    device = "Windows Phone";
  } else if (/macintosh|mac os/i.test(userAgent)) {
    device = "Mac";
  } else if (/windows/i.test(userAgent)) {
    device = "Windows";
  } else if (/linux/i.test(userAgent)) {
    device = "Linux";
  }

  if (/edg\//i.test(userAgent)) {
    browser = "Microsoft Edge";
  } else if (/opr\//i.test(userAgent)) {
    browser = "Opera";
  } else if (/firefox\//i.test(userAgent)) {
    browser = "Mozilla Firefox";
  } else if (/crios\//i.test(userAgent)) {
    browser = "Google Chrome";
  } else if (/chrome\//i.test(userAgent)) {
    browser = "Google Chrome";
  } else if (/safari\//i.test(userAgent)) {
    browser = "Safari";
  }

  return {
    browser,
    device,
  };
}

export function magicLinkTemplate(
  link: string,
  name?: string,
  ip?: string,
  location?: string,
  userAgent?: string
): string {
  const userName = escapeHtml(name?.trim() || "usuário");
  const safeLink = escapeHtml(link);
  const safeIp = escapeHtml(ip || "Não identificado");
  const safeLocation = escapeHtml(location || "Não identificada");

  const { browser, device } = getDeviceAndBrowser(userAgent);

  const safeBrowser = escapeHtml(browser);
  const safeDevice = escapeHtml(device);

  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
<title>Seu acesso à Maylon</title>

<style>
html,
body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  min-width: 100% !important;
  background-color: #f4f7f8;
}

body {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  color: #172033;
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
}

table {
  border-collapse: collapse;
  border-spacing: 0;
}

td {
  padding: 0;
}

img {
  display: block;
  border: 0;
  outline: none;
  text-decoration: none;
  -ms-interpolation-mode: bicubic;
}

a {
  text-decoration: none;
}

.wrapper {
  width: 100%;
  background-color: #f4f7f8;
  padding: 48px 16px;
}

.container {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  background-color: #ffffff;
  border: 1px solid #e7ecef;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
}

.header {
  background-color: #102a2b;
  padding: 42px 40px 38px;
  text-align: center;
}

.logo-wrapper {
  display: inline-block;
  background-color: #ffffff;
  border-radius: 10px;
  padding: 7px 14px;
  margin-bottom: 28px;
}

.logo {
  width: 118px;
  max-width: 118px;
  height: auto;
}

.header-line {
  width: 42px;
  height: 3px;
  margin: 0 auto 20px;
  background-color: #19b8a6;
  border-radius: 10px;
}

.header-title {
  margin: 0;
  color: #ffffff;
  font-size: 28px;
  line-height: 36px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.header-subtitle {
  margin: 10px 0 0;
  color: #a9c6c4;
  font-size: 14px;
  line-height: 22px;
}

.content {
  padding: 44px 44px 40px;
}

.eyebrow {
  margin: 0 0 10px;
  color: #0f8b80;
  font-size: 11px;
  line-height: 18px;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
}

.greeting {
  margin: 0 0 14px;
  color: #101828;
  font-size: 26px;
  line-height: 34px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.description {
  margin: 0;
  color: #667085;
  font-size: 15px;
  line-height: 25px;
}

.access-card {
  margin-top: 30px;
  background-color: #f1fbf9;
  border: 1px solid #d3f0eb;
  border-radius: 16px;
}

.access-content {
  padding: 28px 26px;
  text-align: center;
}

.access-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 17px;
  background-color: #d8f6f0;
  border-radius: 50%;
  color: #0c8176;
  font-size: 22px;
  line-height: 52px;
  text-align: center;
}

.access-title {
  margin: 0 0 8px;
  color: #116b64;
  font-size: 18px;
  line-height: 26px;
  font-weight: 700;
}

.access-text {
  max-width: 430px;
  margin: 0 auto;
  color: #667085;
  font-size: 14px;
  line-height: 22px;
}

.button-area {
  padding: 30px 0 24px;
  text-align: center;
}

.button {
  display: inline-block;
  min-width: 210px;
  padding: 15px 28px;
  background-color: #16b5a3;
  border: 1px solid #16b5a3;
  border-radius: 10px;
  color: #ffffff !important;
  font-size: 15px;
  line-height: 22px;
  font-weight: 700;
  text-align: center;
  box-shadow: 0 7px 18px rgba(22, 181, 163, 0.22);
}

.expiration {
  margin: 0;
  color: #8a95a5;
  font-size: 13px;
  line-height: 21px;
  text-align: center;
}

.expiration strong {
  color: #344054;
}

.details {
  margin-top: 30px;
  border: 1px solid #e7ebef;
  border-radius: 14px;
  background-color: #fbfcfd;
  overflow: hidden;
}

.details-header {
  padding: 18px 20px;
  background-color: #ffffff;
  border-bottom: 1px solid #e7ebef;
}

.details-title {
  margin: 0;
  color: #172033;
  font-size: 14px;
  line-height: 22px;
  font-weight: 700;
}

.details-body {
  padding: 16px 20px;
}

.detail-row td {
  padding: 7px 0;
  vertical-align: top;
}

.detail-label {
  width: 40%;
  color: #98a2b3;
  font-size: 13px;
  line-height: 20px;
}

.detail-value {
  width: 60%;
  color: #344054;
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
  word-break: break-word;
}

.security {
  margin: 24px 0 0;
  padding: 16px 17px;
  background-color: #fff9f3;
  border: 1px solid #f8dfc8;
  border-radius: 11px;
  color: #8a5a2b;
  font-size: 13px;
  line-height: 21px;
}

.msg-2154100244131495934 img{
  padding: 12px;
}

.fallback {
  margin-top: 30px;
  padding-top: 24px;
  border-top: 1px solid #edf0f2;
}

.fallback-label {
  margin: 0 0 8px;
  color: #98a2b3;
  font-size: 11px;
  line-height: 17px;
}

.fallback-box {
  padding: 12px 13px;
  background-color: #f8fafb;
  border: 1px solid #e7ebef;
  border-radius: 8px;
}

.fallback-link {
  margin: 0;
  color: #667085;
  font-size: 11px;
  line-height: 17px;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.footer {
  padding: 26px 30px;
  background-color: #f8fafb;
  border-top: 1px solid #e8edf0;
  text-align: center;
}

.footer-brand {
  margin: 0 0 7px;
  color: #344054;
  font-size: 13px;
  line-height: 20px;
  font-weight: 700;
}

.footer-text {
  margin: 0;
  color: #98a2b3;
  font-size: 10px;
  line-height: 10px;
}

.footer-copy {
  margin: 7px 0 0;
  color: #b0b8c2;
  font-size: 10px;
  line-height: 17px;
}

@media only screen and (max-width: 600px) {
  .wrapper {
    padding: 18px 10px !important;
  }

  .container {
    border-radius: 14px !important;
  }

  .header {
    padding: 32px 22px 30px !important;
  }

  .logo-wrapper {
    margin-bottom: 22px !important;
  }

  .logo {
    width: 105px !important;
    max-width: 105px !important;
  }

  .header-title {
    font-size: 23px !important;
    line-height: 31px !important;
  }

  .header-subtitle {
    font-size: 13px !important;
    line-height: 20px !important;
  }

  .content {
    padding: 30px 20px 28px !important;
  }

  .greeting {
    font-size: 22px !important;
    line-height: 30px !important;
  }

  .description {
    font-size: 14px !important;
    line-height: 23px !important;
  }

  .access-card {
    margin-top: 24px !important;
  }

  .access-content {
    padding: 23px 17px !important;
  }

  .access-title {
    font-size: 17px !important;
  }

  .access-text {
    font-size: 13px !important;
    line-height: 21px !important;
  }

  .button-area {
    padding: 24px 0 20px !important;
  }

  .button {
    display: block !important;
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    padding: 15px 18px !important;
  }

  .details {
    margin-top: 24px !important;
  }

  .details-header {
    padding: 16px !important;
  }

  .details-body {
    padding: 13px 16px !important;
  }

  .detail-row td {
    padding: 6px 0 !important;
  }

  .detail-label,
  .detail-value {
    font-size: 12px !important;
    line-height: 19px !important;
  }

  .detail-label {
    width: 43% !important;
  }

  .detail-value {
    width: 57% !important;
  }

  .security {
    font-size: 12px !important;
    line-height: 20px !important;
  }

  .fallback {
    margin-top: 24px !important;
    padding-top: 20px !important;
  }

  .fallback-link {
    font-size: 10px !important;
    line-height: 16px !important;
  }

  .footer {
    padding: 22px 16px !important;
  }
}

@media only screen and (max-width: 380px) {
  .wrapper {
    padding: 8px 5px !important;
  }

  .header {
    padding: 28px 16px !important;
  }

  .content {
    padding: 26px 15px !important;
  }

  .header-title {
    font-size: 21px !important;
    line-height: 28px !important;
  }

  .greeting {
    font-size: 20px !important;
    line-height: 28px !important;
  }
}
</style>
</head>

<body>

<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
Seu link seguro para acessar sua conta Maylon. Válido por 15 minutos.
</div>

<table
  role="presentation"
  width="100%"
  cellspacing="0"
  cellpadding="0"
  border="0"
  class="wrapper"
>
  <tr>
    <td align="center">

      <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        class="container"
      >

        <tr>
          <td class="header">

            <div class="logo-wrapper">
              <img
                src="https://maylon.com.br/_next/image?url=%2Flogo.png&w=384&q=75"
                width="125"
                alt="Maylon"
                class="logo"
              >
            </div>

            <div class="header-line"></div>

            <h1 class="header-title">
              Seu acesso seguro
            </h1>

            <p class="header-subtitle">
              Acesso rápido, simples e protegido
            </p>

          </td>
        </tr>

        <tr>
          <td class="content">

            <p class="eyebrow">
              Acesso à conta
            </p>

            <h2 class="greeting">
              Olá, ${userName}
            </h2>

            <p class="description">
              Recebemos uma solicitação para acessar sua conta Maylon.
              Para continuar, utilize o botão abaixo.
            </p>

            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
              class="access-card"
            >
              <tr>
                <td class="access-content">

                  <div class="access-icon" style="padding:12px;">
                    &#128274;
                  </div>

                  <h3 class="access-title">
                    Magic Link
                  </h3>

                  <p class="access-text">
                    Este link permite entrar na sua conta com segurança,
                    sem precisar informar sua senha.
                  </p>

                </td>
              </tr>
            </table>

            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
            >
              <tr>
                <td class="button-area">

                  <a
                    href="${safeLink}"
                    class="button"
                    target="_blank"
                  >
                    Acessar minha conta
                  </a>

                </td>
              </tr>
            </table>

            <p class="expiration">
              Este link é válido por <strong>15 minutos</strong>.
            </p>

            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
              class="details"
            >

              <tr>
                <td class="details-header">

                  <h3 class="details-title">
                    Detalhes da solicitação
                  </h3>

                </td>
              </tr>

              <tr>
                <td class="details-body">

                  <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                  >

                    <tr class="detail-row">
                      <td class="detail-label">
                        Endereço IP
                      </td>

                      <td class="detail-value">
                        ${safeIp}
                      </td>
                    </tr>

                    <tr class="detail-row">
                      <td class="detail-label">
                        Dispositivo
                      </td>

                      <td class="detail-value">
                        ${safeDevice}
                      </td>
                    </tr>

                    <tr class="detail-row">
                      <td class="detail-label">
                        Navegador
                      </td>

                      <td class="detail-value">
                        ${safeBrowser}
                      </td>
                    </tr>

                    <tr class="detail-row">
                      <td class="detail-label">
                        Localização
                      </td>

                      <td class="detail-value">
                        ${safeLocation}
                      </td>
                    </tr>

                  </table>

                </td>
              </tr>

            </table>

            <p class="security">
              Se você não reconhece esta solicitação, não utilize este link.
              Recomendamos alterar sua senha e entrar em contato com o suporte
              da Maylon.
            </p>

            <div class="fallback">

              <p class="fallback-label">
                Problemas para acessar?
              </p>

              <div class="fallback-box">

                <p class="fallback-link">
                  ${safeLink}
                </p>

              </div>

            </div>

          </td>
        </tr>

        <tr>
          <td class="footer">
            <p class="footer-text">
              Esta é uma mensagem automática de segurança.
              Por favor, não responda este e-mail.
            </p>

            <p class="footer-copy">
              © ${year} Maylon. Todos os direitos reservados.
            </p>

          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>`;
}

export async function sendMagicLink({
  email,
  name,
  link,
  ip,
  location,
  userAgent,
}: SendMagicLinkParams) {
  if (!email) {
    throw new Error("E-mail do destinatário não informado.");
  }

  if (!link) {
    throw new Error("Link de acesso não informado.");
  }

  if (!process.env.EMAIL_HOST) {
    throw new Error("EMAIL_HOST não configurado.");
  }

  if (!process.env.EMAIL_USER) {
    throw new Error("EMAIL_USER não configurado.");
  }

  if (!process.env.EMAIL_PASS) {
    throw new Error("EMAIL_PASS não configurado.");
  }

  const port = Number(process.env.EMAIL_PORT || 587);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const html = magicLinkTemplate(
    link,
    name,
    ip,
    location,
    userAgent
  );

  const detected = getDeviceAndBrowser(userAgent);

  const text = `
Olá, ${name || "usuário"}.

Recebemos uma solicitação para acessar sua conta Maylon.

Acesse sua conta através do link abaixo:

${link}

Este link é válido por 15 minutos.

Detalhes da solicitação:

IP: ${ip || "Não identificado"}
Dispositivo: ${detected.device}
Navegador: ${detected.browser}
Localização: ${location || "Não identificada"}

Se você não reconhece esta solicitação, não utilize o link e entre em contato com o suporte da Maylon.

© ${new Date().getFullYear()} Maylon. Todos os direitos reservados.
`.trim();

  const info = await transporter.sendMail({
    from: `"Maylon" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Seu acesso seguro - Maylon",
    text,
    html,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
}
