"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CarFront,
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  Power,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type User = {
  id: string | number;
  full_name: string;
  email: string;
};

type TripStatus = string | null | undefined;

type Trip = {
  trip_request_id: number | string;
  pickup_address: string | null;
  destination_address: string | null;
  paid_fare?: number | string | null;
  valor?: number | string | null;
  current_status: TripStatus;
};

type Banner = {
  id: number | string;
  image: string;
  title?: string | null;
};

type StatusConfig = {
  label: string;
  className: string;
  icon: typeof CheckCircle2;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    label: "Aguardando",
    className: "bg-amber-50 text-amber-700",
    icon: Clock3,
  },

  waiting: {
    label: "Aguardando",
    className: "bg-amber-50 text-amber-700",
    icon: Clock3,
  },

  requested: {
    label: "Aguardando",
    className: "bg-amber-50 text-amber-700",
    icon: Clock3,
  },

  searching_driver: {
    label: "Procurando motorista",
    className: "bg-amber-50 text-amber-700",
    icon: Clock3,
  },

  accepted: {
    label: "Aceita",
    className: "bg-blue-50 text-blue-700",
    icon: CheckCircle2,
  },

  driver_accepted: {
    label: "Aceita",
    className: "bg-blue-50 text-blue-700",
    icon: CheckCircle2,
  },

  in_progress: {
    label: "Em andamento",
    className: "bg-blue-50 text-blue-700",
    icon: Clock3,
  },

  started: {
    label: "Em andamento",
    className: "bg-blue-50 text-blue-700",
    icon: Clock3,
  },

  ongoing: {
    label: "Em andamento",
    className: "bg-blue-50 text-blue-700",
    icon: Clock3,
  },

  completed: {
    label: "Finalizada",
    className: "bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },

  finished: {
    label: "Finalizada",
    className: "bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },

  cancelled: {
    label: "Cancelada",
    className: "bg-red-50 text-red-700",
    icon: XCircle,
  },

  canceled: {
    label: "Cancelada",
    className: "bg-red-50 text-red-700",
    icon: XCircle,
  },

  cancelled_by_driver: {
    label: "Cancelada",
    className: "bg-red-50 text-red-700",
    icon: XCircle,
  },

  canceled_by_driver: {
    label: "Cancelada",
    className: "bg-red-50 text-red-700",
    icon: XCircle,
  },

  cancelled_by_customer: {
    label: "Cancelada",
    className: "bg-red-50 text-red-700",
    icon: XCircle,
  },

  canceled_by_customer: {
    label: "Cancelada",
    className: "bg-red-50 text-red-700",
    icon: XCircle,
  },
};

const DEFAULT_STATUS: StatusConfig = {
  label: "Aguardando",
  className: "bg-amber-50 text-amber-700",
  icon: Clock3,
};

function normalizeStatus(status: TripStatus): string {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function getStatus(status: TripStatus): StatusConfig {
  const normalizedStatus = normalizeStatus(status);

  return STATUS_CONFIG[normalizedStatus] ?? DEFAULT_STATUS;
}

function isCompletedStatus(status: TripStatus): boolean {
  const normalizedStatus = normalizeStatus(status);

  return ["completed", "finished"].includes(normalizedStatus);
}

function isInProgressStatus(status: TripStatus): boolean {
  const normalizedStatus = normalizeStatus(status);

  return ["in_progress", "started", "ongoing"].includes(normalizedStatus);
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";

  return "Boa noite";
}

function getTripValue(
  value: number | string | null | undefined
): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  let text = String(value)
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .trim();

  if (!text) {
    return 0;
  }

  if (text.includes(",")) {
    text = text.replace(/\./g, "").replace(",", ".");
  }

  const numericValue = Number(text);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getTripGainValue(trip: Trip): number {
  const paidFare = getTripValue(trip.paid_fare);

  if (paidFare > 0) {
    return paidFare;
  }

  return getTripValue(trip.valor);
}

function formatCurrency(
  value: number | string | null | undefined
): string {
  const numericValue = getTripValue(value);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-3 px-5 py-10 text-sm text-slate-500 sm:py-12">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
      Carregando corridas...
    </div>
  );
}

function EmptyTrips() {
  return (
    <div className="px-5 py-10 text-center sm:py-12">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
        <CarFront size={19} className="text-slate-400" />
      </div>

      <p className="text-sm font-medium text-slate-700">
        Nenhuma corrida encontrada
      </p>

      <p className="mt-1 text-xs text-slate-400">
        Suas corridas aparecerão aqui.
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: TripStatus;
}) {
  const config = getStatus(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium ${config.className}`}
    >
      <Icon size={14} />

      <span className="truncate">
        {config.label}
      </span>
    </span>
  );
}

function TripGain({
  trip,
}: {
  trip: Trip;
}) {
  const value = getTripGainValue(trip);

  return (
    <span
      className={`whitespace-nowrap text-sm font-semibold ${
        value > 0 ? "text-black" : "text-slate-400"
      }`}
    >
      {formatCurrency(value)}
    </span>
  );
}

function TripDetailsLink({
  tripId,
}: {
  tripId: number | string;
}) {
  return (
    <Link
      href={`/motorista/trips/${tripId}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
      title="Visualizar corrida"
      aria-label={`Visualizar corrida ${tripId}`}
    >
      <Eye size={16} />
    </Link>
  );
}

function AddressCell({
  address,
  type,
}: {
  address: string | null;
  type: "pickup" | "destination";
}) {
  const isPickup = type === "pickup";

  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <MapPin
        size={16}
        className={`mt-0.5 shrink-0 ${
          isPickup ? "text-emerald-600" : "text-red-500"
        }`}
      />

      <span
        className="line-clamp-2 min-w-0 text-sm leading-5 text-slate-700"
        title={address || undefined}
      >
        {address || "Não informado"}
      </span>
    </div>
  );
}

