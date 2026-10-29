import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import type { RowDataPacket } from "mysql2";

import { db } from "../../lib/db";
import { authCookieOptions } from "../../lib/authCookies";
import { getUsuarioLogado } from "../../lib/auth";
import { jwtSecret } from "../../lib/sessaoServidor";
import {
  conferirDesafio,
  criarDesafio,
  gerarCodigo,
  MAX_TENTATIVAS,
  reenvioBloqueado,
  VALIDADE_CODIGO_MS,
} from "../../lib/verificacaoEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE = "verificacao_email";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/** Tentativas erradas por desafio (vale para o processo do servidor). */
const tentativas = new Map<string, number>();

function registrarTentativa(id: string) {
  if (tentativas.size > 5000) tentativas.clear();
  const total = (tentativas.get(id) ?? 0) + 1;
  tentativas.set(id, total);
  return total;
}

function resposta(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function erro(message: string, status: number) {
  return resposta({ success: false, message }, status);
}

function cookieDesafio(maxAgeSegundos: number) {
  return { ...authCookieOptions(maxAgeSegundos), sameSite: "strict" as const, path: "/api/send-verification" };
}

function htmlDoEmail(codigo: string) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Confirmação Maylon</title>
      </head>

      <body style="margin:0;padding:0;background:#eefaf7;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(8,168,157,0.15);">
          <div style="background:linear-gradient(135deg,#08a89d,#35a989);padding:35px 30px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:30px;font-weight:700;">Maylon</h1>
            <p style="margin:8px 0 0;color:#ffffff;font-size:14px;">Confirmação de e-mail</p>
          </div>

          <div style="padding:40px 30px;text-align:center;">
            <h2 style="margin:0 0 12px;color:#08a89d;font-size:24px;">Confirme seu e-mail</h2>

            <p style="margin:0 auto 25px;max-width:450px;color:#64748b;font-size:15px;line-height:1.7;">
              Use o código abaixo para confirmar o e-mail cadastrado na sua conta Maylon.
              Ele vale por 10 minutos.
            </p>

            <div style="display:inline-block;background:#effcf9;border:2px solid #35a989;border-radius:16px;padding:18px 30px;margin-bottom:25px;">
              <span style="font-size:34px;font-weight:700;letter-spacing:8px;color:#08a89d;">${codigo}</span>
            </div>

            <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
              Se você não solicitou esta confirmação, ignore este e-mail.
            </p>
          </div>

          <div style="padding:20px 30px;background:#f5fbfa;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              © ${new Date().getFullYear()} Maylon. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Confirmação do e-mail da própria conta. Só funciona logado, o código vai
 * para o e-mail cadastrado (não para um e-mail enviado na requisição) e é
 * conferido de verdade antes de marcar email_verified_at.
 */
export async function POST(request: NextRequest) {
  try {
    const usuario = await getUsuarioLogado(request);
    if (!usuario?.id) return erro("Faça login para confirmar seu e-mail.", 401);

    const body = await request.json().catch(() => null);
    const action = typeof body?.action === "string" ? body.action.trim().toLowerCase() : "send";
    const type = body?.type;

    if (type === "phone") {
      return erro(
        "A confirmação de telefone ainda não está disponível. Em breve você poderá confirmar por SMS.",
        400
      );
    }

    if (type !== "email") return erro("Tipo de confirmação inválido.", 400);

    const [linhas] = await db.query<
      (RowDataPacket & { email: string | null; email_verified_at: string | Date | null })[]
    >("SELECT email, email_verified_at FROM users WHERE id = ? LIMIT 1", [usuario.id]);

    const conta = linhas[0];
    const email = conta?.email?.trim() ?? "";

    if (!email) return erro("Sua conta não tem e-mail cadastrado.", 400);

    if (conta?.email_verified_at) {
      return resposta({
        success: true,
        verified: true,
        type,
        message: "Seu e-mail já está confirmado.",
      });
    }

    const segredo = jwtSecret();
    if (!segredo) {
      console.error("POST /api/send-verification: JWT_SECRET não configurada.");
      return erro("Confirmação de e-mail indisponível no momento.", 500);
    }

    const tokenAtual = request.cookies.get(COOKIE)?.value;

    if (action === "verify") {
      const codigo = typeof body?.code === "string" ? body.code.replace(/\D/g, "") : "";
      if (!/^\d{6}$/.test(codigo)) return erro("O código deve conter 6 números.", 400);

      const resultado = conferirDesafio({ segredo, token: tokenAtual, uid: usuario.id, email, codigo });

      if (resultado.id && (tentativas.get(resultado.id) ?? 0) >= MAX_TENTATIVAS) {
        return erro("Muitas tentativas. Peça um novo código.", 429);
      }

      if (!resultado.ok) {
        if (resultado.motivo === "codigo_errado" && resultado.id) {
          const total = registrarTentativa(resultado.id);
          if (total >= MAX_TENTATIVAS) return erro("Muitas tentativas. Peça um novo código.", 429);
        }

        return erro(
          resultado.motivo === "codigo_errado"
            ? "Código incorreto. Confira o e-mail e tente de novo."
            : "Código expirado ou não solicitado. Peça um novo código.",
          400
        );
      }

      await db.query(
        "UPDATE users SET email_verified_at = NOW() WHERE id = ? AND email_verified_at IS NULL",
        [usuario.id]
      );

      tentativas.delete(resultado.id);

      const ok = resposta({
        success: true,
        verified: true,
        type,
        email_verified_at: new Date().toISOString(),
        message: "E-mail confirmado com sucesso.",
      });
      ok.cookies.set(COOKIE, "", cookieDesafio(0));
      return ok;
    }

    if (action !== "send") return erro("Ação de confirmação inválida.", 400);

    if (reenvioBloqueado({ segredo, token: tokenAtual, uid: usuario.id, email })) {
      return erro("Aguarde um minuto para pedir outro código.", 429);
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("POST /api/send-verification: SMTP não configurado.");
      return erro("O envio de e-mail não está disponível no momento.", 500);
    }

    const codigo = gerarCodigo();

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Código de confirmação - Maylon",
      text: `Seu código de confirmação Maylon é: ${codigo}. Ele vale por 10 minutos.`,
      html: htmlDoEmail(codigo),
    });

    const enviado = resposta({
      success: true,
      type,
      message: "Código de confirmação enviado para o seu e-mail.",
    });
    enviado.cookies.set(
      COOKIE,
      criarDesafio({ segredo, uid: usuario.id, email, codigo }),
      cookieDesafio(VALIDADE_CODIGO_MS / 1000)
    );
    return enviado;
  } catch (error) {
    console.error("POST /api/send-verification:", error);
    return erro("Erro interno ao processar a confirmação.", 500);
  }
}
