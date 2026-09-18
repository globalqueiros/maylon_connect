import {
  Search,
  ShoppingCart,
  Car,
  Bike,
  Smartphone,
  Home as HomeIcon,
  Shirt,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  const categories = [
    { name: "Automóveis", icon: Car },
    { name: "Motos", icon: Bike },
    { name: "Tecnologia", icon: Smartphone },
    { name: "Casa", icon: HomeIcon },
    { name: "Moda", icon: Shirt },
  ];

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-8xl items-center gap-4 px-6 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="O que você está procurando?"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 outline-none transition focus:border-[#36A68B]"
            />
          </div>

          <button className="relative rounded-2xl bg-[#36A68B] p-3 text-white">
            <ShoppingCart size={22} />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs">
              3
            </span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-8xl px-6 py-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#36A68B] to-[#1B7F68]">
          <div className="grid items-center gap-8 p-10 md:grid-cols-2">
            <div>
              <span className="rounded-full bg-white/20 px-4 py-2 text-sm text-white">
                Promoção Especial
              </span>

              <h2 className="mt-5 text-5xl font-black text-white">
                Tudo para seu carro e moto.
              </h2>

              <p className="mt-4 text-lg text-white/90">
                Milhares de produtos com entrega rápida pela Maylon.
              </p>

              <button className="mt-8 rounded-2xl bg-white px-8 py-4 font-bold text-[#36A68B]">
                Comprar Agora
              </button>
            </div>

            <div className="hidden md:block">
              <div className="h-80 rounded-3xl bg-white/10 backdrop-blur-md" />
            </div>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="mx-auto max-w-8xl px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-2xl text-white font-bold">Categorias</h3>

          <button className="flex items-center gap-2 text-[#36A68B]">
            Ver todas
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <div
                key={category.name}
                className="group cursor-pointer rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#36A68B]/10">
                  <Icon size={28} className="text-[#36A68B]" />
                </div>

                <h4 className="mt-4 text-center font-semibold">
                  {category.name}
                </h4>
              </div>
            );
          })}
        </div>
      </section>

      {/* Produtos */}
      <section className="mx-auto max-w-8xl px-6 py-10">
        <h3 className="mb-4 text-white text-2xl font-bold">
          Produtos em Destaque
        </h3>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div
              key={item}
              className="group overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-60 bg-slate-200">
                <span className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                  -20%
                </span>
              </div>

              <div className="p-5">
                <h4 className="line-clamp-2 font-semibold text-slate-800">
                  Central Multimídia Android Auto para Veículos
                </h4>

                <div className="mt-3">
                  <p className="text-sm text-slate-400 line-through">
                    R$ 499,90
                  </p>

                  <p className="text-2xl font-black text-[#36A68B]">
                    R$ 399,90
                  </p>
                </div>

                <button className="mt-5 w-full rounded-2xl bg-[#36A68B] py-3 font-semibold text-white transition hover:bg-[#2f8f78]">
                  Adicionar ao Carrinho
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}