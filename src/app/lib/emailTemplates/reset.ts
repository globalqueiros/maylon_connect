export const resetTemplate = (
  link: string,
  name: string,
  info: { ip: string; device: string; location: string }
) => {
  return `
      <div style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f4;padding:20px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
                <!-- Cabeçalho -->
                <tr>
                  <td align="center" bgcolor="#0f766e" style="padding:30px 20px;">
                    <h1 style="margin:0;color:#ffffff;font-size:28px;">
                      Redefinição de Senha
                    </h1>
                  </td>
                </tr>
                <!-- Conteúdo -->
                <tr>
                  <td style="padding:35px 30px;">
                    <h2 style="margin:0 0 20px;color:#0f766e;font-size:24px;">
                      Olá, ${name}
                    </h2>
                    <p style="font-size:16px;line-height:1.7;color:#4b5563;margin:0 0 25px;">
                      Detectamos uma solicitação de redefinição de senha para sua conta.
                    </p>
                    <!-- Informações -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                      style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:30px;">
                      <tr>
                        <td style="padding:20px;">
                          <h3 style="margin:0 0 15px;color:#111827;font-size:18px;">
                            🔐 Detalhes do acesso
                          </h3>
                          <p style="margin:10px 0;color:#374151;font-size:15px;">
                            <strong>IP:</strong> ${info.ip || "Não identificado"}
                          </p>
                          <p style="margin:10px 0;color:#374151;font-size:15px;">
                            <strong>Navegador:</strong> ${info.device || "Não identificado"}
                          </p>
                          <p style="margin:10px 0;color:#374151;font-size:15px;">
                            <strong>Localização:</strong> ${info.location || "Não identificada"}
                          </p>
                        </td>
                      </tr>
                    </table>
                    <!-- Botão -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center">
                          <a href="${link}"
                            style="display:inline-block;background:#0f766e;color:#ffffff;
                            text-decoration:none;padding:14px 28px;border-radius:8px;
                            font-size:16px;font-weight:bold;">
                            Redefinir Senha
                          </a>
                        </td>
                      </tr>
                    </table>
                    <!-- Avisos -->
                    <p style="margin-top:30px;font-size:14px;color:#6b7280;line-height:1.6;">
                      ⏳ Este link expira em <strong>15 minutos</strong>.
                    </p>
                    <p style="font-size:14px;color:#dc2626;line-height:1.6;">
                      Caso você não tenha solicitado esta alteração, ignore este e-mail.
                    </p>
                  </td>
                </tr>
                <!-- Rodapé -->
                <tr>
                  <td align="center" style="background:#f9fafb;padding:20px;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:12px;color:#6b7280;">
                      Este é um e-mail automático. Por favor, não responda esta mensagem.
                    </p>
                    <p style="margin:10px 0 0;font-size:12px;color:#9ca3af;">
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
};