function TripMobileCard({
  trip,
}: {
  trip: Trip;
}) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Corrida
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-slate-800">
            #{trip.trip_request_id}
          </p>
        </div>

        <StatusBadge status={trip.current_status} />
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Origem
          </p>

          <AddressCell
            address={trip.pickup_address}
            type="pickup"
          />
        </div>

        <div className="ml-[7px] h-3 border-l border-dashed border-slate-300" />

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Destino
          </p>

          <AddressCell
            address={trip.destination_address}
            type="destination"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Ganho
          </p>

          <div className="mt-1">
            <TripGain trip={trip} />
          </div>
        </div>

        <Link
          href={`/motorista/trips/${trip.trip_request_id}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-700"
        >
          <Eye size={14} />
          Detalhes
        </Link>
      </div>
    </article>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
}) {
  if (totalItems === 0) {
    return null;
  }

  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 sm:text-sm">
          Mostrando{" "}
          <span className="font-semibold text-slate-700">
            {startIndex + 1}
          </span>{" "}
          até{" "}
          <span className="font-semibold text-slate-700">
            {Math.min(endIndex, totalItems)}
          </span>{" "}
          de{" "}
          <span className="font-semibold text-slate-700">
            {totalItems}
          </span>{" "}
          {totalItems === 1 ? "corrida" : "corridas"}
        </p>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Página anterior"
              className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm"
            >
              <ArrowLeft size={14} />

              <span className="hidden sm:inline">
                Anterior
              </span>
            </button>

            <div className="flex items-center gap-1">
              {pages.map((page, index) => {
                /*
                 * CORREÇÃO DO TS2345
                 *
                 * page pode ser number ou string.
                 * Quando for string, usamos como reticências.
                 * Depois desse return, o TypeScript sabe
                 * que page é obrigatoriamente number.
                 */
                if (typeof page === "string") {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="flex h-9 min-w-7 items-center justify-center px-1 text-sm text-slate-400"
                    >
                      ...
                    </span>
                  );
                }

                const isActive = currentPage === page;

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => onPageChange(page)}
                    aria-current={
                      isActive ? "page" : undefined
                    }
                    className={`h-9 min-w-9 cursor-pointer rounded-lg px-2.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#35a989] text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Próxima página"
              className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm"
            >
              <span className="hidden sm:inline">
                Próxima
              </span>

              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [rows, setRows] = useState<Trip[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const saudacao = useMemo(() => getGreeting(), []);

  useEffect(() => {
    let mounted = true;

    async function carregarDashboard() {
      setLoading(true);

      const [
        userResult,
        tripsResult,
        bannersResult,
      ] = await Promise.allSettled([
        fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),

        fetch("/api/trips/drives", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),

        fetch("/api/banners", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      if (!mounted) {
        return;
      }

      if (userResult.status === "fulfilled") {
        const response = userResult.value;

        if (response.ok) {
          const userData = await safeJson(response);

          const currentUser =
            userData?.user ?? userData;

          if (currentUser?.full_name) {
            setUser({
              id: currentUser.id,
              full_name: currentUser.full_name,
              email: currentUser.email,
            });
          }
        } else {
          const errorData = await safeJson(response);

          console.error(
            "Erro ao buscar usuário:",
            response.status,
            errorData
          );
        }
      } else {
        console.error(
          "Erro de conexão ao buscar usuário:",
          userResult.reason
        );
      }

      if (tripsResult.status === "fulfilled") {
        const response = tripsResult.value;

        if (response.ok) {
          const tripsData = await safeJson(response);

          const trips: Trip[] = Array.isArray(tripsData)
            ? tripsData
            : Array.isArray(tripsData?.trips)
              ? tripsData.trips
              : [];

          setRows(trips);

          // Volta para a primeira página quando a lista
          // de corridas é carregada novamente.
          setCurrentPage(1);
        } else {
          const errorData = await safeJson(response);

          console.error(
            "Erro ao buscar viagens:",
            response.status,
            errorData
          );

          setRows([]);
          setCurrentPage(1);
        }
      } else {
        console.error(
          "Erro de conexão ao buscar viagens:",
          tripsResult.reason
        );

        setRows([]);
        setCurrentPage(1);
      }

      if (bannersResult.status === "fulfilled") {
        const response = bannersResult.value;

        if (response.ok) {
          const bannersData = await safeJson(response);

          const bannersList: Banner[] = Array.isArray(
            bannersData
          )
            ? bannersData
            : Array.isArray(bannersData?.banners)
              ? bannersData.banners
              : [];

          setBanners(bannersList);
        } else {
          console.error(
            "Erro ao buscar banners:",
            response.status
          );

          setBanners([]);
        }
      } else {
        console.error(
          "Erro de conexão ao buscar banners:",
          bannersResult.reason
        );

        setBanners([]);
      }

      setLoading(false);
    }

    carregarDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * PAGINAÇÃO
   */

  const totalItems = rows.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / itemsPerPage)
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * itemsPerPage;

  const endIndex =
    startIndex + itemsPerPage;

  const paginatedRows = rows.slice(
    startIndex,
    endIndex
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);

    // Volta para o topo da área de corridas.
    window.requestAnimationFrame(() => {
      document
        .getElementById("minhas-corridas")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  };

  /*
   * ESTATÍSTICAS
   *
   * Os números abaixo usam TODAS as corridas,
   * e não somente as 10 da página atual.
   */

  const totalViagens = rows.length;

  const viagensFinalizadas = rows.filter((item) =>
    isCompletedStatus(item.current_status)
  ).length;

  const viagensAndamento = rows.filter((item) =>
    isInProgressStatus(item.current_status)
  ).length;

  const totalGanhos = useMemo(() => {
    return rows.reduce((total, trip) => {
      if (!isCompletedStatus(trip.current_status)) {
        return total;
      }

      return total + getTripGainValue(trip);
    }, 0);
  }, [rows]);

  const bannerPrincipal = banners[0];

  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-8xl">

        {/* HEADER */}

        <header className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:mb-6 sm:gap-5 sm:pb-6 lg:mb-7 lg:flex-row lg:items-center lg:justify-between lg:pb-7">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-medium text-white/50 sm:text-sm">
              Painel do motorista
            </p>

            <h1 className="my-1 break-words text-xl font-semibold tracking-tight text-white sm:text-2xl md:text-3xl">
              {saudacao},{" "}
              <span className="font-bold text-teal-200">
                {user?.full_name || "Carregando..."}
              </span>
            </h1>

            <p className="text-xs text-white/50 sm:text-sm">
              Acompanhe suas corridas e seus ganhos.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setOnline((current) => !current)
            }
            aria-pressed={online}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 transition sm:w-fit ${
              online
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                online
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              <Power size={17} />
            </div>

            <div className="min-w-0 text-left">
              <p
                className={`text-sm font-semibold ${
                  online
                    ? "text-emerald-800"
                    : "text-slate-700"
                }`}
              >
                {online
                  ? "Você está online"
                  : "Você está offline"}
              </p>

              <p className="text-xs text-slate-500">
                {online
                  ? "Disponível para novas corridas"
                  : "Você não receberá novas corridas"}
              </p>
            </div>
          </button>
        </header>

        {/* ESTATÍSTICAS */}

        <section className="mb-5 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:mb-7">

          {/* GANHOS */}

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">
                  Total de Ganhos
                </p>

                <p className="mt-2 truncate text-xl font-semibold text-black sm:text-2xl">
                  {formatCurrency(totalGanhos)}
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <TrendingUp size={14} />

                  Ganhos das corridas finalizadas
                </div>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Wallet size={19} />
              </div>
            </div>
          </div>

          {/* CORRIDAS */}

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Corridas
                </p>

                <p className="mt-2 text-xl font-semibold text-black sm:text-2xl">
                  {totalViagens}
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  Total de corridas
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <CarFront size={19} />
              </div>
            </div>
          </div>

          {/* EM ANDAMENTO */}

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Em andamento
                </p>

                <p className="mt-2 text-xl font-semibold text-black sm:text-2xl">
                  {viagensAndamento}
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  Corridas ativas
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Clock3 size={19} />
              </div>
            </div>
          </div>

          {/* FINALIZADAS */}

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Finalizadas
                </p>

                <p className="mt-2 text-xl font-semibold text-black sm:text-2xl">
                  {viagensFinalizadas}
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  Corridas concluídas
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={19} />
              </div>
            </div>
          </div>
        </section>

        {/* BANNER */}

        {bannerPrincipal?.image && (
          <section className="relative mb-5 h-40 overflow-hidden rounded-xl sm:mb-6 sm:h-52 md:h-60 lg:mb-7 lg:h-64 xl:h-72">
            <Image
              src={bannerPrincipal.image}
              alt={bannerPrincipal.title || "Banner"}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 1600px"
              className="object-cover"
            />

            <div className="absolute inset-0 flex items-center px-4 sm:px-6 md:px-8 lg:px-10">
              <div className="max-w-xs text-white sm:max-w-md lg:max-w-lg">
                {bannerPrincipal.title && (
                  <h2 className="text-lg font-semibold sm:text-xl md:text-2xl">
                    {bannerPrincipal.title}
                  </h2>
                )}
              </div>
            </div>
          </section>
        )}

        {/* MINHAS CORRIDAS */}

        <section
          id="minhas-corridas"
          className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                Minhas corridas
              </h2>

              <p className="mt-0 text-xs text-slate-500 sm:text-sm">
                Acompanhe suas corridas recentes.
              </p>
            </div>

            <Link
              href="/motorista/relatorio"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 sm:w-auto"
            >
              Ver todas

              <ArrowUpRight size={16} />
            </Link>
          </div>

          {/* DESKTOP / TABLET */}

          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="table-fixed border-collapse">
                <colgroup>
                  <col className="w-[10%]" />
                  <col className="w-[25%]" />
                  <col className="w-[25%]" />
                  <col className="w-[13%]" />
                  <col className="w-[17%]" />
                  <col className="w-[10%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Corrida
                    </th>

                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Origem
                    </th>

                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Destino
                    </th>

                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Ganho
                    </th>

                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Ação
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6}>
                        <LoadingState />
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyTrips />
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((trip) => (
                      <tr
                        key={trip.trip_request_id}
                        className="group transition-colors hover:bg-slate-50"
                      >
                        {/* CORRIDA */}

                        <td className="px-4 py-4 align-middle">
                          <span className="text-sm font-semibold text-slate-900">
                            #{trip.trip_request_id}
                          </span>
                        </td>

                        {/* ORIGEM */}

                        <td className="px-4 py-4 align-middle">
                          <AddressCell
                            address={trip.pickup_address}
                            type="pickup"
                          />
                        </td>

                        {/* DESTINO */}

                        <td className="px-4 py-4 align-middle">
                          <AddressCell
                            address={trip.destination_address}
                            type="destination"
                          />
                        </td>

                        {/* GANHO */}

                        <td className="px-4 py-4 align-middle">
                          <TripGain trip={trip} />
                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-4 align-middle">
                          <StatusBadge
                            status={trip.current_status}
                          />
                        </td>

                        {/* AÇÃO */}

                        <td className="px-4 py-4 text-right align-middle">
                          <TripDetailsLink
                            tripId={trip.trip_request_id}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINAÇÃO DESKTOP */}

            {!loading && rows.length > 0 && (
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={handlePageChange}
              />
            )}
          </div>

          {/* MOBILE */}

          <div className="grid grid-cols-1 gap-3 p-3 md:hidden">
            {loading ? (
              <LoadingState />
            ) : rows.length === 0 ? (
              <EmptyTrips />
            ) : (
              paginatedRows.map((trip) => (
                <TripMobileCard
                  key={trip.trip_request_id}
                  trip={trip}
                />
              ))
            )}
          </div>

          {/* PAGINAÇÃO MOBILE */}

          {!loading && rows.length > 0 && (
            <div className="md:hidden">
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
