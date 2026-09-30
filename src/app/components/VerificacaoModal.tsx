"use client";
import { useEffect, useState } from "react";
import { Eye, RefreshCw, ShieldCheck, X } from "lucide-react";
import { documentacaoBloqueia } from "../lib/didit";
import type { VerificacaoStatus } from "../lib/didit";

type ContextoVerificacao = "doc" | "anual";
type ModalStatus = "checking" | "idle" | "loading" | "open";

const botaoFechar = `flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700`;

type DadosVerificacao = {
  verification?: {
    documento?: { status?: VerificacaoStatus };
    prova_vida?: { devida?: boolean };
  };
};

export default function VerificacaoModal() {
  const [status, setStatus] = useState<ModalStatus>("checking");
  const [contexto, setContexto] = useState<ContextoVerificacao | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const decidir = (data: DadosVerificacao | null | undefined): ContextoVerificacao | "idle" => {
    const statusDoc = data?.verification?.documento?.status;
    const devida = Boolean(data?.verification?.prova_vida?.devida);

    if (statusDoc && documentacaoBloqueia(statusDoc)) return "doc";
    if (devida) return "anual";
    return "idle";
  };

  const verificarAlvo = async (): Promise<ContextoVerificacao | "idle"> => {
    try {
      const res = await fetch("/api/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return "idle";
      const data = await res.json();
      return decidir(data);
    } catch {
      return "idle";
    }
  };

  const abrirVerificacao = async (alvo: ContextoVerificacao) => {
    setAviso(null);
    setContexto(alvo);
    if (url) {
      setStatus("open");
      return;
    }
    try {
      setStatus("loading");
      const res = await fetch("/api/motorista/verificacao", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setAviso(data.message || "Erro ao iniciar a verificação.");
        setStatus("idle");
        setContexto(null);
        return;
      }
      if (data.url) {
        setUrl(data.url);
        setStatus("open");
      } else {
        setAviso("Não foi possível iniciar a verificação.");
        setStatus("idle");
        setContexto(null);
      }
    } catch {
      setAviso("Erro ao iniciar a verificação.");
      setStatus("idle");
      setContexto(null);
    }
  };

  useEffect(() => {
    let ativo = true;
    (async () => {
      const alvo = await verificarAlvo();
      if (!ativo) return;
      if (alvo === "idle") {
        setStatus("idle");
      } else {
        await abrirVerificacao(alvo);
      }
    })();
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== "open") return;
    const interval = setInterval(async () => {
      const alvo = await verificarAlvo();
      if (alvo === "idle") {
        setStatus("idle");
        setUrl(null);
        setContexto(null);
        setAviso(null);
      } else if (alvo !== contexto) {
        setContexto(alvo);
      }
    }, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, contexto]);

  const fechar = async () => {
    const alvo = await verificarAlvo();
    if (alvo !== "idle") {
      setContexto(alvo);
      setAviso(
        alvo === "anual"
          ? "A prova de vida ainda não foi concluída."
          : "A verificação de documentos ainda não foi concluída."
      );
      return;
    }
    setStatus("idle");
    setUrl(null);
    setContexto(null);
    setAviso(null);
  };

  if (status === "checking" || status === "idle") {
    return null;
  }

  if (status === "loading") {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/60 backdrop-blur-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f766e] shadow-xl shadow-[#0f766e]/20">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
        </div>
      </div>
    );
  }

  const ehAnual = contexto === "anual";
  const Icone = ehAnual ? Eye : ShieldCheck;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-gray-950/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-verificacao"
        className="flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[85vh] sm:rounded-3xl"
      >
        <div className="flex items-start gap-3.5 p-5 sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF6F4] text-[#149C8B]">
            <Icone size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="titulo-verificacao" className="text-lg font-semibold text-gray-900">
              {ehAnual ? "Prova de vida anual" : "Verificação de documentos"}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {ehAnual
                ? "Confirme sua identidade para continuar usando sua conta."
                : "Para ativar sua conta, conclua a verificação de documentos."}
            </p>
          </div>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            title="Fechar"
            className={botaoFechar}
          >
            <X size={19} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden px-5 pb-5 sm:px-6 sm:pb-6">
          {aviso && (
            <div
              role="alert"
              className="mb-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
            >
              <RefreshCw size={16} className="shrink-0" />
              {aviso}
            </div>
          )}
          {url && (
            <iframe
              src={url}
              title={ehAnual ? "Prova de vida" : "Verificação de documentos"}
              className="h-full w-full rounded-2xl border border-gray-200 bg-white"
              allow="camera; microphone; fullscreen; autoplay; encrypted-media; payment"
            />
          )}
        </div>
      </div>
    </div>
  );
}