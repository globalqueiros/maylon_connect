import { randomUUID } from "crypto";
import { db } from "./db";

export type StatusAssinatura = "aprovado" | "pendente";

type RegistrarParams = {
  usuarioId: string;
  beneficioId: number;
  prefixo: string;
  assunto: string;
  categoria?: string;
  status: StatusAssinatura;
  nome: string;
  email: string;
  linhas: string[];
};

type Registro = {
  codigo: string;
  titulo: string;
};

function gerarCodigo(prefixo: string): string {
  const sufixo = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

  return `${prefixo}-${Date.now()}-${sufixo}`;
}

export async function registrarSolicitacaoBeneficio({
  usuarioId,
  beneficioId,
  prefixo,
  assunto,
  categoria = "beneficio",
  status,
  nome,
  email,
  linhas,
}: RegistrarParams): Promise<Registro> {
  const [usuarios]: any = await db.query(
    `
      SELECT id
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [usuarioId],
  );

  if (!usuarios || usuarios.length === 0) {
    throw new SolicitacaoError("Usuário não encontrado.", 404);
  }

  const [beneficios]: any = await db.query(
    `
      SELECT id, titulo, valor
      FROM beneficios
      WHERE id = ?
        AND status = 1
      LIMIT 1
    `,
    [beneficioId],
  );

  if (!beneficios || beneficios.length === 0) {
    throw new SolicitacaoError("Benefício não encontrado.", 404);
  }

  const beneficio = beneficios[0];

  const [assinaturas]: any = await db.query(
    `
      SELECT status_assinatura
      FROM usuario_beneficios
      WHERE usuario_id = ?
        AND beneficio_id = ?
        AND ativo = 1
      LIMIT 1
    `,
    [usuarioId, beneficioId],
  );

  const statusAtual = String(
    assinaturas?.[0]?.status_assinatura ?? "",
  ).toLowerCase();

  if (statusAtual === "aprovado" || statusAtual === "autorizado") {
    throw new SolicitacaoError("Este benefício já está ativo.", 409);
  }

  if (statusAtual === "pendente") {
    throw new SolicitacaoError(
      "Você já tem uma solicitação em análise para este benefício.",
      409,
    );
  }

  const codigo = gerarCodigo(prefixo);

  const mensagem = [assunto, "", ...linhas].join("\n");

  await db.execute(
    `
      INSERT INTO protocolos (
        usuario_id,
        codigo,
        nome,
        email,
        categoria,
        assunto,
        mensagem,
        arquivo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, '')
    `,
    [usuarioId, codigo, nome, email, categoria, assunto, mensagem],
  );

  await db.execute(
    `
      INSERT INTO usuario_beneficios (
        usuario_id,
        beneficio_id,
        ativo,
        status_assinatura,
        pedido_codigo,
        valor_cobrado
      )
      VALUES (?, ?, 1, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        ativo = 1,
        status_assinatura = VALUES(status_assinatura),
        pedido_codigo = VALUES(pedido_codigo),
        valor_cobrado = VALUES(valor_cobrado),
        atualizado_em = NOW()
    `,
    [usuarioId, beneficioId, status, codigo, valorNumerico(beneficio.valor)],
  );

  return {
    codigo,
    titulo: String(beneficio.titulo ?? ""),
  };
}

export class SolicitacaoError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function valorNumerico(valor: unknown): number {
  const texto = String(valor ?? "").trim();

  if (!texto) {
    return 0;
  }

  const numero = texto.includes(",")
    ? Number(texto.replace(/\./g, "").replace(",", "."))
    : Number(texto);

  return Number.isFinite(numero) ? numero : 0;
}
