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
  QrCode,
  Smartphone,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

type TransactionType = "in" | "out";

type Transaction = {
  id: number | string;
  title: string;
  description: string;
  value: number;
  type: TransactionType;
  created_at: string;
};

type WalletData = {
  id: number | string;
  conta: string | null;
  balance: number;
  currency: string;
};

type ApiTransaction = {
  id?: number | string;
  title?: string;
  description?: string;
  value?: number | string;
  amount?: number | string;
  type?: string;
  created_at?: string;
};

function normalizeTransactionType(
  type: unknown
): TransactionType {
  const normalized = String(type ?? "")
    .trim()
    .toLowerCase();

  if (
    normalized === "in" ||
    normalized === "entrada" ||
    normalized === "credit" ||
    normalized === "credito" ||
    normalized === "received" ||
    normalized === "deposit"
  ) {
    return "in";
  }

  return "out";
}

export default function MaylonServicosPage() {
  const [showBalance, setShowBalance] = useState(true);

  const [wallet, setWallet] =
    useState<WalletData | null>(null);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);

  const [creatingWallet, setCreatingWallet] =
    useState(false);

  const [walletNotFound, setWalletNotFound] =
    useState(false);

  const [error, setError] = useState("");

  /*
   * Controla somente a abertura do modal.
   * Enquanto true, a criação ainda NÃO aconteceu.
   */
  const [
    showCreateWalletModal,
    setShowCreateWalletModal,
  ] = useState(false);

  /*
   * Carrega a carteira.
   */
  const loadWallet = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          "/api/wallet",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const contentType =
          response.headers.get(
            "content-type"
          ) || "";

        let data: any = null;

        if (
          contentType.includes(
            "application/json"
          )
        ) {
          data = await response.json();
        } else {
          await response.text();
        }

        /*
         * Sessão expirada.
         */
        if (response.status === 401) {
          throw new Error(
            "Sua sessão expirou. Faça login novamente."
          );
        }

        /*
         * Carteira não encontrada.
         */
        if (response.status === 404) {
          setWallet(null);
          setTransactions([]);
          setWalletNotFound(true);
          return;
        }

        /*
         * Outros erros.
         */
        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Não foi possível carregar sua carteira."
          );
        }

        /*
         * API respondeu sem carteira.
         */
        if (!data?.wallet) {
          setWallet(null);
          setTransactions([]);
          setWalletNotFound(true);
          return;
        }

        /*
         * Salva carteira.
         */
        setWallet({
          id: data.wallet.id,
          conta:
            data.wallet.conta ?? null,
          balance: Number(
            data.wallet.balance ?? 0
          ),
          currency:
            data.wallet.currency || "BRL",
        });

        /*
         * Normaliza transações.
         */
        const apiTransactions: ApiTransaction[] =
          Array.isArray(data.transactions)
            ? data.transactions
            : [];

        const normalizedTransactions: Transaction[] =
          apiTransactions
            .map(
              (
                transaction
              ): Transaction => ({
                id:
                  transaction.id ??
                  crypto.randomUUID(),

                title:
                  transaction.title ||
                  "Movimentação",

                description:
                  transaction.description ||
                  "Movimentação da carteira",

                value: Number(
                  transaction.value ??
                    transaction.amount ??
                    0
                ),

                type:
                  normalizeTransactionType(
                    transaction.type
                  ),

                created_at:
                  transaction.created_at ||
                  "",
              })
            )
            .sort((a, b) => {
              const dateA = new Date(
                a.created_at
              ).getTime();

              const dateB = new Date(
                b.created_at
              ).getTime();

              return dateB - dateA;
            })
            .slice(0, 10);

        setTransactions(
          normalizedTransactions
        );

        setWalletNotFound(false);
      } catch (error) {
        setWallet(null);
        setTransactions([]);
        setWalletNotFound(false);

        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar sua carteira."
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  /*
   * Carrega a carteira ao abrir a página.
   */
  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  /*
   * ABRE O MODAL.
   *
   * Importante:
   * essa função NÃO cria a carteira.
   */
  function openCreateWalletModal() {
    setError("");
    setShowCreateWalletModal(true);
  }

  /*
   * FECHA O MODAL.
   *
   * Se estiver criando, não permite fechar.
   */
  function closeCreateWalletModal() {
    if (creatingWallet) {
      return;
    }

    setShowCreateWalletModal(false);
  }

  /*
   * CRIA A CARTEIRA.
   *
   * Essa função só é chamada pelo botão
   * "Criar carteira" DENTRO do modal.
   */
  async function createWallet() {
    if (creatingWallet) {
      return;
    }

    try {
      setCreatingWallet(true);
      setError("");

      const response = await fetch(
        "/api/wallet",
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      let data: any = null;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        await response.text();
      }

      /*
       * Sessão expirada.
       */
      if (response.status === 401) {
        throw new Error(
          "Sua sessão expirou. Faça login novamente."
        );
      }

      /*
       * 405 = método POST não existe na API.
       */
      if (response.status === 405) {
        throw new Error(
          "A API da carteira não aceita POST. Adicione o método POST em /api/wallet."
        );
      }

      /*
       * Outros erros.
       */
      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Não foi possível criar sua carteira."
        );
      }

      /*
       * Fecha o modal somente depois
       * que a API confirmou a criação.
       */
      setShowCreateWalletModal(false);

      /*
       * Recarrega os dados da carteira.
       */
      await loadWallet();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar sua carteira."
      );
    } finally {
      setCreatingWallet(false);
    }
  }

  const balance =
    wallet?.balance ?? 0;

  const conta =
    wallet?.conta ?? "";

  function formatCurrency(
    value: number
  ) {
    return value.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency:
          wallet?.currency || "BRL",
      }
    );
  }

  function formatDate(
    date: string
  ) {
    if (!date) {
      return "";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "";
    }

    return parsedDate.toLocaleString(
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

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */
  if (loading) {
    return (
      <main className="min-h-screen pb-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <header className="flex items-center pt-6 sm:pt-8">
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
                  Maylon Pay
                </h1>
              </div>
            </div>
          </header>

          <div className="mt-8 flex min-h-[420px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-white/10 text-[#83ead9]">
                <Wallet size={30} />
              </div>

              <p className="mt-5 text-sm font-bold text-white">
                Carregando sua carteira...
              </p>

              <p className="mt-1 text-xs text-white/40">
                Aguarde um momento.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * MODAL DE CRIAÇÃO
   *
   * Ele é renderizado por cima da tela de carteira inexistente.
   * A tela não avança até a confirmação.
   * =========================================================
   */
  function CreateWalletModal() {
    if (!showCreateWalletModal) {
      return null;
    }

    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#001b2f]/75 p-4 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-wallet-title"
      >
        <div
          className="relative w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.35)]"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          {/* Decoração */}
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#08a89d]/10 blur-3xl" />

          <div className="relative p-6 sm:p-7">
            {/* Fechar */}
            <button
              type="button"
              onClick={
                closeCreateWalletModal
              }
              disabled={creatingWallet}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5f8f9] text-[#8194a4] transition hover:bg-[#edf1f3] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
            <p className="mt-3 text-sm leading-6 text-[#718494]">
              Verificaçlão da didit
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (walletNotFound) {
    return (
      <>
        <main className="min-h-screen pb-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
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
                    Maylon Pay
                  </h1>
                </div>
              </div>
            </header>

            <section className="mt-8">
              <div className="relative mx-auto max-w-2xl overflow-hidden rounded-[32px] bg-gradient-to-br from-[#062b4f] via-[#07566b] to-[#08a89d] p-7 shadow-[0_25px_70px_rgba(8,168,157,0.22)] sm:p-10">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#5be0c8]/20 blur-3xl" />

                <div className="absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-[#08a89d]/20 blur-3xl" />

                <div className="relative text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-white/10 text-[#83ead9]">
                    <Wallet size={38} />
                  </div>

                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#83ead9]">
                    Maylon Pay
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                    Crie sua carteira
                  </h2>

                  <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/65">
                    Você ainda não possui uma
                    carteira digital. Crie sua
                    carteira Maylon Pay
                    gratuitamente para começar
                    a receber, enviar e
                    movimentar seu dinheiro.
                  </p>

                  {error && (
                    <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-left text-sm text-red-100">
                      {error}
                    </div>
                  )}

                  {/* 
                    IMPORTANTE:
                    Agora esse botão NÃO chama createWallet.
                    Ele apenas abre o modal.
                  */}
                  <button
                    type="button"
                    onClick={
                      openCreateWalletModal
                    }
                    disabled={creatingWallet}
                    className="mt-6 inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-white px-6 text-sm font-black text-[#062b4f] transition hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[280px]"
                  >
                    <Wallet size={19} />
                    Criar minha carteira
                  </button>

                  <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <Wallet
                        size={19}
                        className="text-[#83ead9]"
                      />

                      <p className="mt-3 text-xs font-black text-white">
                        Conta digital
                      </p>

                      <p className="mt-1 text-[10px] leading-4 text-white/45">
                        Tenha sua própria conta
                        Maylon.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4">
                      <QrCode
                        size={19}
                        className="text-[#83ead9]"
                      />

                      <p className="mt-3 text-xs font-black text-white">
                        Pix
                      </p>

                      <p className="mt-1 text-[10px] leading-4 text-white/45">
                        Envie e receba dinheiro.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4">
                      <History
                        size={19}
                        className="text-[#83ead9]"
                      />

                      <p className="mt-3 text-xs font-black text-white">
                        Extrato
                      </p>

                      <p className="mt-1 text-[10px] leading-4 text-white/45">
                        Acompanhe suas
                        movimentações.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* 
          O modal fica fora do conteúdo principal.
          Ele aparece por cima de tudo.
        */}
        <CreateWalletModal />
      </>
    );
  }

  /*
   * =========================================================
   * CARTEIRA EXISTENTE
   * =========================================================
   */
  return (
    <>
      <main className="min-h-screen pb-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          {/* HEADER */}
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
                  Maylon Pay
                </h1>
              </div>
            </div>

            <Link
              href="/passageiro/servicos/extrato"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
              aria-label="Extrato"
            >
              <History size={18} />
            </Link>
          </header>

          {/* ERRO */}
          {error && (
            <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {/* CARTEIRA */}
          <section className="mt-6">
            <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#062b4f] via-[#07566b] to-[#08a89d] p-6 shadow-[0_20px_55px_rgba(8,168,157,0.20)] sm:p-8">
              <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#5be0c8]/20 blur-3xl" />

              <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#08a89d]/20 blur-3xl" />

              <div className="relative">
                {/* TOPO */}
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
                    onClick={() =>
                      setShowBalance(
                        (value) => !value
                      )
                    }
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

                {/* SALDO */}
                <div className="mt-6">
                  <p className="mb-3 text-sm font-medium text-white">
                    N° da Conta:{" "}
                    <span className="font-black">
                      {conta ||
                        "Não disponível"}
                    </span>
                  </p>

                  <p className="text-sm font-medium text-white/60">
                    Seu saldo
                  </p>

                  <h2 className="mt-1 text-4xl font-black tracking-tight text-white">
                    {showBalance
                      ? formatCurrency(
                          balance
                        )
                      : "R$ ••••••"}
                  </h2>
                </div>

                {/* AÇÕES DA CARTEIRA */}
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
                      <ArrowDownToLine
                        size={20}
                      />
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

          {/* AÇÕES RÁPIDAS */}
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
                  <ArrowDownToLine
                    size={21}
                  />
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
                  <ArrowUpRight
                    size={21}
                  />
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

          {/* MOVIMENTAÇÕES */}
          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-black text-white">
                  Movimentações recentes
                </h2>

                <p className="mt-0 text-xs text-white/45">
                  Últimas 10 movimentações da
                  sua carteira
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
              {transactions.length ===
              0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f8f9] text-[#9aabb8]">
                    <History size={20} />
                  </div>

                  <p className="mt-3 text-sm font-bold text-[#062b4f]">
                    Nenhuma movimentação
                    encontrada
                  </p>

                  <p className="mt-1 text-xs text-[#8ca0b2]">
                    Quando você realizar
                    uma transação, ela
                    aparecerá aqui.
                  </p>
                </div>
              ) : (
                transactions.map(
                  (
                    transaction,
                    index
                  ) => (
                    <div
                      key={
                        transaction.id
                      }
                      className={`flex items-center gap-3 p-4 sm:p-5 ${
                        index !==
                        transactions.length -
                          1
                          ? "border-b border-[#edf1f3]"
                          : ""
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          transaction.type ===
                          "in"
                            ? "bg-[#e7f8f4] text-[#08a89d]"
                            : "bg-[#fff3f1] text-[#ef5b5b]"
                        }`}
                      >
                        {transaction.type ===
                        "in" ? (
                          <ArrowDownToLine
                            size={19}
                          />
                        ) : (
                          <ArrowUpRight
                            size={19}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[#062b4f]">
                          {
                            transaction.title
                          }
                        </p>

                        <p className="mt-1 text-[10px] text-[#9aabb8]">
                          {
                            transaction.description
                          }
                        </p>

                        <p className="mt-1 text-[9px] text-[#b0bcc5]">
                          {formatDate(
                            transaction.created_at
                          )}
                        </p>
                      </div>

                      <p
                        className={`whitespace-nowrap text-sm font-black ${
                          transaction.type ===
                          "in"
                            ? "text-[#08a89d]"
                            : "text-[#062b4f]"
                        }`}
                      >
                        {transaction.type ===
                        "in"
                          ? "+"
                          : "-"}{" "}
                        {formatCurrency(
                          Math.abs(
                            transaction.value
                          )
                        )}
                      </p>
                    </div>
                  )
                )
              )}
            </div>
          </section>
          

          {/* OUTROS SERVIÇOS */}
          <section className="mt-8">
            <div className="mb-5">
              <h2 className="text-lg font-black text-white">
                Outros serviços
              </h2>

              <p className="mt-0 text-xs text-white/45">
                Use seu saldo para facilitar
                seu dia
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {services.map(
                (service) => {
                  const Icon =
                    service.icon;

                  return (
                    <Link
                      key={
                        service.title
                      }
                      href={
                        service.href
                      }
                      className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.13)]"
                    >
                      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#f7fafb] transition-transform duration-500 group-hover:scale-150" />

                      <div className="relative flex items-center gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${service.iconBg} ${service.iconColor}`}
                        >
                          <Icon
                            size={25}
                            strokeWidth={
                              1.8
                            }
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-black text-[#062b4f]">
                            {
                              service.title
                            }
                          </h3>

                          <p className="mt-1 text-[11px] leading-4 text-[#8ca0b2]">
                            {
                              service.description
                            }
                          </p>
                        </div>

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f8f9] text-[#8194a4] transition-all group-hover:bg-[#08a89d] group-hover:text-white">
                          <ArrowRight
                            size={15}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          </section>

          {/* SEGURANÇA */}
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
                  Gerencie seu saldo,
                  Pix e pagamentos em
                  um só lugar.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <CreateWalletModal />
    </>
  );
}
