"use client";

import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  FileText,
  Gift,
  Loader2,
  Search,
  Smartphone,
  Wallet,
  AlertTriangle,
} from "lucide-react";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Transaction = {
  id: number;
  title: string;
  description: string;
  value: number;
  type: "in" | "out";
  category: string;
  reference?: string | null;
  status?: string | null;
  created_at: string;
};

type WalletData = {
  id: number;
  user_id: string;
  conta: string | null;
  balance: number;
  currency: string;
};

const filters = [
  {
    label: "Todos",
    value: "all",
  },
  {
    label: "Entradas",
    value: "in",
  },
  {
    label: "Saídas",
    value: "out",
  },
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

function formatCurrency(
  value: number,
  currency = "BRL"
) {
  return Number(value || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency,
    }
  );
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function getCategory(
  transaction: any
): string {
  const text = `
    ${transaction.title || ""}
    ${transaction.description || ""}
    ${transaction.reference || ""}
  `.toLowerCase();

  if (text.includes("pix")) {
    return "pix";
  }

  if (text.includes("transfer")) {
    return "transfer";
  }

  if (
    text.includes("recarga") ||
    text.includes("celular")
  ) {
    return "service";
  }

  if (
    text.includes("boleto") ||
    text.includes("conta")
  ) {
    return "bill";
  }

  if (
    text.includes("gift") ||
    text.includes("card")
  ) {
    return "gift";
  }

  if (
    text.includes("depósito") ||
    text.includes("deposito") ||
    text.includes("receb")
  ) {
    return "deposit";
  }

  return "default";
}

export default function ExtratoPage() {
  const [filter, setFilter] =
    useState("all");

  const [mesSelecionado, setMesSelecionado] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [wallet, setWallet] =
    useState<WalletData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const carregarExtrato = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "/api/wallet",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data =
          await response.json().catch(
            () => null
          );

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Não foi possível carregar o extrato."
          );
        }

        if (!mounted) {
          return;
        }

        setWallet(
          data?.wallet || null
        );

        const apiTransactions =
          Array.isArray(
            data?.transactions
          )
            ? data.transactions
            : [];

        const normalized =
          apiTransactions.map(
            (transaction: any) => {
              const type =
                transaction.type === "in"
                  ? "in"
                  : "out";

              return {
                id: Number(
                  transaction.id
                ),
                title:
                  transaction.title ||
                  (type === "in"
                    ? "Dinheiro recebido"
                    : "Dinheiro enviado"),
                description:
                  transaction.description ||
                  "Movimentação da carteira",
                value: Math.abs(
                  Number(
                    transaction.value ||
                      transaction.amount ||
                      0
                  )
                ),
                type,
                category:
                  transaction.category ||
                  getCategory(
                    transaction
                  ),
                reference:
                  transaction.reference ||
                  null,
                status:
                  transaction.status ||
                  null,
                created_at:
                  transaction.created_at,
              };
            }
          );

        setTransactions(normalized);
      } catch (error) {
        console.error(
          "[EXTRATO]",
          error
        );

        if (!mounted) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Erro ao carregar o extrato."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void carregarExtrato();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredTransactions =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return transactions.filter(
        (transaction) => {
          const matchesFilter =
            filter === "all" ||
            transaction.type ===
              filter;

          const searchableText = `
            ${transaction.title}
            ${transaction.description}
            ${transaction.reference || ""}
            ${transaction.category}
            ${transaction.status || ""}
          `.toLowerCase();

          const matchesSearch =
            !searchValue ||
            searchableText.includes(
              searchValue
            );

          let matchesMonth = true;

          if (mesSelecionado) {
            const transactionDate =
              new Date(
                transaction.created_at
              );

            if (
              !Number.isNaN(
                transactionDate.getTime()
              )
            ) {
              const year =
                transactionDate.getFullYear();

              const month = String(
                transactionDate.getMonth() +
                  1
              ).padStart(2, "0");

              const transactionMonth =
                `${year}-${month}`;

              matchesMonth =
                transactionMonth ===
                mesSelecionado;
            } else {
              matchesMonth = false;
            }
          }

          return (
            matchesFilter &&
            matchesSearch &&
            matchesMonth
          );
        }
      );
    }, [
      transactions,
      filter,
      search,
      mesSelecionado,
    ]);

  const totalIn = useMemo(() => {
    return transactions
      .filter(
        (item) =>
          item.type === "in"
      )
      .reduce(
        (total, item) =>
          total +
          Math.abs(
            Number(item.value)
          ),
        0
      );
  }, [transactions]);

  const totalOut = useMemo(() => {
    return transactions
      .filter(
        (item) =>
          item.type === "out"
      )
      .reduce(
        (total, item) =>
          total +
          Math.abs(
            Number(item.value)
          ),
        0
      );
  }, [transactions]);

  const balance = Number(
    wallet?.balance || 0
  );

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between pt-6 sm:pt-8">
          <div className="flex items-center gap-3">
            <Link
              href="/motorista/servicos"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <h1 className="mt-0.5 text-xl font-black text-white sm:text-2xl">
                Extrato
              </h1>

              <p className="mt-0.5 text-[10px] text-white">
                {wallet?.conta
                  ? `Conta: ${wallet.conta}`
                  : "Movimentações da carteira"}
              </p>
            </div>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
            <Wallet size={18} />
          </div>
        </header>

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div className="min-w-0 flex-1">
              <p className="font-bold">
                Não foi possível carregar o extrato
              </p>

              <p className="mt-1 text-xs text-red-200/70">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <section className="mt-6">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#062b4f] via-[#07566b] to-[#08a89d] p-6 shadow-[0_20px_50px_rgba(8,168,157,0.18)]">
            <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#5be0c8]/20 blur-3xl" />

            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                Saldo disponível
              </p>

              {loading ? (
                <div className="mt-3 flex items-center gap-2 text-white">
                  <Loader2
                    size={24}
                    className="animate-spin"
                  />

                  <span className="text-sm font-bold">
                    Carregando saldo...
                  </span>
                </div>
              ) : (
                <p className="mt-2 text-3xl font-black text-white sm:text-4xl">
                  {formatCurrency(
                    balance,
                    wallet?.currency ||
                      "BRL"
                  )}
                </p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft
                      size={15}
                      className="text-[#83ead9]"
                    />

                    <span className="text-[10px] text-white/55">
                      Entradas
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-black text-white">
                    +{" "}
                    {formatCurrency(
                      totalIn,
                      wallet?.currency ||
                        "BRL"
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight
                      size={15}
                      className="text-[#ffb4b4]"
                    />

                    <span className="text-[10px] text-white/55">
                      Saídas
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-black text-white">
                    -{" "}
                    {formatCurrency(
                      totalOut,
                      wallet?.currency ||
                        "BRL"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-3">
            <Search
              size={18}
              className="text-[#8ca0b2]"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Buscar movimentação..."
              className="w-full bg-transparent text-sm text-[#062b4f] outline-none placeholder:text-[#9aabb8]"
            />
          </div>
        </section>

        <section className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => {
            const active =
              filter === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  setFilter(
                    item.value
                  )
                }
                className={`shrink-0 cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  active
                    ? "bg-[#08a89d] text-white shadow-[0_8px_20px_rgba(8,168,157,0.18)]"
                    : "border border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <div className="relative ml-auto shrink-0">
            <CalendarDays
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-white/50"
            />

            <input
              type="month"
              value={mesSelecionado}
              onChange={(event) =>
                setMesSelecionado(
                  event.target.value
                )
              }
              className="h-8 cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 text-[10px] font-bold text-white/70 outline-none transition hover:bg-white/10 focus:border-[#08a89d]"
            />
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">
              Movimentações
            </h2>

            <p className="mt-1 text-xs text-white/45">
              Todas as movimentações da sua carteira
            </p>
          </div>

          <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white">
            {loading ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
                <Loader2
                  size={30}
                  className="animate-spin text-[#08a89d]"
                />

                <p className="mt-4 text-sm font-black text-[#062b4f]">
                  Carregando movimentações
                </p>

                <p className="mt-1 text-xs text-[#9aabb8]">
                  Buscando o histórico da sua carteira...
                </p>
              </div>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map(
                (
                  transaction,
                  index
                ) => {
                  const Icon =
                    getIcon(
                      transaction.category
                    );

                  const isIncome =
                    transaction.type ===
                    "in";

                  return (
                    <div
                      key={
                        transaction.id
                      }
                      className={`group flex items-center gap-3 p-4 transition hover:bg-[#f8fafb] sm:p-5 ${
                        index !==
                        filteredTransactions.length -
                          1
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
                        <Icon
                          size={20}
                          strokeWidth={1.8}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[#062b4f]">
                          {
                            transaction.title
                          }
                        </p>

                        <p className="mt-1 truncate text-[10px] text-[#9aabb8]">
                          {
                            transaction.description
                          }
                        </p>

                        <p className="mt-1 text-[10px] text-[#b0bcc5]">
                          {formatDate(
                            transaction.created_at
                          )}
                        </p>

                        {transaction.reference && (
                          <p className="mt-1 truncate text-[9px] font-semibold text-[#c0c9cf]">
                            Ref:{" "}
                            {
                              transaction.reference
                            }
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-sm font-black ${
                            isIncome
                              ? "text-[#08a89d]"
                              : "text-[#062b4f]"
                          }`}
                        >
                          {isIncome
                            ? "+"
                            : "-"}{" "}
                          {formatCurrency(
                            Math.abs(
                              transaction.value
                            ),
                            wallet?.currency ||
                              "BRL"
                          )}
                        </p>

                        <span
                          className={`mt-1 inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${
                            isIncome
                              ? "bg-[#e7f8f4] text-[#08a89d]"
                              : "bg-[#f5f7f8] text-[#8ca0b2]"
                          }`}
                        >
                          {isIncome
                            ? "Entrada"
                            : "Saída"}
                        </span>
                      </div>
                    </div>
                  );
                }
              )
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f8f9] text-[#9aabb8]">
                  <Search
                    size={24}
                  />
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