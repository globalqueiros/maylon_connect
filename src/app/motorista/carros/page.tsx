"use client";

import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Heart,
  ChevronLeft,
  ChevronRight,
  Gauge,
  CalendarDays,
  CarFront,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Car = {
  id: number;
  nome: string;
  modelo: string;
  preco: number;
  ano: string;
  km: number;
  cidade: string;
  imagens: string[] | string | null;
  descricao: string;
};

type ApiResponse = {
  carros?: unknown;
  cars?: unknown;
  data?: unknown;
  message?: string;
  error?: string;
};

function normalizarNumero(valor: unknown): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function normalizarImagens(valor: unknown): string[] {
  if (!valor) return [];

  if (Array.isArray(valor)) {
    return valor
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof valor !== "string") return [];

  const texto = valor.trim();
  if (!texto) return [];

  try {
    const parsed = JSON.parse(texto);

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item || "").trim())
        .filter(Boolean);
    }

    if (typeof parsed === "string" && parsed.trim()) {
      return [parsed.trim()];
    }
  } catch {}

  if (
    texto.startsWith("http://") ||
    texto.startsWith("https://") ||
    texto.startsWith("/")
  ) {
    return [texto];
  }

  if (texto.includes(",")) {
    return texto
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizarCarro(item: any): Car {
  return {
    id: normalizarNumero(item?.id),
    nome:
      String(
        item?.nome ??
          item?.name ??
          item?.marca ??
          item?.marca_nome ??
          item?.brand ??
          "Veículo"
      ).trim() || "Veículo",
    modelo:
      String(
        item?.modelo ??
          item?.model ??
          item?.modelo_nome ??
          item?.descricao_modelo ??
          ""
      ).trim(),
    preco: normalizarNumero(
      item?.preco ??
        item?.preco_venda ??
        item?.valor ??
        item?.price ??
        item?.valor_venda
    ),
    ano: String(
      item?.ano ?? item?.year ?? item?.ano_modelo ?? ""
    ).trim(),
    km: normalizarNumero(
      item?.km ??
        item?.quilometragem ??
        item?.mileage ??
        item?.kilometragem
    ),
    cidade:
      String(
        item?.cidade ??
          item?.city ??
          item?.localizacao ??
          item?.location ??
          ""
      ).trim(),
    imagens:
      item?.imagens ??
      item?.images ??
      item?.imagem ??
      item?.image ??
      item?.fotos ??
      null,
    descricao:
      String(item?.descricao ?? item?.description ?? "").trim(),
  };
}

function extrairListaCarros(data: ApiResponse | unknown): any[] {
  if (Array.isArray(data)) return data;

  if (!data || typeof data !== "object") return [];

  const objeto = data as ApiResponse;

  if (Array.isArray(objeto.carros)) return objeto.carros;
  if (Array.isArray(objeto.cars)) return objeto.cars;
  if (Array.isArray(objeto.data)) return objeto.data;

  if (objeto.data && typeof objeto.data === "object") {
    const dataInterno = objeto.data as any;

    if (Array.isArray(dataInterno.carros)) {
      return dataInterno.carros;
    }

    if (Array.isArray(dataInterno.cars)) {
      return dataInterno.cars;
    }

    if (Array.isArray(dataInterno.data)) {
      return dataInterno.data;
    }
  }

  return [];
}

function CarItem({ car }: { car: Car }) {
  const [index, setIndex] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const startX = useRef(0);

  const imagens = normalizarImagens(car.imagens);

  useEffect(() => {
    if (imagens.length > 0 && index >= imagens.length) {
      setIndex(0);
    }
  }, [imagens.length, index]);

  const next = () => {
    if (imagens.length <= 1) return;

    setIndex((prev) =>
      prev >= imagens.length - 1 ? 0 : prev + 1
    );
  };

  const prev = () => {
    if (imagens.length <= 1) return;

    setIndex((prev) =>
      prev <= 0 ? imagens.length - 1 : prev - 1
    );
  };

  const handleTouchStart = (
    e: React.TouchEvent<HTMLDivElement>
  ) => {
    startX.current = e.touches[0]?.clientX ?? 0;
  };

  const handleTouchEnd = (
    e: React.TouchEvent<HTMLDivElement>
  ) => {
    const currentX = e.changedTouches[0]?.clientX ?? 0;
    const diff = startX.current - currentX;

    if (diff > 50) next();
    if (diff < -50) prev();
  };

  const preco = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(normalizarNumero(car.preco));

  const quilometragem = new Intl.NumberFormat("pt-BR").format(
    normalizarNumero(car.km)
  );

  return (
    <article className="group w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div
        className="relative h-48 overflow-hidden bg-slate-100"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {imagens.length > 0 ? (
          <>
            <div
              className="flex h-full transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${index * 100}%)`,
              }}
            >
              {imagens.map((img, i) => (
                <div
                  key={`${img}-${i}`}
                  className="relative h-full min-w-full"
                >
                  <Image
                    src={img}
                    alt={`${car.nome} - ${car.modelo}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized={img.includes("amazonaws.com")}
                  />
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

            <button
              type="button"
              onClick={() => setFavorite((prev) => !prev)}
              aria-label={
                favorite
                  ? "Remover dos favoritos"
                  : "Adicionar aos favoritos"
              }
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-105"
            >
              <Heart
                size={17}
                className={
                  favorite
                    ? "fill-red-500 text-red-500"
                    : "text-slate-600"
                }
              />
            </button>

            {imagens.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Imagem anterior"
                  className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
                >
                  <ChevronLeft size={17} />
                </button>

                <button
                  type="button"
                  onClick={next}
                  aria-label="Próxima imagem"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
                >
                  <ChevronRight size={17} />
                </button>

                <div className="absolute bottom-2 left-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {index + 1}/{imagens.length}
                </div>

                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                  {imagens.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Visualizar imagem ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === index
                          ? "w-4 bg-white"
                          : "w-1.5 bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-slate-400">
            <CarFront size={38} strokeWidth={1.5} />
            <span className="mt-1 text-xs">
              Sem imagem disponível
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div>
          <h2 className="truncate text-[17px] font-bold leading-5 tracking-tight text-slate-900">
            {car.nome}
          </h2>

          {car.modelo && (
            <p className="mt-1 truncate text-[13px] text-slate-500">
              {car.modelo}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-4 text-[13px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={15} className="text-slate-500" />
            <span>{car.ano || "Não informado"}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Gauge size={15} className="text-slate-500" />
            <span>{quilometragem} Km</span>
          </div>
        </div>

        {car.cidade && (
          <div className="mt-2 flex items-center gap-1.5 text-[13px] text-slate-500">
            <MapPin size={15} className="shrink-0 text-slate-500" />
            <span className="truncate">{car.cidade}</span>
          </div>
        )}

        <div className="mt-4">
          <p className="text-[11px] font-medium text-slate-400">
            A partir de
          </p>

          <p className="mt-0.5 text-[23px] font-extrabold leading-7 tracking-tight text-slate-900">
            {preco}
          </p>
        </div>

        <Link
          href={`/motorista/carros/${car.id}`}
          className="mt-4 flex w-full items-center justify-center rounded-lg bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md active:scale-[0.98]"
        >
          Ver parcelas
        </Link>
      </div>
    </article>
  );
}

export default function CarCard() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchCars = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      setErrorMessage("");

      const response = await fetch("/api/carros", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const texto = await response.text();
      let data: unknown = null;

      try {
        data = texto ? JSON.parse(texto) : null;
      } catch {
        throw new Error(
          "O servidor retornou uma resposta inválida."
        );
      }

      if (!response.ok) {
        const resposta = data as ApiResponse | null;

        throw new Error(
          resposta?.message ||
            resposta?.error ||
            `Erro HTTP ${response.status}`
        );
      }

      const lista = extrairListaCarros(data);

      if (!Array.isArray(lista)) {
        throw new Error(
          "A API retornou um formato de dados inválido."
        );
      }

      const carrosFormatados = lista
        .map((item) => normalizarCarro(item))
        .filter((carro) => carro.id > 0);

      setCars(carrosFormatados);
    } catch (error) {
      setCars([]);
      setError(true);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível consultar os veículos."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  if (loading) {
    return (
      <section className="min-h-[400px]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4">
            <div className="h-6 w-48 animate-pulse rounded bg-white/20" />
            <div className="mt-2 h-3 w-64 animate-pulse rounded bg-white/10" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="h-48 animate-pulse bg-slate-200" />

                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-7 w-1/2 animate-pulse rounded bg-slate-200" />
                  <div className="h-11 animate-pulse rounded-lg bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-[400px] px-4">
        <div className="mx-auto flex max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border border-red-100 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-red-50">
              <AlertCircle
                size={28}
                strokeWidth={1.8}
                className="text-red-500"
              />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Não foi possível carregar os veículos
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ocorreu um problema ao consultar os veículos. Tente
              novamente.
            </p>

            {errorMessage && (
              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-left">
                <p className="text-xs leading-5 text-red-700">
                  {errorMessage}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={fetchCars}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98]"
            >
              <RefreshCw size={16} />
              Tentar novamente
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (cars.length === 0) {
    return (
      <section className="min-h-[400px] px-4">
        <div className="mx-auto flex max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50">
              <CarFront
                size={30}
                strokeWidth={1.7}
                className="text-teal-600"
              />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Nenhum veículo encontrado
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              No momento não temos veículos disponíveis para exibir.
            </p>

            <button
              type="button"
              onClick={fetchCars}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 hover:shadow-md active:scale-[0.98]"
            >
              <RefreshCw size={16} />
              Atualizar veículos
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Veículos disponíveis
            </h1>

            <p className="text-xs text-white/70">
              Encontre o veículo ideal para você.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchCars}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Atualizar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cars.map((car) => (
            <CarItem key={car.id} car={car} />
          ))}
        </div>
      </div>
    </section>
  );
}
