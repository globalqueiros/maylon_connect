"use client";

import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  CreditCard,
  FileText,
  Gift,
  Search,
  Smartphone,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const transactions = [
  { id: 1, title: "Pix recebido", description: "João Silva", date: "Hoje, 14:32", value: 150, type: "in", category: "pix" },
  { id: 2, title: "Transferência enviada", description: "Maria Oliveira", date: "Hoje, 11:20", value: -80, type: "out", category: "transfer" },
  { id: 3, title: "Recarga de celular", description: "(11) 99999-9999", date: "Hoje, 09:45", value: -30, type: "out", category: "service" },
  { id: 4, title: "Depósito via Pix", description: "Adição de saldo", date: "Ontem, 18:12", value: 300, type: "in", category: "deposit" },
  { id: 5, title: "Pagamento de boleto", description: "Conta de energia", date: "Ontem, 15:40", value: -125.9, type: "out", category: "bill" },
  { id: 6, title: "Gift Card", description: "Google Play", date: "01/10/2026, 12:18", value: -50, type: "out", category: "gift" },
];

const filters = [
  { label: "Todos", value: "all" },
  { label: "Entradas", value: "in" },
  { label: "Saídas", value: "out" },
];

function getIcon(category: string) {
  switch (category) {
    case "pix":
      return ArrowDownLeft;
    case "transfer":
      return ArrowUpRight;
    case "deposit":
      return Wallet;
    case "service":
      return Smartphone;
    case "bill":
      return FileText;
    case "gift":
      return Gift;
    default:
      return CreditCard;
  }
}

export default function ExtratoPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const balance = 1248.75;

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesFilter =
        filter === "all" || transaction.type === filter;

      const searchValue = search.toLowerCase();

      const matchesSearch =
        transaction.title.toLowerCase().includes(searchValue) ||
        transaction.description.toLowerCase().includes(searchValue);

      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  const totalIn = transactions
    .filter((item) => item.type === "in")
    .reduce((total, item) => total + item.value, 0);

  const totalOut = transactions
    .filter((item) => item.type === "out")
    .reduce((total, item) => total + Math.abs(item.value), 0);

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between pt-6 sm:pt-8">
          <div className="flex items-center gap-3">
            <Link
              href="/passageiro/pay"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="mt-0.5 text-xl font-black text-white sm:text-2xl">
                Extrato
              </h1>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
            <Wallet size={18} />
          </div>
        </header>

        <section className="mt-6">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#062b4f] via-[#07566b] to-[#08a89d] p-6 shadow-[0_20px_50px_rgba(8,168,157,0.18)]">
            <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#5be0c8]/20 blur-3xl" />
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                Saldo disponível
              </p>
              <p className="mt-2 text-3xl font-black text-white sm:text-4xl">
                {balance.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft size={15} className="text-[#83ead9]" />
                    <span className="text-[10px] text-white/55">
                      Entradas
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-black text-white">
                    +{" "}
                    {totalIn.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight size={15} className="text-[#ffb4b4]" />
                    <span className="text-[10px] text-white/55">
                      Saídas
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-black text-white">
                    -{" "}
                    {totalOut.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-3">
            <Search size={18} className="text-[#8ca0b2]" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar movimentação..."
              className="w-full bg-transparent text-sm text-[#062b4f] outline-none placeholder:text-[#9aabb8]"
            />
          </div>
        </section>

        <section className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => {
            const active = filter === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  active
                    ? "bg-[#08a89d] text-white shadow-[0_8px_20px_rgba(8,168,157,0.18)]"
                    : "border border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <button
            type="button"
            className="ml-auto flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/50 transition hover:bg-white/10"
          >
            <CalendarDays size={14} />
            Este mês
            <ChevronDown size={13} />
          </button>
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">
              Movimentações
            </h2>
            <p className="mt-1 text-xs text-white/45">
              Histórico da sua carteira Maylon Pay
            </p>
          </div>

          <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction, index) => {
                const Icon = getIcon(transaction.category);
                const isIncome = transaction.type === "in";

                return (
                  <div
                    key={transaction.id}
                    className={`group flex items-center gap-3 p-4 transition hover:bg-[#f8fafb] sm:p-5 ${
                      index !== filteredTransactions.length - 1
                        ? "border-b border-[#edf1f3]"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        isIncome
                          ? "bg-[#e7f8f4] text-[#08a89d]"
                          : "bg-[#f5f7f8] text-[#71869a]"
                      }`}
                    >
                      <Icon size={20} strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[#062b4f]">
                        {transaction.title}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-[#9aabb8]">
                        {transaction.description}
                      </p>
                      <p className="mt-1 text-[10px] text-[#b0bcc5]">
                        {transaction.date}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-black ${
                          isIncome
                            ? "text-[#08a89d]"
                            : "text-[#062b4f]"
                        }`}
                      >
                        {isIncome ? "+" : "-"}{" "}
                        {Math.abs(transaction.value).toLocaleString(
                          "pt-BR",
                          {
                            style: "currency",
                            currency: "BRL",
                          }
                        )}
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${
                          isIncome
                            ? "bg-[#e7f8f4] text-[#08a89d]"
                            : "bg-[#f5f7f8] text-[#8ca0b2]"
                        }`}
                      >
                        {isIncome ? "Entrada" : "Saída"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f8f9] text-[#9aabb8]">
                  <Search size={24} />
                </div>
                <h3 className="mt-4 text-sm font-black text-[#062b4f]">
                  Nenhuma movimentação encontrada
                </h3>
                <p className="mt-1 max-w-xs text-xs leading-5 text-[#9aabb8]">
                  Tente buscar por outro termo ou altere o filtro.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-5">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/5 p-4 text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <FileText size={16} />
            Exportar extrato
          </button>
        </section>

        <section className="mt-5">
          <div className="flex items-center gap-4 rounded-[24px] border border-[#5be0c8]/20 bg-[#08a89d] p-4 shadow-[0_12px_30px_rgba(8,168,157,0.18)]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Seu extrato Maylon Pay
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-white/75">
                Todas as movimentações da sua carteira em um só lugar.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
