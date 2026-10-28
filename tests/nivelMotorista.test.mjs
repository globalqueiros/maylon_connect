import assert from "node:assert/strict";
import { test } from "node:test";

import {
  calcularProgressoNivel,
  taxaDeCancelamento,
} from "../src/app/lib/nivelMotorista.ts";

// Metas como no painel: 10 corridas, R$ 100 de ganho, até 10% de cancelamento e 5 avaliações.
const nivel = {
  targeted_ride: 10,
  targeted_ride_point: 50,
  targeted_amount: 100,
  targeted_amount_point: 30,
  targeted_cancel: 10,
  targeted_cancel_point: 10,
  targeted_review: 5,
  targeted_review_point: 10,
};

const metricas = (extra = {}) => ({
  corridasConcluidas: 0,
  ganhos: 0,
  taxaCancelamento: 0,
  avaliacoesFeitas: 0,
  ...extra,
});

test("motorista começando o nível só tem os pontos de cancelamento", () => {
  assert.deepEqual(calcularProgressoNivel(nivel, metricas()), {
    pontos: 10,
    total: 100,
    percentual: 10,
  });
});

test("metade das metas dá pontos proporcionais", () => {
  const progresso = calcularProgressoNivel(
    nivel,
    metricas({ corridasConcluidas: 5, ganhos: 50, avaliacoesFeitas: 5 })
  );

  assert.deepEqual(progresso, { pontos: 60, total: 100, percentual: 60 });
});

test("metas batidas chegam a 100% e passar da meta não estoura", () => {
  const progresso = calcularProgressoNivel(
    nivel,
    metricas({ corridasConcluidas: 40, ganhos: 900, avaliacoesFeitas: 30 })
  );

  assert.deepEqual(progresso, { pontos: 100, total: 100, percentual: 100 });
});

test("nível já concluído no histórico fica em 100%", () => {
  assert.equal(calcularProgressoNivel(nivel, metricas(), true).percentual, 100);
});

test("nível sem metas não divide por zero", () => {
  assert.equal(calcularProgressoNivel({}, metricas()).percentual, 100);
});

test("cancelamento segue a conta do backend", () => {
  // Acima do limite: pontos proporcionais à taxa, como no Laravel.
  assert.equal(
    calcularProgressoNivel(nivel, metricas({ taxaCancelamento: 45 })).pontos,
    5
  );
  // Meta 0% com taxa 0: o backend dá 0 pontos e o app mostra o mesmo.
  assert.equal(
    calcularProgressoNivel(
      { targeted_cancel: 0, targeted_cancel_point: 10 },
      metricas()
    ).pontos,
    0
  );
});

test("valores vindos do banco como texto são aceitos", () => {
  const doBanco = Object.fromEntries(
    Object.entries(nivel).map(([chave, valor]) => [chave, String(valor)])
  );

  assert.equal(
    calcularProgressoNivel(doBanco, metricas({ corridasConcluidas: 5 })).pontos,
    35
  );
});

test("arredonda como o PHP (meio para cima)", () => {
  const progresso = calcularProgressoNivel(
    { targeted_ride: 4, targeted_ride_point: 10 },
    metricas({ corridasConcluidas: 1 })
  );

  assert.equal(progresso.pontos, 3);
});

test("taxa de cancelamento sobre o total de corridas", () => {
  assert.equal(taxaDeCancelamento(0, 0), 0);
  assert.equal(taxaDeCancelamento(10, 4), 40);
});
