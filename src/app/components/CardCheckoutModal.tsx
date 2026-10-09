"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { stripePromise } from "../lib/stripe";

interface Props {
  open: boolean;
  onClose: () => void;
  usuarioId: number;
  beneficioId: number;
  titulo: string;
  valor: string | number;
}

export default function CardCheckoutModal({
  open,
  onClose,
  usuarioId,
  beneficioId,
  titulo,
  valor,
}: Props) {
  const [bootLoading, setBootLoading] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const valorNumber = Number(String(valor).replace(",", ".")) || 0;
  const valorFormatado = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(valorNumber),
    [valorNumber]
  );

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setBootError(null);
      setBootLoading(false);
      return;
    }

    let cancelled = false;

    async function createEmbeddedSession() {
      setBootLoading(true);
      setBootError(null);
      setClientSecret(null);

      try {
        if (!stripePromise) {
          throw new Error(
            "Chave pública Stripe ausente (NEXT_PUBLIC_STRIPE_PUBLIC_KEY / NEXT_PUBLIC_STRIPE_KEY)."
          );
        }

        const meRes = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (!meRes.ok) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }
        const me = await meRes.json();
        const resolvedUserId = Number(me?.id);
        const resolvedBeneficioId = Number(beneficioId);

        if (!Number.isFinite(resolvedUserId) || resolvedUserId <= 0) {
          throw new Error("Usuário inválido. Faça login novamente.");
        }
        if (!Number.isFinite(resolvedBeneficioId) || resolvedBeneficioId <= 0) {
          throw new Error("Benefício inválido. Recarregue a página.");
        }

        const payload = {
          usuario_id: resolvedUserId || Number(usuarioId),
          beneficio_id: resolvedBeneficioId,
          titulo: String(titulo || ""),
          valor:
            valorNumber > 0
              ? valorNumber
              : String(valor ?? "").replace(",", "."),
        };

        const res = await fetch(
          `/api/stripe/checkout?usuario_id=${payload.usuario_id}&beneficio_id=${payload.beneficio_id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json();
        if (!res.ok || !data.clientSecret) {
          throw new Error(
            data.error || "Não foi possível iniciar o pagamento no portal"
          );
        }

        if (!cancelled) setClientSecret(String(data.clientSecret));
      } catch (err: any) {
        if (!cancelled) {
          setBootError(err?.message || "Erro ao preparar pagamento");
        }
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    }

    void createEmbeddedSession();
    return () => {
      cancelled = true;
    };
  }, [open, usuarioId, beneficioId, titulo, valor, valorNumber]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Pagamento com Cartão
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {titulo} · {valorFormatado}/mês · dentro do Portal Connect
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-[320px] flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              {bootLoading && (
                <div className="flex flex-col items-center gap-3 py-16 text-gray-600">
                  <Loader2 className="animate-spin" size={28} />
                  Preparando checkout no portal...
                </div>
              )}

              {bootError && (
                <div className="space-y-4 py-6">
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                    {bootError}
                  </p>
                  <button
                    onClick={onClose}
                    className="h-12 w-full rounded-2xl bg-gray-100 font-semibold text-gray-700"
                  >
                    Fechar
                  </button>
                </div>
              )}

              {!bootLoading && !bootError && clientSecret && stripePromise && (
                <div id="checkout" className="w-full">
                  <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{ clientSecret }}
                  >
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
