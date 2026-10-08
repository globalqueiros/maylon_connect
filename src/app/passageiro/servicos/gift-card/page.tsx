"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Gift,
  Plus,
  ShoppingBag,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const giftCards = [
  {
    id: "netflix",
    name: "Netflix",
    description: "Assinaturas e entretenimento",
    color: "from-[#b91c1c] to-[#ef4444]",
    image: "/netflix.png",
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Música e podcasts",
    color: "from-[#15803d] to-[#22c55e]",
    image: "/spotify.webp",
  },
  {
    id: "google-play",
    name: "Google Play",
    description: "Apps, jogos e conteúdo",
    color: "from-[#1676b7] to-[#08a89d]",
    image: "/google-play-giftcard.jpg",
  },
  {
    id: "playstation",
    name: "PlayStation",
    description: "Jogos e entretenimento",
    color: "from-[#1d4ed8] to-[#60a5fa]",
    image: "/playstation.png",
  },
];

const values = [20, 30, 50, 100, 200];

export default function GiftCardPage() {
  const [selectedCard, setSelectedCard] = useState("netflix");
  const [selectedValue, setSelectedValue] = useState(50);

  const selectedGiftCard = giftCards.find(
    (card) => card.id === selectedCard,
  );

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
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
                Gift Card
              </h1>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="mt-7">
          <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#062b4f] via-[#07556a] to-[#08a89d] p-6 shadow-[0_20px_50px_rgba(8,168,157,0.15)] sm:p-8">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#5be0c8]/20 blur-3xl" />

            <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#08a89d]/20 blur-3xl" />

            <div className="relative flex items-center justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
                  <Zap
                    size={12}
                    className="text-[#83ead9]"
                  />

                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                    Recarga digital
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl">
                  Escolha seu
                  <br />
                  Gift Card.
                </h2>

                <p className="mt-3 max-w-md text-xs leading-5 text-white/65 sm:text-sm">
                  Compre créditos para seus serviços favoritos de forma rápida
                  e segura.
                </p>
              </div>

              <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-[28px] border border-white/10 bg-white/10 backdrop-blur-md sm:flex">
                <Gift
                  size={42}
                  strokeWidth={1.5}
                  className="text-white"
                />
              </div>
            </div>
          </div>
        </section>

        {/* GIFT CARDS */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">
              Escolha um Gift Card
            </h2>

            <p className="mt-1 text-xs text-white/45">
              Selecione onde deseja utilizar sua recarga
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {giftCards.map((card) => {
              const active = selectedCard === card.id;

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedCard(card.id)}
                  className={`group relative cursor-pointer overflow-hidden rounded-[22px] border p-3 text-left transition-all duration-300 sm:p-4 ${
                    active
                      ? "border-[#08a89d] bg-white shadow-[0_12px_35px_rgba(8,168,157,0.15)]"
                      : "border-white/10 bg-white hover:-translate-y-0.5"
                  }`}
                >
                  {/* IMAGEM */}
                  <div
                    className={`relative h-32 w-full overflow-hidden rounded-[16px] bg-gradient-to-br ${card.color} shadow-inner sm:h-36`}
                  >
                    <Image
                      src={card.image}
                      alt={`Gift Card ${card.name}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* brilho */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10" />
                  </div>

                  {/* NOME */}
                  <div className="mt-3">
                    <p className="text-sm font-black text-[#062b4f]">
                      {card.name}
                    </p>

                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#8ca0b2]">
                      {card.description}
                    </p>
                  </div>

                  {/* SELECIONADO */}
                  {active && (
                    <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#08a89d] text-white shadow-lg">
                      <Check
                        size={14}
                        strokeWidth={3}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* VALOR */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-black text-white">
              Escolha o valor
            </h2>

            <p className="mt-1 text-xs text-white/45">
              Quanto você deseja recarregar?
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
                  className={`cursor-pointer rounded-2xl border p-4 text-center transition-all ${
                    active
                      ? "border-[#08a89d] bg-[#08a89d] text-white shadow-[0_10px_25px_rgba(8,168,157,0.20)]"
                      : "border-white/10 bg-white text-[#062b4f] hover:border-[#08a89d]/30"
                  }`}
                >
                  <span className="text-lg font-black">
                    R$ {value}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-xs font-bold text-white/60 transition hover:border-[#08a89d]/50 hover:bg-[#08a89d]/5 hover:text-[#08a89d]"
          >
            <Plus size={15} />
            Escolher outro valor
          </button>
        </section>

        {/* RESUMO */}
        <section className="mt-8">
          <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_15px_40px_rgba(0,0,0,0.10)]">

            {/* PRODUTO SELECIONADO */}
            <div className="flex items-center gap-4 border-b border-[#edf1f3] p-5">

              {/* IMAGEM PEQUENA */}
              <div
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${selectedGiftCard?.color}`}
              >
                {selectedGiftCard?.image && (
                  <Image
                    src={selectedGiftCard.image}
                    alt={`Gift Card ${selectedGiftCard.name}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9aabb8]">
                  Seu Gift Card
                </p>

                <h3 className="mt-1 text-base font-black text-[#062b4f]">
                  {selectedGiftCard?.name}
                </h3>

                <p className="mt-1 text-[10px] text-[#8ca0b2]">
                  {selectedGiftCard?.description}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-semibold text-[#9aabb8]">
                  Valor
                </p>

                <p className="mt-1 text-lg font-black text-[#08a89d]">
                  R$ {selectedValue},00
                </p>
              </div>
            </div>

            {/* BOTÃO */}
            <div className="p-5">
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#08a89d] px-5 py-4 text-sm font-black text-white shadow-[0_10px_25px_rgba(8,168,157,0.20)] transition hover:bg-[#07978e] active:scale-[0.99]"
              >
                <ShoppingBag size={18} />

                Continuar compra

                <ArrowRight size={17} />
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#9aabb8]">
                <Zap
                  size={12}
                  className="text-[#08a89d]"
                />

                Pagamento rápido e seguro
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}