"use client";

import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Clipboard,
  Copy,
  History,
  QrCode,
  ScanLine,
  Send,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const pixTransactions = [
  {
    title: "Pix recebido",
    description: "Hoje, 14:32",
    value: "+ R$ 150,00",
    type: "in",
  },
  {
    title: "Pix enviado",
    description: "Hoje, 10:18",
    value: "- R$ 45,00",
    type: "out",
  },
  {
    title: "Pix recebido",
    description: "Ontem, 19:42",
    value: "+ R$ 80,00",
    type: "in",
  },
];

export default function PixPage() {
  const [copied, setCopied] = useState(false);

  const balance = 1248.75;

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
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
                Pix
              </h1>
            </div>
          </div>

          <Link
            href="/passageiro/servicos/extrato"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
          >
            <History size={18} />
          </Link>
        </header>

        <section className="mt-6">
          <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#062b4f] via-[#07566b] to-[#08a89d] p-6 shadow-[0_20px_50px_rgba(8,168,157,0.18)] sm:p-7">
            <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#5be0c8]/20 blur-3xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Wallet size={15} className="text-[#83ead9]" />
                  <span className="text-xs font-bold text-white/60">
                    Saldo disponível
                  </span>
                </div>
                <p className="mt-2 text-3xl font-black text-white">
                  {balance.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>

              <div className="hidden h-16 w-16 items-center justify-center rounded-2xl bg-white/10 sm:flex">
                <QrCode size={30} className="text-white" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">
              O que você deseja fazer?
            </h2>
            <p className="mt-1 text-xs text-white/45">
              Escolha uma opção para continuar
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/passageiro/servicos/pix/enviar"
              className="group rounded-[24px] border border-white/10 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f8f4] text-[#08a89d]">
                <Send size={25} />
              </div>
              <h3 className="mt-5 text-base font-black text-[#062b4f]">
                Enviar Pix
              </h3>
              <p className="mt-1 text-xs leading-5 text-[#8ca0b2]">
                Envie dinheiro para uma pessoa ou empresa.
              </p>
              <div className="mt-5 flex items-center gap-2 text-[11px] font-bold text-[#08a89d]">
                Fazer Pix
                <ArrowRight
                  size={13}
                  className="transition-transform group-hover:translate-x-1"
                />
              </div>
            </Link>

            <Link
              href="/passageiro/servicos/pix/receber"
              className="group rounded-[24px] border border-white/10 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf4fb] text-[#1676b7]">
                <ArrowDownLeft size={25} />
              </div>
              <h3 className="mt-5 text-base font-black text-[#062b4f]">
                Receber Pix
              </h3>
              <p className="mt-1 text-xs leading-5 text-[#8ca0b2]">
                Gere um QR Code e receba pagamentos.
              </p>
              <div className="mt-5 flex items-center gap-2 text-[11px] font-bold text-[#1676b7]">
                Receber dinheiro
                <ArrowRight
                  size={13}
                  className="transition-transform group-hover:translate-x-1"
                />
              </div>
            </Link>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">Atalhos Pix</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/passageiro/servicos/pix/qr-code"
              className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white p-4 transition hover:-translate-y-0.5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1ebff] text-[#8b5cf6]">
                <ScanLine size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-[#062b4f]">
                  Ler QR Code
                </p>
                <p className="mt-1 text-[10px] text-[#8ca0b2]">
                  Pague escaneando
                </p>
              </div>
            </Link>

            <Link
              href="/passageiro/servicos/pix/chave"
              className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white p-4 transition hover:-translate-y-0.5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f8f4] text-[#08a89d]">
                <UserRound size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-[#062b4f]">
                  Usar chave Pix
                </p>
                <p className="mt-1 text-[10px] text-[#8ca0b2]">
                  CPF, telefone ou e-mail
                </p>
              </div>
            </Link>

            <Link
              href="/passageiro/servicos/pix/copia-e-cola"
              className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white p-4 transition hover:-translate-y-0.5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff3e7] text-[#f08a24]">
                <Clipboard size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-[#062b4f]">
                  Pix Copia e Cola
                </p>
                <p className="mt-1 text-[10px] text-[#8ca0b2]">
                  Cole um código Pix
                </p>
              </div>
            </Link>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">
              Minha chave Pix
            </h2>
            <p className="mt-1 text-xs text-white/45">
              Compartilhe sua chave para receber pagamentos
            </p>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white p-5 shadow-[0_12px_35px_rgba(0,0,0,0.08)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e7f8f4] text-[#08a89d]">
                <QrCode size={23} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9aabb8]">
                  Chave Pix
                </p>
                <p className="mt-1 truncate text-sm font-black text-[#062b4f]">
                  maylon@pix.com.br
                </p>
                <p className="mt-1 text-[10px] text-[#9aabb8]">E-mail</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText("maylon@pix.com.br");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f8f9] text-[#71869a] transition hover:bg-[#08a89d] hover:text-white"
              >
                {copied ? (
                  <span className="text-[10px] font-black">OK</span>
                ) : (
                  <Copy size={17} />
                )}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="rounded-[26px] bg-[#08a89d] p-5 shadow-[0_12px_30px_rgba(8,168,157,0.18)] sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                <QrCode size={23} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-white">
                  Receba por Pix
                </p>
                <p className="mt-1 text-[11px] leading-5 text-white/70">
                  Gere um QR Code para receber dinheiro diretamente na sua
                  carteira Maylon.
                </p>
              </div>

              <Link
                href="/passageiro/servicos/pix/receber"
                className="flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-[11px] font-black text-[#08a89d] transition hover:bg-white/90"
              >
                Gerar
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Últimos Pix</h2>
              <p className="mt-1 text-xs text-white/45">
                Suas movimentações recentes
              </p>
            </div>

            <Link
              href="/passageiro/servicos/extrato"
              className="text-xs font-bold text-[#08a89d]"
            >
              Ver todos
            </Link>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white">
            {pixTransactions.map((transaction, index) => (
              <div
                key={transaction.title + index}
                className={`flex items-center gap-3 p-4 ${
                  index !== pixTransactions.length - 1
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
                    <ArrowDownLeft size={19} />
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

        <section className="mt-5">
          <div className="flex items-center gap-4 rounded-[24px] border border-[#5be0c8]/20 bg-[#08a89d] p-4 shadow-[0_12px_30px_rgba(8,168,157,0.18)]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Pix seguro com a Maylon
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-white/75">
                Confira os dados do destinatário antes de confirmar.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}