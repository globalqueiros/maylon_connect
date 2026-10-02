"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  UserRound,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function TransferirPage() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const balance = 1248.75;

  const numericAmount = Number(
    amount.replace(/\./g, "").replace(",", ".")
  );

  const hasAmount = numericAmount > 0;

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="flex items-center justify-between pt-6 sm:pt-8">
          <div className="flex items-center gap-3">
            <Link
              href="/passageiro/servicos"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <h1 className="mt-0.5 text-xl font-black text-white sm:text-2xl">
                Transferir
              </h1>
            </div>
          </div>
        </header>

        {/* Saldo */}
        <section className="mt-6">
          <div className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#08a89d]/10 text-[#08a89d]">
                <Wallet size={20} />
              </div>

              <div>
                <p className="text-[10px] text-white/40">
                  Saldo disponível
                </p>

                <p className="mt-0.5 text-base font-black text-white">
                  {balance.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
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

        {/* Destinatário */}
        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">
              Para quem você quer transferir?
            </h2>

            <p className="mt-1 text-xs text-white/45">
              Informe os dados do destinatário
            </p>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white p-5 shadow-[0_12px_35px_rgba(0,0,0,0.08)]">

            <label className="text-xs font-bold text-[#062b4f]">
              CPF, CNPJ, telefone ou chave Pix
            </label>

            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#e5ecef] bg-[#f8fafb] px-4 py-3 transition focus-within:border-[#08a89d] focus-within:ring-2 focus-within:ring-[#08a89d]/10">
              <UserRound
                size={19}
                className="shrink-0 text-[#08a89d]"
              />

              <input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="Digite a chave ou identificador"
                className="w-full bg-transparent text-sm font-medium text-[#062b4f] outline-none placeholder:text-[#a6b4bf]"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center gap-3 rounded-2xl border border-[#e5ecef] p-3 text-left transition hover:border-[#08a89d]/30 hover:bg-[#f8fbfa]"
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

              <Link
                href="/passageiro/servicos/pix/qr-code"
                className="flex items-center gap-3 rounded-2xl border border-[#e5ecef] p-3 text-left transition hover:border-[#08a89d]/30 hover:bg-[#f8fbfa]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1ebff] text-[#8b5cf6]">
                  <CreditCard size={17} />
                </div>

                <div>
                  <p className="text-[11px] font-black text-[#062b4f]">
                    QR Code
                  </p>

                  <p className="mt-0.5 text-[9px] text-[#8ca0b2]">
                    Escanear
                  </p>
                </div>

                <ChevronRight
                  size={14}
                  className="ml-auto text-[#9aabb8]"
                />
              </Link>
            </div>
          </div>
        </section>

        {/* Valor */}
        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">
              Quanto você deseja transferir?
            </h2>

            <p className="mt-1 text-xs text-white/45">
              Informe o valor da transferência
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
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0,00"
                  className="w-48 bg-transparent text-center text-4xl font-black tracking-tight text-[#062b4f] outline-none placeholder:text-[#d1d9de] sm:text-5xl"
                />
              </div>
            </div>

            {/* Valores rápidos */}
            <div className="mt-6 grid grid-cols-4 gap-2">
              {[20, 50, 100, 200].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setAmount(
                      value.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })
                    )
                  }
                  className="rounded-xl border border-[#e5ecef] py-2.5 text-xs font-bold text-[#062b4f] transition hover:border-[#08a89d] hover:bg-[#e7f8f4] hover:text-[#08a89d]"
                >
                  R$ {value}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-[#9aabb8]">
              <CheckCircle2
                size={13}
                className="text-[#08a89d]"
              />
              Você possui saldo suficiente
            </div>
          </div>
        </section>

        {/* Resumo */}
        {hasAmount && (
          <section className="mt-7">
            <div className="rounded-[26px] border border-[#5be0c8]/20 bg-[#08a89d] p-5 shadow-[0_15px_35px_rgba(8,168,157,0.18)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">
                    Você está transferindo
                  </p>

                  <p className="mt-1 text-2xl font-black text-white">
                    {numericAmount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
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

              <button
                type="button"
                disabled={!recipient || !hasAmount}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#08a89d] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Revisar transferência
                <ArrowRight size={17} />
              </button>
            </div>
          </section>
        )}

        {/* Segurança */}
        <section className="mt-5">
          <div className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#08a89d]/10 text-[#08a89d]">
              <CheckCircle2 size={19} />
            </div>

            <div>
              <p className="text-xs font-bold text-white">
                Transferência segura
              </p>

              <p className="mt-0.5 text-[10px] leading-4 text-white/40">
                Confira sempre os dados do destinatário antes de confirmar.
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
