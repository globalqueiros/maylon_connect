"use client";

import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Gift,
  History,
  Plus,
  QrCode,
  Smartphone,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const services = [
  {
    title: "Recarga de celular",
    description: "Adicione créditos ao seu celular",
    href: "/passageiro/servicos/recarga-celular",
    icon: Smartphone,
    iconColor: "text-[#08a89d]",
    iconBg: "bg-[#e7f8f4]",
  },
  {
    title: "Gift Card",
    description: "Compre créditos e cartões digitais",
    href: "/passageiro/servicos/gift-card",
    icon: Gift,
    iconColor: "text-[#8b5cf6]",
    iconBg: "bg-[#f1ebff]",
  },
  {
    title: "Pagar contas",
    description: "Água, luz, internet e muito mais",
    href: "/passageiro/servicos/pagamentos-contas",
    icon: CreditCard,
    iconColor: "text-[#1676b7]",
    iconBg: "bg-[#eaf4fb]",
  },
  {
    title: "Pagar boleto",
    description: "Pague seus boletos rapidamente",
    href: "/passageiro/servicos/pagamento-boleto",
    icon: FileText,
    iconColor: "text-[#f08a24]",
    iconBg: "bg-[#fff3e7]",
  },
];

const transactions = [
  {
    title: "Pix recebido",
    description: "Hoje, 14:32",
    value: "+ R$ 150,00",
    type: "in",
  },
  {
    title: "Recarga de celular",
    description: "Hoje, 11:18",
    value: "- R$ 30,00",
    type: "out",
  },
  {
    title: "Pagamento de boleto",
    description: "Ontem, 18:42",
    value: "- R$ 85,90",
    type: "out",
  },
];

