"use client";

import {
  ArrowRight,
  CreditCard,
  FileText,
  Gift,
  Smartphone,
} from "lucide-react";
import Link from "next/link";

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

export default function ServicosPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-8xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="flex items-center justify-between pt-6 sm:pt-8">
          <div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Maylon Pay
            </h1>
          </div>

          <Link
            href="/passageiro"
            className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur transition hover:bg-white/15"
            aria-label="Voltar"
          >
            <ArrowRight
              size={18}
              className="rotate-180 transition-transform group-hover:-translate-x-0.5"
            />
          </Link>
        </header>

        {/* Hero */}
        <section className="mt-7">
          <div className="relative overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:p-8">

            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#08a89d]/10 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#1676b7]/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#08a89d]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#08a89d]">
                  Tudo em um só lugar
                </span>
              </div>

              <h2 className="mt-3 max-w-xl text-xl font-black leading-tight text-[#062b4f] sm:text-3xl">
                Pague, recarregue e
                <span className="text-[#08a89d]"> aproveite.</span>
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-[#7d91a2]">
                Tenha acesso aos principais serviços do dia a dia
                diretamente pela Maylon.
              </p>
            </div>
          </div>
        </section>
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-xl font-black text-white">
              O que você precisa?
            </h2>
            <p className="mt-1 text-xs text-white/45">
              Escolha uma opção para continuar
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.title}
                  href={service.href}
                  className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-white p-5 shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.13)] sm:p-6"
                >
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#f7fafb] transition-transform duration-500 group-hover:scale-150" />
                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-[20px] ${service.iconBg} ${service.iconColor}`}
                      >
                        <Icon size={29} strokeWidth={1.8} />
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f8f9] text-[#8194a4] transition-all group-hover:bg-[#08a89d] group-hover:text-white">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                    <div className="mt-3.5">
                      <h3 className="text-base font-black text-[#062b4f] sm:text-lg">
                        {service.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-5 text-[#8ca0b2] sm:text-sm">
                        {service.description}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-[#08a89d]">
                      Acessar serviço
                      <ArrowRight
                        size={13}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        <section className="mt-5">
          <div className="flex items-center gap-4 rounded-[24px] border border-[#5be0c8]/20 bg-[#08a89d] p-4 shadow-[0_12px_30px_rgba(8,168,157,0.18)]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Prático e seguro
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-white/75">
                Faça seus pagamentos sem sair da Maylon.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
