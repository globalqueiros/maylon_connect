"use client";

import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Wallet,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

type Trip = {
  id: string;
  ref_id: string;

  entrance?: string | null;
  note?: string | null;

  pickup_address?: string | null;
  destination_address?: string | null;

  origin_address?: string | null;
  destination?: string | null;

  pickup?: string | null;
  dropoff_address?: string | null;
  dropoff?: string | null;

  pickup_lat?: number | string | null;
  pickup_lng?: number | string | null;
  destination_lat?: number | string | null;
  destination_lng?: number | string | null;

  current_status: string;

  actual_fare: number;
  actual_distance?: number | null;

  payment_status?: string | null;
  created_at: string;

  passenger?: {
    id?: string | null;
    full_name?: string | null;
    phone?: string | null;
  } | null;

  driver?: {
    id?: string | null;
    full_name?: string | null;
    phone?: string | null;
  } | null;

  vehicle_model?: string | null;
  vehicle_color?: string | null;
  vehicle_plate?: string | null;

  payment_method?: string | null;
};

/**
 * Monta "lat,lng" a partir do que veio do banco, ou devolve vazio quando a
 * corrida não tem coordenada gravada.
 */
function montarCoordenada(
  lat?: number | string | null,
  lng?: number | string | null
): string {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return "";
  }

  if (latitude === 0 && longitude === 0) {
    return "";
  }

  return `${latitude},${longitude}`;
}

