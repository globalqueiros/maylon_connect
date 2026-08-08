"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  CalendarDays,
  Receipt,
  Mail,
  Home,
  Download,
  User,
  Wallet,
} from "lucide-react";

type PaymentMethod = "card" | "pix";

function formatBRL(valor: string) {
  const n = Number(String(valor).replace(",", "."));
  if (Number.isNaN(n)) return valor;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

function PaymentSuccessContent() {
  const params = useSearchParams();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const method = (params.get("method") as PaymentMethod) || "card";
  const valor = params.get("valor") || "0";
  const titulo = params.get("titulo") || "Assinatura";
  const nome = params.get("nome") || "Cliente";
  const email = params.get("email") || "";
  const assinaturaId = params.get("assinatura_id") || "";
  const subscriptionId = params.get("subscription_id") || "";

  const order = useMemo(
    () =>
      assinaturaId
        ? `#ML${String(assinaturaId).padStart(10, "0")}`
        : `#ML${Date.now().toString().slice(-10)}`,
    [assinaturaId]
  );

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date()),
    []
  );

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: "Recibo-MaylonPass",
  });

  const handleDownloadReceipt = async () => {
    setLoadingPdf(true);
    try {
      handlePrint?.();
    } finally {
      setTimeout(() => setLoadingPdf(false), 2000);
    }
  };

  useEffect(() => {
    // limpa query da listagem se o usuário voltar
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div
        ref={receiptRef}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
      >
        <div className="border-b px-8 py-8 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Pagamento Confirmado
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {titulo} liberado com sucesso.
          </p>
        </div>

        <div className="space-y-3 border-b p-6 text-sm">
          <Info
            icon={<Receipt className="h-5 w-5" />}
            label="Pedido"
            value={order}
          />
          <Info
            icon={<Wallet className="h-5 w-5" />}
            label="Valor"
            value={formatBRL(valor)}
          />
          <Info
            icon={<CreditCard className="h-5 w-5" />}
            label="Método de Pagamento"
            value={method === "card" ? "Cartão" : "PIX"}
          />
          <Info
            icon={<CalendarDays className="h-5 w-5" />}
            label="Data e Hora"
            value={dateLabel}
          />
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Status de Pagamento</span>
            <span className="rounded-lg bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              Pago
            </span>
          </div>
        </div>

        <div className="border-b p-6">
          <h2 className="mb-4 font-semibold">Cliente</h2>
          <div className="flex items-start gap-3">
            <User className="mt-1 h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium">{nome}</p>
              {email && <p className="text-sm text-gray-500">{email}</p>}
            </div>
          </div>
        </div>

        {method === "card" && (
          <div className="border-b p-6">
            <h2 className="mb-4 font-semibold">Cartão</h2>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="font-medium">Cartão salvo para renovação mensal</p>
              <p className="text-sm text-gray-500">
                {subscriptionId
                  ? `Assinatura Stripe: ${subscriptionId}`
                  : "Cobrança recorrente ativa"}
              </p>
            </div>
          </div>
        )}

        {method === "pix" && (
          <div className="border-b p-6">
            <h2 className="mb-4 font-semibold">PIX</h2>
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-700">
                Autorização e 1ª mensalidade confirmadas
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3 p-6">
          <button
            onClick={handleDownloadReceipt}
            disabled={loadingPdf}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70"
          >
            <Download size={18} />
            {loadingPdf ? "Aguarde..." : "Baixar Recibo PDF"}
          </button>
          <button className="flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-6 py-3 font-semibold hover:bg-gray-50">
            <Mail size={18} />
            Enviar Recibo por Email
          </button>
          <Link
            href="/passageiro/beneficios"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 px-6 py-3 font-semibold hover:bg-gray-200"
          >
            <Home size={18} />
            Voltar para Benefícios
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-white">
          Carregando confirmação...
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
