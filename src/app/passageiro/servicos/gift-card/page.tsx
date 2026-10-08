"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Gift,
  Loader2,
  ShoppingBag,
  Zap,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type GiftCard = {
  id: string;
  name: string;
  description: string;
  color: string;
  image: string;
  /** Provider exato na RVHub (kind "pin"). */
  provider: string;
};

const giftCards: GiftCard[] = [
  {
    id: "netflix",
    name: "Netflix",
    description: "Assinaturas e entretenimento",
    color: "from-[#b91c1c] to-[#ef4444]",
    image: "/netflix.png",
    provider: "NETFLIX",
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Música e podcasts",
    color: "from-[#15803d] to-[#22c55e]",
    image: "/spotify.webp",
    provider: "SPOTIFY",
  },
  {
    id: "google-play",
    name: "Google Play",
    description: "Apps, jogos e conteúdo",
    color: "from-[#1676b7] to-[#08a89d]",
    image: "/google-play-giftcard.jpg",
    provider: "GOOGLE PLAY",
  },
  {
    id: "playstation",
    name: "PlayStation",
    description: "Jogos e entretenimento",
    color: "from-[#1d4ed8] to-[#60a5fa]",
    image: "/playstation.png",
    provider: "PLAYSTATION",
  },
];

type Produto = {
  productId: string;
  nome: string;
  valor: number;
  valorMinimo: number;
  valorMaximo: number;
  incremento: number;
  fixo: boolean;
};

type Resultado = {
  id: number;
  valor: number;
  operadora: string;
  pin: string | null;
};

