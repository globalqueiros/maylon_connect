"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, ShieldCheck, Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valorNumber = Number(String(valor).replace(",", ".")) || 0;
  const valorFormatado = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorNumber);

  async function pagar() {
    setLoading(true);
    setError(null);

    try {
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

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          usuario_id: resolvedUserId || Number(usuarioId),
          beneficio_id: resolvedBeneficioId,
          titulo: String(titulo || ""),
          valor: valorNumber > 0 ? valorNumber : String(valor ?? "").replace(",", "."),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        console.error("Stripe checkout failed:", data);
        throw new Error(data.error || "Não foi possível iniciar o pagamento");
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err?.message || "Erro ao processar pagamento");
      setLoading(false);
    }
  }

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
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
            >
              <X size={20} />
            </button>

            <h2 className="mb-6 text-center text-xl font-bold text-gray-900">
              Pagamento com Cartão
            </h2>

            <div className="relative h-52 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-500 p-6 text-white shadow-xl">
              <div className="flex justify-between">
                <div className="h-7 w-10 rounded-md bg-yellow-200" />
                <span className="text-xl font-black">STRIPE</span>
              </div>
              <p className="mt-10 text-lg font-semibold leading-snug">
                {titulo}
              </p>
              <div className="absolute bottom-6 left-6 right-6 flex justify-between">
                <div>
                  <p className="text-xs opacity-70">ASSINATURA MENSAL</p>
                  <p className="font-semibold">{valorFormatado}</p>
                </div>
                <div>
                  <p className="text-xs opacity-70">CARTÃO</p>
                  <p className="font-semibold">Salvo p/ recorrência</p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
              <p>
                Você será redirecionado ao checkout seguro da Stripe para pagar a
                primeira mensalidade. O cartão ficará salvo automaticamente para
                as próximas cobranças.
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-600" />
                Pagamento protegido
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Lock size={18} />
                Dados criptografados pela Stripe
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              onClick={pagar}
              disabled={loading}
              className="mt-5 flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#009688] font-bold text-white transition hover:bg-[#00796b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Redirecionando...
                </>
              ) : (
                `Pagar ${valorFormatado}`
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
