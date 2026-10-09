"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  FileText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Boleto = {
  id: string;
  valor: number;
  linhaDigitavel: string;
  nossoNumero?: string;
  vencimento?: string;
  url?: string;
};

export default function DepositoBoletoPage() {
  const [valor, setValor] = useState("");
  const [boleto, setBoleto] = useState<Boleto | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState("");

  function handleValor(value: string) {
    const numeros = value.replace(/\D/g, "");

    if (!numeros) {
      setValor("");
      return;
    }

    const numero = Number(numeros) / 100;

    setValor(
      numero.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );

    setError("");
  }

  function valorNumerico() {
    return Number(
      valor.replace(/\./g, "").replace(",", "."),
    );
  }

  async function gerarBoleto() {
    setError("");

    const valorFinal = valorNumerico();

    if (!valorFinal || valorFinal <= 0) {
      setError("Informe um valor válido para o depósito.");
      return;
    }

    if (valorFinal < 10) {
      setError("O valor mínimo para depósito é de R$ 10,00.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/deposito/boleto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valor: valorFinal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Não foi possível gerar o boleto.",
        );
      }

      setBoleto(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao gerar boleto.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copiarLinhaDigitavel() {
    if (!boleto?.linhaDigitavel) return;

    await navigator.clipboard.writeText(
      boleto.linhaDigitavel,
    );

    setCopiado(true);

    setTimeout(() => {
      setCopiado(false);
    }, 2000);
  }

  function novoDeposito() {
    setValor("");
    setBoleto(null);
    setError("");
    setCopiado(false);
  }

  const valorFormatado = boleto?.valor.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );

  return (
    <main className="min-h-screen pb-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <header className="pt-6 sm:pt-8">
          <div className="flex items-center gap-4">
            <Link
              href="/motorista/servicos"
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <ArrowLeft size={17} />
              <span>Voltar</span>
            </Link>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Depósito na conta
              </h1>

              <p className="mt-1 text-sm text-white/60">
                Adicione saldo através de boleto bancário.
              </p>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="mt-7">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#062b4f] via-[#074d68] to-[#08a89d] p-6 shadow-[0_20px_50px_rgba(6,43,79,0.18)] sm:p-8">

            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#5be0c8]/20 blur-3xl" />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm">
                <Wallet size={25} />
              </div>

              <h2 className="mt-5 text-2xl font-black text-white sm:text-3xl">
                Adicione dinheiro à sua conta
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
                Escolha o valor que deseja adicionar e gere
                seu boleto bancário.
              </p>
            </div>
          </div>
        </section>

        {/* CARD */}
        <section className="mt-6">
          <div className="rounded-[28px] border border-[#e2ebee] bg-white p-5 shadow-[0_12px_40px_rgba(6,43,79,0.07)] sm:p-8">

            {!boleto ? (
              <>
                <div>
                  <h2 className="text-lg font-black text-[#062b4f]">
                    Quanto deseja depositar?
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-[#71869a]">
                    Informe o valor que deseja adicionar
                    ao saldo da sua conta.
                  </p>
                </div>

                {/* VALOR */}
                <div className="mt-7">
                  <label
                    htmlFor="valor"
                    className="text-xs font-bold text-[#506a82]"
                  >
                    Valor do depósito
                  </label>

                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8ca0b2]">
                      R$
                    </span>

                    <input
                      id="valor"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={valor}
                      onChange={(event) =>
                        handleValor(event.target.value)
                      }
                      disabled={loading}
                      placeholder="0,00"
                      className="h-16 w-full rounded-2xl border border-[#dce5e9] bg-[#fbfcfd] pl-12 pr-4 text-2xl font-black text-[#062b4f] outline-none transition placeholder:text-[#a4b3bd] focus:border-[#08a89d] focus:bg-white focus:ring-4 focus:ring-[#08a89d]/10 disabled:opacity-60"
                    />
                  </div>

                  <p className="mt-2 text-[10px] text-[#8ca0b2]">
                    Valor mínimo para depósito: R$ 10,00.
                  </p>
                </div>

                {/* MÉTODO */}
                <div className="mt-7">
                  <p className="text-xs font-bold text-[#506a82]">
                    Forma de depósito
                  </p>

                  <div className="mt-2 rounded-2xl border-2 border-[#08a89d] bg-[#f3fbf9] p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e5f8f4] text-[#08a89d]">
                        <FileText size={23} />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-black text-[#062b4f]">
                          Boleto bancário
                        </p>

                        <p className="mt-1 text-xs text-[#71869a]">
                          Gere um boleto para adicionar
                          saldo à sua conta.
                        </p>
                      </div>

                      <CheckCircle2
                        size={21}
                        className="text-[#08a89d]"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* BOLETO GERADO */}
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e5f8f4] text-[#08a89d]">
                    <CheckCircle2 size={28} />
                  </div>

                  <h2 className="mt-5 text-xl font-black text-[#062b4f]">
                    Boleto gerado
                  </h2>

                  <p className="mt-1 text-xs text-[#71869a]">
                    Pague o boleto para adicionar o valor
                    ao seu saldo.
                  </p>

                  <p className="mt-5 text-3xl font-black text-[#08a89d]">
                    {valorFormatado}
                  </p>
                </div>

                {/* LINHA DIGITÁVEL */}
                <div className="mt-7">
                  <p className="text-xs font-bold text-[#506a82]">
                    Linha digitável
                  </p>

                  <div className="mt-2 flex gap-2">
                    <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-[#dce5e9] bg-[#f9fbfc] px-4 py-3">
                      <p className="break-all text-xs font-semibold tracking-wide text-[#506a82]">
                        {boleto.linhaDigitavel}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={copiarLinhaDigitavel}
                      className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-[#08a89d] px-4 text-xs font-bold text-white transition hover:bg-[#078f80]"
                    >
                      <Copy size={16} />

                      {copiado
                        ? "Copiado"
                        : "Copiar"}
                    </button>
                  </div>
                </div>

                {/* INFORMAÇÕES */}
                <div className="mt-5 rounded-2xl border border-[#dce9e7] bg-[#f7fbfa] p-4">
                  <div className="flex justify-between gap-4 text-xs">
                    <span className="text-[#71869a]">
                      Valor
                    </span>

                    <span className="font-black text-[#062b4f]">
                      {valorFormatado}
                    </span>
                  </div>

                  {boleto.vencimento && (
                    <div className="mt-3 flex justify-between gap-4 text-xs">
                      <span className="text-[#71869a]">
                        Vencimento
                      </span>

                      <span className="font-bold text-[#062b4f]">
                        {boleto.vencimento}
                      </span>
                    </div>
                  )}

                  {boleto.nossoNumero && (
                    <div className="mt-3 flex justify-between gap-4 text-xs">
                      <span className="text-[#71869a]">
                        Nosso número
                      </span>

                      <span className="font-bold text-[#062b4f]">
                        {boleto.nossoNumero}
                      </span>
                    </div>
                  )}
                </div>

                {/* ABRIR BOLETO */}
                {boleto.url && (
                  <a
                    href={boleto.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#dce5e9] bg-white px-5 py-3.5 text-sm font-bold text-[#062b4f] transition hover:bg-[#f5f8fa]"
                  >
                    <FileText size={17} />
                    Abrir boleto
                  </a>
                )}

                {/* AVISO */}
                <div className="mt-5 rounded-2xl bg-[#f5f8fa] p-4">
                  <p className="text-xs font-black text-[#062b4f]">
                    Depois de pagar
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-[#71869a]">
                    Aguarde a confirmação do pagamento.
                    Depois que o boleto for compensado,
                    o valor será disponibilizado no seu saldo.
                  </p>
                </div>
              </>
            )}

            {/* ERRO */}
            {error && (
              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* SEGURANÇA */}
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#f5f8fa] p-4">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-[#08a89d]"
              />

              <div>
                <p className="text-xs font-bold text-[#062b4f]">
                  Depósito seguro
                </p>

                <p className="mt-1 text-[11px] leading-5 text-[#71869a]">
                  O saldo só será adicionado após a
                  confirmação do pagamento do boleto.
                </p>
              </div>
            </div>

            {/* BOTÃO */}
            <button
              type="button"
              onClick={
                boleto
                  ? novoDeposito
                  : gerarBoleto
              }
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#08a89d] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(8,168,157,0.2)] transition hover:bg-[#078f80] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Gerando boleto..."
                : boleto
                  ? "Fazer outro depósito"
                  : "Gerar boleto"}

              {!loading && <ArrowRight size={17} />}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}