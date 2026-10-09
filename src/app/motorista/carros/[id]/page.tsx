import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Gauge,
  CalendarDays,
  CarFront,
  Building2,
  CheckCircle2,
  Heart,
  Video,
  ShieldCheck,
  CircleDollarSign,
  ChevronDown,
} from "lucide-react";
import InterestModal from "./InterestModal";
import VideoCallModal from "../../../components/VideoCallModal";
import { db } from "../../../lib/db";

type Car = {
  id: number;
  nome: string;
  modelo: string;
  preco: number | string;
  ano: string;
  km: number | string;
  cidade: string;
  imagens: string[] | string | null;
  descricao: string | null;
  laudo_vistoria: string | null;
  vistoria: number | string | boolean | null;
};

async function getCar(id: string): Promise<Car | null> {
  const carId = Number(id);

  if (!Number.isInteger(carId) || carId <= 0) {
    return null;
  }

  try {
    const [rows] = await db.execute(
      `
        SELECT
          id,
          nome,
          modelo,
          preco,
          ano,
          km,
          cidade,
          imagens,
          descricao,
          laudo_vistoria,
          vistoria
        FROM carros
        WHERE id = ?
        LIMIT 1
      `,
      [carId]
    );

    const cars = rows as Car[];
    return cars.length > 0 ? cars[0] : null;
  } catch (error) {
    console.error("Erro ao buscar veículo:", error);
    return null;
  }
}

function parseImages(imagens: string[] | string | null): string[] {
  if (!imagens) return [];

  if (Array.isArray(imagens)) {
    return imagens
      .filter(
        (imagem) =>
          typeof imagem === "string" && imagem.trim().length > 0
      )
      .map((imagem) => imagem.trim());
  }

  const valor = imagens.trim();

  if (!valor) return [];

  try {
    const parsed = JSON.parse(valor);

    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (imagem) =>
            typeof imagem === "string" && imagem.trim().length > 0
        )
        .map((imagem) => imagem.trim());
    }

    return [];
  } catch {
    return [valor];
  }
}

function isVistoriado(vistoria: Car["vistoria"]): boolean {
  return (
    Number(vistoria) === 1 ||
    vistoria === true ||
    String(vistoria).toLowerCase() === "true"
  );
}

