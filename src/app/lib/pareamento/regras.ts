import type { Genero } from "./genero";

export type PassageiroPedido = {
  genero: Genero | null;
  /** A passageira quer motorista mulher nesta corrida. */
  exigeMotoristaFeminina: boolean;
};

export type CandidatoMotorista = {
  id: string;
  /** Só vale como feminino se o gênero estiver confirmado. */
  genero: Genero | null;
  /** A motorista marcou que só quer passageiras. */
  somentePassageiras: boolean;
};

export type MotivoDescarte =
  | "motorista_nao_confirmada_feminina"
  | "motorista_atende_somente_passageiras";

export type Descartado = { id: string; motivo: MotivoDescarte };

export type ResultadoPareamento = {
  elegiveis: string[];
  descartados: Descartado[];
  /**
   * A passageira pediu motorista mulher e nenhuma candidata serve. O app deve
   * avisar e deixar ela escolher; nunca oferecer outro motorista em silêncio.
   */
  semMotoristaFeminina: boolean;
};

export const OPCOES_SEM_MOTORISTA = [
  "esperar",
  "ampliar_busca",
  "cancelar",
] as const;

/**
 * Filtra as candidatas já encontradas pelo raio de busca do app. Não decide
 * ordem nem distância: só tira quem não pode atender esta corrida.
 */
export function avaliarCandidatos(
  passageiro: PassageiroPedido,
  candidatos: CandidatoMotorista[]
): ResultadoPareamento {
  const elegiveis: string[] = [];
  const descartados: Descartado[] = [];

  for (const candidato of candidatos) {
    if (
      passageiro.exigeMotoristaFeminina &&
      candidato.genero !== "feminino"
    ) {
      descartados.push({
        id: candidato.id,
        motivo: "motorista_nao_confirmada_feminina",
      });
      continue;
    }

    if (candidato.somentePassageiras && passageiro.genero !== "feminino") {
      descartados.push({
        id: candidato.id,
        motivo: "motorista_atende_somente_passageiras",
      });
      continue;
    }

    elegiveis.push(candidato.id);
  }

  return {
    elegiveis,
    descartados,
    semMotoristaFeminina:
      passageiro.exigeMotoristaFeminina && elegiveis.length === 0,
  };
}

export type ApoioViagem = {
  viagem_silenciosa: true;
  evitar_mudanca_de_rota: true;
};

/**
 * O motorista recebe só preferências de conduta, nunca o diagnóstico nem o
 * laudo: o dado de saúde fica com a passageira. Solicitação reprovada na
 * análise não gera apoio.
 */
export function apoioParaMotorista(acessibilidade: {
  autista: boolean;
  autistaStatus: string | null;
} | null): ApoioViagem | null {
  if (!acessibilidade?.autista) return null;

  const status = String(acessibilidade.autistaStatus ?? "")
    .trim()
    .toLowerCase();
  if (status === "reprovado" || status === "nao_solicitado") return null;

  return { viagem_silenciosa: true, evitar_mudanca_de_rota: true };
}
