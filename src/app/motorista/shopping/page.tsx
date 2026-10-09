"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Search,
  ShoppingBag,
  Car,
  Bike,
  Smartphone,
  Home as HomeIcon,
  Shirt,
  Laptop,
  Wrench,
  Gamepad2,
  Package,
  X,
  Plus,
  Minus,
  Trash2,
  LayoutGrid,
  List,
  Truck,
  ShieldCheck,
  Check,
  Zap,
  ArrowRight,
} from "lucide-react";

type Category = {
  categoria: string;
};

type Product = {
  id: number;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  imagem_principal: string | null;
  preco: number | string;
};

type CartItem = Product & {
  quantidade: number;
};

type SortOption = "relevancia" | "menor" | "maior" | "nome";
type ViewMode = "grid" | "list";

const iconMap: Record<string, any> = {
  Automóveis: Car,
  Motos: Bike,
  Tecnologia: Smartphone,
  Informática: Laptop,
  Casa: HomeIcon,
  Moda: Shirt,
  Ferramentas: Wrench,
  Games: Gamepad2,
  Elétrica: Zap,
};

const cardShadow =
  "shadow-[0_1px_2px_rgba(19,78,74,0.04),0_10px_30px_-14px_rgba(19,78,74,0.16)]";

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("relevancia");
  const [view, setView] = useState<ViewMode>("grid");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("maylon-cart");
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) setCart(parsedCart);
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error);
    } finally {
      setCartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;

    try {
      localStorage.setItem("maylon-cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Erro ao salvar carrinho:", error);
    }
  }, [cart, cartLoaded]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCategories(true);
        const response = await fetch("/api/categorias", { cache: "no-store" });
        if (!response.ok) throw new Error("Erro ao buscar categorias");
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro nas categorias:", error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    }

    async function loadProducts() {
      try {
        setLoadingProducts(true);
        const response = await fetch("/api/produtos", { cache: "no-store" });
        if (!response.ok) throw new Error("Erro ao buscar produtos");
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro nos produtos:", error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }

    loadCategories();
    loadProducts();
  }, []);

  function formatPrice(price: number | string) {
    const value = Number(price);
    if (Number.isNaN(value)) return "R$ 0,00";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((product) => {
      if (product.categoria) {
        counts[product.categoria] = (counts[product.categoria] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    const list = products.filter((product) => {
      const nome = product.nome?.toLowerCase() || "";
      const descricao = product.descricao?.toLowerCase() || "";
      const categoria = product.categoria?.toLowerCase() || "";

      const matchesSearch =
        !searchText ||
        nome.includes(searchText) ||
        descricao.includes(searchText) ||
        categoria.includes(searchText);

      const matchesCategory =
        !selectedCategory || product.categoria === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    const sorted = [...list];
    if (sort === "menor") {
      sorted.sort((a, b) => Number(a.preco) - Number(b.preco));
    } else if (sort === "maior") {
      sorted.sort((a, b) => Number(b.preco) - Number(a.preco));
    } else if (sort === "nome") {
      sorted.sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
    }
    return sorted;
  }, [products, search, selectedCategory, sort]);

  const cartQuantity = useMemo(
    () => cart.reduce((total, item) => total + Number(item.quantidade || 0), 0),
    [cart]
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce((total, item) => {
        const price = Number(item.preco) || 0;
        const quantity = Number(item.quantidade) || 0;
        return total + price * quantity;
      }, 0),
    [cart]
  );

  function addToCart(product: Product) {
    setCart((currentCart) => {
      const existingProduct = currentCart.find((item) => item.id === product.id);

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantidade: 1 }];
    });

    setToast(product.nome);
  }

  function increaseQuantity(productId: number) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      )
    );
  }

  function decreaseQuantity(productId: number) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantidade: item.quantidade - 1 }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  }

  function removeFromCart(productId: number) {
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
  }

  function clearFilters() {
    setSearch("");
    setSelectedCategory(null);
  }

  function selectCategory(category: string | null) {
    setSearch("");
    setSelectedCategory((current) => (current === category ? null : category));
  }

  const hasFilters = Boolean(search || selectedCategory);

  const pageTitle = selectedCategory
    ? selectedCategory
    : search
      ? `Resultados para "${search}"`
      : "Todos os produtos";

  return (
    <main className="min-h-screen text-teal-800">
      {/* Topo flutuante */}
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6">
        <div className="mx-auto flex max-w-8xl items-center gap-3 rounded-full bg-white/80 px-3 py-2 shadow-[0_8px_30px_-12px_rgba(19,78,74,0.2)] ring-1 ring-teal-900/5 backdrop-blur-xl sm:gap-4 sm:px-4">
          <Link
            href="/motorista/shopping"
            className="flex shrink-0 items-center gap-2 pl-1"
            aria-label="Maylon Shop"
          >
            <span className="hidden text-base font-extrabold tracking-tight text-teal-900 sm:block">
              Maylon Shop
            </span>
          </Link>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#1B7F68]" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar peças, acessórios e mais"
              className="w-full rounded-full bg-white py-2.5 pl-11 pr-10 text-sm text-teal-900 outline-none ring-1 ring-teal-900/10 transition placeholder:text-teal-700/60 focus:ring-2 focus:ring-[#36A68B]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-teal-400 transition hover:bg-teal-200 hover:text-teal-700"
                aria-label="Limpar pesquisa"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-teal-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1B7F68]"
            aria-label="Abrir carrinho"
          >
            <ShoppingBag size={18} />
            <span className="hidden sm:inline">
              {cartQuantity > 0 ? formatPrice(cartTotal) : "Carrinho"}
            </span>
            {cartQuantity > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#36A68B] px-1 text-[11px] font-bold text-white ring-2 ring-white">
                {cartQuantity}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-8xl px-3 pb-16 pt-5 sm:px-6">
        {/* Hero compacto */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0E4A3C] via-[#1B7F68] to-[#36A68B] px-6 py-8 sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 right-32 h-64 w-64 rounded-full bg-[#7be0c3]/20 blur-3xl" />
          <Car
            aria-hidden
            strokeWidth={1}
            className="pointer-events-none absolute -bottom-6 right-6 hidden h-48 w-48 text-white/10 md:block"
          />

          <div className="relative max-w-xl">
            <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl">
              Peças para o seu carro e moto, direto na sua mão.
            </h1>
            <p className="mt-3 text-base text-white/80">
              Compre com entrega rápida pela Maylon.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur">
                <Truck size={15} />
                Entrega rápida
              </span>
              <span className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur">
                <ShieldCheck size={15} />
                Compra segura
              </span>
            </div>
          </div>
        </section>

        {/* Categorias em pílulas */}
        <section className="mt-6" aria-label="Categorias">
          <div className="-mx-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-2">
              <button
                type="button"
                onClick={() => selectCategory(null)}
                className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  !selectedCategory
                    ? "bg-teal-900 text-white"
                    : "bg-white text-teal-700 ring-1 ring-teal-900/5 hover:ring-[#36A68B]"
                }`}
              >
                <Package size={16} />
                Todos
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    !selectedCategory
                      ? "bg-white/20 text-white"
                      : "bg-teal-100 text-teal-500"
                  }`}
                >
                  {products.length}
                </span>
              </button>

              {loadingCategories
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-10 w-32 animate-pulse rounded-full bg-white"
                    />
                  ))
                : categories.map((category) => {
                    const Icon = iconMap[category.categoria] || Package;
                    const isSelected = selectedCategory === category.categoria;

                    return (
                      <button
                        key={category.categoria}
                        type="button"
                        onClick={() => selectCategory(category.categoria)}
                        className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                          isSelected
                            ? "bg-teal-900 text-white"
                            : "bg-white text-teal-700 ring-1 ring-teal-900/5 hover:ring-[#36A68B]"
                        }`}
                      >
                        <Icon size={16} />
                        {category.categoria}
                        <span
                          className={`rounded-full px-1.5 text-xs ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-teal-100 text-teal-500"
                          }`}
                        >
                          {categoryCounts[category.categoria] ?? 0}
                        </span>
                      </button>
                    );
                  })}
            </div>
          </div>
        </section>

        {/* Produtos */}
        <section id="produtos" className="mt-8 scroll-mt-28">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">
                {pageTitle}
              </h2>
              <p className="mt-0.5 flex items-center gap-3 text-sm text-teal-500">
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="cursor-pointer font-semibold text-[#1B7F68] underline-offset-2 hover:underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-700 outline-none ring-1 ring-teal-900/5 transition focus:ring-2 focus:ring-[#36A68B]/50"
                aria-label="Ordenar produtos"
              >
                <option value="relevancia">Mais relevantes</option>
                <option value="menor">Menor preço</option>
                <option value="maior">Maior preço</option>
                <option value="nome">Nome (A–Z)</option>
              </select>

              <div className="flex rounded-full bg-white p-1 ring-1 ring-teal-900/5">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={`cursor-pointer rounded-full p-1.5 transition ${
                    view === "grid"
                      ? "bg-teal-900 text-white"
                      : "text-teal-500 hover:text-teal-800"
                  }`}
                  aria-label="Ver em grade"
                  aria-pressed={view === "grid"}
                >
                  <LayoutGrid size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`cursor-pointer rounded-full p-1.5 transition ${
                    view === "list"
                      ? "bg-teal-900 text-white"
                      : "text-teal-500 hover:text-teal-800"
                  }`}
                  aria-label="Ver em lista"
                  aria-pressed={view === "list"}
                >
                  <List size={17} />
                </button>
              </div>
            </div>
          </div>

          {loadingProducts ? (
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]"
                  : "space-y-3"
              }
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={`rounded-3xl bg-white p-3 ${cardShadow} ${
                    view === "list" ? "flex gap-4" : ""
                  }`}
                >
                  <div
                    className={`animate-pulse rounded-2xl bg-teal-100 ${
                      view === "list" ? "h-28 w-28 shrink-0" : "aspect-[4/3]"
                    }`}
                  />
                  <div className="flex-1 space-y-3 px-1 pb-1 pt-4">
                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-teal-100" />
                    <div className="h-6 w-1/3 animate-pulse rounded-full bg-teal-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[2rem] bg-white px-6 py-20 text-center ring-1 ring-teal-900/5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                <Package size={28} className="text-teal-400" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-teal-900">
                Nenhum produto encontrado
              </h3>
              <p className="mt-1 text-sm text-teal-500">
                Tente outro termo de busca ou escolha outra categoria.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 cursor-pointer rounded-full bg-teal-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white"
              >
                Ver todos os produtos
              </button>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className={`group flex flex-col rounded-3xl bg-white p-2.5 ring-1 ring-teal-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-16px_rgba(27,127,104,0.35)] ${cardShadow}`}
                >
                  <div className="relative">
                    <Link
                      href={`/motorista/shopping/${product.id}`}
                      className="block aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-gradient-to-b from-teal-50 to-teal-100"
                    >
                      {product.imagem_principal ? (
                        <img
                          src={product.imagem_principal}
                          alt={product.nome}
                          loading="lazy"
                          className="h-full w-full object-contain p-4 mix-blend-multiply transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package size={44} className="text-teal-300" />
                        </div>
                      )}
                    </Link>

                    {product.categoria && (
                      <button
                        type="button"
                        onClick={() => selectCategory(product.categoria!)}
                        className="absolute left-2.5 top-2.5 cursor-pointer rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-teal-600 shadow-sm backdrop-blur transition hover:text-[#1B7F68]"
                      >
                        {product.categoria}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col px-2 pb-1.5 pt-3.5">
                    <Link href={`/motorista/shopping/${product.id}`}>
                      <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-teal-800 transition hover:text-[#1B7F68]">
                        {product.nome}
                      </h3>
                    </Link>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-xl font-extrabold tracking-tight text-teal-900">
                        {formatPrice(product.preco)}
                      </p>
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#36A68B] text-white shadow-[0_6px_16px_-6px_rgba(54,166,139,0.8)] transition hover:scale-110 hover:bg-[#1B7F68] active:scale-95"
                        aria-label={`Adicionar ${product.nome} ao carrinho`}
                      >
                        <Plus size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className={`group flex gap-4 rounded-3xl bg-white p-2.5 ring-1 ring-teal-900/5 transition duration-300 hover:shadow-[0_20px_40px_-16px_rgba(27,127,104,0.3)] ${cardShadow}`}
                >
                  <Link
                    href={`/motorista/shopping/${product.id}`}
                    className="block h-28 w-28 shrink-0 overflow-hidden rounded-[1.25rem] bg-gradient-to-b from-teal-50 to-teal-100 sm:h-32 sm:w-40"
                  >
                    {product.imagem_principal ? (
                      <img
                        src={product.imagem_principal}
                        alt={product.nome}
                        loading="lazy"
                        className="h-full w-full object-contain p-3 mix-blend-multiply"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package size={36} className="text-teal-300" />
                      </div>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-4 py-1 pr-2">
                    <div className="min-w-0">
                      {product.categoria && (
                        <button
                          type="button"
                          onClick={() => selectCategory(product.categoria!)}
                          className="cursor-pointer rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-600 transition hover:text-[#1B7F68]"
                        >
                          {product.categoria}
                        </button>
                      )}
                      <Link href={`/motorista/shopping/${product.id}`}>
                        <h3 className="mt-1.5 line-clamp-2 font-semibold text-teal-800 transition hover:text-[#1B7F68]">
                          {product.nome}
                        </h3>
                      </Link>
                      {product.descricao && (
                        <p className="mt-1 line-clamp-1 hidden text-sm text-teal-500 sm:block">
                          {product.descricao}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-5">
                      <p className="text-lg font-extrabold tracking-tight text-teal-900 sm:text-xl">
                        {formatPrice(product.preco)}
                      </p>
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[#36A68B] px-4 text-sm font-semibold text-white transition hover:bg-[#1B7F68] active:scale-95"
                      >
                        <Plus size={16} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Adicionar</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

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
            {toast}
          </p>
          <button
            type="button"
            onClick={() => {
              setToast(null);
              setCartOpen(true);
            }}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-teal-900 transition hover:bg-teal-100"
          >
            Ver carrinho
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Carrinho */}
      {cartOpen && (
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
                <p className="text-sm text-teal-500">
                  {cartQuantity} item{cartQuantity !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="cursor-pointer rounded-full bg-teal-100 p-2 text-teal-600 transition hover:bg-teal-200"
                aria-label="Fechar carrinho"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-100">
                    <ShoppingBag size={34} className="text-teal-400" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-teal-800">
                    Seu carrinho está vazio
                  </h3>
                  <p className="mt-1 max-w-xs text-sm text-teal-500">
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
                      className="rounded-3xl bg-teal-50 p-3 ring-1 ring-teal-900/5"
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
                            <h3 className="line-clamp-2 text-sm font-semibold text-teal-800 transition hover:text-[#1B7F68]">
                              {item.nome}
                            </h3>
                          </Link>
                          <p className="mt-1 text-sm font-bold text-teal-900">
                            {formatPrice(item.preco)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
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
                            onClick={() => decreaseQuantity(item.id)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-teal-600 transition hover:bg-teal-100"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-teal-800">
                            {item.quantidade}
                          </span>
                          <button
                            type="button"
                            onClick={() => increaseQuantity(item.id)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#36A68B] text-white transition hover:bg-[#1B7F68]"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-teal-700">
                          {formatPrice(Number(item.preco) * item.quantidade)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-teal-100 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-semibold text-teal-500">Total</span>
                  <span className="text-2xl font-extrabold tracking-tight text-teal-900">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/motorista/shopping/checkout")}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#36A68B] py-3.5 font-bold text-white shadow-[0_10px_24px_-10px_rgba(54,166,139,0.9)] transition hover:bg-[#1B7F68]"
                >
                  Finalizar compra
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}