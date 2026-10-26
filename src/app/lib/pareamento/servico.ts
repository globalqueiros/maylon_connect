import {
  apoioParaMotorista,
  avaliarCandidatos,
  OPCOES_SEM_MOTORISTA,
} from "./regras";
import {
  obterAcessibilidadeParaApoio,
  obterGeneros,
  obterPreferencias,
} from "./repositorio";

export const MAX_CANDIDATOS = 500;

export function idValido(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim() !== "" && valor.length <= 64;
}

/** Lista de ids válida (strings curtas), sem exceder o limite por chamada. */
export function listaDeIds(valor: unknown): string[] | null {
  if (!Array.isArray(valor) || valor.length > MAX_CANDIDATOS) return null;
  if (!valor.every(idValido)) return null;
  return [...new Set(valor as string[])];
}

/** Quais das motoristas candidatas podem atender esta passageira. */
export async function avaliarMotoristasParaPassageira(
  passageiroId: string,
  motoristaIds: string[],
  motoristaFemininaDestaCorrida?: boolean
) {
  const [generos, preferencias, acessibilidade] = await Promise.all([
    obterGeneros([passageiroId, ...motoristaIds]),
    obterPreferencias([passageiroId, ...motoristaIds]),
    obterAcessibilidadeParaApoio(passageiroId),
  ]);

  // O pedido desta corrida vale mais que o padrão salvo no perfil.
  const exigeMotoristaFeminina =
    motoristaFemininaDestaCorrida ??
    preferencias.get(passageiroId)?.motoristaFeminina ??
    false;

  const resultado = avaliarCandidatos(
    {
      genero: generos.get(passageiroId) ?? null,
      exigeMotoristaFeminina,
    },
    motoristaIds.map((id) => ({
      id,
      genero: generos.get(id) ?? null,
      somentePassageiras: preferencias.get(id)?.somentePassageiras ?? false,
    }))
  );

  return {
    exige_motorista_feminina: exigeMotoristaFeminina,
    elegiveis: resultado.elegiveis,
    descartados: resultado.descartados,
    sem_motorista_feminina: resultado.semMotoristaFeminina,
    opcoes_sem_motorista: resultado.semMotoristaFeminina
      ? OPCOES_SEM_MOTORISTA
      : [],
    apoio_viagem: apoioParaMotorista(acessibilidade),
  };
}

/** Quais passageiras esta motorista pode atender (preferência dos dois lados). */
export async function avaliarPassageirasParaMotorista(
  motoristaId: string,
  passageiroIds: string[]
) {
  const [generos, preferencias] = await Promise.all([
    obterGeneros([motoristaId, ...passageiroIds]),
    obterPreferencias([motoristaId, ...passageiroIds]),
  ]);

  const motorista = {
    id: motoristaId,
    genero: generos.get(motoristaId) ?? null,
    somentePassageiras: preferencias.get(motoristaId)?.somentePassageiras ?? false,
  };

  const permitidos: string[] = [];
  const bloqueados: { id: string; motivo: string }[] = [];

  for (const passageiroId of passageiroIds) {
    const resultado = avaliarCandidatos(
      {
        genero: generos.get(passageiroId) ?? null,
        exigeMotoristaFeminina:
          preferencias.get(passageiroId)?.motoristaFeminina ?? false,
      },
      [motorista]
    );

    if (resultado.elegiveis.length > 0) {
      permitidos.push(passageiroId);
    } else {
      bloqueados.push({
        id: passageiroId,
        motivo: resultado.descartados[0].motivo,
      });
    }
  }

  return { permitidos, bloqueados };
}
