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

export const IDENTITY_MATCH_KEY = "identity_match";

export function normalizarDocumento(
  valor: string | number | null | undefined
): string {
  if (valor == null) return "";
  return String(valor).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

export type IdentityMatch = {
  documento: boolean;
  tipo: { ocr: string | null; cadastro: string | null };
  ok: boolean;
  document_number: string | null;
  tax_number: string | null;
  personal_number: string | null;
  identification_number: string | null;
};

type IdVerificationOcr = {
  document_number?: string | number | null;
  tax_number?: string | number | null;
  personal_number?: string | number | null;
  document_type?: string | number | null;
};

export function documentoConfere(
  decision: unknown,
  usuario: {
    identification_number?: string | null;
    identification_type?: string | null;
  }
): IdentityMatch {
  const idVerif = Array.isArray((decision as { id_verifications?: unknown })?.id_verifications)
    ? ((decision as { id_verifications?: unknown }).id_verifications as IdVerificationOcr[])[0]
    : undefined;

  const documentNumber =
    idVerif?.document_number != null ? String(idVerif.document_number) : null;
  const taxNumber =
    idVerif?.tax_number != null ? String(idVerif.tax_number) : null;
  const personalNumber =
    idVerif?.personal_number != null ? String(idVerif.personal_number) : null;

  const identificationNumber = usuario.identification_number ?? null;
  const cadastro = normalizarDocumento(identificationNumber);

  const documento =
    cadastro !== "" &&
    [documentNumber, taxNumber, personalNumber].some(
      (candidato) =>
        candidato != null && normalizarDocumento(candidato) === cadastro
    );

  return {
    documento,
    tipo: {
      ocr:
        idVerif?.document_type != null
          ? String(idVerif.document_type)
          : null,
      cadastro: usuario.identification_type ?? null,
    },
    ok: documento,
    document_number: documentNumber,
    tax_number: taxNumber,
    personal_number: personalNumber,
    identification_number: identificationNumber,
  };
}

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