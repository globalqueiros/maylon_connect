"use client";

import { useEffect } from "react";

// Pedidos que a própria pessoa faz para sair: durante eles um 401 é esperado
// e quem manda para o login é a tela de saída ("Deslogado com sucesso").
const ROTAS_DE_SAIDA = /^\/api\/(auth\/logout|logout|logout-all)\b/;
const ENCERRAR_SESSAO = /^\/api\/motorista\/sessoes\/[^/]+$/;

/**
 * Único ponto que trata sessão encerrada em outro aparelho (passageiro e
 * motorista). Quando uma chamada à nossa API volta 401, confere no /api/me;
 * se a sessão acabou mesmo, apaga os cookies e leva para o login com aviso,
 * em vez de deixar a tela mostrando erro até recarregar.
 */
export default function SessaoEncerradaWatcher() {
  useEffect(() => {
    const original = window.fetch;
    let saindoAte = 0;
    let conferindo = false;
    let encerrada = false;

    function caminhoDaApi(input: RequestInfo | URL): string {
      try {
        const bruto =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const url = new URL(bruto, window.location.href);
        return url.origin === window.location.origin ? url.pathname : "";
      } catch {
        return "";
      }
    }

    async function conferirSessao() {
      if (conferindo || encerrada) return;
      conferindo = true;
      try {
        const me = await original("/api/me", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (me.status !== 401 || Date.now() < saindoAte) return;

        encerrada = true;
        await original("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        }).catch(() => null);
        window.location.replace("/?sessao=encerrada");
      } catch {
        // sem rede: não faz nada, a tela segue como estava
      } finally {
        conferindo = false;
      }
    }

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const caminho = caminhoDaApi(input);
      const metodo = String(
        init?.method || (input instanceof Request ? input.method : "GET")
      ).toUpperCase();

      if (
        ROTAS_DE_SAIDA.test(caminho) ||
        (metodo === "DELETE" && ENCERRAR_SESSAO.test(caminho))
      ) {
        saindoAte = Date.now() + 10_000;
      }

      const res = await original(input, init);

      if (
        res.status === 401 &&
        caminho.startsWith("/api/") &&
        Date.now() >= saindoAte
      ) {
        void conferirSessao();
      }

      return res;
    };

    return () => {
      window.fetch = original;
    };
  }, []);

  return null;
}
