"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clipboard,
  Copy,
  QrCode,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DepositoPage() {
  const [copied, setCopied] = useState(false);
  const [selectedValue, setSelectedValue] = useState(100);

  const balance = 1248.75;

  const values = [20, 50, 100, 200, 500];

  const pixCode =
    "00020126580014BR.GOV.BCB.PIX0136maylon-deposito-1234567895204000053039865405100.005802BR5925MAYLON PAY6009SAO PAULO62070503***6304ABCD";

  function copyPixCode() {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
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
                Depositar
              </h1>
            </div>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
            <Wallet size={18} />
          </div>
        </header>

        <section className="mt-6">
          <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#062b4f] via-[#07566b] to-[#08a89d] p-6 shadow-[0_20px_50px_rgba(8,168,157,0.18)] sm:p-7">
            <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#5be0c8]/20 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2">
                <Wallet size={15} className="text-[#83ead9]" />
                <span className="text-xs font-bold text-white/60">
                  Saldo disponível
                </span>
              </div>

              <p className="mt-2 text-3xl font-black text-white sm:text-4xl">
                {balance.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>

              <p className="mt-2 text-xs text-white/50">
                Adicione dinheiro à sua carteira Maylon Pay.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">
              Quanto deseja depositar?
            </h2>
            <p className="mt-1 text-xs text-white/45">
              Escolha um valor para adicionar à carteira.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {values.map((value) => {
              const active = selectedValue === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedValue(value)}
                  className={`rounded-2xl border p-4 text-center transition-all ${
                    active
                      ? "border-[#08a89d] bg-[#08a89d] text-white shadow-[0_10px_25px_rgba(8,168,157,0.20)]"
                      : "border-white/10 bg-white text-[#062b4f] hover:border-[#08a89d]/30"
                  }`}
                >
                  <span className="text-base font-black sm:text-lg">
                    R$ {value}
                  </span>

                  {active && (
                    <div className="mt-1 flex justify-center">
                      <Check size={13} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">
              Depósito via Pix
            </h2>
            <p className="mt-1 text-xs text-white/45">
              Envie o valor para sua carteira usando Pix.
            </p>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_15px_40px_rgba(0,0,0,0.08)]">
            <div className="border-b border-[#edf1f3] p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e7f8f4] text-[#08a89d]">
                  <QrCode size={27} />
                </div>

                <div>
                  <p className="text-sm font-black text-[#062b4f]">
                    QR Code Pix
                  </p>
                  <p className="mt-1 text-xs text-[#8ca0b2]">
                    Escaneie o código usando o aplicativo do seu banco.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <div className="flex h-44 w-44 items-center justify-center rounded-[24px] border border-[#edf1f3] bg-[#f8fafb]">
                  <QrCode
                    size={125}
                    strokeWidth={1.2}
                    className="text-[#062b4f]"
                  />
                </div>
              </div>

              <p className="mt-4 text-center text-[10px] text-[#9aabb8]">
                Valor do depósito:{" "}
                <span className="font-black text-[#062b4f]">
                  {selectedValue.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#9aabb8]">
                    Pix Copia e Cola
                  </p>
                  <p className="mt-1 text-xs text-[#71869a]">
                    Copie o código para pagar pelo seu banco.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyPixCode}
                  className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#08a89d] px-4 text-[11px] font-black text-white transition hover:bg-[#07978e]"
                >
                  {copied ? (
                    <>
                      <Check size={15} />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={15} />
                      Copiar
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-[#f5f8f9] p-4">
                <p className="break-all text-[10px] leading-5 text-[#71869a]">
                  {pixCode}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#08a89d]/10 text-[#08a89d]">
              <Clipboard size={20} />
            </div>

            <div>
              <p className="text-xs font-bold text-white">
                Como depositar
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-white/45">
                Copie o código Pix, abra seu banco e faça o pagamento.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">
              Depósito rápido
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-white/10 bg-white p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f8f4] text-[#08a89d]">
                <Zap size={20} />
              </div>

              <h3 className="mt-4 text-sm font-black text-[#062b4f]">
                Confirmação rápida
              </h3>

              <p className="mt-1 text-[11px] leading-5 text-[#8ca0b2]">
                Após a confirmação do Pix, o saldo será atualizado na sua
                carteira.
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf4fb] text-[#1676b7]">
                <ShieldCheck size={20} />
              </div>

              <h3 className="mt-4 text-sm font-black text-[#062b4f]">
                Depósito seguro
              </h3>

              <p className="mt-1 text-[11px] leading-5 text-[#8ca0b2]">
                Confira os dados antes de confirmar a transferência no seu
                banco.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <Link
            href="/passageiro/servicos/extrato"
            className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/5 p-4 text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            Ver histórico de depósitos
            <ArrowRight size={15} />
          </Link>
        </section>
      </div>
    </main>
  );
}