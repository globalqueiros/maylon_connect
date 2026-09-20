"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Search,
  ShoppingCart,
  Car,
  Bike,
  Smartphone,
  Home as HomeIcon,
  Shirt,
  Laptop,
  Wrench,
  Gamepad2,
  Package,
  ChevronRight,
  X,
  Plus,
  Minus,
  Trash2,
  Eye,
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

const iconMap: Record<string, any> = {
  Automóveis: Car,
  Motos: Bike,
  Tecnologia: Smartphone,
  Informática: Laptop,
  Casa: HomeIcon,
  Moda: Shirt,
  Ferramentas: Wrench,
  Games: Gamepad2,
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
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
    async function loadCategories() {
      try {
        setLoadingCategories(true);
        const response = await fetch("/api/categorias", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar categorias");
        }

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
        const response = await fetch("/api/produtos", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar produtos");
        }

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

    if (Number.isNaN(value)) {
      return "R$ 0,00";
    }

    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const filteredProducts = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return products.filter((product) => {
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
  }, [products, search, selectedCategory]);

  const cartQuantity = useMemo(() => {
    return cart.reduce(
      (total, item) => total + Number(item.quantidade || 0),
      0
    );
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = Number(item.preco) || 0;
      const quantity = Number(item.quantidade) || 0;
      return total + price * quantity;
    }, 0);
  }, [cart]);

  function addToCart(product: Product) {
    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
              ...item,
              quantidade: item.quantidade + 1,
            }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantidade: 1,
        },
      ];
    });

    setCartOpen(true);
  }

  function increaseQuantity(productId: number) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
            ...item,
            quantidade: item.quantidade + 1,
          }
          : item
      )
    );
  }

  function decreaseQuantity(productId: number) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
              ...item,
              quantidade: item.quantidade - 1,
            }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  }

  function removeFromCart(productId: number) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  }

  function clearFilters() {
    setSearch("");
    setSelectedCategory(null);
  }

  function selectCategory(category: string) {
    setSearch("");
    setSelectedCategory((current) =>
      current === category ? null : category
    );

    setTimeout(() => {
      document.getElementById("produtos")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function handleBuyNow() {
    clearFilters();

    setTimeout(() => {
      document.getElementById("produtos")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-8xl items-center gap-4 px-4 py-4 sm:px-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="O que você está procurando?"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-12 text-sm text-slate-800 outline-none transition focus:border-[#36A68B] focus:ring-2 focus:ring-[#36A68B]/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                aria-label="Limpar pesquisa"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative shrink-0 cursor-pointer rounded-2xl bg-[#36A68B] p-3 text-white transition hover:bg-[#2f8f78]"
            aria-label="Abrir carrinho"
          >
            <ShoppingCart size={22} />
            {cartQuantity > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                {cartQuantity}
              </span>
            )}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-8xl px-4 py-8 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#36A68B] to-[#1B7F68]">
          <div className="grid items-center gap-8 p-8 md:grid-cols-2 md:p-10 lg:p-14">
            <div>
              <span className="inline-block rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white">
                Promoção Especial
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight text-white md:text-5xl lg:text-6xl">
                Tudo para seu carro e moto.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-white/90">
                Milhares de produtos com entrega rápida pela Maylon.
              </p>
              <button
                type="button"
                onClick={handleBuyNow}
                className="mt-8 rounded-2xl bg-white px-8 py-4 font-bold text-[#36A68B] transition hover:bg-slate-100"
              >
                Comprar Agora
              </button>
            </div>
            <div className="hidden md:block">
              <div className="flex h-80 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md">
                <ShoppingCart
                  size={150}
                  strokeWidth={1}
                  className="text-white/20"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-8xl px-4 py-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Categorias</h2>
          {selectedCategory && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#36A68B] transition hover:text-[#48c19f]"
            >
              Limpar filtro
              <X size={16} />
            </button>
          )}
        </div>

        {loadingCategories ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-3xl bg-white/10"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-3xl bg-white/5 p-8 text-center text-slate-400">
            Nenhuma categoria encontrada.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((category) => {
              const Icon = iconMap[category.categoria] || Package;
              const isSelected = selectedCategory === category.categoria;

              return (
                <button
                  key={category.categoria}
                  type="button"
                  onClick={() => selectCategory(category.categoria)}
                  className={`group cursor-pointer rounded-3xl p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${isSelected
                    ? "bg-[#36A68B] ring-2 ring-white"
                    : "bg-white"
                    }`}
                >
                  <div
                    className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${isSelected ? "bg-white/20" : "bg-[#36A68B]/10"
                      }`}
                  >
                    <Icon
                      size={28}
                      className={
                        isSelected ? "text-white" : "text-[#36A68B]"
                      }
                    />
                  </div>
                  <h3
                    className={`mt-4 text-center font-semibold ${isSelected ? "text-white" : "text-slate-800"
                      }`}
                  >
                    {category.categoria}
                  </h3>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section
        id="produtos"
        className="mx-auto max-w-8xl scroll-mt-24 px-4 py-10 sm:px-6"
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {selectedCategory
                ? selectedCategory
                : search
                  ? "Resultado da pesquisa"
                  : "Produtos em Destaque"}
            </h2>
            {(search || selectedCategory) && (
              <p className="mt-1 text-sm text-slate-400">
                {filteredProducts.length} produto
                {filteredProducts.length !== 1 ? "s" : ""} encontrado
                {filteredProducts.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {(search || selectedCategory) && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[#36A68B] transition hover:text-[#48c19f]"
            >
              Ver todos
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {loadingProducts ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-3xl bg-white"
              >
                <div className="h-60 animate-pulse bg-slate-200" />
                <div className="space-y-3 p-5">
                  <div className="h-4 animate-pulse rounded bg-slate-200" />
                  <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-8 w-1/2 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl bg-white/5 px-6 py-20 text-center">
            <Package size={60} className="mx-auto text-slate-600" />
            <h3 className="mt-5 text-xl font-bold text-white">
              Nenhum produto encontrado
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Tente pesquisar outro produto ou selecionar outra categoria.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 rounded-2xl bg-[#36A68B] px-6 py-3 font-semibold text-white transition hover:bg-[#2f8f78]"
            >
              Ver todos os produtos
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <Link
                  href={`/motorista/shopping/${product.id}`}
                  className="block"
                >
                  <div className="relative h-60 overflow-hidden bg-slate-200">
                    {product.imagem_principal ? (
                      <img
                        src={product.imagem_principal}
                        alt={product.nome}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package size={60} className="text-slate-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
                      <span className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-lg">
                        <Eye size={17} />
                        Ver produto
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="p-5">
                  {product.categoria && (
                    <button
                      type="button"
                      onClick={() => selectCategory(product.categoria!)}
                      className="text-xs font-bold text-[#36A68B] transition hover:underline"
                    >
                      {product.categoria}
                    </button>
                  )}

                  <Link
                    href={`/motorista/shopping/${product.id}`}
                    className="block"
                  >
                    <h3 className="mt-2 line-clamp-2 min-h-[48px] font-semibold text-slate-800 transition hover:text-[#36A68B]">
                      {product.nome}
                    </h3>
                  </Link>

                  <div className="mt-4">
                    <p className="text-xl font-black text-[#36A68B]">
                      {formatPrice(product.preco)}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className="cursor-pointer rounded-2xl bg-[#36A68B] py-3 font-semibold text-white transition hover:bg-[#2f8f78]"
                    >
                      Adicionar
                    </button>
                    <Link
                      href={`/motorista/shopping/${product.id}`}
                      className="flex items-center justify-center rounded-2xl border border-slate-200 px-4 text-slate-700 transition hover:border-[#36A68B] hover:text-[#36A68B]"
                      aria-label={`Ver ${product.nome}`}
                    >
                      <Eye size={20} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {cartOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          onClick={() => setCartOpen(false)}
        >
          <aside
            onClick={(event) => event.stopPropagation()}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Seu Carrinho
                </h2>
                <p className="text-sm text-slate-500">
                  {cartQuantity} item{cartQuantity !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Fechar carrinho"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingCart size={65} className="text-slate-200" />
                  <h3 className="mt-5 text-lg font-bold text-slate-700">
                    Seu carrinho está vazio
                  </h3>
                  <p className="mt-2 max-w-xs text-sm text-slate-400">
                    Adicione produtos para começar sua compra.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="mt-6 cursor-pointer rounded-2xl bg-[#36A68B] px-6 py-3 font-semibold text-white"
                  >
                    Continuar comprando
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 p-3"
                    >
                      <div className="flex gap-3">
                        <Link
                          href={`/motorista/shopping/${item.id}`}
                          onClick={() => setCartOpen(false)}
                          className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100"
                        >
                          {item.imagem_principal ? (
                            <img
                              src={item.imagem_principal}
                              alt={item.nome}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package
                                size={30}
                                className="text-slate-400"
                              />
                            </div>
                          )}
                        </Link>

                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/motorista/shopping/${item.id}`}
                            onClick={() => setCartOpen(false)}
                          >
                            <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 transition hover:text-[#36A68B]">
                              {item.nome}
                            </h3>
                          </Link>
                          <p className="mt-1 font-bold text-[#36A68B]">
                            {formatPrice(item.preco)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="h-fit cursor-pointer rounded-lg p-1 text-red-500 transition hover:bg-red-50"
                          aria-label={`Remover ${item.nome}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                          Quantidade
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => decreaseQuantity(item.id)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus size={15} />
                          </button>
                          <span className="w-5 text-center font-bold text-slate-800">
                            {item.quantidade}
                          </span>
                          <button
                            type="button"
                            onClick={() => increaseQuantity(item.id)}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-[#36A68B] text-white transition hover:bg-[#2f8f78]"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs text-slate-500">
                          Subtotal
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                          {formatPrice(
                            Number(item.preco) * item.quantidade
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-semibold text-slate-600">
                    Total
                  </span>
                  <span className="text-2xl font-black text-[#36A68B]">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/motorista/shopping/checkout")}
                  className="w-full cursor-pointer rounded-2xl bg-[#36A68B] py-4 font-bold text-white transition hover:bg-[#2f8f78]"
                >
                  Finalizar Compra
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
