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
import { use, useEffect, useMemo, useRef, useState } from "react";

type Passenger = {
  id?: string | null;
  full_name?: string | null;
  phone?: string | null;
};

type Driver = {
  id?: string | null;
  full_name?: string | null;
  phone?: string | null;
};

type VehicleModel = {
  id?: string | number | null;
  name?: string | null;
  image?: string | null;
};

type VehicleCategory = {
  id?: string | number | null;
  name?: string | null;
};

type Vehicle = {
  id?: string | number | null;
  licence_plate_number?: string | null;
  category_id?: string | number | null;
  category?: VehicleCategory | null;
  model?: VehicleModel | null;
};

type Trip = {
  id: string | number;
  ref_id: string;

  entrance?: string | null;
  note?: string | null;

  pickup_address?: string | null;
  destination_address?: string | null;

  pickup_lat?: number | string | null;
  pickup_lng?: number | string | null;

  destination_lat?: number | string | null;
  destination_lng?: number | string | null;

  encoded_polyline?: string | null;

  /*
   * IMPORTANTE:
   * O valor da corrida vem diretamente de estimated_fare.
   *
   * Exemplo:
   * banco = 6.23
   * frontend = R$ 6,23
   *
   * Nenhuma multiplicação é feita.
   */
  estimated_fare?: number | string | null;
  paid_fare?: number | string | null;

  actual_distance?: number | string | null;
  estimated_distance?: number | string | null;

  current_status?: string | null;
  payment_status?: string | null;
  payment_method?: string | null;

  created_at: string;

  passenger?: Passenger | null;
  driver?: Driver | null;
  vehicle?: Vehicle | null;

  vehicle_category?: string | null;
  vehicle_model?: string | null;
  vehicle_color?: string | null;
  vehicle_plate?: string | null;
  vehicle_model_image?: string | null;
};

/* =========================================================
   GOOGLE MAPS
========================================================= */

let googleMapsPromise: Promise<void> | null = null;

function carregarGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error(
        "Google Maps só pode ser carregado no navegador."
      )
    );
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const chave =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!chave) {
    return Promise.reject(
      new Error(
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY não está configurada."
      )
    );
  }

  googleMapsPromise = new Promise<void>(
    (resolve, reject) => {
      const scriptExistente =
        document.querySelector(
          'script[data-google-maps="true"]'
        ) as HTMLScriptElement | null;

      if (scriptExistente) {
        if (window.google?.maps) {
          resolve();
          return;
        }

        const verificar = () => {
          if (window.google?.maps) {
            resolve();
          }
        };

        const tratarErro = () => {
          googleMapsPromise = null;

          reject(
            new Error(
              "Erro ao carregar Google Maps."
            )
          );
        };

        scriptExistente.addEventListener(
          "load",
          verificar,
          { once: true }
        );

        scriptExistente.addEventListener(
          "error",
          tratarErro,
          { once: true }
        );

        return;
      }

      const script =
        document.createElement("script");

      script.src =
        "https://maps.googleapis.com/maps/api/js" +
        `?key=${encodeURIComponent(chave)}` +
        "&v=weekly";

      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = "true";

      script.onload = () => {
        if (window.google?.maps) {
          resolve();
        } else {
          googleMapsPromise = null;

          reject(
            new Error(
              "Google Maps carregou, mas a API não está disponível."
            )
          );
        }
      };

      script.onerror = () => {
        googleMapsPromise = null;

        reject(
          new Error(
            "Não foi possível carregar o Google Maps."
          )
        );
      };

      document.head.appendChild(script);
    }
  );

  return googleMapsPromise;
}

/* =========================================================
   HELPERS
========================================================= */

function montarCoordenada(
  lat?: number | string | null,
  lng?: number | string | null
): string {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return "";
  }

  if (latitude === 0 && longitude === 0) {
    return "";
  }

  return `${latitude},${longitude}`;
}

