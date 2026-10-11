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
import ReceiptDoc from "./recibo/Receipt";

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
  const [enviandoRecibo, setEnviandoRecibo] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [info, setInfo] = useState<PaymentInfo>({
    pedido: pedidoParam || "—",
    amount_formatted: valorParam
      ? (/R\$/.test(String(valorParam))
        ? String(valorParam)
        : new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(Number(String(valorParam).replace(",", "."))))
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
        } else if (pedidoParam) {

          const me = await fetch("/api/me", { credentials: "include" });
          const user = me.ok ? await me.json() : null;
          setInfo((prev) => ({
            ...prev,
            pedido: pedidoParam,
            method,
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  async function enviarReciboEmail() {
    try {
      if (!info.customer.email || info.customer.email === "—") {
        setAlert({
          type: "error",
          message: "Não foi possível identificar o e-mail cadastrado.",
        });
        return;
      }

      setEnviandoRecibo(true);
      setAlert(null);

      const response = await fetch("/api/recibo/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          pedido: info.pedido,
          email: info.customer.email,
          nome: info.customer.name,
          valor: info.amount_formatted,
          metodo: info.method === "card" ? cardLabel : "PIX",
          data: info.date,
          transaction_id: info.transaction_id || info.pedido,
          status: "PAGO",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Não foi possível enviar o recibo."
        );
      }

      setAlert({
        type: "success",
        message: `Recibo enviado para ${data.email || info.customer.email}.`,
      });
    } catch (error) {
      console.error("Erro ao enviar recibo:", error);

      setAlert({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao enviar o recibo por e-mail.",
      });
    } finally {
      setEnviandoRecibo(false);
    }
  }

  useEffect(() => {
    if (!alert) return;

    const timer = setTimeout(() => {
      setAlert(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [alert]);

  return (
    <>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden py-4">
        {alert && (
          <div
            className={`fixed right-6 top-6 z-[9999] rounded-xl px-5 py-4 shadow-xl ${alert.type === "success"
                ? "bg-teal-600 text-white"
                : "bg-red-600 text-white"
              }`}
          >
            <div className="flex items-center gap-3">
              {alert.type === "success" ? (
                <CheckCircle2 size={20} />
              ) : (
                <span className="text-lg font-bold">!</span>
              )}

              <span className="font-medium">
                {alert.message}
              </span>
            </div>
          </div>
        )}
        <div
          ref={receiptRef}
          className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-white/60 bg-white/95 shadow-[0_30px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl"
        >
          <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-6 py-10 text-center sm:px-8">
            <CheckCircle2 className="mx-auto h-16 w-16 text-teal-500 drop-shadow-[0_8px_20px_rgba(13,148,136,0.25)]" />
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
              Pagamento Confirmado
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Obrigado! Seu pagamento foi aprovado.
            </p>
          </div>
          <div className="space-y-3 border-b border-slate-100 p-5 sm:p-6 text-sm">
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
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <span className="text-slate-500">Status de Pagamento</span>
              <span className="rounded-lg bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-700">
                Pago
              </span>
            </div>
          </div>

          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="mb-2 font-semibold">Cliente</h2>
            <div className="flex items-start gap-3">
              <User className="mt-1 h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium">{info.customer.name}</p>
                <p className="text-sm text-slate-500">{info.customer.email}</p>
              </div>
            </div>
          </div>

          {info.method === "card" && (
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <h2 className="mb-4 font-semibold">Cartão</h2>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="font-medium">{cardLabel}</p>
                <p className="text-sm text-slate-500">
                  Salvo para cobranças futuras
                </p>
              </div>
            </div>
          )}

          {info.method === "pix" && (
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <h2 className="mb-4 font-semibold">PIX</h2>
              <div className="rounded-2xl border border-teal-100 bg-teal-50/80 p-4">
                <p className="font-semibold text-sm text-teal-700">PIX Recebido</p>
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 flex-col gap-3 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto sm:translate-x-0">
          <button
            onClick={handleDownloadReceipt}
            disabled={loadingPdf}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-3.5 shadow-lg shadow-teal-900/20 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Download size={18} />
            {loadingPdf ? "Aguarde..." : "Baixar Recibo PDF"}
          </button>
          <button
            type="button"
            onClick={enviarReciboEmail}
            disabled={enviandoRecibo}
            className="flex items-center cursor-pointer justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 shadow-lg shadow-slate-950/5 font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Mail size={18} />
            {enviandoRecibo ? "Enviando..." : "Enviar Recibo por Email"}
          </button>
          <Link
            href="/passageiro/beneficios"
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 py-3.5 font-semibold hover:bg-slate-200"
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
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-slate-950">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
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
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
