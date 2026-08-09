"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useReactToPrint } from "react-to-print";
import { useSearchParams } from "next/navigation";
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
  Loader2,
} from "lucide-react";
import ReceiptDoc from "./recibo/page";

type PaymentMethod = "card" | "pix";

type PaymentInfo = {
  pedido: string;
  amount_formatted: string;
  method: PaymentMethod;
  date: string;
  customer: { name: string; email: string };
  card?: { brand?: string; last4?: string };
  transaction_id?: string;
};

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const method = (searchParams.get("method") as PaymentMethod) || "card";
  const sessionId = searchParams.get("session_id");
  const pedidoParam = searchParams.get("pedido");
  const valorParam = searchParams.get("valor");

  const receiptRef = useRef<HTMLDivElement>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [info, setInfo] = useState<PaymentInfo>({
    pedido: pedidoParam || "—",
    amount_formatted: valorParam
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(Number(valorParam))
      : "—",
    method,
    date: new Date().toLocaleString("pt-BR"),
    customer: { name: "—", email: "—" },
    card: {},
  });

  useEffect(() => {
    const load = async () => {
      try {
        if (sessionId) {
          const res = await fetch(
            `/api/stripe/session?session_id=${encodeURIComponent(sessionId)}&pedido=${encodeURIComponent(pedidoParam || "")}`,
            { credentials: "include" }
          );
          const data = await res.json();
          if (res.ok) {
            setInfo({
              pedido: data.pedido || pedidoParam || sessionId,
              amount_formatted: data.amount_formatted,
              method: "card",
              date: data.date,
              customer: data.customer || { name: "—", email: "—" },
              card: data.card || {},
              transaction_id: data.transaction_id,
            });
          }
        } else if (pedidoParam && method === "pix") {
          const me = await fetch("/api/me", { credentials: "include" });
          const user = me.ok ? await me.json() : null;
          setInfo((prev) => ({
            ...prev,
            pedido: pedidoParam,
            method: "pix",
            customer: {
              name: user?.full_name || "—",
              email: user?.email || "—",
            },
          }));
        } else {
          const me = await fetch("/api/me", { credentials: "include" });
          if (me.ok) {
            const user = await me.json();
            setInfo((prev) => ({
              ...prev,
              customer: {
                name: user.full_name || "—",
                email: user.email || "—",
              },
            }));
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [sessionId, pedidoParam, method]);

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

  const cardLabel = info.card?.brand
    ? `${info.card.brand.toUpperCase()} **** ${info.card.last4 || "****"}`
    : "Cartão";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <>
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
              Obrigado! Seu pagamento foi aprovado.
            </p>
          </div>
          <div className="space-y-3 border-b p-6 text-sm">
            <Info
              icon={<Receipt className="h-5 w-5" />}
              label="Pedido"
              value={`#${info.pedido}`}
            />
            <Info
              icon={<Wallet className="h-5 w-5" />}
              label="Valor"
              value={info.amount_formatted}
            />
            <Info
              icon={<CreditCard className="h-5 w-5" />}
              label="Método de Pagamento"
              value={info.method === "card" ? "Cartão" : "PIX"}
            />
            <Info
              icon={<CalendarDays className="h-5 w-5" />}
              label="Data e Hora"
              value={info.date}
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
                <p className="font-medium">{info.customer.name}</p>
                <p className="text-sm text-gray-500">{info.customer.email}</p>
              </div>
            </div>
          </div>

          {info.method === "card" && (
            <div className="border-b p-6">
              <h2 className="mb-4 font-semibold">Cartão</h2>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="font-medium">{cardLabel}</p>
                <p className="text-sm text-gray-500">
                  Salvo para cobranças futuras
                </p>
              </div>
            </div>
          )}

          {info.method === "pix" && (
            <div className="border-b p-6">
              <h2 className="mb-4 font-semibold">PIX</h2>
              <div className="rounded-lg bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-700">PIX Recebido</p>
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          <button
            onClick={handleDownloadReceipt}
            disabled={loadingPdf}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Download size={18} />
            {loadingPdf ? "Aguarde..." : "Baixar Recibo PDF"}
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl border bg-white px-6 py-3 font-semibold hover:bg-gray-50">
            <Mail size={18} />
            Enviar Recibo por Email
          </button>
          <Link
            href="/passageiro/beneficios"
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-6 py-3 font-semibold hover:bg-gray-200"
          >
            <Home size={18} />
            Voltar para Benefícios
          </Link>
        </div>
      </div>

      <div className="hidden">
        <ReceiptDoc
          receipt={{
            order: `#${info.pedido}`,
            customer: info.customer.name,
            email: info.customer.email,
            amount: info.amount_formatted,
            method: info.method === "card" ? cardLabel : "PIX",
            transactionId: info.transaction_id || info.pedido,
            authorization: info.card?.last4 || undefined,
            status: "PAGO",
            date: info.date,
          }}
        />
      </div>
    </>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

interface InfoProps {
  icon?: React.ReactNode;
  label: string;
  value: string;
}

function Info({ icon, label, value }: InfoProps) {
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
