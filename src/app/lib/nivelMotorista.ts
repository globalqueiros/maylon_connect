/**
 * Progresso do motorista no nível atual, com as mesmas regras do backend
 * Laravel (DriverLevelController::getDriverLevelWithTrip) e do app, que
 * soma os pontos conquistados e divide pela soma das metas do nível.
 */

/** O MySQL devolve DECIMAL como texto; os dois formatos são aceitos. */
type Valor = number | string | null;

export type NivelMetas = {
  targeted_ride?: Valor;
  targeted_ride_point?: Valor;
  targeted_amount?: Valor;
  targeted_amount_point?: Valor;
  targeted_cancel?: Valor;
  targeted_cancel_point?: Valor;
  targeted_review?: Valor;
  targeted_review_point?: Valor;
};

export type MetricasMotorista = {
  corridasConcluidas: number;
  /** Ganho líquido: corridas pagas menos a comissão da plataforma. */
  ganhos: number;
  /** Percentual de corridas canceladas sobre o total (0 a 100). */
  taxaCancelamento: number;
  avaliacoesFeitas: number;
};

export type ProgressoNivel = {
  pontos: number;
  total: number;
  percentual: number;
};

const n = (valor: unknown) => {
  const numero = Number(valor ?? 0);
  return Number.isFinite(numero) ? numero : 0;
};

/** round() do PHP: meio arredonda para longe do zero. */
const arredondar = (valor: number) => Math.sign(valor) * Math.round(Math.abs(valor));

function pontosDaMeta(meta: number, pontosMeta: number, alcancado: number) {
  if (meta <= alcancado) return pontosMeta;
  if (meta === 0) return pontosMeta;
  return arredondar((pontosMeta / meta) * alcancado);
}

export function taxaDeCancelamento(totalCorridas: number, canceladas: number) {
  return (n(canceladas) / (n(totalCorridas) === 0 ? 1 : n(totalCorridas))) * 100;
}

export function calcularProgressoNivel(
  nivel: NivelMetas,
  metricas: MetricasMotorista,
  nivelConcluido = false
): ProgressoNivel {
  const metaCancelamento = n(nivel.targeted_cancel);
  const pontosCancelamento = n(nivel.targeted_cancel_point);

  const total =
    n(nivel.targeted_ride_point) +
    n(nivel.targeted_amount_point) +
    pontosCancelamento +
    n(nivel.targeted_review_point);

  if (nivelConcluido) {
    return { pontos: total, total, percentual: 100 };
  }

  const pontosCancel =
    metaCancelamento <= metricas.taxaCancelamento && metaCancelamento !== 100
      ? arredondar((pontosCancelamento / (100 - metaCancelamento)) * metricas.taxaCancelamento)
      : pontosCancelamento;

  const pontos =
    pontosDaMeta(n(nivel.targeted_ride), n(nivel.targeted_ride_point), metricas.corridasConcluidas) +
    pontosDaMeta(n(nivel.targeted_amount), n(nivel.targeted_amount_point), metricas.ganhos) +
    pontosCancel +
    pontosDaMeta(n(nivel.targeted_review), n(nivel.targeted_review_point), metricas.avaliacoesFeitas);

  if (total <= 0) {
    return { pontos, total, percentual: 100 };
  }

  const percentual = Math.max(0, Math.min(100, Math.round((pontos / total) * 100)));

  return { pontos, total, percentual };
}
