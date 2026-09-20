"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  Plus,
  Minus,
  Package,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";

type Product = {
  id: number;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  imagem_principal: string | null;
  imagem_2: string | null;
  imagem_3: string | null;
  imagem_4: string | null;
  preco: number | string;
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function ProductImages({
  imagens,
  nome,
}: {
  imagens: string[];
  nome: string;
}) {
  const [imagemSelecionada, setImagemSelecionada] = useState(0);

  function imagemAnterior() {
    setImagemSelecionada((atual) =>
      atual === 0 ? imagens.length - 1 : atual - 1
    );
  }

  function proximaImagem() {
    setImagemSelecionada((atual) =>
      atual === imagens.length - 1 ? 0 : atual + 1
    );
  }

  if (imagens.length === 0) {
    return (
      <div className="flex h-[560px] items-center justify-center rounded-[32px] border border-white/10 bg-white/[0.03]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/5">
            <Package
              size={55}
              strokeWidth={1.5}
              className="text-transparent-500"
            />
          </div>

          <span className="text-sm text-transparent-500">
            Nenhuma imagem disponível
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* IMAGEM PRINCIPAL */}
      <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/20">
        <div className="relative h-[560px] w-full">
          <img
            src={imagens[imagemSelecionada]}
            alt={`${nome} - imagem ${imagemSelecionada + 1}`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
          />

          {/* GRADIENTE */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

          {/* CONTADOR */}
          <div className="absolute right-5 top-5 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
            {imagemSelecionada + 1} / {imagens.length}
          </div>

          {/* SETA ESQUERDA */}
          {imagens.length > 1 && (
            <button
              type="button"
              onClick={imagemAnterior}
              className="absolute left-5 top-1/2 flex h-11 w-11 -trantransparent-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 backdrop-blur-md transition hover:bg-[#36A68B] group-hover:opacity-100"
              aria-label="Imagem anterior"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* SETA DIREITA */}
          {imagens.length > 1 && (
            <button
              type="button"
              onClick={proximaImagem}
              className="absolute right-5 top-1/2 flex h-11 w-11 -trantransparent-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 backdrop-blur-md transition hover:bg-[#36A68B] group-hover:opacity-100"
              aria-label="Próxima imagem"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>
      </div>

      {/* MINIATURAS */}
      {imagens.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {imagens.map((imagem, index) => (
            <button
              key={`${imagem}-${index}`}
              type="button"
              onClick={() => setImagemSelecionada(index)}
              className={`group relative h-24 cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                imagemSelecionada === index
                  ? "border-[#36A68B] shadow-lg shadow-[#36A68B]/10"
                  : "border-transparent opacity-60 hover:border-white/20 hover:opacity-100"
              }`}
            >
              <img
                src={imagem}
                alt={`${nome} - miniatura ${index + 1}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />

              {imagemSelecionada === index && (
                <div className="absolute inset-0 bg-[#36A68B]/10" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductPage({ params }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantidade, setQuantidade] = useState(1);
  const [descricaoExpandida, setDescricaoExpandida] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const { id } = await params;

        const response = await fetch(`/api/produtos/${id}`);

        if (!response.ok) {
          throw new Error("Produto não encontrado");
        }

        const data = await response.json();

        setProduct(data);
      } catch (error) {
        console.error("Erro ao carregar produto:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [params]);

  function formatPrice(price: number | string) {
    return Number(price).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function addToCart() {
    if (!product) return;

    try {
      const savedCart = localStorage.getItem("maylon-cart");

      const cart = savedCart ? JSON.parse(savedCart) : [];

      const existingProduct = cart.find(
        (item: Product & { quantidade: number }) =>
          item.id === product.id
      );

      if (existingProduct) {
        existingProduct.quantidade += quantidade;
      } else {
        cart.push({
          ...product,
          quantidade,
        });
      }

      localStorage.setItem(
        "maylon-cart",
        JSON.stringify(cart)
      );

      alert("Produto adicionado ao carrinho!");
    } catch (error) {
      console.error(
        "Erro ao adicionar ao carrinho:",
        error
      );
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-transparent-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#36A68B]" />

          <p className="text-sm text-transparent-400">
            Carregando produto...
          </p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-transparent-950 px-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/5">
          <Package
            size={50}
            strokeWidth={1.5}
            className="text-transparent-500"
          />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-white">
          Produto não encontrado
        </h1>

        <p className="mt-2 text-center text-sm text-transparent-500">
          O produto que você está procurando não está disponível.
        </p>

        <Link
          href="/motorista/shopping"
          className="mt-7 flex items-center gap-2 rounded-2xl bg-[#36A68B] px-6 py-3 font-semibold text-white transition hover:bg-[#2f8f78]"
        >
          <ArrowLeft size={18} />
          Voltar para a loja
        </Link>
      </main>
    );
  }

  const imagens = [
    product.imagem_principal,
    product.imagem_2,
    product.imagem_3,
    product.imagem_4,
  ].filter(Boolean) as string[];

  return (
    <main className="min-h-screen bg-transparent-950">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-transparent-950/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link
            href="/motorista/shopping"
            className="group flex items-center text-white gap-2 text-sm font-medium text-transparent-400 transition hover:text-white"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition group-hover:border-[#36A68B]/40 group-hover:bg-[#36A68B]/10">
              <ArrowLeft size={17} />
            </div>

            <span>Voltar para a loja</span>
          </Link>
        </div>
      </header>

      {/* CONTEÚDO */}
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          {/* GALERIA */}
          <div>
            <ProductImages
              imagens={imagens}
              nome={product.nome}
            />
          </div>

          {/* INFORMAÇÕES */}
          <div className="flex flex-col justify-center">
            <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.025] p-6 shadow-2xl shadow-black/20 sm:p-8">
              {/* CATEGORIA */}
              {product.categoria && (
                <div className="mb-5 flex items-center gap-2">
                  <span className="rounded-full text-white border border-[#36A68B]/20 bg-[#36A68B]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#36A68B]">
                    {product.categoria}
                  </span>
                </div>
              )}

              {/* NOME */}
              <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-2xl">
                {product.nome}
              </h1>

              {/* PREÇO */}
              <div className="mt-4 border-b border-white/[0.08] pb-7">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-white">
                  Preço
                </p>
                <span className="text-4xl font-black tracking-tight text-white sm:text-4xl">
                  {formatPrice(product.preco)}
                </span>
              </div>

              {/* DESCRIÇÃO */}
              {product.descricao && (
                <div className="mt-7">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                      Descrição
                    </h2>
                  </div>

                  <p
                    className={`text-sm leading-7 text-white ${
                      descricaoExpandida
                        ? ""
                        : "line-clamp-4"
                    }`}
                  >
                    {product.descricao}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setDescricaoExpandida(
                        (value) => !value
                      )
                    }
                    className="mt-3 flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-white transition hover:text-white"
                  >
                    {descricaoExpandida ? (
                      <>
                        Ver menos
                        <ChevronLeft
                          size={16}
                          className="rotate-90"
                        />
                      </>
                    ) : (
                      <>
                        Ver mais
                        <ChevronRight
                          size={16}
                          className="rotate-90"
                        />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* QUANTIDADE */}
              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    Quantidade
                  </span>

                  <span className="text-xs text-transparent-500">
                    {quantidade}{" "}
                    {quantidade === 1
                      ? "unidade"
                      : "unidades"}
                  </span>
                </div>

                <div className="flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 p-2">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantidade((value) =>
                        Math.max(1, value - 1)
                      )
                    }
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-white/[0.05] text-transparent-300 transition hover:bg-white/10 hover:text-white"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus size={18} />
                  </button>

                  <span className="text-lg font-bold text-white">
                    {quantidade}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setQuantidade(
                        (value) => value + 1
                      )
                    }
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-[#36A68B] text-white shadow-lg shadow-[#36A68B]/10 transition hover:bg-[#2f8f78]"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* BOTÃO */}
              <button
                type="button"
                onClick={addToCart}
                className="mt-6 flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-[#36A68B] font-bold text-white shadow-xl shadow-[#36A68B]/10 transition hover:-trantransparent-y-0.5 hover:bg-[#2f8f78] hover:shadow-[#36A68B]/20 active:trantransparent-y-0"
              >
                <ShoppingCart size={21} />
                Adicionar ao Carrinho
              </button>

              {/* SEGURANÇA */}
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-transparent-500">
                <Check
                  size={15}
                  className="text-[#36A68B]"
                />

                Compra rápida e segura
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
