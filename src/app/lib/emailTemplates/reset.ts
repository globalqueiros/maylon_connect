export const resetTemplate = (
  link: string,
  name: string,
  info: { ip: string; device: string; location: string }
) => {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      font-family: Arial, Helvetica, sans-serif;
    }

    .email-wrapper {
      width: 100%;
      padding: 20px 10px;
    }

    .email-container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
    }

    .header {
      padding: 30px 20px;
      background: #0f766e;
      text-align: center;
    }

    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
    }

    .content {
      padding: 35px 30px;
    }

    .content h2 {
      margin: 0 0 20px;
      color: #0f766e;
      font-size: 24px;
    }

    .content-text {
      margin: 0 0 25px;
      color: #4b5563;
      font-size: 16px;
      line-height: 1.7;
    }

    .info-box {
      margin-bottom: 30px;
      padding: 20px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .info-box h3 {
      margin: 0 0 15px;
      color: #111827;
      font-size: 18px;
    }

    .info-box p {
      margin: 10px 0;
      color: #374151;
      font-size: 15px;
    }

    .button-wrapper {
      text-align: center;
    }

    .reset-button {
      display: inline-block;
      padding: 14px 28px;
      background: #0f766e;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
    }

    .warning {
      margin-top: 30px;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
    }

    .danger {
      color: #dc2626;
      font-size: 14px;
      line-height: 1.6;
    }

    .footer {
      padding: 20px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }

    .footer p {
      margin: 0;
      color: #6b7280;
      font-size: 12px;
    }

    .footer .copyright {
      margin-top: 3px;
      color: #9ca3af;
    }

    /* sm */
    @media screen and (min-width: 640px) {
      .email-wrapper {
        padding: 30px 20px;
      }

      .email-container {
        max-width: 640px;
      }

      .content {
        padding: 40px 35px;
      }
    }

    /* md */
    @media screen and (min-width: 768px) {
      .email-wrapper {
        padding: 40px 25px;
      }

      .email-container {
        max-width: 700px;
      }

      .content {
        padding: 45px 40px;
      }

      .header {
        padding: 35px 25px;
      }

      .header h1 {
        font-size: 30px;
      }
    }

    /* lg */
    @media screen and (min-width: 1024px) {
      .email-wrapper {
        padding: 50px 30px;
      }

      .email-container {
        max-width: 760px;
      }

      .content {
        padding: 50px 45px;
      }

      .header {
        padding: 40px 30px;
      }

      .header h1 {
        font-size: 32px;
      }

      .content h2 {
        font-size: 26px;
      }
    }

    /* xl */
    @media screen and (min-width: 1280px) {
      .email-wrapper {
        padding: 60px 40px;
      }

      .email-container {
        max-width: 800px;
      }

      .content {
        padding: 55px 50px;
      }
    }

    /* 2xl */
    @media screen and (min-width: 1536px) {
      .email-wrapper {
        padding: 70px 50px;
      }

      .email-container {
        max-width: 850px;
      }

      .content {
        padding: 60px 55px;
      }

      .header {
        padding: 45px 35px;
      }

      .header h1 {
        font-size: 34px;
      }
    }

    /* Mobile */
    @media screen and (max-width: 480px) {
      .email-wrapper {
        padding: 10px 6px;
      }

      .email-container {
        border-radius: 8px;
      }

      .header {
        padding: 25px 15px;
      }

      .header h1 {
        font-size: 23px;
      }

      .content {
        padding: 25px 20px;
      }

      .content h2 {
        font-size: 21px;
      }

      .content-text {
        font-size: 15px;
      }

      .info-box {
        padding: 15px;
      }

      .reset-button {
        display: block;
        width: 100%;
        padding: 15px 20px;
      }

      .footer {
        padding: 18px 12px;
      }
    }
  </style>
</head>

<body>

  <div class="email-wrapper">

    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
    >
      <tr>
        <td align="center">

          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            class="email-container"
          >

            <!-- Cabeçalho -->
            <tr>
              <td class="header">
                <h1>
                  Redefinição de Senha
                </h1>
              </td>
            </tr>

            <!-- Conteúdo -->
            <tr>
              <td class="content">

                <h2>
                  Olá, ${name}
                </h2>

                <p class="content-text">
                  Detectamos uma solicitação de redefinição de senha
                  para sua conta.
                </p>

                <!-- Informações -->
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  class="info-box"
                >
                  <tr>
                    <td>

                      <h3>
                        🔐 Detalhes do acesso
                      </h3>

                      <p>
                        <strong>IP:</strong>
                        ${info.ip || "Não identificado"}
                      </p>

                      <p>
                        <strong>Navegador:</strong>
                        ${info.device || "Não identificado"}
                      </p>

                      <p>
                        <strong>Localização:</strong>
                        ${info.location || "Não identificada"}
                      </p>

                    </td>
                  </tr>
                </table>

                <!-- Botão -->
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                >
                  <tr>
                    <td class="button-wrapper">

                      <a
                        href="${link}"
                        class="reset-button"
                      >
                        Redefinir Senha
                      </a>

                    </td>
                  </tr>
                </table>

                <!-- Avisos -->
                <p class="warning">
                  ⏳ Este link expira em
                  <strong>15 minutos</strong>.
                </p>

                <p class="danger">
                  Caso você não tenha solicitado esta alteração,
                  ignore este e-mail.
                </p>

              </td>
            </tr>

            <!-- Rodapé -->
            <tr>
              <td class="footer">

                <p>
                  Este é um e-mail automático.
                  Por favor, não responda esta mensagem.
                </p>

                <p class="copyright">
                  © ${new Date().getFullYear()} Maylon.
                  Todos os direitos reservados.
                </p>

              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </div>

</body>
</html>
  `;
};