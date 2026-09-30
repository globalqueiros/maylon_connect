export type VerificacaoStatus =
  | "nao_iniciado"
  | "pendente"
  | "em_analise"
  | "aprovado"
  | "reprovado";

export const DIDIT_WORKFLOW_ID =
  "2fe65fd9-53ee-40ee-91e3-5e8af06fdd90";

export const DIDIT_API_URL = "https://verification.didit.me";

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