export default function MaylonservicosPage() {
  const [showBalance, setShowBalance] = useState(true);

  // Futuramente este valor pode vir da API/MySQL
  const balance = 1248.75;

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto w-full max-w-7xl">

        {/* Header */}
        <header className="flex items-center justify-between pt-6 sm:pt-8">
          <div className="flex items-center gap-3">
            <Link
              href="/passageiro"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Carteira digital
              </p>

              <h1 className="mt-0.5 text-xl font-black text-white sm:text-2xl">
                Maylon servicos
              </h1>
            </div>
          </div>

          <Link
            href="/passageiro/servicos/maylon-servicos/extrato"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
            aria-label="Extrato"
          >
            <History size={18} />
          </Link>
        </header>

        {/* Carteira / Saldo */}
        <section className="mt-6">
          <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#062b4f] via-[#07566b] to-[#08a89d] p-6 shadow-[0_20px_55px_rgba(8,168,157,0.20)] sm:p-8">

            {/* Background */}
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#5be0c8]/20 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#08a89d]/20 blur-3xl" />

            <div className="relative">

              {/* Topo */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Wallet size={18} />
                  </div>

                  <span className="text-xs font-bold text-white/70">
                    Saldo disponível
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBalance((value) => !value)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15"
                  aria-label={
                    showBalance
                      ? "Ocultar saldo"
                      : "Mostrar saldo"
                  }
                >
                  {showBalance ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>

              {/* Saldo */}
              <div className="mt-6">
                <p className="text-[11px] font-medium text-white/50">
                  Seu saldo
                </p>

                <h2 className="mt-1 text-4xl font-black tracking-tight text-white sm:text-5xl">
                  {showBalance
                    ? balance.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    : "R$ ••••••"}
                </h2>
              </div>

              {/* Ações */}
              <div className="mt-7 grid grid-cols-2 gap-3">

                <Link
                  href="/passageiro/servicos/pix"
                  className="group flex items-center gap-3 rounded-2xl bg-white p-3.5 text-[#062b4f] transition hover:bg-white/95"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f8f4] text-[#08a89d]">
                    <QrCode size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-black">
                      Pix
                    </p>

                    <p className="mt-0.5 text-[10px] text-[#8ca0b2]">
                      Enviar ou receber
                    </p>
                  </div>

                  <ArrowRight
                    size={15}
                    className="ml-auto text-[#9aabb8] transition-transform group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  href="/passageiro/servicos/deposito"
                  className="group flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 text-white backdrop-blur-sm transition hover:bg-white/15"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#83ead9]">
                    <ArrowDownToLine size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-black">
                      Depositar
                    </p>

                    <p className="mt-0.5 text-[10px] text-white/50">
                      Adicionar dinheiro
                    </p>
                  </div>

                  <ArrowRight
                    size={15}
                    className="ml-auto text-white/40 transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Atalhos */}
        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">
              Ações rápidas
            </h2>

            <p className="mt-0 text-xs text-white/45">
              Faça mais com seu dinheiro
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

            <Link
              href="/passageiro/servicos/pix"
              className="group rounded-[22px] border border-white/10 bg-white p-4 transition hover:-translate-y-1"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f8f4] text-[#08a89d]">
                <QrCode size={21} />
              </div>

              <p className="mt-4 text-sm font-black text-[#062b4f]">
                Pix
              </p>

              <p className="mt-1 text-[10px] text-[#8ca0b2]">
                Enviar e receber
              </p>
            </Link>

            <Link
              href="/passageiro/servicos/deposito"
              className="group rounded-[22px] border border-white/10 bg-white p-4 transition hover:-translate-y-1"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf4fb] text-[#1676b7]">
                <ArrowDownToLine size={21} />
              </div>

              <p className="mt-4 text-sm font-black text-[#062b4f]">
                Depositar
              </p>

              <p className="mt-1 text-[10px] text-[#8ca0b2]">
                Adicionar saldo
              </p>
            </Link>

            <Link
              href="/passageiro/servicos/transferir"
              className="group rounded-[22px] border border-white/10 bg-white p-4 transition hover:-translate-y-1"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1ebff] text-[#8b5cf6]">
                <ArrowUpRight size={21} />
              </div>

              <p className="mt-4 text-sm font-black text-[#062b4f]">
                Transferir
              </p>

              <p className="mt-1 text-[10px] text-[#8ca0b2]">
                Enviar dinheiro
              </p>
            </Link>

            <Link
              href="/passageiro/servicos/extrato"
              className="group rounded-[22px] border border-white/10 bg-white p-4 transition hover:-translate-y-1"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff3e7] text-[#f08a24]">
                <History size={21} />
              </div>

              <p className="mt-4 text-sm font-black text-[#062b4f]">
                Extrato
              </p>

              <p className="mt-1 text-[10px] text-[#8ca0b2]">
                Ver movimentações
              </p>
            </Link>
          </div>
        </section>

        {/* Extrato recente */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-black text-white">
                Movimentações recentes
              </h2>

              <p className="mt-0 text-xs text-white/45">
                Últimas movimentações da sua carteira
              </p>
            </div>

            <Link
              href="/passageiro/servicos/extrato"
              className="text-sm font-bold text-white/60 transition hover:text-white/80"
            >
              Ver extrato
            </Link>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white">
            {transactions.map((transaction, index) => (
              <div
                key={transaction.title + index}
                className={`flex items-center gap-3 p-4 sm:p-5 ${
                  index !== transactions.length - 1
                    ? "border-b border-[#edf1f3]"
                    : ""
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    transaction.type === "in"
                      ? "bg-[#e7f8f4] text-[#08a89d]"
                      : "bg-[#fff3f1] text-[#ef5b5b]"
                  }`}
                >
                  {transaction.type === "in" ? (
                    <ArrowDownToLine size={19} />
                  ) : (
                    <ArrowUpRight size={19} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-[#062b4f]">
                    {transaction.title}
                  </p>

                  <p className="mt-1 text-[10px] text-[#9aabb8]">
                    {transaction.description}
                  </p>
                </div>

                <p
                  className={`text-sm font-black ${
                    transaction.type === "in"
                      ? "text-[#08a89d]"
                      : "text-[#062b4f]"
                  }`}
                >
                  {transaction.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Serviços */}
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-lg font-black text-white">
              Outros serviços
            </h2>

            <p className="mt-0 text-xs text-white/45">
              Use seu saldo para facilitar seu dia
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <Link
                  key={service.title}
                  href={service.href}
                  className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.13)]"
                >
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#f7fafb] transition-transform duration-500 group-hover:scale-150" />

                  <div className="relative flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${service.iconBg} ${service.iconColor}`}
                    >
                      <Icon size={25} strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-[#062b4f]">
                        {service.title}
                      </h3>

                      <p className="mt-1 text-[11px] leading-4 text-[#8ca0b2]">
                        {service.description}
                      </p>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f8f9] text-[#8194a4] transition-all group-hover:bg-[#08a89d] group-hover:text-white">
                      <ArrowRight size={15} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Segurança */}
        <section className="mt-5">
          <div className="flex items-center gap-4 rounded-[24px] border border-[#5be0c8]/20 bg-[#08a89d] p-4 shadow-[0_12px_30px_rgba(8,168,157,0.18)]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
              <Wallet size={20} />
            </div>

            <div>
              <p className="text-xs font-bold text-white">
                Seu dinheiro na Maylon
              </p>

              <p className="mt-0.5 text-[11px] leading-4 text-white/75">
                Gerencie seu saldo, Pix e pagamentos em um só lugar.
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}