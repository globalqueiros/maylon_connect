"use client";

import {
  ArrowRight,
  FileText,
  Smartphone,
  Wallet,
  Zap,
} from "lucide-react";
import Link from "next/link";

const services = [
  {
    title: "Recarga de celular",
    description: "Recarregue seu número",
    href: "/passageiro/servicos/recarga-celular",
    icon: Smartphone,
    color: "text-[#08a89d]",
    bg: "bg-[#e7f8f4]",
  },
  {
    title: "Pagamento de contas",
    description: "Pague suas contas",
    href: "/passageiro/servicos/pagamentos-contas",
    icon: FileText,
    color: "text-[#1676b7]",
    bg: "bg-[#eaf4fb]",
  },
];

export default function ServicosPage() {
  return (
    <main className="min-h-screen pb-10">
      <div className="mx-auto w-full max-w-8xl px-4 sm:px-6 lg:px-8">
        <header className="pt-6 sm:pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Serviços
              </h1>
            </div>
            <Link
              href="/passageiro"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
              aria-label="Voltar"
            >
              <ArrowRight size={18} className="rotate-180" />
            </Link>
          </div>
        </header>

        <section className="mt-7">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#062b4f] via-[#074d68] to-[#08a89d] p-6 shadow-[0_20px_50px_rgba(6,43,79,0.18)] sm:p-8">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#5be0c8]/20 blur-3xl" />
            <div className="absolute -bottom-28 left-1/2 h-64 w-64 rounded-full bg-[#08a89d]/20 blur-3xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  <Zap size={13} className="text-[#83ead9]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                    Serviços rápidos
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl">
                  Resolva suas tarefas
                  <br />
                  do dia a dia.
                </h2>
                <p className="mt-3 max-w-md text-xs leading-5 text-white/65 sm:text-sm">
                  Recargas e pagamentos de contas, tudo de forma simples dentro da Maylon.
                </p>
              </div>
              <div className="hidden h-28 w-28 shrink-0 items-center justify-center rounded-[30px] border border-white/10 bg-white/10 backdrop-blur-md sm:flex">
                <Wallet
                  size={46}
                  strokeWidth={1.4}
                  className="text-white/90"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-black text-white sm:text-xl">
                Escolha um serviço
              </h2>
              <p className="mt-1 text-xs text-white/50">
                O que você deseja fazer?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <Link
                  key={service.title}
                  href={service.href}
                  className="group flex items-center gap-4 rounded-2xl border border-[#e5ecef] bg-white p-4 shadow-[0_8px_30px_rgba(6,43,79,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(6,43,79,0.10)] sm:p-5"
                >
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${service.bg} ${service.color}`}
                  >
                    <Icon size={25} strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-black text-[#062b4f] sm:text-base">
                      {service.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#8ca0b2]">
                      {service.description}
                    </p>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f8f9] text-[#71869a] transition-all group-hover:bg-[#08a89d] group-hover:text-white">
                    <ArrowRight size={16} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}