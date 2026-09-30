export type VerificacaoStatus =
  | "nao_iniciado"
  | "pendente"
  | "em_analise"
  | "aprovado"
  | "reprovado";

export const DIDIT_WORKFLOW_ID =
  "2fe65fd9-53ee-40ee-91e3-5e8af06fdd90";

export const DIDIT_API_URL = "https://verification.didit.me";

export const LAST_LIVENESS_KEY = "last_liveness_at";

const STATUS_APROVADO = ["Approved"];
const STATUS_EM_ANALISE = ["In Review"];
const STATUS_PENDENTE = [
  "Not Started",
  "In Progress",
  "Awaiting User",
  "Resubmitted",
];
const STATUS_REPROVADO = ["Declined", "Abandoned", "Expired"];

export function mapearStatusDidit(
  diditStatus: string | null | undefined,
  isVerified?: number | boolean
): VerificacaoStatus {
  if (diditStatus) {
    if (STATUS_APROVADO.includes(diditStatus)) return "aprovado";
    if (STATUS_EM_ANALISE.includes(diditStatus)) return "em_analise";
    if (STATUS_PENDENTE.includes(diditStatus)) return "pendente";
    if (STATUS_REPROVADO.includes(diditStatus)) return "reprovado";
    return "pendente";
  }

  if (isVerified) return "aprovado";
  return "nao_iniciado";
}

export function verifDocPendente(status: VerificacaoStatus): boolean {
  return status === "nao_iniciado" || status === "pendente" || status === "em_analise" || status === "reprovado";
}

export function documentacaoBloqueia(status: VerificacaoStatus): boolean {
  return status === "nao_iniciado" || status === "pendente" || status === "reprovado";
}

export function provaVidaDevida(
  created_at: string | Date | null | undefined,
  lastLivenessAt: string | Date | null | undefined,
  agora: Date = new Date()
): boolean {
  if (!created_at) return false;

  const criacao = new Date(created_at);
  if (isNaN(criacao.getTime())) return false;

  const primeiroAniversario = new Date(
    criacao.getFullYear() + 1,
    criacao.getMonth(),
    criacao.getDate()
  );

  if (agora < primeiroAniversario) return false;

  const ultimoAniversario = new Date(
    agora.getFullYear(),
    criacao.getMonth(),
    criacao.getDate()
  );
  if (ultimoAniversario > agora) {
    ultimoAniversario.setFullYear(ultimoAniversario.getFullYear() - 1);
  }

  if (!lastLivenessAt) return true;

  const ultimaProva = new Date(lastLivenessAt);
  if (isNaN(ultimaProva.getTime())) return true;

  return ultimaProva < ultimoAniversario;
}