export default async function CarDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const car = await getCar(id);

  if (!car) {
    notFound();
  }

  const imagens = parseImages(car.imagens);
  const imagemPrincipal = imagens[0] ?? null;
  const fotosExtras = imagens.slice(1, 5);
  const vistoriado = isVistoriado(car.vistoria);

  const quilometragem = new Intl.NumberFormat("pt-BR").format(
    Number(car.km) || 0
  );

  const bancos = [
    {
      imagem: "/itau.svg",
      nome: "Itaú",
      descricao: "Financiamento de veículos",
    },
    {
      imagem: "/bv.png",
      nome: "BV",
      descricao: "Financiamento de veículos",
    },
    {
      imagem: "/santander.jpg",
      nome: "Santander",
      descricao: "Financiamento de veículos",
    },
    {
      imagem: "/bradesco.png",
      nome: "Bradesco",
      descricao: "Financiamento de veículos",
    },
  ];

  const itensVeiculo = [
    "Airbag",
    "Alarme",
    "Banco com regulagem de altura",
    "Computador de bordo",
    "Controle de tração",
    "Desembaçador traseiro",
    "Ar condicionado",
    "Encosto de cabeça traseiro",
    "Freio ABS",
    "Limpador traseiro",
    "Rádio",
    "Retrovisores elétricos",
    "Rodas de liga leve",
    "Sensor de estacionamento",
    "Travas elétricas",
    "Vidros elétricos",
    "Volante com regulagem de altura",
    "Direção hidráulica",
    "GPS",
    "Direção com ajuste",
    "Freios ABS com EBD",
    "Freios ABS com BAS",
    "Controle de estabilidade",
    "Sensor de pressão dos pneus",
    "Tela multimídia",
    "Espelhamento com Smartphone",
    "Bluetooth",
  ];

  const itensVistoria = [
    "Estrutura",
    "Interior",
    "Indício de sinistro",
    "Débitos",
    "Funilaria",
    "Restrições",
  ];

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-8xl">
        <div className="py-5">
          <Link
            href="/motorista/carros"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-teal-700 hover:shadow-md active:scale-[0.98]"
          >
            <ArrowLeft size={18} />
            Voltar para veículos
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="bg-slate-900 p-3 sm:p-4">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-800">
                {imagemPrincipal ? (
                  <Image
                    src={imagemPrincipal}
                    alt={`${car.nome} ${car.modelo}`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-slate-400">
                    <CarFront size={70} />
                    <p className="mt-3 text-sm">
                      Sem imagem disponível
                    </p>
                  </div>
                )}

                <div className="absolute left-4 top-4 rounded-full bg-teal-500 px-4 py-2 text-xs font-bold text-white shadow-lg">
                  Veículo disponível
                </div>

                <button
                  type="button"
                  aria-label="Favoritar veículo"
                  className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-lg transition hover:scale-105 hover:text-red-500"
                >
                  <Heart size={21} />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2">
                {fotosExtras.map((imagem, index) => (
                  <div
                    key={`${imagem}-${index}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-800"
                  >
                    <Image
                      src={imagem}
                      alt={`${car.nome} ${car.modelo} - foto ${index + 2}`}
                      fill
                      sizes="(max-width: 640px) 25vw, 15vw"
                      className="object-cover transition duration-300 hover:scale-105"
                    />
                  </div>
                ))}

                {Array.from({
                  length: Math.max(0, 4 - fotosExtras.length),
                }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="flex aspect-[4/3] items-center justify-center rounded-xl bg-slate-800 text-slate-500"
                  >
                    <CarFront size={22} />
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between px-1 text-xs text-slate-400">
                <span>
                  {imagens.length}{" "}
                  {imagens.length === 1 ? "foto" : "fotos"} do veículo
                </span>
                <span>
                  {imagens.length >= 5
                    ? "Galeria completa"
                    : "Mais fotos em breve"}
                </span>
              </div>
            </div>

            <div className="flex flex-col p-6 sm:p-8 lg:p-10">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  {car.nome}
                </h1>
                <p className="text-lg font-medium text-slate-500">
                  {car.modelo}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                  <MapPin size={20} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">
                    Localização
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {car.cidade || "Não informado"}
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-2xl p-5 text-white">
                <p className="text-xs font-medium text-slate-400">
                  Preço do veículo
                </p>

                <p className="mt-1 text-3xl font-black tracking-tight text-teal-600">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(
                    typeof car.preco === "number"
                      ? car.preco
                      : Number(
                          String(car.preco)
                            .replace(/[^\d,.-]/g, "")
                            .replace(/\./g, "")
                            .replace(",", ".")
                        ) || 0
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Consulte condições de financiamento
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <CalendarDays size={20} className="text-teal-600" />
                  <p className="mt-3 text-xs text-slate-400">Ano</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {car.ano}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <Gauge size={20} className="text-teal-600" />
                  <p className="mt-3 text-xs text-slate-400">KM</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {quilometragem}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <InterestModal
                  carId={car.id}
                  carName={car.nome}
                  carModel={car.modelo}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="mb-7">
            <p className="text-sm font-medium text-slate-400">
              Sobre este carro
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              {car.nome} {car.modelo}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Marca</p>
              <p className="mt-1 font-bold text-slate-900">
                {car.nome}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Modelo</p>
              <p className="mt-1 font-bold text-slate-900">
                {car.modelo}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Ano</p>
              <p className="mt-1 font-bold text-slate-900">
                {car.ano}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Quilometragem
              </p>
              <p className="mt-1 font-bold text-slate-900">
                {quilometragem} km
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-sm font-medium text-slate-400">
            Sobre os diferenciais do anúncio
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-900">
            Compra mais segura e tranquila
          </h2>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Video size={23} />
                </div>

                <div>
                  <p className="font-bold text-slate-900">
                    Videochamada
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Veja o veículo em vídeo antes de comprar.
                  </p>
                </div>
              </div>

              <VideoCallModal
                carId={car.id}
                carName={car.nome}
                carModel={car.modelo}
              />
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <CircleDollarSign size={25} />
              </div>

              <div>
                <p className="font-bold text-slate-900">
                  Preço competitivo
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Consulte as condições disponíveis.
                </p>
              </div>

              <ChevronDown
                size={20}
                className="ml-auto text-slate-400"
              />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-sm font-bold text-slate-400">
            Sobre este carro
          </p>

          <p className="mt-3 whitespace-pre-line text-justify text-sm leading-7 text-slate-700">
            {car.descricao ||
              "Nenhuma descrição foi cadastrada para este veículo."}
          </p>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-sm font-medium text-slate-400">
            Itens de veículo
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-900">
            Equipamentos e acessórios
          </h2>

          <div className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {itensVeiculo.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0 text-teal-500"
                />
                <span className="text-sm font-semibold leading-5 text-slate-800">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50">
              <Building2 size={24} className="text-teal-600" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Financiamento
              </h2>
              <p className="text-sm text-slate-500">
                Consulte as opções de financiamento disponíveis
                para este veículo.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bancos.map((banco) => (
              <div
                key={banco.nome}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-md"
              >
                <div className="flex h-16 items-center">
                  <Image
                    src={banco.imagem}
                    alt={`Logo ${banco.nome}`}
                    width={120}
                    height={50}
                    className="h-12 w-auto max-w-[110px] object-contain"
                  />
                </div>

                <p className="mt-4 font-bold text-slate-900">
                  {banco.nome}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {banco.descricao}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-teal-600">
                  <CheckCircle2 size={15} />
                  Sujeito à aprovação
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-teal-50 p-4">
            <p className="text-sm leading-6 text-teal-800">
              As taxas, prazos e aprovação dependem da análise de
              crédito da instituição financeira.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="rounded-3xl border-2 border-slate-200 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50">
                  <ShieldCheck
                    size={27}
                    className="text-pink-500"
                  />
                </div>

                <div>
                  <p className="text-xl font-black text-slate-900">
                    Vistoriado
                    <span className="text-pink-500">.</span>
                  </p>

                  <p className="text-xs text-slate-400">
                    Segurança para sua compra
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-4 py-2 text-xs font-bold ${
                  vistoriado
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {vistoriado
                  ? "Veículo Vistoriado"
                  : "Veículo Não Vistoriado"}
              </span>
            </div>

            {vistoriado ? (
              <div className="mt-8">
                <p className="text-sm text-slate-500">
                  Confiança e tranquilidade na compra do seu
                  seminovo.
                </p>

                <h3 className="mt-3 text-2xl font-black text-slate-900">
                  Diversos itens inspecionados
                </h3>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {itensVistoria.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle2
                        size={20}
                        className="text-pink-500"
                      />
                      <span className="font-semibold text-slate-600">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="my-5 text-sm text-slate-600">
                  Você mais seguro na hora de fechar o negócio!
                </p>

                {car.laudo_vistoria ? (
                  <Link
                    href={car.laudo_vistoria}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-pink-500 px-8 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-pink-600"
                  >
                    Visualizar laudo
                  </Link>
                ) : (
                  <div className="inline-flex rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-500">
                    Laudo não disponível
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-5">
                <p className="font-bold text-red-700">
                  Este veículo ainda não foi vistoriado.
                </p>

                <p className="mt-1 text-sm leading-6 text-red-600">
                  A vistoria ainda não foi realizada ou não está
                  disponível para este veículo.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}