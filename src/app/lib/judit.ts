export type ProcessosJudiciaisStatus =
  | "nao_iniciado"
  | "pendente"
  | "em_analise"
  | "aprovado"
  | "reprovado";

export const JUDIT_API_URL = "https://lawsuits.production.judit.io";

export type JuditLawsuit = {
  code?: string | null;
  status?: string | null;
  tribunal_acronym?: string | null;
  [key: string]: unknown;
};

export type ConsultaProcessosResult =
  | {
      ok: true;
      hasLawsuits: boolean;
      total: number;
      data: JuditLawsuit[];
    }
  | {
      ok: false;
      error: "not_configured" | "request_failed" | "unexpected";
    };
