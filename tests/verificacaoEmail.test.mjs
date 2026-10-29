import assert from "node:assert/strict";
import { test } from "node:test";

import {
  conferirDesafio,
  criarDesafio,
  gerarCodigo,
  INTERVALO_REENVIO_MS,
  reenvioBloqueado,
  VALIDADE_CODIGO_MS,
} from "../src/app/lib/verificacaoEmail.ts";

const segredo = "segredo-de-teste";
const uid = "5f1c2d3e-0000-4000-8000-000000000001";
const email = "motorista@exemplo.com";
const agora = 1_800_000_000_000;

const desafio = (extra = {}) =>
  criarDesafio({ segredo, uid, email, codigo: "123456", agora, ...extra });

const conferir = (token, extra = {}) =>
  conferirDesafio({ segredo, token, uid, email, codigo: "123456", agora: agora + 1000, ...extra });

test("código certo, da mesma conta e dentro do prazo, confirma", () => {
  assert.equal(conferir(desafio()).ok, true);
});

test("e-mail com maiúsculas ou espaços conta como o mesmo", () => {
  assert.equal(conferir(desafio({ email: "  Motorista@Exemplo.com " })).ok, true);
});

test("código errado não confirma e informa o desafio para contar tentativas", () => {
  const resultado = conferir(desafio(), { codigo: "654321" });
  assert.equal(resultado.ok, false);
  assert.equal(resultado.motivo, "codigo_errado");
  assert.ok(resultado.id);
});

test("código vencido não confirma", () => {
  const resultado = conferir(desafio(), { agora: agora + VALIDADE_CODIGO_MS + 1 });
  assert.equal(resultado.motivo, "expirado");
});

test("desafio de outra conta ou de outro e-mail não vale", () => {
  assert.equal(conferir(desafio(), { uid: "outra-conta" }).motivo, "invalido");
  assert.equal(conferir(desafio(), { email: "outro@exemplo.com" }).motivo, "invalido");
});

test("sem cookie, cookie alterado ou assinado com outro segredo não vale", () => {
  assert.equal(conferir(undefined).motivo, "invalido");

  const [conteudo, assinatura] = desafio().split(".");
  const alterado = JSON.parse(Buffer.from(conteudo, "base64url").toString());
  alterado.uid = "outra-conta";
  const forjado = `${Buffer.from(JSON.stringify(alterado)).toString("base64url")}.${assinatura}`;
  assert.equal(conferir(forjado, { uid: "outra-conta" }).motivo, "invalido");

  const deOutroServidor = criarDesafio({ segredo: "outro", uid, email, codigo: "123456", agora });
  assert.equal(conferir(deOutroServidor).motivo, "invalido");
});

test("o cookie não carrega o código em texto", () => {
  const token = desafio({ codigo: "987654" });
  const conteudo = Buffer.from(token.split(".")[0], "base64url").toString();
  assert.equal(conteudo.includes("987654"), false);
});

test("reenvio só depois de um minuto, e só conta para a mesma conta", () => {
  const token = desafio();
  assert.equal(reenvioBloqueado({ segredo, token, uid, email, agora: agora + 1000 }), true);
  assert.equal(
    reenvioBloqueado({ segredo, token, uid, email, agora: agora + INTERVALO_REENVIO_MS }),
    false
  );
  assert.equal(reenvioBloqueado({ segredo, token, uid: "outra", email, agora }), false);
  assert.equal(reenvioBloqueado({ segredo, token: undefined, uid, email, agora }), false);
});

test("código gerado tem sempre 6 números", () => {
  for (let i = 0; i < 200; i++) assert.match(gerarCodigo(), /^\d{6}$/);
});
