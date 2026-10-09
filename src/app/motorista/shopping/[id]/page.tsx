"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Plus,
  Minus,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Trash2,
  Truck,
  ShieldCheck,
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

type CartItem = Product & {
  quantidade: number;
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const cardShadow =
  "shadow-[0_1px_2px_rgba(19,78,74,0.04),0_10px_30px_-14px_rgba(19,78,74,0.16)]";

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
      <div
        className={`flex aspect-square items-center justify-center rounded-3xl bg-white ring-1 ring-teal-900/5 ${cardShadow}`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-50">
            <Package size={36} strokeWidth={1.5} className="text-teal-400" />
          </div>
          <span className="text-sm text-teal-700/70">
            Nenhuma imagem disponível
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Imagem principal */}
      <div
        className={`group relative overflow-hidden rounded-3xl bg-white p-2.5 ring-1 ring-teal-900/5 ${cardShadow}`}
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-[1.25rem] bg-gradient-to-b from-teal-50 to-teal-100/60 sm:aspect-[4/3]">
          <img
            src={imagens[imagemSelecionada]}
            alt={`${nome} - imagem ${imagemSelecionada + 1}`}
            className="h-full w-full object-contain p-6 mix-blend-multiply transition duration-500 group-hover:scale-105 sm:p-10"
          />

          {imagens.length > 1 && (
            <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-teal-800 shadow-sm backdrop-blur">
              {imagemSelecionada + 1} / {imagens.length}
            </div>
          )}

          {imagens.length > 1 && (
            <>
              <button
                type="button"
                onClick={imagemAnterior}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-teal-900 shadow-md backdrop-blur transition hover:bg-[#36A68B] hover:text-white lg:opacity-0 lg:group-hover:opacity-100"
                aria-label="Imagem anterior"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={proximaImagem}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-teal-900 shadow-md backdrop-blur transition hover:bg-[#36A68B] hover:text-white lg:opacity-0 lg:group-hover:opacity-100"
                aria-label="Próxima imagem"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Miniaturas */}
      {imagens.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {imagens.map((imagem, index) => (
            <button
              key={`${imagem}-${index}`}
              type="button"
              onClick={() => setImagemSelecionada(index)}
              aria-label={`Ver imagem ${index + 1}`}
              aria-pressed={imagemSelecionada === index}
              className={`aspect-square cursor-pointer overflow-hidden rounded-2xl bg-white p-1.5 transition ${
                imagemSelecionada === index
                  ? "ring-2 ring-[#36A68B]"
                  : "ring-1 ring-teal-900/10 opacity-70 hover:opacity-100 hover:ring-[#36A68B]"
              }`}
            >
              <div className="h-full w-full overflow-hidden rounded-xl bg-gradient-to-b from-teal-50 to-teal-100/60">
                <img
                  src={imagem}
                  alt={`${nome} - miniatura ${index + 1}`}
                  className="h-full w-full object-contain p-1.5 mix-blend-multiply"
                />
              </div>
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(false);

  function readCart(): CartItem[] {
    try {
      const savedCart = localStorage.getItem("maylon-cart");
      const parsed = savedCart ? JSON.parse(savedCart) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function countItems(cart: CartItem[]) {
    return cart.reduce((total, item) => total + Number(item.quantidade || 0), 0);
  }

  const cartCount = countItems(cart);
  const cartTotal = cart.reduce(
    (total, item) =>
      total + (Number(item.preco) || 0) * (Number(item.quantidade) || 0),
    0
  );

  function saveCart(next: CartItem[]) {
    setCart(next);

    try {
      localStorage.setItem("maylon-cart", JSON.stringify(next));
    } catch (error) {
      console.error("Erro ao salvar carrinho:", error);
    }
  }

  function increaseItem(productId: number) {
    saveCart(
      cart.map((item) =>
        item.id === productId
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      )
    );
  }

  function decreaseItem(productId: number) {
    saveCart(
      cart
        .map((item) =>
          item.id === productId
            ? { ...item, quantidade: item.quantidade - 1 }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  }

  function removeItem(productId: number) {
    saveCart(cart.filter((item) => item.id !== productId));
  }

  useEffect(() => {
    setCart(readCart());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

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
    const value = Number(price);
    if (Number.isNaN(value)) return "R$ 0,00";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function addToCart() {
    if (!product) return;

    try {
      const cart = readCart();

      const existingProduct = cart.find((item) => item.id === product.id);

      if (existingProduct) {
        existingProduct.quantidade += quantidade;
      } else {
        cart.push({
          ...product,
          quantidade,
        });
      }

      saveCart([...cart]);
      setToast(true);
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
    }
  }

  const header = (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6">
      <div className="mx-auto flex max-w-8xl items-center justify-between gap-3 rounded-full bg-white/80 px-3 py-2 shadow-[0_8px_30px_-12px_rgba(19,78,74,0.2)] ring-1 ring-teal-900/5 backdrop-blur-xl sm:px-4">
        <Link
          href="/motorista/shopping"
          className="group flex items-center gap-2.5 text-sm font-semibold text-teal-900 transition hover:text-[#1B7F68]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 transition group-hover:bg-[#36A68B] group-hover:text-white">
            <ArrowLeft size={17} />
          </span>
          <span>Voltar para a loja</span>
        </Link>

        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="relative flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-teal-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1B7F68]"
          aria-label="Abrir carrinho"
        >
          <ShoppingBag size={18} />
          <span className="hidden sm:inline">Carrinho</span>
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#36A68B] px-1 text-[11px] font-bold text-white ring-2 ring-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );

  const cartDrawer = cartOpen && (
    <div
      className="fixed inset-0 z-[120] bg-teal-900/50 backdrop-blur-sm"
      onClick={() => setCartOpen(false)}
    >
      <aside
        onClick={(event) => event.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:rounded-l-[2rem]"
      >
        <div className="flex items-center justify-between px-6 pb-4 pt-6">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-teal-900">
              Seu carrinho
            </h2>
            <p className="text-sm text-teal-700/70">
              {cartCount} item{cartCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="cursor-pointer rounded-full bg-teal-50 p-2 text-teal-800 transition hover:bg-teal-100"
            aria-label="Fechar carrinho"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-50">
                <ShoppingBag size={34} className="text-teal-400" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-teal-900">
                Seu carrinho está vazio
              </h3>
              <p className="mt-1 max-w-xs text-sm text-teal-700/70">
                Adicione produtos para começar sua compra.
              </p>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="mt-6 cursor-pointer rounded-full bg-teal-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1B7F68]"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl bg-teal-50/60 p-3 ring-1 ring-teal-900/5"
                >
                  <div className="flex gap-3">
                    <Link
                      href={`/motorista/shopping/${item.id}`}
                      onClick={() => setCartOpen(false)}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white"
                    >
                      {item.imagem_principal ? (
                        <img
                          src={item.imagem_principal}
                          alt={item.nome}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package size={28} className="text-teal-300" />
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/motorista/shopping/${item.id}`}
                        onClick={() => setCartOpen(false)}
                      >
                        <h3 className="line-clamp-2 text-sm font-semibold text-teal-900 transition hover:text-[#1B7F68]">
                          {item.nome}
                        </h3>
                      </Link>
                      <p className="mt-1 text-sm font-bold text-teal-900">
                        {formatPrice(item.preco)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="h-fit cursor-pointer rounded-full p-1.5 text-teal-400 transition hover:bg-red-50 hover:text-red-500"
                      aria-label={`Remover ${item.nome}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-teal-900/5">
                      <button
                        type="button"
                        onClick={() => decreaseItem(item.id)}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-teal-800 transition hover:bg-teal-50"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-teal-900">
                        {item.quantidade}
                      </span>
                      <button
                        type="button"
                        onClick={() => increaseItem(item.id)}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#36A68B] text-white transition hover:bg-[#1B7F68]"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-teal-800">
                      {formatPrice(Number(item.preco) * item.quantidade)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-teal-900/10 p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold text-teal-700/80">Total</span>
              <span className="text-2xl font-extrabold tracking-tight text-teal-900">
                {formatPrice(cartTotal)}
              </span>
            </div>
            <Link
              href="/motorista/shopping/checkout"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#36A68B] py-3.5 font-bold text-white shadow-[0_10px_24px_-10px_rgba(54,166,139,0.9)] transition hover:bg-[#1B7F68]"
            >
              Finalizar compra
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </aside>
    </div>
  );

  if (loading) {
    return (
      <main className="min-h-screen text-teal-900">
        {header}
      {cartDrawer}
        <section className="mx-auto max-w-8xl px-3 py-8 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            <div
              className={`aspect-square animate-pulse rounded-3xl bg-white sm:aspect-[4/3] ${cardShadow}`}
            />
            <div
              className={`h-[420px] animate-pulse rounded-3xl bg-white ${cardShadow}`}
            />
          </div>
        </section>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen text-teal-900">
        {header}
      {cartDrawer}
        <section className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white ring-1 ring-teal-900/5">
            <Package size={34} strokeWidth={1.5} className="text-teal-400" />
          </div>

          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-teal-900">
            Produto não encontrado
          </h1>

          <p className="mt-2 text-sm text-teal-700/80">
            O produto que você procura não está disponível.
          </p>

          <Link
            href="/motorista/shopping"
            className="mt-7 flex items-center gap-2 rounded-full bg-teal-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1B7F68]"
          >
            <ArrowLeft size={17} />
            Voltar para a loja
          </Link>
        </section>
      </main>
    );
  }

  const imagens = [
    product.imagem_principal,
    product.imagem_2,
    product.imagem_3,
    product.imagem_4,
  ].filter(Boolean) as string[];

  const descricaoLonga =
    (product.descricao?.length ?? 0) > 280 ||
    (product.descricao?.split("\n").length ?? 0) > 6;
  const subtotal = Number(product.preco) * quantidade;

  return (
    <main className="min-h-screen text-teal-900">
      {header}
      {cartDrawer}

      <section className="mx-auto max-w-8xl px-3 pb-16 pt-5 sm:px-6">
        <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          {/* Galeria */}
          <ProductImages imagens={imagens} nome={product.nome} />

          {/* Informações */}
          <div
            className={`rounded-3xl bg-white p-6 ring-1 ring-teal-900/5 sm:p-8 lg:sticky lg:top-24 ${cardShadow}`}
          >
            {product.categoria && (
              <Link
                href="/motorista/shopping"
                className="inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-[#1B7F68] transition hover:bg-teal-100"
              >
                {product.categoria}
              </Link>
            )}

            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-teal-900 sm:text-3xl">
              {product.nome}
            </h1>

            <div className="mt-5 border-b border-teal-900/10 pb-6">
              <span className="text-4xl font-extrabold tracking-tight text-teal-900">
                {formatPrice(product.preco)}
              </span>
              <p className="mt-1 text-sm text-teal-700/70">por unidade</p>
            </div>

            {/* Quantidade */}
            <div className="mt-6 flex items-center justify-between gap-4">
              <span className="text-sm font-bold text-teal-900">Quantidade</span>

              <div className="flex items-center gap-1 rounded-full bg-teal-50 p-1 ring-1 ring-teal-900/5">
                <button
                  type="button"
                  onClick={() => setQuantidade((value) => Math.max(1, value - 1))}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-teal-800 transition hover:bg-white"
                  aria-label="Diminuir quantidade"
                >
                  <Minus size={17} />
                </button>

                <span className="w-10 text-center text-base font-bold text-teal-900">
                  {quantidade}
                </span>

                <button
                  type="button"
                  onClick={() => setQuantidade((value) => value + 1)}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#36A68B] text-white transition hover:bg-[#1B7F68]"
                  aria-label="Aumentar quantidade"
                >
                  <Plus size={17} />
                </button>
              </div>
            </div>

            {quantidade > 1 && (
              <p className="mt-3 text-right text-sm text-teal-700/80">
                Subtotal:{" "}
                <span className="font-bold text-teal-900">
                  {formatPrice(subtotal)}
                </span>
              </p>
            )}

            {/* Botão */}
            <button
              type="button"
              onClick={addToCart}
              className="mt-6 flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-[#36A68B] font-bold text-white shadow-[0_10px_24px_-10px_rgba(54,166,139,0.9)] transition hover:bg-[#1B7F68] active:scale-[0.99]"
            >
              <ShoppingBag size={20} />
              Adicionar ao carrinho
            </button>

            {/* Garantias */}
            <div className="mt-5 grid gap-2 rounded-2xl bg-teal-50 p-4 text-sm text-teal-800">
              <span className="flex items-center gap-2.5">
                <Truck size={17} className="shrink-0 text-[#1B7F68]" />
                Entrega rápida pela Maylon
              </span>
              <span className="flex items-center gap-2.5">
                <ShieldCheck size={17} className="shrink-0 text-[#1B7F68]" />
                Compra rápida e segura
              </span>
            </div>
          </div>
        </div>

        {/* Descrição completa */}
        {product.descricao && (
          <div
            className={`mt-6 rounded-3xl bg-white p-6 ring-1 ring-teal-900/5 sm:p-8 lg:mt-10 ${cardShadow}`}
          >
            <h2 className="text-lg font-extrabold tracking-tight text-teal-900">
              Descrição do produto
            </h2>

            <div className="relative mt-4">
              <p
                className={`whitespace-pre-line break-words text-sm leading-7 text-teal-800/90 ${
                  descricaoLonga && !descricaoExpandida
                    ? "max-h-52 overflow-hidden"
                    : ""
                }`}
              >
                {product.descricao}
              </p>

              {descricaoLonga && !descricaoExpandida && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
              )}
            </div>

            {descricaoLonga && (
              <button
                type="button"
                onClick={() => setDescricaoExpandida((value) => !value)}
                className="mt-3 flex cursor-pointer items-center gap-1 text-sm font-semibold text-[#1B7F68] transition hover:text-teal-900"
                aria-expanded={descricaoExpandida}
              >
                {descricaoExpandida ? "Ver menos" : "Ver mais"}
                <ChevronDown
                  size={16}
                  className={`transition ${
                    descricaoExpandida ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>
        )}
      </section>

      {/* Aviso ao adicionar */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[110] flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-full bg-teal-900 py-2.5 pl-3 pr-2.5 text-white shadow-2xl"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#36A68B]">
            <Check size={16} strokeWidth={3} />
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-medium">
            Adicionado ao carrinho
          </p>
          <button
            type="button"
            onClick={() => {
              setToast(false);
              setCartOpen(true);
            }}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-teal-900 transition hover:bg-teal-50"
          >
            Ver carrinho
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </main>
  );
}