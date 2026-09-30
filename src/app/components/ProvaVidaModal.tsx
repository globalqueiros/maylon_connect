"use client";
import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, X } from "lucide-react";

type ProvaVidaStatus = "checking" | "idle" | "loading" | "open";

const botaoFechar = `flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700`;

export default function ProvaVidaModal() {
  const [status, setStatus] = useState<ProvaVidaStatus>("checking");
  const [url, setUrl] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const verificarSeDevida = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data?.verification?.prova_vida?.devida);
    } catch {
      return false;
    }
  };

  const abrirVerificacao = async () => {
    setAviso(null);
    try {
      setStatus("loading");
      const res = await fetch("/api/motorista/verificacao", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setAviso(data.message || "Erro ao iniciar a prova de vida.");
        setStatus("idle");
        return;
      }
      if (data.url) {
        setUrl(data.url);
        setStatus("open");
      } else {
        setAviso("Não foi possível iniciar a prova de vida.");
        setStatus("idle");
      }
    } catch {
      setAviso("Erro ao iniciar a prova de vida.");
      setStatus("idle");
    }
  };

  useEffect(() => {
    let ativo = true;
    (async () => {
      const devida = await verificarSeDevida();
      if (!ativo) return;
      if (devida) {
        await abrirVerificacao();
      } else {
        setStatus("idle");
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (status !== "open") return;
    const interval = setInterval(async () => {
      const devida = await verificarSeDevida();
      if (!devida) {
        setStatus("idle");
        setUrl(null);
        setAviso(null);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [status]);

  const fechar = async () => {
    const devida = await verificarSeDevida();
    if (devida) {
      setAviso("A prova de vida ainda não foi concluída.");
      return;
    }
    setStatus("idle");
    setUrl(null);
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

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-gray-950/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-prova-vida"
        className="flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[85vh] sm:rounded-3xl"
      >
        <div className="flex items-start gap-3.5 p-5 sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF6F4] text-[#149C8B]">
            <ShieldCheck size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="titulo-prova-vida" className="text-lg font-semibold text-gray-900">
              Prova de vida anual
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Confirme sua identidade para continuar usando sua conta.
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
              title="Prova de vida"
              className="h-full w-full rounded-2xl border border-gray-200 bg-white"
              allow="camera; microphone; fullscreen; autoplay; encrypted-media; payment"
            />
          )}
        </div>
      </div>
    </div>
  );
}