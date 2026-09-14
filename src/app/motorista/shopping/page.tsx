"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Eye,
  CreditCard,
  Trash2,
  Search,
  ShoppingBag,
  X,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";

type Produto = {
  id: number;
  nome: string;
  descricao: string;
  imagem: string;
  preco: number;
};

export default function Relatorio() {
  const [loadingUser, setLoadingUser] = useState(true);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<Produto[]>([]);
  const [search, setSearch] = useState("");
  const [loadingBtn, setLoadingBtn] = useState<number | null>(null);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  useEffect(() => {
    async function carregarPagina() {
      try {
        const res = await fetch("/api/produtos", {
          cache: "no-store",
        });

        const data = await res.json();
        const lista = Array.isArray(data) ? data : [];

        setProdutos(lista);
        setTodosProdutos(lista);

        const carrinhoSalvo = JSON.parse(
          localStorage.getItem("carrinho") || "[]"
        );

        setCarrinho(
          Array.isArray(carrinhoSalvo) ? carrinhoSalvo : []
        );
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      } finally {
        setTimeout(() => {
          setLoadingUser(false);
        }, 400);
      }
    }

    carregarPagina();
  }, []);

  function salvarCarrinho(lista: Produto[]) {
    setCarrinho(lista);
    localStorage.setItem("carrinho", JSON.stringify(lista));
  }

  function addCarrinho(produto: Produto) {
    setLoadingBtn(produto.id);

    const novoCarrinho = [...carrinho, produto];

    salvarCarrinho(novoCarrinho);
    setCarrinhoAberto(true);

    setTimeout(() => {
      setLoadingBtn(null);
    }, 600);
  }

  function removerItem(index: number) {
    const novoCarrinho = carrinho.filter((_, i) => i !== index);
    salvarCarrinho(novoCarrinho);
  }

  function limparCarrinho() {
    salvarCarrinho([]);
  }

  function pesquisar(value: string) {
    setSearch(value);

    const termo = value.trim().toLowerCase();

    if (!termo) {
      setProdutos(todosProdutos);
      return;
    }

    const filtrados = todosProdutos.filter((item) => {
      return (
        item.nome.toLowerCase().includes(termo) ||
        item.descricao.toLowerCase().includes(termo)
      );
    });

    setProdutos(filtrados);
  }

  const total = useMemo(() => {
    return carrinho.reduce(
      (acc, item) => acc + Number(item.preco),
      0
    );
  }, [carrinho]);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#f5f5f3] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-[3px] border-black/10" />

            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-black animate-spin" />
          </div>

          <p className="mt-5 text-sm font-semibold text-neutral-500">
            Preparando sua loja...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f3] text-neutral-950 pb-32">

      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-[#f5f5f3]/90 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-[1700px] mx-auto px-5 md:px-8 h-[72px] flex items-center justify-between gap-6">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
              <Sparkles size={18} />
            </div>

            <div>
              <p className="font-black tracking-tight leading-none">
                MAYLON
              </p>

              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 mt-1">
                Auto Store
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCarrinhoAberto(true)}
            className="relative h-11 px-4 rounded-xl bg-white border border-black/[0.07] shadow-sm flex items-center gap-2.5 hover:bg-neutral-50 transition"
          >
            <ShoppingBag size={18} />

            <span className="hidden sm:block text-sm font-bold">
              Carrinho
            </span>

            {carrinho.length > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                {carrinho.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-[1700px] mx-auto px-5 md:px-8">

        {/* HERO */}
        <section className="pt-10 md:pt-16 pb-8">
          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-end">

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Loja online
              </div>

              <h1 className="mt-5 text-4xl md:text-6xl lg:text-7xl font-black tracking-[-0.05em] leading-[0.95] max-w-4xl">
                Tudo para deixar
                <br />
                seu veículo{" "}
                <span className="text-neutral-400">
                  ainda melhor.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-sm md:text-base text-neutral-500 leading-relaxed">
                Acessórios, peças e produtos selecionados para
                carro e moto. Escolha seu produto e compre de
                forma rápida e segura.
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-8 pb-2">
              <div>
                <p className="text-3xl font-black">
                  {todosProdutos.length}
                </p>

                <p className="text-xs text-neutral-400 uppercase tracking-wider mt-1">
                  Produtos
                </p>
              </div>

              <div className="w-px h-12 bg-black/10" />

              <div>
                <p className="text-3xl font-black">
                  24h
                </p>

                <p className="text-xs text-neutral-400 uppercase tracking-wider mt-1">
                  Atendimento
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH */}
        <section className="mb-10">
          <div className="relative bg-white border border-black/[0.07] rounded-2xl shadow-sm overflow-hidden">

            <div className="flex items-center">
              <div className="pl-5">
                <Search
                  size={20}
                  className="text-neutral-400"
                />
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => pesquisar(e.target.value)}
                placeholder="O que você está procurando?"
                className="flex-1 h-16 px-4 bg-transparent outline-none text-sm md:text-base font-medium placeholder:text-neutral-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => pesquisar("")}
                  className="mr-2 w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-black transition"
                >
                  <X size={18} />
                </button>
              )}

              <button
                type="button"
                onClick={() => pesquisar(search)}
                className="hidden sm:flex mr-2 h-12 px-6 rounded-xl bg-black text-white items-center gap-2 text-sm font-bold hover:bg-neutral-800 transition"
              >
                Buscar
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* TITLE */}
        <section className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-400">
              Catálogo
            </p>

            <h2 className="mt-1 text-2xl md:text-3xl font-black tracking-tight">
              Produtos em destaque
            </h2>
          </div>

          <p className="text-sm text-neutral-400">
            {produtos.length}{" "}
            {produtos.length === 1
              ? "resultado"
              : "resultados"}
          </p>
        </section>

        {/* PRODUCTS */}
        {produtos.length === 0 ? (
          <div className="bg-white border border-black/[0.07] rounded-3xl p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-100 flex items-center justify-center">
              <Search size={24} className="text-neutral-400" />
            </div>

            <h3 className="mt-5 text-lg font-black">
              Nenhum produto encontrado
            </h3>

            <p className="mt-2 text-sm text-neutral-500">
              Tente buscar por outro nome ou descrição.
            </p>

            <button
              type="button"
              onClick={() => pesquisar("")}
              className="mt-6 px-5 h-11 rounded-xl bg-black text-white text-sm font-bold"
            >
              Limpar pesquisa
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

            {produtos.map((item) => (
              <article
                key={item.id}
                className="group bg-white rounded-3xl border border-black/[0.06] overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300"
              >

                {/* IMAGE */}
                <Link
                  href={`/motorista/produto/${item.id}`}
                  className="block"
                >
                  <div className="relative h-[280px] bg-[#f7f7f5] overflow-hidden">

                    <Image
                      src={item.imagem}
                      alt={item.nome}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-contain p-8 group-hover:scale-105 transition-transform duration-700"
                    />

                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-[10px] font-black uppercase tracking-wider shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Em estoque
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/90 backdrop-blur shadow-sm flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <Eye size={17} />
                    </div>
                  </div>
                </Link>

                {/* CONTENT */}
                <div className="p-5">

                  <Link href={`/motorista/produto/${item.id}`}>
                    <h3 className="text-[17px] font-black tracking-tight line-clamp-1 hover:text-neutral-500 transition">
                      {item.nome}
                    </h3>
                  </Link>

                  <p className="mt-2 text-sm text-neutral-500 leading-relaxed line-clamp-2 min-h-[40px]">
                    {item.descricao}
                  </p>

                  <div className="mt-5 pt-4 border-t border-black/[0.06] flex items-end justify-between">

                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                        A partir de
                      </p>

                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xs font-bold text-neutral-500">
                          R$
                        </span>

                        <span className="text-2xl font-black tracking-tight">
                          {Number(item.preco).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/motorista/produto/${item.id}`}
                      className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center hover:bg-black hover:text-white transition"
                      aria-label="Ver produto"
                    >
                      <ArrowRight size={17} />
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => addCarrinho(item)}
                    disabled={loadingBtn === item.id}
                    className="mt-4 w-full h-12 rounded-xl bg-black text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition disabled:opacity-60"
                  >
                    {loadingBtn === item.id ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={17} />
                        Adicionar ao carrinho
                      </>
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* FLOATING CART */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-5 left-4 right-4 z-40">
          <div className="max-w-xl mx-auto">
            <button
              type="button"
              onClick={() => setCarrinhoAberto(true)}
              className="w-full bg-black text-white rounded-2xl p-2 pl-4 shadow-[0_15px_50px_rgba(0,0,0,0.30)] flex items-center justify-between hover:bg-neutral-900 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <ShoppingBag size={18} />
                </div>

                <div className="text-left">
                  <p className="text-xs text-white/50">
                    Seu carrinho
                  </p>

                  <p className="text-sm font-bold">
                    {carrinho.length}{" "}
                    {carrinho.length === 1
                      ? "produto"
                      : "produtos"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 pr-2">
                <span className="font-black text-emerald-400">
                  R$ {total.toFixed(2)}
                </span>

                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black">
                  <ArrowRight size={17} />
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {carrinhoAberto && (
        <div className="fixed inset-0 z-50">

          <button
            type="button"
            aria-label="Fechar carrinho"
            onClick={() => setCarrinhoAberto(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
          />

          <aside className="absolute right-0 top-0 bottom-0 w-full sm:max-w-[430px] bg-[#fafaf8] shadow-2xl flex flex-col">

            {/* DRAWER HEADER */}
            <div className="px-6 py-5 border-b border-black/[0.07] flex items-center justify-between bg-white">

              <div>
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} />

                  <h2 className="text-lg font-black">
                    Seu carrinho
                  </h2>
                </div>

                <p className="text-xs text-neutral-400 mt-1">
                  {carrinho.length}{" "}
                  {carrinho.length === 1
                    ? "item selecionado"
                    : "itens selecionados"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCarrinhoAberto(false)}
                className="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* ITEMS */}
            <div className="flex-1 overflow-y-auto p-5">

              {carrinho.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-center">
                    <ShoppingBag
                      size={24}
                      className="text-neutral-400"
                    />
                  </div>

                  <h3 className="mt-5 font-black">
                    Seu carrinho está vazio
                  </h3>

                  <p className="text-sm text-neutral-400 mt-2">
                    Adicione produtos para continuar.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {carrinho.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="group flex gap-3 p-3 rounded-2xl bg-white border border-black/[0.06]"
                    >
                      <div className="relative w-20 h-20 rounded-xl bg-[#f5f5f3] overflow-hidden shrink-0">
                        <Image
                          src={item.imagem}
                          alt={item.nome}
                          fill
                          sizes="80px"
                          className="object-contain p-2"
                        />
                      </div>

                      <div className="flex-1 min-w-0 py-1">
                        <p className="font-bold text-sm line-clamp-2">
                          {item.nome}
                        </p>

                        <p className="text-sm font-black mt-2">
                          R$ {Number(item.preco).toFixed(2)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removerItem(index)}
                        className="w-9 h-9 rounded-xl text-neutral-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition"
                        aria-label="Remover produto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="p-5 border-t border-black/[0.07] bg-white">

              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-wider font-bold">
                    Total
                  </p>

                  <p className="text-3xl font-black tracking-tight mt-1">
                    R$ {total.toFixed(2)}
                  </p>
                </div>

                <span className="text-xs text-neutral-400">
                  {carrinho.length}{" "}
                  {carrinho.length === 1
                    ? "item"
                    : "itens"}
                </span>
              </div>

              <Link
                href="/motorista/shopping/checkout"
                onClick={() => setCarrinhoAberto(false)}
                className={`w-full h-13 rounded-xl bg-black text-white flex items-center justify-center gap-2 font-bold hover:bg-neutral-800 active:scale-[0.98] transition ${
                  carrinho.length === 0
                    ? "pointer-events-none opacity-40"
                    : ""
                }`}
              >
                <CreditCard size={17} />
                Finalizar compra
              </Link>

              {carrinho.length > 0 && (
                <button
                  type="button"
                  onClick={limparCarrinho}
                  className="w-full mt-2 h-11 rounded-xl text-xs font-bold text-neutral-400 hover:text-red-500 hover:bg-red-50 transition"
                >
                  Limpar carrinho
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
