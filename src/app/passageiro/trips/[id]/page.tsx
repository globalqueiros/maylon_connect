"use client";

import { useEffect, useState, use } from "react";
import {
  CarFront,
  CalendarDays,
  Wallet,
  Phone,
  Clock3,
  CheckCircle2,
  XCircle,
  Receipt,
  Navigation,
  MapPin,
} from "lucide-react";
import Link from "next/link";

type Trip = {
  id: string;
  ref_id: string;
  entrance: string;
  note: string;
  current_status: string;
  actual_fare: number;
  actual_distance?: number;
  payment_status?: string;
  created_at: string;
  passenger_name?: string;
  passenger_email?: string;
  passenger_phone?: string;
  driver_name?: string;
  driver_phone?: string;
  payment_method: string;
};

export default function DetalhesCorrida({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  const isCanceled = trip?.current_status === "cancelled";
  const isCompleted = trip?.current_status === "completed";

  const statusColor = isCanceled
    ? "bg-red-50 text-red-700 border-red-100"
    : isCompleted
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : "bg-amber-50 text-amber-700 border-amber-100";

  const statusLabel = isCanceled
    ? "Cancelada"
    : isCompleted
      ? "Concluída"
      : "Pendente";

  useEffect(() => {
    async function carregarCorrida() {
      try {
        const res = await fetch(`/api/trips/${id}`);

        if (!res.ok) {
          throw new Error("Erro ao carregar corrida");
        }

        const data = await res.json();
        setTrip(data.trip);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    carregarCorrida();
  }, [id]);

  const traduzirMetodoPagamento = (metodo: string) => {
    switch (metodo) {
      case "cash":
        return "Dinheiro";
      case "card":
        return "Cartão";
      default:
        return metodo || "Não informado";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex w-full max-w-[320px] flex-col items-center rounded-[28px] bg-white p-10 shadow-xl ring-1 ring-black/5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f7f4]">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#149C8B] border-t-transparent" />
          </div>
          <p className="mt-5 text-sm font-semibold text-gray-700">
            Carregando seu página
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Aguarde um momemento...
          </p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>

          <h2 className="text-2xl font-bold text-[#073b70]">
            Corrida não encontrada
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            Não foi possível localizar esta corrida.
          </p>

          <Link
            href="/viagens"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#073b70] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0a4d8f]"
          >
            Voltar para viagens
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen text-[#073b70]">
      <div className="mx-auto flex max-w-8xl flex-col gap-6">
        {/* Cabeçalho */}
        <div
          className={`relative overflow-hidden rounded-[28px] border p-6 text-white shadow-sm sm:p-8 ${
            isCanceled
              ? "border-red-700 bg-gradient-to-br from-red-700 to-red-900"
              : isCompleted
                ? "border-[#0f8f7d] bg-gradient-to-br from-[#073b70] via-[#075b70] to-[#149c8b]"
                : "border-amber-600 bg-gradient-to-br from-amber-500 to-amber-700"
          }`}
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <CarFront className="h-7 w-7 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Corrida #{trip.ref_id}
                </h1>

                <p className="mt-1 text-sm text-white/75">
                  Visualize informações completas da viagem.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:min-w-[170px]">
                <p className="text-xs font-medium text-white/70">
                  Valor total
                </p>

                <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                  {isCanceled
                    ? "R$ 0,00"
                    : `R$ ${Number(trip.actual_fare || 0).toFixed(2)}`}
                </h2>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:min-w-[170px]">
                <p className="text-xs font-medium text-white/70">
                  Distância
                </p>

                <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                  {isCanceled
                    ? "0 km"
                    : `${trip.actual_distance || 0} km`}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="flex flex-col gap-6 xl:col-span-2">
            {/* Status */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#073b70]">
                    Status da Corrida
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Informações atualizadas da viagem
                  </p>
                </div>

                <div
                  className={`inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold ${statusColor}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={16} />
                  ) : isCanceled ? (
                    <XCircle size={16} />
                  ) : (
                    <Clock3 size={16} />
                  )}

                  {statusLabel}
                </div>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-[#f8fafb] p-5 transition hover:border-[#d7ebe7] hover:shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f7f3] text-[#149c8b]">
                    <CalendarDays size={20} />
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Data da corrida
                  </p>

                  <h3 className="mt-2 text-sm font-bold text-[#073b70]">
                    {new Date(trip.created_at).toLocaleString("pt-BR")}
                  </h3>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-[#f8fafb] p-5 transition hover:border-[#d7ebe7] hover:shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Clock3 size={20} />
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Meio de pagamento
                  </p>

                  <div className="mt-2">
                    <span
                      className={`inline-flex capitalize rounded-lg px-3 py-1.5 text-sm font-bold ${
                        trip.payment_method === "cash"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {traduzirMetodoPagamento(trip.payment_method)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-[#f8fafb] p-5 transition hover:border-[#d7ebe7] hover:shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Wallet size={20} />
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Valor da corrida
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-[#073b70]">
                    {isCanceled
                      ? "R$ 0,00"
                      : `R$ ${Number(trip.actual_fare || 0).toFixed(2)}`}
                  </h3>
                </div>
              </div>
            </section>

            {/* Trajeto */}
            {!isCanceled && (
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f7f3] text-[#149c8b]">
                    <Navigation size={21} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#073b70]">
                      Trajeto da Corrida
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Origem e destino da viagem
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="relative">
                    <div className="absolute left-5 top-5 h-[calc(100%-40px)] w-px bg-slate-200" />

                    <div className="relative flex gap-4">
                      <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#149c8b] shadow-sm">
                        <MapPin size={16} className="text-white" />
                      </div>

                      <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#149c8b]">
                          Local de embarque
                        </p>

                        <h3 className="mt-2 break-words text-base font-bold leading-6 text-[#073b70]">
                          {trip.entrance || "Não informado"}
                        </h3>
                      </div>
                    </div>

                    <div className="relative mt-4 flex gap-4">
                      <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-red-500 shadow-sm">
                        <Navigation size={16} className="text-white" />
                      </div>

                      <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                          Destino final
                        </p>

                        <h3 className="mt-2 break-words text-base font-bold leading-6 text-[#073b70]">
                          {trip.note || "Não informado"}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <iframe
                      width="100%"
                      height="350"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(
                        trip.entrance || "São Paulo"
                      )}&output=embed`}
                      className="h-[280px] w-full sm:h-[350px]"
                    />
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Motorista */}
          <div className="flex flex-col gap-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f7] text-[#073b70]">
                  <CarFront size={21} />
                </div>

                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#073b70]">
                    Motorista
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Informações do condutor
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-2xl border border-slate-100 bg-[#f8fafb] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Nome do motorista
                  </p>

                  <h3 className="mt-2 text-lg font-bold text-[#073b70]">
                    {trip.driver_name || "Não informado"}
                  </h3>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-[#f8fafb] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Telefone
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f7f3] text-[#149c8b]">
                      <Phone size={17} />
                    </div>

                    <h3 className="text-base font-bold text-[#073b70]">
                      {trip.driver_phone || "Não informado"}
                    </h3>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-[#073b70] to-[#149c8b] p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                    Status do motorista
                  </p>

                  <h3 className="mt-2 text-xl font-bold">
                    Disponível
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-white/75">
                    Motorista vinculado à corrida e pronto para atendimento.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}