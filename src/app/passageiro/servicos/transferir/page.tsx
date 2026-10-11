"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  UserRound,
  Wallet,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type WalletData = {
  balance: number;
};

type TransferResult = {
  id?: string;
  status?: string;
  message?: string;
};

export default function TransferirPage() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingTransfer, setLoadingTransfer] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [transfer, setTransfer] =
    useState<TransferResult | null>(null);

  /*
   * Busca o saldo real da carteira.
   */
  useEffect(() => {
    async function carregarWallet() {
      try {
        setLoadingBalance(true);
        setError("");

        const response = await fetch("/api/wallet", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
            "Não foi possível carregar o saldo.",
          );
        }

        /*
         * Aceita:
         *
         * {
         *   balance: 1248.75
         * }
         *
         * ou:
         *
         * {
         *   saldo: 1248.75
         * }
         */
        const saldo = Number(
          data?.balance ?? data?.saldo ?? 0,
        );

        setBalance(Number.isFinite(saldo) ? saldo : 0);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar saldo.",
        );
      } finally {
        setLoadingBalance(false);
      }
    }

    carregarWallet();
  }, []);

  /*
   * Converte o campo de valor para número.
   *
   * Exemplo:
   *
   * "1.250,50" -> 1250.50
   */
  const numericAmount = Number(
    amount.replace(/\./g, "").replace(",", "."),
  );

  const hasAmount = numericAmount > 0;

  const insufficientBalance =
    hasAmount && numericAmount > balance;

  const canTransfer =
    recipient.trim().length > 0 &&
    hasAmount &&
    !insufficientBalance &&
    !loadingTransfer &&
    !loadingBalance;

  function handleAmount(value: string) {
    const numbers = value.replace(/\D/g, "");

    if (!numbers) {
      setAmount("");
      setError("");
      return;
    }

    const number = Number(numbers) / 100;

    setAmount(
      number.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );

    setError("");
    setSuccess(false);
  }

  function selecionarValor(value: number) {
    setAmount(
      value.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );

    setError("");
    setSuccess(false);
  }

  /*
   * Realiza a transferência PIX.
   *
   * O backend deve validar novamente:
   * - usuário autenticado
   * - saldo
   * - chave PIX
   * - valor
   * - limites
   * - idempotência
   */
  async function transferir() {
    if (!recipient.trim()) {
      setError("Informe a chave PIX do destinatário.");
      return;
    }

    if (!hasAmount) {
      setError("Informe um valor válido para transferir.");
      return;
    }

    if (numericAmount <= 0) {
      setError("O valor deve ser maior que zero.");
      return;
    }

    if (numericAmount > balance) {
      setError("Você não possui saldo suficiente.");
      return;
    }

    setLoadingTransfer(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(
        "/api/wallet/transfer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient: recipient.trim(),
            amount: numericAmount,
            method: "PIX",
            provider: "MAYLON_PASS",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          "Não foi possível realizar a transferência.",
        );
      }

      setTransfer(data);
      setSuccess(true);

      /*
       * Atualiza o saldo depois da transferência.
       */
      setBalance((current) =>
        Math.max(0, current - numericAmount),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao realizar transferência PIX.",
      );
    } finally {
      setLoadingTransfer(false);
    }
  }

  function novaTransferencia() {
    setRecipient("");
    setAmount("");
    setError("");
    setSuccess(false);
    setTransfer(null);
  }

  const saldoFormatado = balance.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );

  const valorTransferencia = numericAmount.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between pt-6 sm:pt-8">
          <div className="flex items-center gap-3">
            <Link
              href="/passageiro/servicos"
              className="flex h-10 items-center gap-2 rounded-xl border border-[#08a89d]/30 bg-[#08a89d]/10 px-4 text-sm font-bold text-white transition"
            >
              <ArrowLeft size={18} />
              <span>Voltar</span>
            </Link>
            <div>
              <h1 className="mt-0.5 text-xl font-black text-white sm:text-2xl">
                Transferir
              </h1>
            </div>
          </div>
        </header>

        {/* SALDO */}
        <section className="mt-6">
          <div className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#08a89d]/10 text-[#08a89d]">
                {loadingBalance ? (
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                ) : (
                  <Wallet size={20} />
                )}
              </div>

              <div>
                <p className="text-[10px] text-white/40">
                  Saldo disponível
                </p>

                <p className="mt-0.5 text-base font-black text-white">
                  {loadingBalance
                    ? "Carregando..."
                    : saldoFormatado}
                </p>
              </div>
            </div>

            <Link
              href="/passageiro/servicos/deposito"
              className="text-[11px] font-bold text-[#08a89d]"
            >
              Adicionar saldo
            </Link>
          </div>
        </section>

        {/* SUCESSO */}
        {success ? (
          <section className="mt-7">
            <div className="rounded-[28px] border border-[#5be0c8]/20 bg-[#08a89d] p-7 text-center shadow-[0_15px_35px_rgba(8,168,157,0.18)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white">
                <CheckCircle2 size={34} />
              </div>

              <h2 className="mt-5 text-2xl font-black text-white">
                Transferência enviada!
              </h2>

              <p className="mt-2 text-sm text-white/70">
                Você transferiu
              </p>

              <p className="mt-1 text-3xl font-black text-white">
                {valorTransferencia}
              </p>

              <div className="mt-5 rounded-2xl bg-white/10 p-4 text-left">
                <div className="flex justify-between gap-4">
                  <span className="text-xs text-white/60">
                    Destinatário
                  </span>

                  <span className="max-w-[220px] truncate text-xs font-bold text-white">
                    {recipient}
                  </span>
                </div>

                {transfer?.id && (
                  <div className="mt-3 flex justify-between gap-4">
                    <span className="text-xs text-white/60">
                      ID
                    </span>

                    <span className="max-w-[220px] truncate text-xs font-bold text-white">
                      {transfer.id}
                    </span>
                  </div>
                )}

                <div className="mt-3 flex justify-between gap-4">
                  <span className="text-xs text-white/60">
                    Novo saldo
                  </span>

                  <span className="text-xs font-bold text-white">
                    {saldoFormatado}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={novaTransferencia}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#08a89d] transition hover:bg-white/90"
              >
                Fazer outra transferência
                <ArrowRight size={17} />
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* DESTINATÁRIO */}
            <section className="mt-7">
              <div className="mb-4">
                <h2 className="text-lg font-black text-white">
                  Para quem você quer transferir?
                </h2>

                <p className="mt-1 text-xs text-white/45">
                  Informe a chave PIX do destinatário
                </p>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white p-5 shadow-[0_12px_35px_rgba(0,0,0,0.08)]">

                <label
                  htmlFor="recipient"
                  className="text-xs font-bold text-[#062b4f]"
                >
                  Chave PIX
                </label>

                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#e5ecef] bg-[#f8fafb] px-4 py-3 transition focus-within:border-[#08a89d] focus-within:ring-2 focus-within:ring-[#08a89d]/10">
                  <UserRound
                    size={19}
                    className="shrink-0 text-[#08a89d]"
                  />

                  <input
                    id="recipient"
                    value={recipient}
                    disabled={loadingTransfer}
                    onChange={(event) =>
                      setRecipient(event.target.value)
                    }
                    placeholder="CPF, CNPJ, telefone, e-mail ou chave aleatória"
                    className="w-full bg-transparent text-sm font-medium text-[#062b4f] outline-none placeholder:text-[#a6b4bf] disabled:opacity-50"
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#e5ecef] p-3 text-left transition hover:border-[#08a89d]/30 hover:bg-[#f8fbfa]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7f8f4] text-[#08a89d]">
                      <UserRound size={17} />
                    </div>

                    <div>
                      <p className="text-[11px] font-black text-[#062b4f]">
                        Contatos
                      </p>

                      <p className="mt-0.5 text-[9px] text-[#8ca0b2]">
                        Escolher contato
                      </p>
                    </div>

                    <ChevronRight
                      size={14}
                      className="ml-auto text-[#9aabb8]"
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* VALOR */}
            <section className="mt-7">
              <div className="mb-4">
                <h2 className="text-lg font-black text-white">
                  Quanto você deseja transferir?
                </h2>

                <p className="mt-1 text-xs text-white/45">
                  O valor será descontado do seu saldo
                </p>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white p-6 shadow-[0_12px_35px_rgba(0,0,0,0.08)]">

                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#9aabb8]">
                    Valor da transferência
                  </p>

                  <div className="mt-3 flex items-center justify-center">
                    <span className="mr-2 text-lg font-bold text-[#9aabb8]">
                      R$
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      disabled={loadingTransfer}
                      onChange={(event) =>
                        handleAmount(event.target.value)
                      }
                      placeholder="0,00"
                      className="w-48 bg-transparent text-center text-4xl font-black tracking-tight text-[#062b4f] outline-none placeholder:text-[#d1d9de] sm:text-5xl disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* VALORES RÁPIDOS */}
                <div className="mt-6 grid grid-cols-4 gap-2">
                  {[20, 50, 100, 200].map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        disabled={loadingTransfer}
                        onClick={() =>
                          selecionarValor(value)
                        }
                        className="rounded-xl border border-[#e5ecef] py-2.5 text-xs font-bold text-[#062b4f] transition hover:border-[#08a89d] hover:bg-[#e7f8f4] hover:text-[#08a89d] disabled:opacity-50"
                      >
                        R$ {value}
                      </button>
                    ),
                  )}
                </div>

                {/* STATUS DO SALDO */}
                <div className="mt-5 flex items-center justify-center gap-2 text-[10px]">
                  {insufficientBalance ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-red-500" />

                      <span className="font-semibold text-red-500">
                        Saldo insuficiente
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2
                        size={13}
                        className="text-[#08a89d]"
                      />

                      <span className="text-[#9aabb8]">
                        Saldo suficiente
                      </span>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* RESUMO */}
            {hasAmount && (
              <section className="mt-7">
                <div className="rounded-[26px] border border-[#5be0c8]/20 bg-[#08a89d] p-5 shadow-[0_15px_35px_rgba(8,168,157,0.18)]">

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">
                        Você está transferindo
                      </p>

                      <p className="mt-1 text-2xl font-black text-white">
                        {valorTransferencia}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                      <ArrowUpRight size={23} />
                    </div>
                  </div>

                  <div className="mt-5 h-px bg-white/15" />

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-white/65">
                      Destinatário
                    </span>

                    <span className="max-w-[200px] truncate text-xs font-bold text-white">
                      {recipient || "Não informado"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-white/65">
                      Saldo após transferência
                    </span>

                    <span className="text-xs font-bold text-white">
                      {Math.max(
                        0,
                        balance - numericAmount,
                      ).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={transferir}
                    disabled={!canTransfer}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#08a89d] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingTransfer ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Processando PIX...
                      </>
                    ) : (
                      <>
                        Transferir via PIX
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </div>
              </section>
            )}

            {/* ERRO */}
            {error && (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-300">
                {error}
              </div>
            )}

            {/* SEGURANÇA */}
            <section className="mt-5">
              <div className="flex items-center gap-3 rounded-[22px] border border-[#08a89d]/30 bg-[#08a89d]/10 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#08a89d]/20 text-[#08a89d]">
                  <CheckCircle2 size={19} />
                </div>

                <div>
                  <p className="text-xs font-bold text-[#08a89d]">
                    Transferência segura
                  </p>

                  <p className="mt-0.5 text-[10px] leading-4 text-[#08a89d]/70">
                    Confira sempre a destinatário e o valor antes
                    de confirmar a transferência.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
