"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Loader2,
  X,
} from "lucide-react";

type BeneficioInfo = {
  id: number;
  titulo: string;
  valor: string | number;
};

type UsuarioInfo = {
  id: number;
  full_name?: string;
  email?: string;
};

type Stage = "autorizacao" | "primeira_mensalidade";

interface Props {
  open: boolean;
  onClose: () => void;
  usuario: UsuarioInfo | null;
  beneficio: BeneficioInfo | null;
}

function formatBRL(valor: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor));
}

export default function PixCheckoutModal({
  open,
  onClose,
  usuario,
  beneficio,
}: Props) {
  const [stage, setStage] = useState<Stage>("autorizacao");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assinaturaId, setAssinaturaId] = useState<number | null>(null);
  const [emv, setEmv] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      setStage("autorizacao");
      setLoading(false);
      setPolling(false);
      setError(null);
      setAssinaturaId(null);
      setEmv(null);
      setQrUrl(null);
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !usuario || !beneficio || startedRef.current) return;
    startedRef.current = true;
    void startAuthorization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, usuario, beneficio]);

  useEffect(() => {
    if (!open || !assinaturaId || !polling) return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/pix/status?assinatura_id=${assinaturaId}`
        );
        const data = await res.json();
        if (!res.ok) return;

        if (data.rejected) {
          setPolling(false);
          window.location.href =
            `/passageiro/beneficios/pagamento/recusado?method=pix` +
            `&valor=${encodeURIComponent(String(beneficio?.valor || ""))}` +
            `&titulo=${encodeURIComponent(beneficio?.titulo || "")}` +
            `&motivo=${encodeURIComponent("Autorização ou pagamento Pix recusado")}` +
            `&codigo=pix_rejected`;
          return;
        }

        if (
          stage === "autorizacao" &&
          (data.stage === "autorizacao_aprovada" ||
            data.status === "aguardando_pagamento")
        ) {
          setPolling(false);
          await startFirstCharge(assinaturaId);
          return;
        }

        if (data.approved || data.stage === "concluido") {
          setPolling(false);
          window.location.href =
            `/passageiro/beneficios/pagamento/sucesso?method=pix` +
            `&valor=${encodeURIComponent(String(beneficio?.valor || ""))}` +
            `&titulo=${encodeURIComponent(beneficio?.titulo || "")}` +
            `&assinatura_id=${encodeURIComponent(String(assinaturaId))}` +
            `&nome=${encodeURIComponent(usuario?.full_name || "")}` +
            `&email=${encodeURIComponent(usuario?.email || "")}`;
        }
      } catch {
        // keep polling
      }
    }, 4000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, assinaturaId, polling, stage]);

  async function startAuthorization() {
    if (!usuario || !beneficio) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pix/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: usuario.id,
          beneficio_id: beneficio.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar autorização");

      setAssinaturaId(data.assinaturaId);
      setEmv(data.emv);
      setQrUrl(data.qrUrl);
      setStage("autorizacao");
      setPolling(true);
    } catch (err: any) {
      setError(err?.message || "Falha ao iniciar Pix");
    } finally {
      setLoading(false);
    }
  }

  async function startFirstCharge(id: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pix/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assinatura_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar 1ª mensalidade");

      setStage("primeira_mensalidade");
      setEmv(data.emv);
      setQrUrl(data.qrUrl);
      setPolling(true);
    } catch (err: any) {
      setError(err?.message || "Falha ao gerar cobrança da 1ª mensalidade");
    } finally {
      setLoading(false);
    }
  }

  async function copyEmv() {
    if (!emv) return;
    await navigator.clipboard.writeText(emv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const title =
    stage === "autorizacao"
      ? "1/2 · Autorização Pix Automático"
      : "2/2 · Pagar primeira mensalidade";

  const subtitle =
    stage === "autorizacao"
      ? "Escaneie o QR Code para autorizar o débito mensal automático."
      : "Autorização aprovada. Agora pague a primeira mensalidade.";

  return (
    <AnimatePresence>
      {open && usuario && beneficio && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600"
            >
              <X size={18} />
            </button>

            <h2 className="text-center text-2xl font-bold text-gray-900">
              {title}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              {subtitle}
            </p>
            <p className="mt-1 text-center text-sm font-semibold text-teal-700">
              {beneficio.titulo} · {formatBRL(beneficio.valor)}/mês
            </p>

            <div className="my-6 flex justify-center">
              <div className="flex h-56 w-56 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                {loading && !qrUrl && !emv ? (
                  <Loader2 className="animate-spin text-teal-600" size={32} />
                ) : qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrUrl}
                    alt="QR Code Pix"
                    className="h-full w-full object-contain"
                  />
                ) : emv ? (
                  <div className="p-3 text-center text-xs text-gray-500">
                    Use o Pix Copia e Cola abaixo
                  </div>
                ) : (
                  <span className="text-gray-400">QR CODE</span>
                )}
              </div>
            </div>

            {emv && (
              <button
                onClick={copyEmv}
                className="mb-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                {copied ? (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Código copiado
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copiar Pix Copia e Cola
                  </>
                )}
              </button>
            )}

            {(polling || loading) && (
              <div className="mb-4 flex items-center justify-center gap-2 text-sm text-teal-700">
                <Loader2 className="animate-spin" size={16} />
                Aguardando confirmação do banco...
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
                <button
                  onClick={() => {
                    startedRef.current = false;
                    void startAuthorization();
                  }}
                  className="mt-2 block font-semibold underline"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full cursor-pointer rounded-xl border py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