function formatarReal(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function GiftCardPage() {
  const [selectedCard, setSelectedCard] = useState("netflix");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [valorCustomizado, setValorCustomizado] = useState("");
  const [carregandoValores, setCarregandoValores] = useState(false);
  const [comprando, setComprando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [copiado, setCopiado] = useState(false);

  const card =
    giftCards.find((item) => item.id === selectedCard) ?? giftCards[0];

  const produtoVariavel = useMemo(
    () => produtos.find((p) => !p.fixo) ?? null,
    [produtos]
  );

  // Busca os valores reais do gift card na RVHub ao trocar o cartão.
  useEffect(() => {
    let ativo = true;

    (async () => {
      setCarregandoValores(true);
      setProdutos([]);
      setSelectedProductId("");
      setValorCustomizado("");
      setErro(null);

      try {
        const res = await fetch(
          `/api/rvhub/giftcard/valores?operadora=${encodeURIComponent(
            card.provider
          )}`,
          { credentials: "include", cache: "no-store" }
        );
        const data = await res.json().catch(() => null);
        if (!ativo) return;
        if (!res.ok) {
          throw new Error(data?.error || "Erro ao carregar valores.");
        }
        const lista: Produto[] = Array.isArray(data?.produtos)
          ? data.produtos
          : [];
        setProdutos(lista);
        const primeiroFixo = lista.find((p) => p.fixo);
        setSelectedProductId(primeiroFixo?.productId ?? "");
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Erro ao carregar valores."
          );
        }
      } finally {
        if (ativo) setCarregandoValores(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [card.provider]);

  const produtoSelecionado = produtos.find(
    (p) => p.productId === selectedProductId
  );

  const valorFinal = useMemo(() => {
    if (produtoSelecionado?.fixo) return produtoSelecionado.valor;

    const numero = Number(valorCustomizado.replace(",", "."));
    return Number.isFinite(numero) ? numero : 0;
  }, [produtoSelecionado, valorCustomizado]);

  const valorValido = useMemo(() => {
    if (produtoSelecionado?.fixo) return true;
    if (!produtoVariavel || valorFinal <= 0) return false;

    const { valorMinimo: min, valorMaximo: max, incremento } = produtoVariavel;
    if (valorFinal < min || valorFinal > max) return false;
    if (incremento > 0) {
      const passos = Math.round((valorFinal - min) * 100);
      const passo = Math.round(incremento * 100);
      if (passo > 0 && passos % passo !== 0) return false;
    }
    return true;
  }, [produtoSelecionado, produtoVariavel, valorFinal]);

  const podeComprar =
    !!selectedProductId && valorValido && !comprando && !carregandoValores;

  const selecionarProduto = (produto: Produto) => {
    setSelectedProductId(produto.productId);
    setValorCustomizado("");
    setErro(null);
  };

  const alterarValorCustomizado = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (produtoVariavel) setSelectedProductId(produtoVariavel.productId);
    setValorCustomizado(event.target.value);
    setErro(null);
  };

  const comprar = async () => {
    if (!podeComprar) {
      setErro("Selecione um gift card e um valor válido.");
      return;
    }

    try {
      setComprando(true);
      setErro(null);

      const response = await fetch("/api/rvhub/giftcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          operadora: card.provider,
          productId: selectedProductId,
          valor: valorFinal,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao comprar o gift card.");
      }

      setResultado({
        id: Number(data?.transacao?.id ?? 0),
        valor: Number(data?.transacao?.valor ?? valorFinal),
        operadora: String(data?.transacao?.operadora ?? card.provider),
        pin: data?.transacao?.pin ?? null,
      });
    } catch (error) {
      console.error("[GIFT CARD]", error);
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a compra."
      );
    } finally {
      setComprando(false);
    }
  };

  const copiarPin = async () => {
    if (!resultado?.pin) return;
    try {
      await navigator.clipboard.writeText(resultado.pin);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de clipboard: o PIN continua visível para copiar à mão.
    }
  };

  if (resultado) {
    return (
      <main className="min-h-screen pb-12">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-2xl items-center justify-center px-4">
          <div className="w-full overflow-hidden rounded-[30px] bg-white p-6 shadow-[0_15px_40px_rgba(0,0,0,0.20)] sm:p-9">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#e7f8f4]">
              <Check
                size={42}
                strokeWidth={3}
                className="text-[#08a89d]"
              />
            </div>

            <h1 className="mt-6 text-center text-2xl font-black text-[#062b4f] sm:text-3xl">
              Compra concluída!
            </h1>

            <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-[#8ca0b2]">
              Use o código abaixo para resgatar seu gift card{" "}
              {resultado.operadora}.
            </p>

            <div className="mt-6 rounded-2xl border border-[#edf1f3] bg-[#f7fafb] p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-[#8ca0b2]">Gift card</span>
                <strong className="text-sm text-[#062b4f]">
                  {resultado.operadora}
                </strong>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-sm text-[#8ca0b2]">Valor</span>
                <strong className="text-base text-[#08a89d]">
                  {formatarReal(resultado.valor)}
                </strong>
              </div>

              <div className="mt-4 border-t border-[#e4ebee] pt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9aabb8]">
                  Código (PIN)
                </span>

                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-xl border border-[#dce5e9] bg-white px-4 py-3 text-center text-base font-black tracking-wider text-[#062b4f]">
                    {resultado.pin || "—"}
                  </code>

                  {resultado.pin && (
                    <button
                      type="button"
                      onClick={copiarPin}
                      className="flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-[#08a89d] px-4 text-xs font-bold text-white transition hover:bg-[#07978e]"
                    >
                      {copiado ? <Check size={16} /> : <Copy size={16} />}
                      {copiado ? "Copiado" : "Copiar"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setResultado(null);
                setSelectedProductId(
                  produtos.find((p) => p.fixo)?.productId ?? ""
                );
                setValorCustomizado("");
                setCopiado(false);
              }}
              className="mt-6 w-full cursor-pointer rounded-2xl bg-[#08a89d] px-5 py-4 text-sm font-black text-white shadow-[0_10px_25px_rgba(8,168,157,0.20)] transition hover:bg-[#07978e]"
            >
              Comprar outro gift card
            </button>
          </div>
        </div>
      </main>
    );
  }

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
                  <Zap size={12} className="text-[#83ead9]" />

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

        {/* ERRO */}
        {erro && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />

            <span className="min-w-0 flex-1">{erro}</span>

            <button
              type="button"
              onClick={() => setErro(null)}
              className="text-red-300 transition hover:text-white"
            >
              ×
            </button>
          </div>
        )}

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
            {giftCards.map((item) => {
              const active = selectedCard === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedCard(item.id)}
                  className={`group relative cursor-pointer overflow-hidden rounded-[22px] border p-3 text-left transition-all duration-300 sm:p-4 ${
                    active
                      ? "border-[#08a89d] bg-white shadow-[0_12px_35px_rgba(8,168,157,0.15)]"
                      : "border-white/10 bg-white hover:-translate-y-0.5"
                  }`}
                >
                  <div
                    className={`relative h-32 w-full overflow-hidden rounded-[16px] bg-gradient-to-br ${item.color} shadow-inner sm:h-36`}
                  >
                    <Image
                      src={item.image}
                      alt={`Gift Card ${item.name}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10" />
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-black text-[#062b4f]">
                      {item.name}
                    </p>

                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#8ca0b2]">
                      {item.description}
                    </p>
                  </div>

                  {active && (
                    <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#08a89d] text-white shadow-lg">
                      <Check size={14} strokeWidth={3} />
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

          {carregandoValores ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              <Loader2 size={18} className="animate-spin" />
              Carregando valores...
            </div>
          ) : produtos.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Nenhum valor disponível para este gift card no momento.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {produtos
                  .filter((p) => p.fixo)
                  .map((produto) => {
                    const active =
                      selectedProductId === produto.productId;

                    return (
                      <button
                        key={produto.productId}
                        type="button"
                        onClick={() => selecionarProduto(produto)}
                        className={`cursor-pointer rounded-2xl border p-4 text-center transition-all ${
                          active
                            ? "border-[#08a89d] bg-[#08a89d] text-white shadow-[0_10px_25px_rgba(8,168,157,0.20)]"
                            : "border-white/10 bg-white text-[#062b4f] hover:border-[#08a89d]/30"
                        }`}
                      >
                        <span className="text-lg font-black">
                          {formatarReal(produto.valor)}
                        </span>
                      </button>
                    );
                  })}
              </div>

              {produtoVariavel && (
                <div className="mt-3">
                  <div className="relative">
                    <ShoppingBag
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50"
                    />

                    <input
                      type="text"
                      inputMode="decimal"
                      value={valorCustomizado}
                      onChange={alterarValorCustomizado}
                      placeholder="Outro valor"
                      className={`h-14 w-full rounded-2xl border bg-white/5 pl-11 pr-4 text-sm font-bold text-white outline-none transition placeholder:text-white/40 focus:bg-white/10 ${
                        selectedProductId === produtoVariavel.productId &&
                        valorCustomizado
                          ? "border-[#08a89d]"
                          : "border-white/15"
                      }`}
                    />
                  </div>

                  <p className="mt-2 text-xs text-white/45">
                    Valor entre {formatarReal(produtoVariavel.valorMinimo)} e{" "}
                    {formatarReal(produtoVariavel.valorMaximo)}.
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        {/* RESUMO */}
        <section className="mt-8">
          <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_15px_40px_rgba(0,0,0,0.10)]">
            <div className="flex items-center gap-4 border-b border-[#edf1f3] p-5">
              <div
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${card.color}`}
              >
                <Image
                  src={card.image}
                  alt={`Gift Card ${card.name}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9aabb8]">
                  Seu Gift Card
                </p>

                <h3 className="mt-1 text-base font-black text-[#062b4f]">
                  {card.name}
                </h3>

                <p className="mt-1 text-[10px] text-[#8ca0b2]">
                  {card.description}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-semibold text-[#9aabb8]">
                  Valor
                </p>

                <p className="mt-1 text-lg font-black text-[#08a89d]">
                  {valorFinal > 0 ? formatarReal(valorFinal) : "—"}
                </p>
              </div>
            </div>

            <div className="p-5">
              <button
                type="button"
                onClick={() => void comprar()}
                disabled={!podeComprar}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#08a89d] px-5 py-4 text-sm font-black text-white shadow-[0_10px_25px_rgba(8,168,157,0.20)] transition hover:bg-[#07978e] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {comprando ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    Finalizar compra
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#9aabb8]">
                <Zap size={12} className="text-[#08a89d]" />
                Pagamento rápido e seguro
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
