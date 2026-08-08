"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  XCircle,
  CreditCard,
  CalendarDays,
  BadgeAlert,
} from "lucide-react";

function formatBRL(valor: string) {
  const n = Number(String(valor).replace(",", "."));
  if (Number.isNaN(n)) return valor || "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

function PaymentDeclinedContent() {
  const params = useSearchParams();
  const method = params.get("method") || "card";
  const valor = params.get("valor") || "0";
  const titulo = params.get("titulo") || "Assinatura";
  const motivo =
    params.get("motivo") || "Pagamento recusado pela instituição financeira";
  const codigo = params.get("codigo") || "payment_declined";

  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b px-8 py-8 text-center">
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Pagamento não aprovado
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Não foi possível concluir {titulo}.
          </p>
        </div>

        <div className="space-y-3 border-b p-6 text-sm">
          <Info
            icon={<BadgeAlert className="h-5 w-5" />}
            label="Pedido"
            value="—"
          />
          <Info
            icon={<CreditCard className="h-5 w-5" />}
            label="Valor"
            value={formatBRL(valor)}
          />
          <Info
            icon={<CreditCard className="h-5 w-5" />}
            label="Método de Pagamento"
            value={method === "pix" ? "PIX" : "Cartão"}
          />
          <Info
            icon={<CalendarDays className="h-5 w-5" />}
            label="Data e Hora"
            value={dateLabel}
          />
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Status de Pagamento</span>
            <span className="rounded-lg bg-red-100 px-3 py-1 text-sm font-semibold text-red-600">
              Recusado
            </span>
          </div>
        </div>

        <div className="border-b p-6">
          <h2 className="font-semibold text-gray-900">Motivo</h2>
          <p className="mt-1 text-sm text-gray-600">{motivo}</p>
          <div className="mt-2.5 rounded-lg bg-red-500 p-3 font-mono text-sm text-gray-200">
            Código: {codigo}
          </div>
        </div>

        <div className="border-b p-6">
          <h2 className="font-semibold">Sugestões</h2>
          <ul className="mt-2 space-y-2 text-sm text-gray-600">
            <li>• Verifique os dados do cartão</li>
            <li>• Confira o saldo ou limite disponível</li>
            <li>• Tente outro cartão</li>
            <li>• Utilize PIX</li>
          </ul>
        </div>

        <div className="space-y-3 p-6">
          <Link
            href="/passageiro/beneficios"
            className="block w-full cursor-pointer rounded-xl bg-red-600 py-3 text-center font-semibold text-white transition hover:bg-red-700"
          >
            Tentar novamente
          </Link>
          <Link
            href="/passageiro/beneficios"
            className="block w-full cursor-pointer rounded-xl border py-3 text-center font-semibold transition hover:bg-gray-50"
          >
            Alterar forma de pagamento
          </Link>
          <Link
            href="/passageiro/central_ajuda"
            className="block w-full cursor-pointer rounded-xl border py-3 text-center font-semibold transition hover:bg-gray-50"
          >
            Falar com o suporte
          </Link>
          <Link
            href="/passageiro/beneficios"
            className="block w-full cursor-pointer rounded-xl bg-gray-100 py-3 text-center font-semibold transition hover:bg-gray-200"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentDeclined() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Carregando...
        </div>
      }
    >
      <PaymentDeclinedContent />
    </Suspense>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
