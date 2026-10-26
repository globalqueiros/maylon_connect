import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import {
  identificarNoLaravel,
  limparCacheLaravel,
  tokenBearer,
} from "../src/app/lib/pareamento/laravel.ts";

const BASE = "https://laravel.exemplo";

/** fetch simulado: mapa caminho -> corpo (200) ou status de erro. */
function fakeFetch(rotas, chamadas = []) {
  return async (url, init) => {
    chamadas.push({ url, auth: init.headers.Authorization });
    const caminho = url.replace(BASE, "");
    const resposta = rotas[caminho];

    if (typeof resposta === "number") {
      return { ok: false, status: resposta, json: async () => ({}) };
    }
    if (resposta instanceof Error) throw resposta;

    return { ok: true, status: 200, json: async () => resposta };
  };
}

beforeEach(() => limparCacheLaravel());

test("tokenBearer lê só o formato 'Bearer x'", () => {
  const com = (valor) =>
    new Request("http://x", { headers: valor ? { authorization: valor } : {} });

  assert.equal(tokenBearer(com("Bearer abc")), "abc");
  assert.equal(tokenBearer(com("bearer abc")), "abc");
  assert.equal(tokenBearer(com("Basic abc")), null);
  assert.equal(tokenBearer(com("Bearer")), null);
  assert.equal(tokenBearer(com(null)), null);
});

test("token de passageira é reconhecido pelo /customer/info", async () => {
  const chamadas = [];
  const usuario = await identificarNoLaravel("tok-p", {
    baseUrl: BASE,
    fetchImpl: fakeFetch(
      { "/api/customer/info": { data: { id: "uuid-p" } } },
      chamadas
    ),
  });

  assert.deepEqual(usuario, { id: "uuid-p", tipo: "customer" });
  assert.equal(chamadas.length, 1);
  assert.equal(chamadas[0].auth, "Bearer tok-p");
});

test("token de motorista cai no /driver/info quando o de passageira recusa", async () => {
  const usuario = await identificarNoLaravel("tok-m", {
    baseUrl: BASE,
    fetchImpl: fakeFetch({
      "/api/customer/info": 403,
      "/api/driver/info": { data: { id: "uuid-m" } },
    }),
  });

  assert.deepEqual(usuario, { id: "uuid-m", tipo: "driver" });
});

test("token inválido, resposta sem id ou erro de rede não autenticam", async () => {
  for (const rotas of [
    { "/api/customer/info": 401, "/api/driver/info": 401 },
    { "/api/customer/info": { data: {} }, "/api/driver/info": { data: null } },
    {
      "/api/customer/info": new Error("rede"),
      "/api/driver/info": new Error("rede"),
    },
  ]) {
    limparCacheLaravel();
    const usuario = await identificarNoLaravel("tok", {
      baseUrl: BASE,
      fetchImpl: fakeFetch(rotas),
    });
    assert.equal(usuario, null);
  }
});

test("resultado fica em cache por token e expira", async () => {
  const chamadas = [];
  let agora = 1_000;
  const opcoes = {
    baseUrl: BASE,
    agora: () => agora,
    fetchImpl: fakeFetch(
      { "/api/customer/info": { data: { id: "uuid-p" } } },
      chamadas
    ),
  };

  await identificarNoLaravel("tok", opcoes);
  await identificarNoLaravel("tok", opcoes);
  assert.equal(chamadas.length, 1);

  await identificarNoLaravel("outro", opcoes);
  assert.equal(chamadas.length, 2);

  agora += 61_000;
  await identificarNoLaravel("tok", opcoes);
  assert.equal(chamadas.length, 3);
});