/*
 * NÃO CALCULA VALOR.
 *
 * Apenas verifica se existe um valor numérico
 * e formata para moeda brasileira.
 *
 * 6.23 -> R$ 6,23
 *
 * Não existe:
 * valor * 10
 * valor * 100
 * valor / 100
 * soma
 * tarifa x distância
 */
function formatarValor(
  valor?: number | string | null
): string {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "Não informado";
  }

  const texto = String(valor).trim();

  if (!texto) {
    return "Não informado";
  }

  const numero = Number(texto);

  if (!Number.isFinite(numero)) {
    return "Não informado";
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatarData(
  data?: string | null
): string {
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
}

function formatarTelefone(
  telefone?: string | null
): string {
  if (!telefone) {
    return "Não informado";
  }

  let numero = String(telefone).replace(
    /\D/g,
    ""
  );

  if (
    numero.startsWith("55") &&
    numero.length >= 12
  ) {
    numero = numero.substring(2);
  }

  if (numero.length === 11) {
    return `(${numero.substring(
      0,
      2
    )}) ${numero.substring(
      2,
      7
    )}-${numero.substring(7)}`;
  }

  if (numero.length === 10) {
    return `(${numero.substring(
      0,
      2
    )}) ${numero.substring(
      2,
      6
    )}-${numero.substring(6)}`;
  }

  return numero || "Não informado";
}

function formatarDistancia(
  distancia?: number | string | null
): string {
  if (
    distancia === null ||
    distancia === undefined
  ) {
    return "Não informado";
  }

  const texto = String(distancia).trim();

  if (!texto) {
    return "Não informado";
  }

  const numero = Number(texto);

  if (!Number.isFinite(numero)) {
    return "Não informado";
  }

  return `${numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}

function traduzirMetodoPagamento(
  metodo?: string | null
): string {
  switch (
  String(metodo || "")
    .trim()
    .toLowerCase()
  ) {
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
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function DetalhesCorrida({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [trip, setTrip] =
    useState<Trip | null>(null);

  const [loading, setLoading] =
    useState(true);

  const mapaRef =
    useRef<HTMLDivElement | null>(null);

  const directionsRendererRef =
    useRef<google.maps.DirectionsRenderer | null>(
      null
    );

  /* =========================================================
     CARREGAR VIAGEM
  ========================================================= */

  useEffect(() => {
    let ativo = true;

    async function carregarCorrida() {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/trips/${encodeURIComponent(id)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.error ||
            `Erro ao carregar corrida: ${res.status}`
          );
        }

        if (!ativo) {
          return;
        }

        setTrip(data?.trip ?? null);
      } catch (error) {
        console.error(
          "Erro ao carregar corrida:",
          error
        );

        if (ativo) {
          setTrip(null);
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregarCorrida();

    return () => {
      ativo = false;
    };
  }, [id]);

  /* =========================================================
     STATUS
  ========================================================= */

  const statusNormalizado = String(
    trip?.current_status || ""
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  const isDriverCanceled =
    statusNormalizado === "driver_cancelled" ||
    statusNormalizado === "driver_canceled" ||
    statusNormalizado === "cancelled_by_driver" ||
    statusNormalizado === "canceled_by_driver" ||
    statusNormalizado ===
    "cancelado_pelo_motorista" ||
    statusNormalizado ===
    "cancelada_pelo_motorista" ||
    statusNormalizado.includes("driver_cancel");

  const isTripCanceled =
    isDriverCanceled ||
    statusNormalizado === "cancelled" ||
    statusNormalizado === "canceled" ||
    statusNormalizado === "cancelado" ||
    statusNormalizado === "cancelada" ||
    statusNormalizado ===
    "cancelled_by_passenger" ||
    statusNormalizado ===
    "canceled_by_passenger" ||
    statusNormalizado === "cancelled_by_user" ||
    statusNormalizado === "canceled_by_user" ||
    statusNormalizado ===
    "cancelled_by_system" ||
    statusNormalizado ===
    "canceled_by_system" ||
    statusNormalizado.includes("cancel");

  const isCompleted =
    statusNormalizado === "completed" ||
    statusNormalizado === "complete" ||
    statusNormalizado === "concluida" ||
    statusNormalizado === "concluída" ||
    statusNormalizado === "success" ||
    statusNormalizado === "successful" ||
    statusNormalizado === "sucesso";

  const statusColor = isTripCanceled
    ? "border-red-100 bg-red-50 text-red-700"
    : isCompleted
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : "border-amber-100 bg-amber-50 text-amber-700";

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

  /* =========================================================
     ENDEREÇOS
  ========================================================= */

  const origem = useMemo(() => {
    return (
      trip?.pickup_address?.trim() ||
      trip?.entrance?.trim() ||
      ""
    );
  }, [trip]);

  const destino = useMemo(() => {
    return (
      trip?.destination_address?.trim() ||
      ""
    );
  }, [trip]);

  const coordenadaOrigem = useMemo(
    () =>
      montarCoordenada(
        trip?.pickup_lat,
        trip?.pickup_lng
      ),
    [
      trip?.pickup_lat,
      trip?.pickup_lng,
    ]
  );

  const coordenadaDestino = useMemo(
    () =>
      montarCoordenada(
        trip?.destination_lat,
        trip?.destination_lng
      ),
    [
      trip?.destination_lat,
      trip?.destination_lng,
    ]
  );

  const pontoOrigem =
    coordenadaOrigem || origem;

  const pontoDestino =
    coordenadaDestino || destino;

  const possuiPontosMapa =
    Boolean(
      pontoOrigem || pontoDestino
    );

  /* =========================================================
     VEÍCULO
  ========================================================= */

  const nomeVeiculo = useMemo(() => {
    return (
      trip?.vehicle?.model?.name?.trim() ||
      trip?.vehicle_model?.trim() ||
      "Não informado"
    );
  }, [
    trip?.vehicle?.model?.name,
    trip?.vehicle_model,
  ]);

  const placaVeiculo =
    trip?.vehicle?.licence_plate_number?.trim() ||
    trip?.vehicle_plate?.trim() ||
    "";

  const imagemVeiculo =
    trip?.vehicle?.model?.image ||
    trip?.vehicle_model_image ||
    null;

  const categoria = useMemo(() => {
    return (
      trip?.vehicle?.category?.name?.trim() ||
      trip?.vehicle_category?.trim() ||
      "Não informado"
    );
  }, [
    trip?.vehicle?.category?.name,
    trip?.vehicle_category,
  ]);

  /* =========================================================
     MOTORISTA
  ========================================================= */

  const nomeMotorista =
    trip?.driver?.full_name?.trim() ||
    "Motorista não informado";

  const telefoneMotorista =
    formatarTelefone(
      trip?.driver?.phone
    );

  const possuiMotorista =
    Boolean(trip?.driver?.id) ||
    Boolean(trip?.driver?.full_name) ||
    Boolean(trip?.driver?.phone);

  /* =========================================================
     VALOR DA CORRIDA
  ========================================================= */

  /*
   * IMPORTANTE:
   *
   * NÃO usa paid_fare.
   * NÃO faz fallback.
   * NÃO calcula.
   * NÃO multiplica.
   *
   * O valor vem DIRETAMENTE de:
   *
   * trip_requests.estimated_fare
   *
   * Banco:
   * 6.23
   *
   * Front:
   * R$ 6,23
   */
  const valorCorrida =
    trip?.estimated_fare;

  /* =========================================================
     DISTÂNCIA
  ========================================================= */

  /*
   * A distância também NÃO é calculada pelo Google Maps.
   *
   * Primeiro usa actual_distance.
   * Se não existir, usa estimated_distance.
   *
   * O Google Maps serve somente para desenhar a rota.
   */
  const distanciaBanco =
    trip?.actual_distance ??
    trip?.estimated_distance ??
    null;

  /* =========================================================
     GOOGLE MAPS
  ========================================================= */

  useEffect(() => {
    if (!trip || !mapaRef.current) {
      return;
    }

    if (!possuiPontosMapa) {
      return;
    }

    let cancelado = false;

    async function iniciarMapa() {
      try {
        await carregarGoogleMaps();

        if (
          cancelado ||
          !mapaRef.current ||
          !window.google?.maps
        ) {
          return;
        }

        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(
            null
          );

          directionsRendererRef.current = null;
        }

        let centroInicial = {
          lat: -23.9608,
          lng: -46.3336,
        };

        if (coordenadaOrigem) {
          const partes =
            coordenadaOrigem
              .split(",")
              .map(Number);

          if (
            partes.length === 2 &&
            Number.isFinite(partes[0]) &&
            Number.isFinite(partes[1])
          ) {
            centroInicial = {
              lat: partes[0],
              lng: partes[1],
            };
          }
        }

        const mapa =
          new window.google.maps.Map(
            mapaRef.current,
            {
              center: centroInicial,
              zoom: 14,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              zoomControl: true,
              clickableIcons: true,
            }
          );

        /*
         * IMPORTANTE:
         *
         * O Google Maps pode desenhar a rota,
         * mas NÃO usamos a distância retornada
         * pelo Google.
         */
        if (
          pontoOrigem &&
          pontoDestino
        ) {
          const directionsService =
            new window.google.maps.DirectionsService();

          const directionsRenderer =
            new window.google.maps.DirectionsRenderer({
              map: mapa,
              suppressMarkers: false,
              polylineOptions: {
                strokeColor:
                  isTripCanceled
                    ? "#dc2626"
                    : "#155EEF",
                strokeOpacity: 0.95,
                strokeWeight: 6,
              },
            });

          directionsRendererRef.current =
            directionsRenderer;

          directionsService.route(
            {
              origin: pontoOrigem,
              destination: pontoDestino,
              travelMode:
                window.google.maps.TravelMode
                  .DRIVING,
            },
            (
              resultado,
              status
            ) => {
              if (cancelado) {
                return;
              }

              if (
                status ===
                window.google.maps
                  .DirectionsStatus.OK &&
                resultado
              ) {
                directionsRenderer.setDirections(
                  resultado
                );

                /*
                 * NÃO pega:
                 *
                 * leg.distance.value
                 *
                 * Portanto o Google Maps não
                 * altera a distância mostrada.
                 */

                if (
                  resultado.routes[0]?.bounds
                ) {
                  mapa.fitBounds(
                    resultado.routes[0].bounds,
                    50
                  );
                }
              } else {
                console.error(
                  "Erro ao carregar rota:",
                  status
                );
              }
            }
          );

          return;
        }

        const coordenada =
          coordenadaOrigem ||
          coordenadaDestino;

        if (!coordenada) {
          return;
        }

        const partes =
          coordenada
            .split(",")
            .map(Number);

        if (
          partes.length !== 2 ||
          !Number.isFinite(partes[0]) ||
          !Number.isFinite(partes[1])
        ) {
          return;
        }

        const position = {
          lat: partes[0],
          lng: partes[1],
        };

        mapa.setCenter(position);
        mapa.setZoom(15);

        new window.google.maps.Marker({
          position,
          map: mapa,
          title: coordenadaOrigem
            ? "Origem da viagem"
            : "Destino da viagem",
        });
      } catch (error) {
        if (!cancelado) {
          console.error(
            "Erro ao inicializar Google Maps:",
            error
          );
        }
      }
    }

    iniciarMapa();

    return () => {
      cancelado = true;

      if (
        directionsRendererRef.current
      ) {
        directionsRendererRef.current.setMap(
          null
        );

        directionsRendererRef.current = null;
      }
    };
  }, [
    trip,
    possuiPontosMapa,
    pontoOrigem,
    pontoDestino,
    coordenadaOrigem,
    coordenadaDestino,
    isTripCanceled,
  ]);

  /* =========================================================
     URL GOOGLE MAPS
  ========================================================= */

  const googleMapsRouteUrl = useMemo(() => {
    if (
      !pontoOrigem &&
      !pontoDestino
    ) {
      return "https://www.google.com/maps";
    }

    if (
      pontoOrigem &&
      pontoDestino
    ) {
      return (
        "https://www.google.com/maps/dir/?api=1" +
        `&origin=${encodeURIComponent(
          pontoOrigem
        )}` +
        `&destination=${encodeURIComponent(
          pontoDestino
        )}` +
        "&travelmode=driving"
      );
    }

    const ponto =
      pontoOrigem ||
      pontoDestino ||
      "";

    return (
      "https://www.google.com/maps/search/?api=1" +
      `&query=${encodeURIComponent(ponto)}`
    );
  }, [
    pontoOrigem,
    pontoDestino,
  ]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex w-full max-w-[280px] flex-col items-center rounded-[24px] bg-white p-7 shadow-xl ring-1 ring-black/5 sm:max-w-[320px] sm:rounded-[28px] sm:p-8 md:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f7f4] sm:h-16 sm:w-16">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#149C8B] border-t-transparent sm:h-8 sm:w-8" />
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

  /* =========================================================
     NÃO ENCONTRADA
  ========================================================= */

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-sm sm:max-w-md sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <XCircle className="h-7 w-7 text-red-500" />
          </div>

          <h2 className="text-lg font-bold text-[#073b70] sm:text-xl">
            Viagem não encontrada
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Não foi possível localizar esta viagem.
          </p>

          <Link
            href="/passageiro/viagens"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#073b70] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0a4d8f] sm:w-auto"
          >
            <ArrowLeft
              size={17}
              className="mr-2"
            />
            Voltar para viagens
          </Link>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="min-h-screen overflow-x-hidden text-sm text-[#073b70]">
      <div className="mx-auto flex max-w-8xl flex-col gap-5 sm:gap-6 lg:gap-7 2xl:gap-8">

        {/* HEADER */}

        <div
          className={`relative overflow-hidden rounded-[22px] border p-5 text-white shadow-sm sm:rounded-[26px] sm:p-7 md:p-8 lg:rounded-[30px] lg:p-9 2xl:rounded-[34px] 2xl:p-10 ${isTripCanceled
              ? "border-red-700 bg-gradient-to-br from-red-700 to-red-900"
              : isCompleted
                ? "border-[#0f8f7d] bg-gradient-to-br from-[#073b70] via-[#075b70] to-[#149c8b]"
                : "border-amber-600 bg-gradient-to-br from-amber-500 to-amber-700"
            }`}
        >
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 sm:h-14 sm:w-14 2xl:h-16 2xl:w-16">
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

              {/* VALOR DA CORRIDA */}

              <div className="min-w-0 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm sm:min-w-[170px] sm:p-4">
                <p className="text-[11px] font-medium text-white/70 sm:text-xs">
                  Valor da corrida
                </p>

                <h2 className="mt-1 truncate text-lg font-bold sm:text-xl md:text-2xl">
                  {formatarValor(
                    trip.paid_fare
                  )}
                </h2>
              </div>

              {/* DISTÂNCIA DO BANCO */}

              <div className="min-w-0 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm sm:min-w-[170px] sm:p-4">
                <p className="text-[11px] font-medium text-white/70 sm:text-xs">
                  Distância
                </p>

                <h2 className="mt-1 truncate text-lg font-bold sm:text-xl md:text-2xl">
                  {formatarDistancia(
                    distanciaBanco
                  )}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* GRID PRINCIPAL */}

        <div className="grid grid-cols-1 gap-5 md:gap-6 lg:gap-7 xl:grid-cols-3 2xl:gap-8">

          {/* COLUNA ESQUERDA */}

          <div className="flex min-w-0 flex-col gap-5 md:gap-6 lg:gap-7 xl:col-span-2">

            {/* STATUS */}

            <section className="min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[26px] sm:p-6 md:p-7 lg:rounded-[30px] lg:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight text-[#073b70] sm:text-xl lg:text-2xl">
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
                          ? "O motorista cancelou esta viagem. A viagem permanece disponível para consulta."
                          : "Esta viagem foi cancelada, mas os dados registrados permanecem disponíveis para consulta."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                {/* DATA */}

                <div className="min-w-0 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f7f3] text-[#149c8b]">
                    <CalendarDays size={20} />
                  </div>

                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
                    Data da corrida
                  </p>

                  <h3 className="mt-2 break-words text-sm font-bold leading-5 text-[#073b70]">
                    {formatarData(
                      trip.created_at
                    )}
                  </h3>
                </div>

                {/* PAGAMENTO */}

                <div className="min-w-0 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Wallet size={20} />
                  </div>

                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
                    Meio de pagamento
                  </p>

                  <div className="mt-2">
                    <span className="inline-flex max-w-full rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 sm:text-sm">
                      {traduzirMetodoPagamento(
                        trip.payment_method
                      )}
                    </span>
                  </div>
                </div>

                {/* VALOR */}

                <div className="min-w-0 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Wallet size={20} />
                  </div>

                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
                    Valor da corrida
                  </p>

                  <h3 className="mt-2 truncate text-lg font-bold text-[#073b70] sm:text-xl">
                    {formatarValor(
                      valorCorrida
                    )}
                  </h3>
                </div>
              </div>
            </section>

            {/* TRAJETO */}

            <section className="min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm sm:rounded-[26px] lg:rounded-[30px]">
              <div className="p-5 sm:p-6 md:p-7 lg:p-8">
                <div className="mb-5 flex items-center gap-3 sm:mb-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f7f3] text-[#149c8b] sm:h-11 sm:w-11">
                    <Navigation size={21} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight text-[#073b70] sm:text-xl lg:text-2xl">
                      Trajeto da Corrida
                    </h2>

                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      Origem e destino da viagem
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-5 sm:gap-6">

                  {/* ORIGEM / DESTINO */}

                  <div className="relative">
                    <div className="absolute left-5 top-5 h-[calc(100%-40px)] w-px bg-slate-200" />

                    <div className="relative flex min-w-0 gap-3 sm:gap-4">
                      <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#149c8b] shadow-sm">
                        <MapPin
                          size={16}
                          className="text-white"
                        />
                      </div>

                      <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#149c8b] sm:text-xs">
                          Origem
                        </p>

                        <h3 className="mt-2 break-words text-sm font-bold leading-6 text-[#073b70] sm:text-base">
                          {origem ||
                            "Não informado"}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          Local de embarque
                        </p>
                      </div>
                    </div>

                    <div className="relative mt-4 flex min-w-0 gap-3 sm:gap-4">
                      <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#073b70] shadow-sm">
                        <Navigation
                          size={16}
                          className="text-white"
                        />
                      </div>

                      <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#073b70] sm:text-xs">
                          Destino
                        </p>

                        <h3 className="mt-2 break-words text-sm font-bold leading-6 text-[#073b70] sm:text-base">
                          {destino ||
                            "Não informado"}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          Destino final
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* MAPA */}

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                    {possuiPontosMapa ? (
                      <div
                        ref={mapaRef}
                        className="block h-[280px] w-full sm:h-[360px] md:h-[420px] lg:h-[460px] xl:h-[500px]"
                      />
                    ) : (
                      <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center sm:min-h-[360px]">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#149c8b] shadow-sm">
                          <MapPin size={25} />
                        </div>

                        <h3 className="mt-4 text-base font-bold text-[#073b70]">
                          Mapa indisponível
                        </h3>

                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                          {!origem &&
                            !destino
                            ? "A origem e o destino desta viagem não foram informados."
                            : !origem
                              ? "A origem desta viagem não foi informada."
                              : "O destino desta viagem não foi informado."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* GOOGLE MAPS */}

                  {possuiPontosMapa && (
                    <a
                      href={googleMapsRouteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition active:scale-[0.99] sm:w-auto ${isTripCanceled
                          ? "bg-red-700 hover:bg-red-800"
                          : "bg-[#073b70] hover:bg-[#0a4d8f]"
                        }`}
                    >
                      <Navigation size={17} />

                      {pontoOrigem &&
                        pontoDestino
                        ? "Abrir rota no Google Maps"
                        : "Abrir localização no Google Maps"}

                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* COLUNA DIREITA */}

          <div className="flex min-w-0 flex-col gap-5 md:gap-6 lg:gap-7">

            {/* CANCELAMENTO */}

            {isTripCanceled && (
              <section className="rounded-[22px] border border-red-100 bg-white p-5 shadow-sm sm:rounded-[26px] sm:p-6 md:p-7 lg:rounded-[30px]">
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
                    Viagem cancelada
                  </h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    {isDriverCanceled
                      ? "O motorista cancelou esta viagem. Os dados da corrida continuam disponíveis para consulta."
                      : "Esta viagem foi cancelada. Os dados registrados continuam disponíveis para consulta."}
                  </p>
                </div>
              </section>
            )}

            {/* MOTORISTA */}

            <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[26px] sm:p-6 md:p-7 lg:rounded-[30px]">
              <div className="mb-5 flex items-center gap-3 sm:mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3f7] text-[#073b70] sm:h-11 sm:w-11">
                  <CarFront size={21} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight text-[#073b70] sm:text-xl lg:text-2xl">
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
                        Motorista não informado
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-amber-600">
                        {isTripCanceled
                          ? "Não existem dados de motorista registrados para esta viagem."
                          : "Os dados do motorista aparecerão aqui quando um motorista aceitar a corrida."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">

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

                  <div
                    className={`rounded-2xl p-4 text-white sm:p-5 ${isTripCanceled
                        ? "bg-gradient-to-br from-red-700 to-red-900"
                        : "bg-gradient-to-br from-[#073b70] to-[#149c8b]"
                      }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70 sm:text-xs">
                      Status do motorista
                    </p>

                    <h3 className="mt-2 text-lg font-bold sm:text-xl">
                      {isTripCanceled
                        ? "Viagem cancelada"
                        : "Vinculado à corrida"}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-white/75">
                      {isTripCanceled
                        ? "O motorista estava vinculado a esta corrida, mas a viagem foi cancelada."
                        : "Motorista vinculado à corrida e responsável pelo atendimento desta viagem."}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* VEÍCULO */}

            <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[26px] sm:p-6 md:p-7 lg:rounded-[30px]">
              <div className="mb-5 flex items-center gap-3 sm:mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f7f3] text-[#149c8b] sm:h-11 sm:w-11">
                  <CarFront size={21} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight text-[#073b70] sm:text-xl lg:text-2xl">
                    Veículo
                  </h2>

                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Informações do veículo utilizado
                  </p>
                </div>
              </div>

              {imagemVeiculo && (
                <div className="mb-4 overflow-hidden rounded-2xl border border-slate-100">
                  <img
                    src={
                      imagemVeiculo
                        ? `https://auth.maylon.com.br/storage/app/public/vehicle/model/${imagemVeiculo}`
                        : "/images/vehicle-placeholder.png"
                    }
                    alt={nomeVeiculo || "Veículo"}
                    className="h-40 w-full object-contain p-0 sm:h-40"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                <div className="rounded-2xl bg-[#f8fafb] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Modelo
                  </p>

                  <p className="mt-2 break-words text-xs font-bold text-[#073b70]">
                    {nomeVeiculo}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f8fafb] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Placa
                  </p>

                  <p className="mt-2 break-words text-xs font-bold text-[#073b70]">
                    {placaVeiculo || "Não informado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f8fafb] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Categoria
                  </p>

                  <p className="mt-2 break-words text-xs font-bold text-[#073b70]">
                    {categoria}
                  </p>
                </div>

              </div>
            </section>

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
