import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ehTipoMotorista,
  normalizarGenero,
} from "../src/app/lib/pareamento/genero.ts";
import {
  apoioParaMotorista,
  avaliarCandidatos,
} from "../src/app/lib/pareamento/regras.ts";

const mulher = (id, extra = {}) => ({
  id,
  genero: "feminino",
  somentePassageiras: false,
  ...extra,
});
const homem = (id, extra = {}) => ({
  id,
  genero: "masculino",
  somentePassageiras: false,
  ...extra,
});
const semGenero = (id) => ({
  id,
  genero: null,
  somentePassageiras: false,
});

test("normalizarGenero reconhece cadastro e documento, e rejeita o resto", () => {
  assert.equal(normalizarGenero("F"), "feminino");
  assert.equal(normalizarGenero(" female "), "feminino");
  assert.equal(normalizarGenero("Feminino"), "feminino");
  assert.equal(normalizarGenero("M"), "masculino");
  assert.equal(normalizarGenero("male"), "masculino");
  assert.equal(normalizarGenero("X"), "outro");
  assert.equal(normalizarGenero(""), null);
  assert.equal(normalizarGenero("2"), null);
  assert.equal(normalizarGenero(2), null);
  assert.equal(normalizarGenero(null), null);
});

test("ehTipoMotorista", () => {
  assert.equal(ehTipoMotorista("driver"), true);
  assert.equal(ehTipoMotorista(" Motorista "), true);
  assert.equal(ehTipoMotorista("customer"), false);
  assert.equal(ehTipoMotorista(undefined), false);
});

test("sem preferência, todo mundo é elegível", () => {
  const r = avaliarCandidatos(
    { genero: "feminino", exigeMotoristaFeminina: false },
    [mulher("a"), homem("b"), semGenero("c")]
  );

  assert.deepEqual(r.elegiveis, ["a", "b", "c"]);
  assert.deepEqual(r.descartados, []);
  assert.equal(r.semMotoristaFeminina, false);
});

test("passageira que pede motorista mulher só recebe motorista confirmada feminina", () => {
  const r = avaliarCandidatos(
    { genero: "feminino", exigeMotoristaFeminina: true },
    [homem("h"), mulher("m"), semGenero("s"), { ...homem("o"), genero: "outro" }]
  );

  assert.deepEqual(r.elegiveis, ["m"]);
  assert.deepEqual(
    r.descartados.map((d) => d.id),
    ["h", "s", "o"]
  );
  assert.ok(
    r.descartados.every(
      (d) => d.motivo === "motorista_nao_confirmada_feminina"
    )
  );
  assert.equal(r.semMotoristaFeminina, false);
});

test("sem nenhuma motorista, avisa e não devolve motorista homem", () => {
  const r = avaliarCandidatos(
    { genero: "feminino", exigeMotoristaFeminina: true },
    [homem("h1"), homem("h2"), semGenero("s")]
  );

  assert.deepEqual(r.elegiveis, []);
  assert.equal(r.semMotoristaFeminina, true);
});

test("sem candidatos e sem pedido de motorista mulher não é 'sem motorista feminina'", () => {
  const r = avaliarCandidatos(
    { genero: "masculino", exigeMotoristaFeminina: false },
    []
  );

  assert.equal(r.semMotoristaFeminina, false);
});

test("motorista 'somente passageiras' não recebe homem nem passageiro sem gênero confirmado", () => {
  const candidatos = [mulher("so-mulheres", { somentePassageiras: true })];

  for (const genero of ["masculino", "outro", null]) {
    const r = avaliarCandidatos(
      { genero, exigeMotoristaFeminina: false },
      candidatos
    );

    assert.deepEqual(r.elegiveis, [], `genero=${genero}`);
    assert.equal(r.descartados[0].motivo, "motorista_atende_somente_passageiras");
  }
});

test("motorista 'somente passageiras' recebe passageira confirmada", () => {
  const r = avaliarCandidatos(
    { genero: "feminino", exigeMotoristaFeminina: false },
    [mulher("so-mulheres", { somentePassageiras: true }), homem("h")]
  );

  assert.deepEqual(r.elegiveis, ["so-mulheres", "h"]);
});

test("as duas preferências juntas: passageira exige mulher e motorista só passageira", () => {
  const r = avaliarCandidatos(
    { genero: "feminino", exigeMotoristaFeminina: true },
    [mulher("so-mulheres", { somentePassageiras: true }), mulher("normal"), homem("h")]
  );

  assert.deepEqual(r.elegiveis, ["so-mulheres", "normal"]);
});

test("apoio ao passageiro com autismo expõe só preferências, nunca diagnóstico", () => {
  const apoio = apoioParaMotorista({ autista: true, autistaStatus: "pendente" });

  assert.deepEqual(apoio, {
    viagem_silenciosa: true,
    evitar_mudanca_de_rota: true,
  });
  assert.deepEqual(
    apoioParaMotorista({ autista: true, autistaStatus: "aprovado" }),
    apoio
  );
});

test("sem apoio quando não pediu, não existe registro ou a análise reprovou", () => {
  assert.equal(apoioParaMotorista(null), null);
  assert.equal(
    apoioParaMotorista({ autista: false, autistaStatus: "nao_solicitado" }),
    null
  );
  assert.equal(
    apoioParaMotorista({ autista: true, autistaStatus: "reprovado" }),
    null
  );
});
