"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  XCircle,
  CreditCard,
  CalendarDays,
  BadgeAlert,
  Loader2,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
  WalletCards,
  Headphones,
} from "lucide-react";

function PaymentDeclinedContent() {
  const searchParams = useSearchParams();

  const method = searchParams.get("method") || "card";
  const pedido = searchParams.get("pedido") || "—";
  const reason = searchParams.get("reason") || "card_declined";
  const valor = searchParams.get("valor");

  const amount = valor
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(valor))
    : "—";

  const reasonLabel =
    reason === "canceled"
      ? "Pagamento cancelado pelo usuário"
      : reason === "pix_rejected"
        ? "Autorização ou pagamento Pix recusado"
        : "Cartão recusado pela instituição financeira";

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-teal-950 via-teal-900 to-slate-950 px-4 py-8 text-slate-900 sm:px-6 lg:py-12">
      {}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-teal-300/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[32px] border border-white/15 bg-white/95 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {}
          <div className="relative overflow-hidden border-b border-slate-200 px-6 py-10 text-center sm:px-10">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal-700 via-teal-500 to-teal-400" />

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-red-50 ring-8 ring-red-50/60">
              <XCircle className="h-12 w-12 text-red-500" strokeWidth={1.8} />
            </div>

            <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Pagamento não aprovado
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
              Não foi possível concluir seu pagamento. Confira os detalhes
              abaixo e escolha uma nova forma de pagamento.
            </p>

            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-600">
              <ShieldAlert className="h-4 w-4" />
              Transação recusada
            </div>
          </div>

          {}
          <div className="border-b border-slate-200 p-5 sm:p-7">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <ReceiptIcon />
              </div>
              <div>
                <h2 className="font-bold text-slate-950">Resumo da tentativa</h2>
                <p className="text-xs text-slate-500">Confira os dados do pagamento</p>
              </div>
            </div>

            <div className="space-y-2 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
              <Info
                icon={<BadgeAlert className="h-5 w-5" />}
                label="Pedido"
                value={`#${pedido}`}
              />
              <Info
                icon={<WalletCards className="h-5 w-5" />}
                label="Valor"
                value={amount}
              />
              <Info
                icon={<CreditCard className="h-5 w-5" />}
                label="Método de Pagamento"
                value={method === "pix" ? "PIX" : "Cartão"}
              />
              <Info
                icon={<CalendarDays className="h-5 w-5" />}
                label="Data e Hora"
                value={new Date().toLocaleString("pt-BR")}
              />

              <div className="my-3 h-px bg-slate-200" />

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">Status de Pagamento</span>
                <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-extrabold text-red-600">
                  Recusado
                </span>
              </div>
            </div>
          </div>

          {}
          <div className="border-b border-slate-200 p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-950">Motivo da recusa</h2>
                <p className="text-xs text-slate-500">Informação retornada pelo pagamento</p>
              </div>
            </div>

            <div className="mt-4 rounded-[20px] border border-amber-100 bg-amber-50/70 p-4">
              <p className="text-sm font-semibold leading-6 text-slate-700">
                {reasonLabel}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-950 px-4 py-3">
                <span className="text-xs font-medium text-slate-400">
                  Código
                </span>
                <code className="max-w-[65%] truncate text-xs font-bold text-teal-300">
                  {reason}
                </code>
              </div>
            </div>
          </div>

          {}
          <div className="border-b border-slate-200 p-5 sm:p-7">
            <h2 className="font-bold text-slate-950">O que você pode fazer?</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Suggestion text="Verifique os dados do cartão" />
              <Suggestion text="Confira seu saldo ou limite" />
              <Suggestion text="Tente outro cartão" />
              <Suggestion text="Experimente pagar com PIX" />
            </div>
          </div>

          {}
          <div className="space-y-3 p-5 sm:p-7">
            <Link
              href="/passageiro/beneficios"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-700 via-teal-600 to-teal-500 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-teal-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-900/30"
            >
              <RefreshCw className="h-5 w-5 transition-transform duration-300 group-hover:rotate-180" />
              Tentar novamente
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              href="/passageiro/beneficios"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-teal-100 bg-teal-50/60 px-5 py-4 text-sm font-bold text-teal-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50"
            >
              <CreditCard className="h-5 w-5" />
              Alterar forma de pagamento
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/passageiro/central_ajuda"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50/40"
            >
              <Headphones className="h-5 w-5 text-teal-600" />
              Falar com o suporte
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/passageiro/beneficios"
              className="flex w-full items-center justify-center rounded-2xl bg-slate-100 px-5 py-4 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
            >
              Voltar para o início
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function ReceiptIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 7h6M9 11h6M9 15h3" />
    </svg>
  );
}

function Suggestion({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 transition hover:border-teal-100 hover:bg-teal-50/30">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
        <CreditCard className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium leading-5 text-slate-600">{text}</span>
    </div>
  );
}

export default function PaymentDeclined() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-950 via-teal-900 to-slate-950">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <Loader2 className="h-8 w-8 animate-spin text-teal-300" />
          </div>
        </main>
      }
    >
      <PaymentDeclinedContent />
    </Suspense>
  );
}

type InfoProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function Info({ icon, label, value }: InfoProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-2 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5 text-slate-500">
        <span className="shrink-0 text-teal-600">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="max-w-[55%] truncate text-right text-sm font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}
