"use client";

import {
  CalendarDays,
  CarFront,
  ChevronRight,
  Clock3,
  MapPin,
  Navigation,
  Wallet,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Trip = {
  id: string;
  ref_id: string;
  entrance: string;
  note: string;
  current_status: string;
  actual_fare: number;
  actual_distance?: number;
  payment_method: string;
  created_at: string;
};

export default function ViagensPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function carregarViagens() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/trips", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Erro ao carregar viagens");
        }

        const data = await res.json();

        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data.trips)
            ? data.trips
            : Array.isArray(data.data)
              ? data.data
              : [];

        setTrips(lista);
      } catch (error) {
        console.error(error);
        setError("Não foi possível carregar suas viagens.");
      } finally {
        setLoading(false);
      }
    }

    carregarViagens();
  }, []);

  const formatarData = (data: string) => {
    if (!data) return "Não informado";

    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatarValor = (valor: number) => {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const traduzirStatus = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluída";

      case "cancelled":
        return "Cancelada";

      case "pending":
        return "Pendente";

      case "accepted":
        return "Aceita";

      case "in_progress":
        return "Em andamento";

      default:
        return status || "Pendente";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
        return "border-emerald-100 bg-emerald-50 text-emerald-700";

      case "cancelled":
        return "border-red-100 bg-red-50 text-red-700";

      case "in_progress":
        return "border-blue-100 bg-blue-50 text-blue-700";

      default:
        return "border-amber-100 bg-amber-50 text-amber-700";
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-6">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-72 animate-pulse rounded bg-slate-100" />
          </div>

          <div className="grid gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="h-5 w-40 rounded bg-slate-200" />
                <div className="mt-5 h-4 w-full rounded bg-slate-100" />
                <div className="mt-3 h-4 w-3/4 rounded bg-slate-100" />
                <div className="mt-6 h-10 w-full rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[28px] border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>

          <h1 className="mt-5 text-xl font-bold text-[#073b70]">
            Não foi possível carregar
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-[#073b70] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0a4d8f]"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden px-3 py-5 text-[#073b70] sm:px-5 sm:py-7 md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1500px]">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#e8f7f3] px-3 py-1.5 text-xs font-bold text-[#149c8b]">
              <CarFront size={14} />
              Minhas viagens
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#073b70] sm:text-3xl md:text-4xl">
              Todas as viagens
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Consulte o histórico completo das suas viagens.
            </p>
          </div>

          <div className="flex w-fit items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Total
              </p>

              <p className="mt-0.5 text-xl font-bold text-[#073b70]">
                {trips.length}
              </p>
            </div>

            <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f7f3] text-[#149c8b]">
              <Navigation size={19} />
            </div>
          </div>
        </div>

        {trips.length === 0 ? (
          <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f7f3] text-[#149c8b]">
              <CarFront size={28} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#073b70]">
              Nenhuma viagem encontrada
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Quando você realizar uma viagem, ela aparecerá aqui.
            </p>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/viagens/${trip.id}`}
                className="group block min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#bfe4dc] hover:shadow-md sm:p-6"
              >
                <div className="flex min-w-0 items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f7f3] text-[#149c8b]">
                      <CarFront size={21} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Viagem
                      </p>

                      <h2 className="mt-0.5 truncate text-base font-bold text-[#073b70] sm:text-lg">
                        #{trip.ref_id}
                      </h2>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-xl border px-3 py-1.5 text-[11px] font-bold sm:text-xs ${getStatusClass(
                      trip.current_status
                    )}`}
                  >
                    {traduzirStatus(trip.current_status)}
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f7f3] text-[#149c8b]">
                      <MapPin size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#149c8b]">
                        Origem
                      </p>

                      <p className="mt-1 break-words text-sm font-semibold leading-5 text-[#073b70]">
                        {trip.entrance || "Não informado"}
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 h-px bg-slate-100" />

                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef3f7] text-[#073b70]">
                      <Navigation size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#073b70]">
                        Destino
                      </p>

                      <p className="mt-1 break-words text-sm font-semibold leading-5 text-[#073b70]">
                        {trip.note || "Não informado"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <CalendarDays size={14} />

                      <span className="text-[10px] font-semibold uppercase tracking-wide">
                        Data
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs font-bold text-[#073b70]">
                      {formatarData(trip.created_at)}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Wallet size={14} />

                      <span className="text-[10px] font-semibold uppercase tracking-wide">
                        Valor
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs font-bold text-[#073b70]">
                      {formatarValor(trip.actual_fare)}
                    </p>
                  </div>

                  <div className="hidden min-w-0 sm:block">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock3 size={14} />

                      <span className="text-[10px] font-semibold uppercase tracking-wide">
                        Distância
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs font-bold text-[#073b70]">
                      {trip.actual_distance || 0} km
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-semibold text-slate-400">
                    Ver detalhes da viagem
                  </span>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#073b70] text-white transition group-hover:bg-[#149c8b]">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}