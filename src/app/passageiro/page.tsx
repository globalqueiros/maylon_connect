"use client";

import {
  ArrowUpRight,
  CalendarDays,
  Car,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  MapPin,
  Plane,
  UserRound,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type User = {
  id: number;
  full_name: string;
  email: string;
};

type Banner = {
  id: number;
  image: string;
  title?: string;
};

type Trip = {
  id: number | string | null;
  trip_request_id: number | string | null;
  created_at: string | null;
  valor: number;
  origin: string | null;
  destination: string | null;
  status: string | null;
  pickup_city?: string | null;
  pickup_state?: string | null;
  destination_city?: string | null;
  destination_state?: string | null;
  [key: string]: unknown;
};

function parseDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(text)) {
    const [datePart, timePart] = text.split(" ");

    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second] = timePart.split(":").map(Number);

    const date = new Date(
      year,
      month - 1,
      day,
      hour || 0,
      minute || 0,
      second || 0
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameMonth(value: unknown, reference: Date): boolean {
  const date = parseDate(value);

  if (!date) {
    return false;
  }

  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

function parseMoney(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  let text = value
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .trim();

  if (!text) {
    return 0;
  }

  if (text.includes(",") && text.includes(".")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  }

  const numberValue = Number(text);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: unknown): string {
  const date = parseDate(value);

  if (!date) {
    return "—";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatTime(value: unknown): string {
  const date = parseDate(value);

  if (!date) {
    return "—";
  }

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeUser(response: unknown): User | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const root = response as Record<string, unknown>;

  let userData: Record<string, unknown> | null = null;

  if (root.user && typeof root.user === "object") {
    userData = root.user as Record<string, unknown>;
  } else if (root.usuario && typeof root.usuario === "object") {
    userData = root.usuario as Record<string, unknown>;
  } else if (
    root.data &&
    typeof root.data === "object" &&
    !Array.isArray(root.data)
  ) {
    const data = root.data as Record<string, unknown>;

    if (data.user && typeof data.user === "object") {
      userData = data.user as Record<string, unknown>;
    } else if (data.usuario && typeof data.usuario === "object") {
      userData = data.usuario as Record<string, unknown>;
    } else {
      userData = data;
    }
  } else {
    userData = root;
  }

  const fullName =
    userData.full_name ??
    userData.fullName ??
    userData.name ??
    userData.nome ??
    userData.nome_completo ??
    userData.nomeCompleto;

  if (typeof fullName !== "string" || !fullName.trim()) {
    return null;
  }

  const id =
    userData.id ??
    userData.usuario_id ??
    userData.user_id ??
    0;

  const email = userData.email;

  return {
    id: Number(id) || 0,
    full_name: fullName.trim(),
    email: typeof email === "string" ? email : "",
  };
}

function normalizeTrip(raw: unknown): Trip {
  if (!raw || typeof raw !== "object") {
    return {
      id: null,
      trip_request_id: null,
      created_at: null,
      valor: 0,
      origin: null,
      destination: null,
      status: null,
    };
  }

  const trip = raw as Record<string, unknown>;

  const id =
    trip.id ??
    trip.trip_request_id ??
    trip.tripRequestId ??
    null;

  const tripRequestId =
    trip.trip_request_id ??
    trip.tripRequestId ??
    trip.request_id ??
    trip.requestId ??
    trip.id ??
    null;

  const createdAt =
    trip.created_at ??
    trip.createdAt ??
    trip.data_criacao ??
    trip.dataCriacao ??
    trip.created ??
    null;

  const origin =
    trip.pickup_address ??
    trip.pickupAddress ??
    trip.origin ??
    trip.origem ??
    trip.endereco_origem ??
    trip.enderecoOrigem ??
    trip.pickup ??
    null;

  const destination =
    trip.destination_address ??
    trip.destinationAddress ??
    trip.dropoff_address ??
    trip.dropoffAddress ??
    trip.destination ??
    trip.destino ??
    trip.endereco_destino ??
    trip.enderecoDestino ??
    trip.dropoff ??
    null;

  const status =
    trip.current_status ??
    trip.currentStatus ??
    trip.status ??
    trip.trip_status ??
    trip.status_viagem ??
    trip.tripStatus ??
    null;

  const valor =
    trip.valor ??
    trip.actual_fare ??
    trip.actualFare ??
    trip.estimated_fare ??
    trip.estimatedFare ??
    trip.price ??
    trip.preco ??
    trip.valor_viagem ??
    trip.valorViagem ??
    0;

  return {
    ...trip,

    id:
      typeof id === "number" || typeof id === "string"
        ? id
        : null,

    trip_request_id:
      typeof tripRequestId === "number" ||
        typeof tripRequestId === "string"
        ? tripRequestId
        : null,

    created_at:
      createdAt !== null && createdAt !== undefined
        ? String(createdAt)
        : null,

    valor: parseMoney(valor),

    origin:
      typeof origin === "string"
        ? origin.trim()
        : null,

    destination:
      typeof destination === "string"
        ? destination.trim()
        : null,

    status:
      typeof status === "string"
        ? status.trim()
        : null,

    pickup_city:
      typeof trip.pickup_city === "string"
        ? trip.pickup_city
        : null,

    pickup_state:
      typeof trip.pickup_state === "string"
        ? trip.pickup_state
        : null,

    destination_city:
      typeof trip.destination_city === "string"
        ? trip.destination_city
        : null,

    destination_state:
      typeof trip.destination_state === "string"
        ? trip.destination_state
        : null,
  };
}

function extractUser(response: unknown): User | null {
  return normalizeUser(response);
}

function extractTrips(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const root = response as Record<string, unknown>;

  const possibleArrays = [
    root.trips,
    root.viagens,
    root.rows,
    root.results,
  ];

  for (const item of possibleArrays) {
    if (Array.isArray(item)) {
      return item;
    }
  }

  if (
    root.data &&
    typeof root.data === "object"
  ) {
    if (Array.isArray(root.data)) {
      return root.data;
    }

    const data = root.data as Record<string, unknown>;

    const nestedArrays = [
      data.trips,
      data.viagens,
      data.rows,
      data.results,
    ];

    for (const item of nestedArrays) {
      if (Array.isArray(item)) {
        return item;
      }
    }
  }

  return [];
}

function getTripTitle(trip: Trip): string {
  const status = String(trip.status ?? "")
    .trim()
    .toLowerCase();

  if (
    [
      "completed",
      "complete",
      "concluida",
      "concluído",
      "concluída",
      "realizada",
      "finished",
    ].includes(status)
  ) {
    return "Viagem realizada";
  }

  if (
    [
      "cancelled",
      "canceled",
      "cancelada",
      "cancelado",
    ].includes(status)
  ) {
    return "Viagem cancelada";
  }

  if (
    ["pending", "pendente"].includes(status)
  ) {
    return "Viagem pendente";
  }

  if (
    ["accepted", "aceita", "aceitado"].includes(status)
  ) {
    return "Viagem aceita";
  }

  if (
    [
      "started",
      "in_progress",
      "em_andamento",
      "em andamento",
    ].includes(status)
  ) {
    return "Viagem em andamento";
  }

  return "Viagem registrada";
}

function getTripLocation(trip: Trip): string {
  const origin = trip.origin?.trim();
  const destination = trip.destination?.trim();

  if (origin && destination) {
    return `${origin} → ${destination}`;
  }

  if (destination) {
    return destination;
  }

  if (origin) {
    return origin;
  }

  return "Local não informado";
}

function getTripStatusClass(status: string | null): string {
  const value = String(status ?? "")
    .trim()
    .toLowerCase();

  if (
    [
      "completed",
      "complete",
      "concluida",
      "concluído",
      "concluída",
      "realizada",
      "finished",
    ].includes(value)
  ) {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (
    [
      "cancelled",
      "canceled",
      "cancelada",
      "cancelado",
    ].includes(value)
  ) {
    return "bg-red-50 text-red-600 border-red-100";
  }

  if (
    [
      "pending",
      "pendente",
      "started",
      "in_progress",
      "em_andamento",
      "em andamento",
    ].includes(value)
  ) {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }

  return "bg-[#e9f8f5] text-[#078f80] border-[#cceee8]";
}

function getTripStatusLabel(status: string | null): string {
  const value = String(status ?? "")
    .trim()
    .toLowerCase();

  if (
    [
      "completed",
      "complete",
      "concluida",
      "concluído",
      "concluída",
      "realizada",
      "finished",
    ].includes(value)
  ) {
    return "Concluída";
  }

  if (
    [
      "cancelled",
      "canceled",
      "cancelada",
      "cancelado",
    ].includes(value)
  ) {
    return "Cancelada";
  }

  if (
    ["pending", "pendente"].includes(value)
  ) {
    return "Pendente";
  }

  if (
    [
      "started",
      "in_progress",
      "em_andamento",
      "em andamento",
    ].includes(value)
  ) {
    return "Em andamento";
  }

  if (
    ["accepted", "aceita", "aceitado"].includes(value)
  ) {
    return "Aceita";
  }

  return "Registrada";
}

export default function PassageiroDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [rows, setRows] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);

  const hoje = useMemo(() => new Date(), []);

  const hora = new Date().getHours();

  const texto =
    hora < 12
      ? "Bom dia ☀️"
      : hora < 18
        ? "Boa tarde 🌤️"
        : "Boa noite 🌙";

  const emoji =
    hora < 12
      ? "☀️"
      : hora < 18
        ? "🌤️"
        : "🌙";

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const usuario = extractUser(data);

        if (usuario) {
          setUser(usuario);
        }
      } catch (err) {
        console.error("Erro /api/me:", err);
      }
    }

    void loadUser();
  }, []);

  useEffect(() => {
    let ativo = true;

    async function loadTrips() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/trips", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const contentType =
          response.headers.get("content-type") || "";

        let data: unknown;

        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();

          console.error(
            "/api/trips não retornou JSON:",
            text
          );

          throw new Error(
            "A API de viagens não retornou JSON."
          );
        }

        if (!response.ok) {
          let mensagem =
            "Não foi possível carregar suas viagens.";

          if (
            data &&
            typeof data === "object"
          ) {
            const obj =
              data as Record<string, unknown>;

            if (
              typeof obj.message === "string"
            ) {
              mensagem = obj.message;
            } else if (
              typeof obj.error === "string"
            ) {
              mensagem = obj.error;
            }
          }

          throw new Error(
            `${mensagem} (${response.status})`
          );
        }

        const viagens = extractTrips(data);

        const normalizadas = viagens
          .map(normalizeTrip)
          .filter(
            (trip) =>
              trip.created_at !== null
          );

        if (ativo) {
          setRows(normalizadas);

          const usuario = extractUser(data);

          if (usuario) {
            setUser(usuario);
          }
        }
      } catch (err) {
        console.error(
          "Erro ao carregar viagens:",
          err
        );

        if (ativo) {
          setRows([]);

          setError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar viagens."
          );
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    void loadTrips();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    async function loadBanners() {
      try {
        const response = await fetch(
          "/api/banners",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.banners)
            ? data.banners
            : Array.isArray(data?.data)
              ? data.data
              : [];

        const validos = lista.filter(
          (banner: Banner) =>
            typeof banner?.image === "string" &&
            banner.image.trim().length > 0
        );

        setBanners(validos);
      } catch (err) {
        console.error(
          "Erro ao carregar banners:",
          err
        );
      }
    }

    void loadBanners();
  }, []);

  const viagensMes = useMemo(() => {
    return rows.filter((trip) =>
      isSameMonth(
        trip.created_at,
        hoje
      )
    );
  }, [rows, hoje]);

  const totalViagens = rows.length;

  const totalGastoMes = useMemo(() => {
    return viagensMes.reduce(
      (total, trip) =>
        total + parseMoney(trip.valor),
      0
    );
  }, [viagensMes]);

  const ultimasViagens = useMemo(() => {
    return [...rows]
      .sort((a, b) => {
        const dateA =
          parseDate(
            a.created_at
          )?.getTime() ?? 0;

        const dateB =
          parseDate(
            b.created_at
          )?.getTime() ?? 0;

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [rows]);

  const chartData = useMemo(() => {
    const grouped = new Map<string, number>();

    const inicio = new Date();

    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(
      inicio.getDate() - 6
    );

    for (
      let index = 0;
      index < 7;
      index++
    ) {
      const date = new Date(inicio);

      date.setDate(
        inicio.getDate() + index
      );

      const label =
        date.toLocaleDateString(
          "pt-BR",
          {
            day: "2-digit",
            month: "2-digit",
          }
        );

      grouped.set(label, 0);
    }

    rows.forEach((trip) => {
      const date = parseDate(
        trip.created_at
      );

      if (!date) {
        return;
      }

      if (
        date.getTime() <
        inicio.getTime()
      ) {
        return;
      }

      const label =
        date.toLocaleDateString(
          "pt-BR",
          {
            day: "2-digit",
            month: "2-digit",
          }
        );

      grouped.set(
        label,
        (grouped.get(label) ?? 0) + 1
      );
    });

    return Array.from(
      grouped.entries()
    ).map(
      ([label, value]) => ({
        label,
        value,
      })
    );
  }, [rows]);

  const maxChartValue = Math.max(
    ...chartData.map(
      (item) => item.value
    ),
    1
  );

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-8xl">

        {/* HEADER */}

        <section className="relative mt-3 overflow-hidden rounded-[32px] bg-white shadow-[0_20px_60px_rgba(6,43,79,0.12)]">

          <div className="relative min-h-[245px] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('/bg-fundo.png')",
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-br from-[#0a9d86]/95 via-[#0b9b85]/80 to-[#062b4f]/85" />

            <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-[#5be0c8]/10 blur-3xl" />

            <div className="relative z-10 px-6 py-8 sm:px-8 lg:px-12 lg:py-10">
              <p className="mt-7 text-sm font-medium text-white/85">
                {texto},
              </p>

              <h1 className="mt-1 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                {loading
                  ? "Carregando..."
                  : user?.full_name ||
                  "Bem-vindo à Maylon"}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                Acompanhe suas viagens, seus gastos
                e tudo o que acontece na sua conta
                Maylon.
              </p>
            </div>
          </div>

        </section>

        {/* ERRO */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-white px-5 py-4 text-sm text-red-600 shadow-sm">
            <strong>
              Erro ao carregar viagens:
            </strong>{" "}
            {error}
          </div>
        )}

        {banners.length > 0 &&
          banners[0]?.image && (
            <section className="mt-7 overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_15px_45px_rgba(6,43,79,0.1)]">

              <div className="relative min-h-[220px] overflow-hidden sm:min-h-[240px]">

                <img
                  src={banners[0].image}
                  alt={
                    banners[0].title ||
                    "Banner Maylon"
                  }
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0" />

                <div className="relative z-10 flex min-h-[250px] items-center px-7 py-8 sm:min-h-[260px] sm:px-10 lg:px-12">

                </div>
              </div>
            </section>
          )}

        <div className="h-2" />

        <section className="mt-1">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
                Sua movimentação
              </h2>

              <p className="mt-0 text-sm text-white">
                Uma visão rápida da sua atividade na Maylon.
              </p>
            </div>

            <Link
              href="/passageiro/viagens"
              className="inline-flex items-center gap-2 self-start rounded-xl border border-[#dce5e9] bg-white px-4 py-2.5 text-sm font-bold text-[#163a59] shadow-sm transition hover:border-[#08a89d] hover:text-[#08a89d] sm:self-auto"
            >
              Ver histórico
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

            {/* CARD 1 */}

            <div className="group relative overflow-hidden rounded-[26px] border border-[#e2ebee] bg-white p-6 shadow-[0_10px_35px_rgba(6,43,79,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(6,43,79,0.11)]">

              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#08a89d]/5 transition group-hover:scale-125" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e5f8f4] text-[#08a89d]">
                    <Car size={25} />
                  </div>

                  <span className="rounded-full bg-[#effaf8] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#078f80]">
                    Mês atual
                  </span>
                </div>

                <p className="mt-6 text-sm font-semibold text-[#71869a]">
                  Viagens no mês
                </p>

                <p className="mt-1 text-3xl font-black text-[#062b4f]">
                  {loading
                    ? "—"
                    : viagensMes.length}
                </p>

                <p className="mt-2 text-xs font-medium text-[#08a89d]">
                  Atividade deste mês
                </p>
              </div>
            </div>

            {/* CARD 2 */}

            <div className="group relative overflow-hidden rounded-[26px] border border-[#e2ebee] bg-white p-6 shadow-[0_10px_35px_rgba(6,43,79,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(6,43,79,0.11)]">

              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#0c75bd]/5 transition group-hover:scale-125" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#1676b7]">
                    <Plane size={25} />
                  </div>

                  <span className="rounded-full bg-[#f0f6fb] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1676b7]">
                    Histórico
                  </span>
                </div>

                <p className="mt-6 text-sm font-semibold text-[#71869a]">
                  Total de viagens
                </p>

                <p className="mt-1 text-3xl font-black text-[#062b4f]">
                  {loading
                    ? "—"
                    : totalViagens}
                </p>

                <p className="mt-2 text-xs font-medium text-[#1676b7]">
                  Todas as viagens registradas
                </p>
              </div>
            </div>

            {/* CARD 3 */}

            <div className="group relative overflow-hidden rounded-[26px] border border-[#e2ebee] bg-white p-6 shadow-[0_10px_35px_rgba(6,43,79,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(6,43,79,0.11)]">

              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#08a89d]/5 transition group-hover:scale-125" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e5f8f4] text-[#08a89d]">
                    <Wallet size={25} />
                  </div>

                  <span className="rounded-full bg-[#effaf8] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#078f80]">
                    Gastos
                  </span>
                </div>

                <p className="mt-6 text-sm font-semibold text-[#71869a]">
                  Gasto do mês
                </p>

                <p className="mt-1 text-3xl font-black text-[#062b4f]">
                  {loading
                    ? "—"
                    : formatCurrency(
                      totalGastoMes
                    )}
                </p>

                <p className="mt-2 text-xs font-medium text-[#08a89d]">
                  Total acumulado no mês
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTEÚDO PRINCIPAL */}

        <section className="mt-7 grid grid-cols-1 gap-7 xl:grid-cols-[1.45fr_0.95fr]">

          {/* GRÁFICO */}

          <div className="overflow-hidden rounded-[28px] border border-[#e2ebee] bg-white shadow-[0_12px_40px_rgba(6,43,79,0.07)]">

            <div className="flex flex-col gap-4 border-b border-[#edf1f4] px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">

              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e5f8f4] text-[#08a89d]">
                    <Car size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-[#062b4f]">
                      Atividade recente
                    </h2>

                    <p className="mt-0 text-xs text-[#71869a]">
                      Viagens dos últimos 7 dias
                    </p>
                  </div>
                </div>
              </div>

              <div className="self-start rounded-xl bg-[#eaf8f5] px-4 py-2 text-xs font-bold text-[#078f80] sm:self-auto">
                Últimos 7 dias
              </div>
            </div>

            <div className="p-6 lg:p-8">

              <div className="relative h-[310px] w-full">

                <div className="absolute inset-0 flex flex-col justify-between pb-10 pt-3">
                  {[4, 3, 2, 1, 0].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3"
                      >
                        <div className="h-px flex-1 bg-[#edf1f4]" />
                      </div>
                    )
                  )}
                </div>

                <div className="absolute inset-0 flex items-end gap-2 px-1 pb-10 pt-5 sm:gap-4">

                  {chartData.map(
                    (item, index) => {
                      const height =
                        item.value === 0
                          ? 3
                          : Math.max(
                            (item.value /
                              maxChartValue) *
                            82,
                            8
                          );

                      return (
                        <div
                          key={`${item.label}-${index}`}
                          className="group relative flex h-full flex-1 flex-col justify-end"
                        >

                          {item.value > 0 && (
                            <div
                              className="absolute left-1/2 z-20 flex -translate-x-1/2 -translate-y-2 items-center justify-center rounded-lg bg-[#062b4f] px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100"
                              style={{
                                bottom: `${height}%`,
                              }}
                            >
                              {item.value}
                            </div>
                          )}

                          <div
                            className="relative w-full overflow-hidden rounded-t-2xl bg-gradient-to-t from-[#07947e] via-[#12aa91] to-[#54d1ba] shadow-[0_8px_20px_rgba(8,168,157,0.18)] transition duration-300 group-hover:from-[#067e6d] group-hover:to-[#3bc0a8]"
                            style={{
                              height: `${height}%`,
                              opacity:
                                item.value === 0
                                  ? 0.18
                                  : 1,
                            }}
                          >
                            <div className="absolute inset-x-0 top-0 h-1 bg-white/30" />
                          </div>

                          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-[#71869a]">
                            {item.label}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>

                {!loading &&
                  rows.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-2xl border border-dashed border-[#dbe5e9] bg-[#fbfcfd] px-6 py-5 text-center">
                        <Car
                          size={28}
                          className="mx-auto text-[#9aafbd]"
                        />

                        <p className="mt-2 text-sm font-semibold text-[#506a82]">
                          Nenhuma viagem encontrada
                        </p>

                        <p className="mt-1 text-xs text-[#8ca0b2]">
                          Suas próximas viagens aparecerão aqui.
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* ATIVIDADES */}

          <div className="overflow-hidden rounded-[28px] border border-[#e2ebee] bg-white shadow-[0_12px_40px_rgba(6,43,79,0.07)]">

            <div className="flex items-center justify-between border-b border-[#edf1f4] px-6 py-6">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#08a89d]">
                  Histórico
                </p>

                <h2 className="mt-1 text-lg font-black text-[#062b4f]">
                  Últimas atividades
                </h2>

                <p className="mt-0 text-xs text-[#71869a]">
                  Suas viagens mais recentes
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6f7f4] text-[#08a89d]">
                <Clock3 size={20} />
              </div>
            </div>

            <div className="px-6">

              {loading && (
                <div className="py-12 text-center">
                  <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#dceceb] border-t-[#08a89d]" />

                  <p className="mt-3 text-xs font-medium text-[#71869a]">
                    Carregando atividades...
                  </p>
                </div>
              )}

              {!loading &&
                ultimasViagens.length === 0 && (
                  <div className="py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2f6f7] text-[#91a5b3]">
                      <CalendarDays size={23} />
                    </div>

                    <p className="mt-4 text-sm font-bold text-[#506a82]">
                      Nenhuma atividade recente
                    </p>

                    <p className="mt-1 text-xs text-[#8ca0b2]">
                      Você ainda não possui viagens.
                    </p>
                  </div>
                )}

              {!loading &&
                ultimasViagens.length > 0 &&
                ultimasViagens.map(
                  (trip, index) => (
                    <div
                      key={`${trip.trip_request_id ?? trip.id ?? "trip"}-${index}`}
                      className="group flex gap-3 border-b border-[#edf1f4] py-5 last:border-0"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e6f7f4] text-[#08a89d] transition group-hover:bg-[#08a89d] group-hover:text-white">
                        {index === 0 ? (
                          <CheckCircle2 size={19} />
                        ) : (
                          <CalendarDays size={19} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-bold text-[#163a59]">
                            {getTripTitle(trip)}
                          </p>

                          <span
                            className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold ${getTripStatusClass(
                              trip.status
                            )}`}
                          >
                            {getTripStatusLabel(
                              trip.status
                            )}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#71869a]">
                          <MapPin
                            size={12}
                            className="shrink-0"
                          />

                          <span className="truncate">
                            {getTripLocation(trip)}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-[10px] text-[#8ca0b2]">
                          <span>
                            {formatDate(
                              trip.created_at
                            )}
                          </span>

                          <span className="h-1 w-1 rounded-full bg-[#c5d1d8]" />

                          <span>
                            {formatTime(
                              trip.created_at
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
            </div>

            <div className="p-6 pt-3">
              <Link
                href="/passageiro/viagens"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#08a89d] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(8,168,157,0.2)] transition hover:-translate-y-0.5 hover:bg-[#078f80]"
              >
                Ver todas as viagens
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}