export default function DetalhesCorrida({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarCorrida() {
      try {
        setLoading(true);

        const res = await fetch(`/api/trips/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Erro ao carregar corrida");
        }

        const data = await res.json();

        setTrip(data.trip || data);
      } catch (error) {
        console.error("Erro ao carregar corrida:", error);
        setTrip(null);
      } finally {
        setLoading(false);
      }
    }

    carregarCorrida();
  }, [id]);

  /**
   * Normaliza o status da corrida
   */
  const statusNormalizado = String(trip?.current_status || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  /**
   * Verifica se foi cancelada pelo motorista
   */
  const isDriverCanceled =
    statusNormalizado === "driver_cancelled" ||
    statusNormalizado === "driver_canceled" ||
    statusNormalizado === "cancelled_by_driver" ||
    statusNormalizado === "canceled_by_driver" ||
    statusNormalizado === "cancelado_pelo_motorista" ||
    statusNormalizado === "cancelada_pelo_motorista" ||
    statusNormalizado.includes("driver_cancel");

  /**
   * Verifica se a corrida foi cancelada
   */
  const isTripCanceled =
    isDriverCanceled ||
    statusNormalizado === "cancelled" ||
    statusNormalizado === "canceled" ||
    statusNormalizado === "cancelado" ||
    statusNormalizado === "cancelada" ||
    statusNormalizado === "cancelled_by_passenger" ||
    statusNormalizado === "canceled_by_passenger" ||
    statusNormalizado === "cancelled_by_user" ||
    statusNormalizado === "canceled_by_user" ||
    statusNormalizado === "cancelled_by_system" ||
    statusNormalizado === "canceled_by_system" ||
    statusNormalizado.includes("cancel");

  /**
   * Verifica se foi concluída
   */
  const isCompleted =
    statusNormalizado === "completed" ||
    statusNormalizado === "complete" ||
    statusNormalizado === "concluida" ||
    statusNormalizado === "concluída" ||
    statusNormalizado === "success" ||
    statusNormalizado === "successful" ||
    statusNormalizado === "sucesso";

  /**
   * Cor do status
   */
  const statusColor = isTripCanceled
    ? "border-red-100 bg-red-50 text-red-700"
    : isCompleted
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : "border-amber-100 bg-amber-50 text-amber-700";

  /**
   * Texto do status
   */
  const statusLabel = isDriverCanceled
    ? "Cancelada pelo motorista"
    : isTripCanceled
      ? "Cancelada"
      : isCompleted
        ? "Concluída"
        : statusNormalizado === "in_progress"
          ? "Em andamento"
          : statusNormalizado === "accepted"
            ? "Aceita"
            : "Pendente";

  /**
   * Traduz método de pagamento
   */
  const traduzirMetodoPagamento = (metodo?: string | null) => {
    switch (String(metodo || "").toLowerCase()) {
      case "cash":
      case "dinheiro":
        return "Dinheiro";

      case "card":
      case "credit_card":
      case "debit_card":
      case "cartao":
      case "cartão":
        return "Cartão";

      case "pix":
        return "PIX";

      default:
        return metodo || "Não informado";
    }
  };

  /**
   * Formata valor em Real
   */
  const formatarValor = (valor?: number | null) => {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  /**
   * Formata data
   */
  const formatarData = (data?: string | null) => {
    if (!data) {
      return "Não informado";
    }

    const date = new Date(data);

    if (Number.isNaN(date.getTime())) {
      return "Não informado";
    }

    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Formata telefone brasileiro.
   *
   * Exemplos:
   *
   * +55 13 99999-9999
   * 5513999999999
   * 5513999999999
   *
   * Resultado:
   *
   * (13) 99999-9999
   */
  const formatarTelefone = (telefone?: string | null) => {
    if (!telefone) {
      return "Não informado";
    }

    let numero = String(telefone).replace(/\D/g, "");

    /**
     * Remove o código internacional do Brasil.
     */
    if (numero.startsWith("55") && numero.length >= 12) {
      numero = numero.substring(2);
    }

    /**
     * Celular brasileiro:
     * DDD + 9 dígitos
     */
    if (numero.length === 11) {
      return `(${numero.substring(0, 2)}) ${numero.substring(
        2,
        7
      )}-${numero.substring(7)}`;
    }

    /**
     * Telefone fixo:
     * DDD + 8 dígitos
     */
    if (numero.length === 10) {
      return `(${numero.substring(0, 2)}) ${numero.substring(
        2,
        6
      )}-${numero.substring(6)}`;
    }

    /**
     * Caso venha em formato diferente,
     * retorna somente os números.
     */
    return numero || "Não informado";
  };

  /**
   * Origem
   */
  const origem = useMemo(() => {
    if (!trip) return "";

    return (
      trip.pickup_address?.trim() ||
      trip.origin_address?.trim() ||
      trip.pickup?.trim() ||
      trip.entrance?.trim() ||
      ""
    );
  }, [trip]);

  /**
   * Destino
   */
  const destino = useMemo(() => {
    if (!trip) return "";

    return (
      trip.destination_address?.trim() ||
      trip.destination?.trim() ||
      trip.dropoff_address?.trim() ||
      trip.dropoff?.trim() ||
      trip.note?.trim() ||
      ""
    );
  }, [trip]);

  /**
   * Ponto de embarque e de destino no formato "lat,lng".
   *
   * A coordenada é mais confiável que o endereço escrito: o endereço pode vir
   * com nome de estabelecimento e o Google acaba marcando outro ponto.
   */
  const coordenadaOrigem = useMemo(
    () => montarCoordenada(trip?.pickup_lat, trip?.pickup_lng),
    [trip]
  );

  const coordenadaDestino = useMemo(
    () => montarCoordenada(trip?.destination_lat, trip?.destination_lng),
    [trip]
  );

  const pontoOrigem = coordenadaOrigem || origem;
  const pontoDestino = coordenadaDestino || destino;

  /**
   * URL do mapa
   */
  const mapaUrl = useMemo(() => {
    if (!pontoOrigem || !pontoDestino) {
      return "";
    }

    const chave = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!chave) {
      return "";
    }

    return (
      `https://www.google.com/maps/embed/v1/directions` +
      `?key=${chave}` +
      `&origin=${encodeURIComponent(pontoOrigem)}` +
      `&destination=${encodeURIComponent(pontoDestino)}` +
      `&mode=driving`
    );
  }, [pontoOrigem, pontoDestino]);

  /**
   * URL da rota no Google Maps
   */
  const googleMapsRouteUrl = useMemo(() => {
    if (!pontoOrigem || !pontoDestino) {
      return "https://www.google.com/maps";
    }

    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      pontoOrigem
    )}&destination=${encodeURIComponent(
      pontoDestino
    )}&travelmode=driving`;
  }, [pontoOrigem, pontoDestino]);

  /**
   * Tela de carregamento
   */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex w-full max-w-[320px] flex-col items-center rounded-[28px] bg-white p-8 shadow-xl ring-1 ring-black/5 sm:p-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f7f4]">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#149C8B] border-t-transparent" />
          </div>

          <p className="mt-5 text-center text-sm font-semibold text-gray-700">
            Carregando sua viagem
          </p>

          <p className="mt-1 text-center text-xs text-gray-400">
            Aguarde um momento...
          </p>
        </div>
      </div>
    );
  }

  /**
   * Viagem não encontrada
   */
  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>

          <h2 className="text-xl font-bold text-[#073b70] sm:text-2xl">
            Viagem não encontrada
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Não foi possível localizar esta viagem.
          </p>

          <Link
            href="/passageiro/viagens"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#073b70] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0a4d8f] sm:w-auto"
          >
            <ArrowLeft size={17} className="mr-2" />
            Voltar para viagens
          </Link>
        </div>
      </div>
    );
  }

  /**
   * Nome do motorista
   */
  const nomeMotorista =
    trip.driver?.full_name?.trim() || "Motorista não informado";

  /**
   * Telefone do motorista
   */
  const telefoneMotorista = formatarTelefone(trip.driver?.phone);

  /**
   * Verifica se existe motorista
   */
  const possuiMotorista =
    Boolean(trip.driver?.id) ||
    Boolean(trip.driver?.full_name) ||
    Boolean(trip.driver?.phone);

  return (
    <main className="min-h-screen overflow-x-hidden py-4 text-[#073b70]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 sm:gap-6">
        {/* HEADER */}
        <div
          className={`relative overflow-hidden rounded-[24px] border p-5 text-white shadow-sm sm:rounded-[28px] sm:p-7 md:p-8 ${
            isTripCanceled
              ? "border-red-700 bg-gradient-to-br from-red-700 to-red-900"
              : isCompleted
                ? "border-[#0f8f7d] bg-gradient-to-br from-[#073b70] via-[#075b70] to-[#149c8b]"
                : "border-amber-600 bg-gradient-to-br from-amber-500 to-amber-700"
          }`}
        >
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 sm:h-14 sm:w-14">
                {isTripCanceled ? (
                  <XCircle className="h-6 w-6 sm:h-7 sm:w-7" />
                ) : (
                  <CarFront className="h-6 w-6 sm:h-7 sm:w-7" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/70">
                  Viagem
                </p>

                <h1 className="mt-1 truncate text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                  #{trip.ref_id}
                </h1>

                <p className="mt-1 text-xs text-white/75 sm:text-sm">
                  Visualize informações completas da viagem.
                </p>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 lg:w-auto">
              <div className="min-w-0 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm sm:min-w-[170px] sm:p-4">
                <p className="text-[11px] font-medium text-white/70 sm:text-xs">
                  Valor total
                </p>

                <h2 className="mt-1 truncate text-lg font-bold sm:text-xl md:text-2xl">
                  {isTripCanceled
                    ? "R$ 0,00"
                    : formatarValor(trip.actual_fare)}
                </h2>
              </div>

              <div className="min-w-0 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm sm:min-w-[170px] sm:p-4">
                <p className="text-[11px] font-medium text-white/70 sm:text-xs">
                  Distância
                </p>

                <h2 className="mt-1 truncate text-lg font-bold sm:text-xl md:text-2xl">
                  {isTripCanceled
                    ? "0 km"
                    : `${trip.actual_distance || 0} km`}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:gap-6 xl:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-5 md:gap-6 xl:col-span-2">
            {/* STATUS */}
            <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-6 md:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight text-[#073b70] sm:text-xl">
                    Status da Corrida
                  </h2>

                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Informações atualizadas da viagem
                  </p>
                </div>

                <div
                  className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm ${statusColor}`}
                >
                  {isTripCanceled ? (
                    <XCircle size={16} />
                  ) : isCompleted ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Clock3 size={16} />
                  )}

                  {statusLabel}
                </div>
              </div>

              {isTripCanceled && (
                <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 sm:p-5">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <XCircle size={20} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-red-700 sm:text-base">
                        {isDriverCanceled
                          ? "Viagem cancelada pelo motorista"
                          : "Viagem cancelada"}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-red-600 sm:text-sm">
                        {isDriverCanceled
                          ? "O motorista cancelou esta viagem. Ele não está mais vinculado a esta corrida."
                          : "Esta viagem foi cancelada e não está mais em atendimento."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="min-w-0 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f7f3] text-[#149c8b]">
                    <CalendarDays size={20} />
                  </div>

                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
                    Data da corrida
                  </p>

                  <h3 className="mt-2 break-words text-sm font-bold leading-5 text-[#073b70]">
                    {formatarData(trip.created_at)}
                  </h3>
                </div>

                <div className="min-w-0 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Clock3 size={20} />
                  </div>

                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
                    Meio de pagamento
                  </p>

                  <div className="mt-2">
                    <span className="inline-flex max-w-full rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 sm:text-sm">
                      {traduzirMetodoPagamento(trip.payment_method)}
                    </span>
                  </div>
                </div>

                <div className="min-w-0 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Wallet size={20} />
                  </div>

                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
                    Valor da corrida
                  </p>

                  <h3 className="mt-2 truncate text-lg font-bold text-[#073b70] sm:text-xl">
                    {isTripCanceled
                      ? "R$ 0,00"
                      : formatarValor(trip.actual_fare)}
                  </h3>
                </div>
              </div>
            </section>

            {/* TRAJETO */}
            <section className="min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm sm:rounded-[28px]">
              <div className="p-5 sm:p-6 md:p-7">
                <div className="mb-5 flex items-center gap-3 sm:mb-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f7f3] text-[#149c8b] sm:h-11 sm:w-11">
                    <Navigation size={21} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight text-[#073b70] sm:text-xl">
                      Trajeto da Corrida
                    </h2>

                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      Origem e destino da viagem
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-5 sm:gap-6">
                  <div className="relative">
                    <div className="absolute left-5 top-5 h-[calc(100%-40px)] w-px bg-slate-200" />

                    {/* ORIGEM */}
                    <div className="relative flex min-w-0 gap-3 sm:gap-4">
                      <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#149c8b] shadow-sm">
                        <MapPin size={16} className="text-white" />
                      </div>

                      <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#149c8b] sm:text-xs">
                          Origem
                        </p>

                        <h3 className="mt-2 break-words text-sm font-bold leading-6 text-[#073b70] sm:text-base">
                          {origem || "Não informado"}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          Local de embarque
                        </p>
                      </div>
                    </div>

                    {/* DESTINO */}
                    <div className="relative mt-4 flex min-w-0 gap-3 sm:gap-4">
                      <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#073b70] shadow-sm">
                        <Navigation size={16} className="text-white" />
                      </div>

                      <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#073b70] sm:text-xs">
                          Destino
                        </p>

                        <h3 className="mt-2 break-words text-sm font-bold leading-6 text-[#073b70] sm:text-base">
                          {destino || "Não informado"}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          Destino final
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* MAPA */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                    {mapaUrl ? (
                      <iframe
                        title="Mapa com rota da corrida"
                        src={mapaUrl}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        className="block h-[300px] w-full border-0 sm:h-[380px] md:h-[430px] lg:h-[460px]"
                      />
                    ) : (
                      <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center sm:min-h-[380px]">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#149c8b] shadow-sm">
                          <MapPin size={25} />
                        </div>

                        <h3 className="mt-4 text-base font-bold text-[#073b70]">
                          Mapa indisponível
                        </h3>

                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                          {!origem && !destino
                            ? "A origem e o destino desta viagem não foram informados."
                            : !origem
                              ? "A origem desta viagem não foi informada."
                              : "O destino desta viagem não foi informado."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* GOOGLE MAPS */}
                  {pontoOrigem && pontoDestino && !isTripCanceled && (
                    <a
                      href={googleMapsRouteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#073b70] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0a4d8f] active:scale-[0.99]"
                    >
                      <Navigation size={17} />
                      Abrir rota no Google Maps
                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* COLUNA DIREITA */}
          <div className="flex min-w-0 flex-col gap-5 md:gap-6">
            {/* CANCELADA */}
            {isTripCanceled ? (
              <section className="rounded-[24px] border border-red-100 bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-6 md:p-7">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500">
                    <XCircle size={38} />
                  </div>

                  <span className="mt-5 rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-red-500">
                    {isDriverCanceled
                      ? "Cancelada pelo motorista"
                      : "Viagem cancelada"}
                  </span>

                  <h2 className="mt-3 text-xl font-bold text-[#073b70] sm:text-2xl">
                    Motorista não disponível
                  </h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    {isDriverCanceled
                      ? "O motorista cancelou esta viagem e não está mais vinculado a esta corrida."
                      : "Esta viagem foi cancelada e o motorista não está mais vinculado a esta corrida."}
                  </p>

                  <div className="mt-6 w-full rounded-2xl border border-red-100 bg-red-50 p-4">
                    <div className="flex items-center justify-center gap-2 text-red-600">
                      <XCircle size={17} />

                      <p className="text-xs font-bold sm:text-sm">
                        {isDriverCanceled
                          ? "A viagem foi cancelada pelo motorista."
                          : "A viagem foi cancelada."}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              /* MOTORISTA */
              <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-6 md:p-7">
                <div className="mb-5 flex items-center gap-3 sm:mb-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#073b70] sm:h-11 sm:w-11">
                    <CarFront size={21} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight text-[#073b70] sm:text-xl">
                      Seu motorista
                    </h2>

                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      Informações do condutor
                    </p>
                  </div>
                </div>

                {!possuiMotorista ? (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                        <Clock3 size={20} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-amber-700">
                          Motorista ainda não vinculado
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-amber-600">
                          Os dados do motorista aparecerão aqui quando um
                          motorista aceitar a corrida.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* NOME */}
                    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d9f8f3] to-[#eefbf9]">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-10 w-10 text-[#008f80]"
                        >
                          <path
                            d="M20 21a8 8 0 0 0-16 0"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />

                          <circle
                            cx="12"
                            cy="7"
                            r="4"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Motorista
                        </p>

                        <h3 className="mt-1 break-words text-lg font-bold text-[#073b70] sm:text-xl">
                          {nomeMotorista}
                        </h3>

                        <span className="mt-2 inline-flex rounded-lg bg-[#e8f7f3] px-3 py-1 text-xs font-semibold text-[#008f80]">
                          Motorista
                        </span>
                      </div>
                    </div>

                    {/* TELEFONE */}
                    <div className="rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Telefone
                      </p>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f7f3] text-[#149c8b]">
                          <Phone size={17} />
                        </div>

                        <p className="break-words text-sm font-bold text-[#073b70] sm:text-base">
                          {telefoneMotorista}
                        </p>
                      </div>
                    </div>

                    {/* STATUS */}
                    <div className="rounded-2xl bg-gradient-to-br from-[#073b70] to-[#149c8b] p-4 text-white sm:p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70 sm:text-xs">
                        Status do motorista
                      </p>

                      <h3 className="mt-2 text-lg font-bold sm:text-xl">
                        Vinculado à corrida
                      </h3>

                      <p className="mt-2 text-sm leading-relaxed text-white/75">
                        Motorista vinculado à corrida e responsável pelo
                        atendimento desta viagem.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* VEÍCULO */}
            {!isTripCanceled && (
              <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-6 md:p-7">
                <div className="mb-5 flex items-center gap-3 sm:mb-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f7f3] text-[#149c8b] sm:h-11 sm:w-11">
                    <CarFront size={21} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight text-[#073b70] sm:text-xl">
                      Veículo
                    </h2>

                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      Informações do veículo utilizado
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[#f8fafb] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Modelo
                    </p>

                    <p className="mt-2 break-words text-sm font-bold text-[#073b70]">
                      {trip.vehicle_model || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f8fafb] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Cor
                    </p>

                    <p className="mt-2 break-words text-sm font-bold text-[#073b70]">
                      {trip.vehicle_color || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f8fafb] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Placa
                    </p>

                    <p className="mt-2 break-words text-sm font-bold uppercase text-[#073b70]">
                      {trip.vehicle_plate || "-"}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* VOLTAR */}
            <Link
              href="/passageiro/viagens"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-[#073b70] shadow-sm transition hover:border-[#149c8b] hover:text-[#149c8b]"
            >
              <ArrowLeft size={17} />
              Voltar para todas as viagens
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}