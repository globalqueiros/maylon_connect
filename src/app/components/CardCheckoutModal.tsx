"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lock,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  Elements,
  CardElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { stripePromise } from "../lib/stripe";

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

function CheckoutInner({
  usuario,
  beneficio,
  onClose,
}: {
  usuario: UsuarioInfo;
  beneficio: BeneficioInfo;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState(usuario.full_name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: usuario.id,
          beneficio_id: beneficio.id,
          titulo: beneficio.titulo,
          valor: beneficio.valor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao iniciar pagamento");
      }

      const card = elements.getElement(CardElement);
      if (!card) {
        throw new Error("Cartão inválido");
      }

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: name || usuario.full_name || undefined,
            email: usuario.email || undefined,
          },
        },
      });

      if (result.error) {
        const code = result.error.code || "card_declined";
        const message =
          result.error.message || "Pagamento recusado";
        window.location.href =
          `/passageiro/beneficios/pagamento/recusado?method=card` +
          `&valor=${encodeURIComponent(String(beneficio.valor))}` +
          `&titulo=${encodeURIComponent(beneficio.titulo)}` +
          `&motivo=${encodeURIComponent(message)}` +
          `&codigo=${encodeURIComponent(code)}`;
        return;
      }

      if (
        result.paymentIntent?.status === "succeeded" ||
        result.paymentIntent?.status === "processing"
      ) {
        try {
          await fetch("/api/stripe/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscriptionId: data.subscriptionId,
              assinaturaId: data.assinaturaId,
            }),
          });
        } catch {
          // webhook ainda pode concluir
        }

        window.location.href =
          `/passageiro/beneficios/pagamento/sucesso?method=card` +
          `&valor=${encodeURIComponent(String(beneficio.valor))}` +
          `&titulo=${encodeURIComponent(beneficio.titulo)}` +
          `&assinatura_id=${encodeURIComponent(String(data.assinaturaId || ""))}` +
          `&subscription_id=${encodeURIComponent(String(data.subscriptionId || ""))}` +
          `&nome=${encodeURIComponent(usuario.full_name || "")}` +
          `&email=${encodeURIComponent(usuario.email || "")}`;
        return;
      }

      throw new Error("Pagamento não concluído");
    } catch (err: any) {
      setError(err?.message || "Falha ao processar pagamento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-gray-800">
          Nome no cartão
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
          placeholder="NOME COMPLETO"
          className="mt-2 h-12 w-full rounded-xl border px-4 uppercase outline-none focus:border-teal-600"
          required
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-800">
          Dados do cartão
        </label>
        <div className="mt-2 rounded-xl border px-4 py-3">
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: "16px",
                  color: "#111827",
                  "::placeholder": { color: "#9ca3af" },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-green-600" />
          Pagamento protegido pela Stripe
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Lock size={18} />
          Cartão salvo com segurança para as próximas mensalidades
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="mt-1 flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#009688] font-bold text-white transition hover:bg-[#00796b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Processando...
          </>
        ) : (
          `Pagar ${formatBRL(beneficio.valor)}`
        )}
      </button>

      <button
        type="button"
        onClick={onClose}
        className="h-12 w-full cursor-pointer rounded-2xl border font-semibold text-gray-700 hover:bg-gray-50"
      >
        Cancelar
      </button>
    </form>
  );
}

export default function CardCheckoutModal({
  open,
  onClose,
  usuario,
  beneficio,
}: Props) {
  const options = useMemo(
    () => ({
      appearance: {
        theme: "stripe" as const,
      },
    }),
    []
  );

  return (
    <AnimatePresence>
      {open && usuario && beneficio && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-md"
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

            <h2 className="mb-2 text-center text-xl font-bold text-gray-900">
              Pagamento com Cartão
            </h2>
            <p className="mb-6 text-center text-sm text-gray-500">
              {beneficio.titulo} · cobrança mensal recorrente
            </p>

            <div className="relative mb-6 h-40 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-500 p-6 text-white shadow-xl">
              <p className="text-xs uppercase tracking-widest text-white/80">
                Assinatura
              </p>
              <p className="mt-3 text-2xl font-bold">
                {formatBRL(beneficio.valor)}
                <span className="text-sm font-medium text-white/80"> /mês</span>
              </p>
              <p className="mt-6 text-sm text-white/90">
                1ª mensalidade agora · cartão salvo para renovação
              </p>
            </div>

            <Elements stripe={stripePromise} options={options}>
              <CheckoutInner
                usuario={usuario}
                beneficio={beneficio}
                onClose={onClose}
              />
            </Elements>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
