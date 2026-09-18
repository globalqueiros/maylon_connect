"use client";

import {
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

  if (hour < 12) {
    return "Bom dia";
  }

  if (hour < 18) {
    return "Boa tarde";
  }

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
    <div className="flex items-center justify-center gap-3 px-5 py-12 text-sm text-slate-500">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
      Carregando corridas...
    </div>
  );
}

function EmptyTrips() {
  return (
    <div className="px-5 py-12 text-center">
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

function StatusBadge({ status }: { status: TripStatus }) {
  const config = getStatus(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${config.className}`}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
}

function TripGain({ trip }: { trip: Trip }) {
  const value = getTripGainValue(trip);

  return (
    <span
      className={`text-sm font-semibold ${
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
      title="Visualizar corrida"
      aria-label={`Visualizar corrida ${tripId}`}
    >
      <Eye size={16} />
    </Link>
  );
}

function TripMobileCard({ trip }: { trip: Trip }) {
  return (
    <div className="p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700">
          Corrida #{trip.trip_request_id}
        </span>

        <StatusBadge status={trip.current_status} />
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <MapPin
            size={16}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Origem
            </p>

            <p className="mt-1 text-sm leading-5 text-slate-700">
              {trip.pickup_address || "Não informado"}
            </p>
          </div>
        </div>

        <div className="ml-[7px] h-3 border-l border-dashed border-slate-300" />

        <div className="flex gap-3">
          <MapPin
            size={16}
            className="mt-0.5 shrink-0 text-red-500"
          />

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Destino
            </p>

            <p className="mt-1 text-sm leading-5 text-slate-700">
              {trip.destination_address || "Não informado"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Ganho
          </p>

          <div className="mt-1">
            <TripGain trip={trip} />
          </div>
        </div>

        <Link
          href={`/motorista/trips/${trip.trip_request_id}`}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-700"
        >
          <Eye size={14} />
          Detalhes
        </Link>
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

  const saudacao = useMemo(() => getGreeting(), []);

  useEffect(() => {
    let mounted = true;

    async function carregarDashboard() {
      setLoading(true);

      const [userResult, tripsResult, bannersResult] =
        await Promise.allSettled([
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
          const currentUser = userData?.user ?? userData;

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
        } else {
          const errorData = await safeJson(response);

          console.error(
            "Erro ao buscar viagens:",
            response.status,
            errorData
          );

          setRows([]);
        }
      } else {
        console.error(
          "Erro de conexão ao buscar viagens:",
          tripsResult.reason
        );

        setRows([]);
      }

      if (bannersResult.status === "fulfilled") {
        const response = bannersResult.value;

        if (response.ok) {
          const bannersData = await safeJson(response);

          const bannersList: Banner[] = Array.isArray(bannersData)
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
    <main className="min-h-screen">
      <div className="mx-auto max-w-8xl">
        <header className="mb-7 flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-white/50">
              Painel do motorista
            </p>

            <h1 className="my-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {saudacao},{" "}
              <span className="font-bold text-teal-200">
                {user?.full_name || "Carregando..."}
              </span>
            </h1>

            <p className="mt-0 text-sm text-white/50">
              Acompanhe suas corridas e seus ganhos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOnline((current) => !current)}
            aria-pressed={online}
            className={`flex w-fit cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
              online
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                online
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              <Power size={17} />
            </div>

            <div className="text-left">
              <p
                className={`text-sm font-semibold ${
                  online ? "text-emerald-800" : "text-slate-700"
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

        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Ganhos
                </p>

                <p className="mt-2 text-2xl font-semibold text-black">
                  {formatCurrency(totalGanhos)}
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <TrendingUp size={14} />
                  Ganhos das corridas finalizadas
                </div>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Wallet size={19} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Corridas
                </p>

                <p className="mt-2 text-2xl font-semibold text-black">
                  {totalViagens}
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  Total de corridas
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <CarFront size={19} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Em andamento
                </p>

                <p className="mt-2 text-2xl font-semibold text-black">
                  {viagensAndamento}
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  Corridas ativas
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Clock3 size={19} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Finalizadas
                </p>

                <p className="mt-2 text-2xl font-semibold text-black">
                  {viagensFinalizadas}
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  Corridas concluídas
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={19} />
              </div>
            </div>
          </div>
        </section>

        {bannerPrincipal?.image && (
          <section className="relative mb-7 h-52 overflow-hidden rounded-xl sm:h-60">
            <Image
              src={bannerPrincipal.image}
              alt={bannerPrincipal.title || "Banner"}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 1200px"
              className="object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

            <div className="absolute inset-0 flex items-center px-6 sm:px-10">
              <div className="max-w-lg text-white">
                {bannerPrincipal.title && (
                  <h2 className="text-xl font-semibold sm:text-2xl">
                    {bannerPrincipal.title}
                  </h2>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Minhas corridas
              </h2>

              <p className="mt-0 text-sm text-slate-500">
                Acompanhe suas corridas recentes.
              </p>
            </div>

            <Link
              href="/motorista/relatorio"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-600 hover:shadow-md"
            >
              Ver todas
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Corrida
                  </th>

                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Origem
                  </th>

                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Destino
                  </th>

                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Ganho
                  </th>

                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Ação
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-14 text-center"
                    >
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
                  rows.map((trip) => (
                    <tr
                      key={trip.trip_request_id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="text-sm font-semibold text-black">
                          #{trip.trip_request_id}
                        </span>
                      </td>

                      <td className="max-w-[250px] px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin
                            size={15}
                            className="shrink-0 text-emerald-600"
                          />

                          <span className="truncate text-sm text-black">
                            {trip.pickup_address ||
                              "Não informado"}
                          </span>
                        </div>
                      </td>

                      <td className="max-w-[250px] px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin
                            size={15}
                            className="shrink-0 text-red-500"
                          />

                          <span className="truncate text-sm text-black">
                            {trip.destination_address ||
                              "Não informado"}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <TripGain trip={trip} />
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge
                          status={trip.current_status}
                        />
                      </td>

                      <td className="px-6 py-4 text-right">
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

          <div className="divide-y divide-slate-100 lg:hidden">
            {loading ? (
              <LoadingState />
            ) : rows.length === 0 ? (
              <EmptyTrips />
            ) : (
              rows.map((trip) => (
                <TripMobileCard
                  key={trip.trip_request_id}
                  trip={trip}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}