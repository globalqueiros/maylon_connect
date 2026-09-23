"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  Navigation,
  Phone,
  ReceiptText,
  Star,
  UserRound,
  XCircle,
} from "lucide-react";

type Viagem = Record<string, any>;
type Coordenadas = Record<string, any>;
type Taxa = Record<string, any>;
type Tarifa = Record<string, any>;

function normalizarStatus(status: unknown) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

function formatarValor(valor: unknown) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "R$ 0,00";
  }

  return `R$ ${numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatarNumero(valor: unknown, casas = 2) {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return String(valor);
  }

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function formatarData(data: unknown) {
  if (!data) {
    return "-";
  }

  const valor = String(data);
  const match = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  const date = new Date(valor);

  if (Number.isNaN(date.getTime())) {
    return valor;
  }

  return date.toLocaleDateString("pt-BR");
}

function formatarHora(data: unknown) {
  if (!data) {
    return "-";
  }

  const valor = String(data);

  if (/^\d{2}:\d{2}/.test(valor)) {
    return valor.substring(0, 5);
  }

  const date = new Date(valor);

  if (Number.isNaN(date.getTime())) {
    return valor;
  }

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function valorPrimeiro(
  objeto: Record<string, any> | null | undefined,
  nomes: string[],
  fallback: any = ""
) {
  if (!objeto) {
    return fallback;
  }

  for (const nome of nomes) {
    const valor = objeto[nome];

    if (valor !== undefined && valor !== null && valor !== "") {
      return valor;
    }
  }

  return fallback;
}

function obterObjeto(
  objeto: unknown
): Record<string, any> | null {
  if (
    objeto &&
    typeof objeto === "object" &&
    !Array.isArray(objeto)
  ) {
    return objeto as Record<string, any>;
  }

  return null;
}

function obterPrimeiroObjeto(...objetos: unknown[]) {
  for (const objeto of objetos) {
    const resultado = obterObjeto(objeto);

    if (resultado) {
      return resultado;
    }
  }

  return {};
}

function formatarTelefone(telefone: unknown) {
  if (!telefone) {
    return "";
  }

  return String(telefone).replace(/\s+/g, "");
}

export default function VisualizacaoViagem() {
  const params = useParams();

  const id = String(
    Array.isArray(params?.id)
      ? params.id[0]
      : params?.id || ""
  ).trim();

  const [viagem, setViagem] = useState<Viagem | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!id) {
      setErro("ID da viagem inválido.");
      setLoading(false);
      return;
    }

    let ativo = true;

    async function buscarViagem() {
      try {
        setLoading(true);
        setErro("");

        const response = await fetch(
          `/api/viagens/${encodeURIComponent(id)}`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const contentType =
          response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          await response.text();

          throw new Error(
            "A API não retornou JSON. Verifique a rota /api/viagens/[id]."
          );
        }

        const resultado = await response.json();

        if (!response.ok) {
          throw new Error(
            resultado?.error ||
            resultado?.message ||
            "Não foi possível carregar a viagem."
          );
        }

        const dados =
          resultado?.data ||
          resultado?.viagem ||
          resultado;

        if (
          !dados ||
          typeof dados !== "object" ||
          Array.isArray(dados)
        ) {
          throw new Error("Dados da viagem inválidos.");
        }

        if (ativo) {
          setViagem(dados);
        }
      } catch (error: unknown) {
        if (ativo) {
          setViagem(null);

          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os dados da viagem."
          );
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    buscarViagem();

    return () => {
      ativo = false;
    };
  }, [id]);

  function imprimirRecibo() {
    window.print();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-[280px] rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:max-w-sm sm:rounded-2xl sm:p-8">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600 sm:h-9 sm:w-9" />
          <div className="text-xs font-bold text-slate-600 sm:text-sm">
            Carregando viagem...
          </div>
        </div>
      </main>
    );
  }

  if (erro || !viagem) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-red-200 bg-white p-5 text-center shadow-sm sm:max-w-md sm:rounded-2xl sm:p-7">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 sm:h-14 sm:w-14">
            <XCircle size={24} className="sm:hidden" />
            <XCircle size={28} className="hidden sm:block" />
          </div>

          <h1 className="mt-4 text-lg font-black text-slate-900 sm:text-xl">
            Viagem não encontrada
          </h1>

          <div className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm">
            {erro || "Não foi possível localizar esta viagem."}
          </div>

          <Link
            href="/passageiro/viagens"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-teal-700 sm:px-5 sm:py-3 sm:text-sm"
          >
            <ArrowLeft size={17} />
            Voltar para viagens
          </Link>
        </div>
      </main>
    );
  }

  const coordenadas: Coordenadas = obterPrimeiroObjeto(
    Array.isArray(viagem.coordinates)
      ? viagem.coordinates[0]
      : viagem.coordinates,
    Array.isArray(viagem.coordenadas)
      ? viagem.coordenadas[0]
      : viagem.coordenadas
  );

  const taxas: Taxa = obterPrimeiroObjeto(
    Array.isArray(viagem.fees)
      ? viagem.fees[0]
      : viagem.fees,
    Array.isArray(viagem.taxas)
      ? viagem.taxas[0]
      : viagem.taxas
  );

  const tarifa: Tarifa = obterPrimeiroObjeto(
    viagem.fare,
    viagem.tarifa
  );

  const statusOriginal = valorPrimeiro(
    viagem,
    ["current_status", "status", "trip_status", "state"],
    "Sem status"
  );

  const status = normalizarStatus(statusOriginal);

  const cancelada = [
    "cancelada",
    "cancelado",
    "cancelled",
    "canceled",
    "cancel",
  ].includes(status);

  const finalizada = [
    "finalizada",
    "finalizado",
    "concluida",
    "concluido",
    "completed",
    "complete",
    "finished",
    "finish",
    "sucesso",
    "success",
  ].includes(status);

  const emAndamento = [
    "em andamento",
    "andamento",
    "in progress",
    "inprogress",
    "started",
    "iniciar",
    "iniciada",
    "iniciado",
    "accepted",
    "aceita",
    "aceito",
  ].includes(status);

  const origem = valorPrimeiro(
    viagem,
    [
      "pickup_address",
      "origem",
      "origin",
      "origin_address",
      "pickup_location",
      "start_address",
      "from",
    ],
    valorPrimeiro(
      coordenadas,
      [
        "pickup_address",
        "origin_address",
        "start_address",
        "origem",
      ],
      "-"
    )
  );

  const destino = valorPrimeiro(
    viagem,
    [
      "destination_address",
      "destino",
      "destination",
      "dropoff_address",
      "dropoff_location",
      "end_address",
      "to",
    ],
    valorPrimeiro(
      coordenadas,
      [
        "destination_address",
        "dropoff_address",
        "end_address",
        "destino",
      ],
      "-"
    )
  );

  const pickupCoordinates = valorPrimeiro(
    coordenadas,
    ["pickup_coordinates", "start_coordinates"],
    valorPrimeiro(
      viagem,
      ["pickup_coordinates", "start_coordinates"],
      ""
    )
  );

  const destinationCoordinates = valorPrimeiro(
    coordenadas,
    [
      "destination_coordinates",
      "drop_coordinates",
    ],
    valorPrimeiro(
      viagem,
      [
        "destination_coordinates",
        "drop_coordinates",
      ],
      ""
    )
  );

  const passageiroObjeto = obterPrimeiroObjeto(
    viagem.passageiro,
    viagem.passenger,
    viagem.customer
  );

  const passageiro = valorPrimeiro(
    passageiroObjeto || viagem,
    [
      "nome",
      "name",
      "full_name",
      "passageiro",
      "passenger",
      "passenger_name",
      "customer_name",
      "user_name",
    ],
    "Passageiro"
  );

  const valor = valorPrimeiro(
    viagem,
    [
      "actual_fare",
      "paid_fare",
      "due_amount",
      "total_amount",
      "amount",
      "valor",
      "price",
      "total",
      "estimated_fare",
    ],
    0
  );

  const data = valorPrimeiro(
    viagem,
    [
      "created_at",
      "data",
      "date",
      "trip_date",
      "requested_at",
    ],
    null
  );

  const horarioOriginal = valorPrimeiro(
    viagem,
    [
      "scheduled_at",
      "created_at",
      "horario",
      "time",
      "trip_time",
      "start_time",
    ],
    "-"
  );

  const horario =
    horarioOriginal !== "-"
      ? formatarHora(horarioOriginal)
      : "-";

  const pagamento = valorPrimeiro(
    viagem,
    [
      "payment_method",
      "pagamento",
      "payment",
      "payment_type",
      "method",
    ],
    "-"
  );

  const pagamentoStatus = valorPrimeiro(
    viagem,
    [
      "payment_status",
      "pagamento_status",
      "status_pagamento",
    ],
    "-"
  );

  const distancia = valorPrimeiro(
    viagem,
    [
      "actual_distance",
      "estimated_distance",
      "distancia",
      "distance",
      "trip_distance",
      "distance_km",
    ],
    "-"
  );

  const duracao = valorPrimeiro(
    viagem,
    [
      "duration",
      "trip_duration",
      "duration_minutes",
      "duracao",
    ],
    "-"
  );

  const taxaCancelamento = valorPrimeiro(
    taxas,
    ["cancellation_fee"],
    valorPrimeiro(
      viagem,
      ["cancellation_fee"],
      0
    )
  );

  const taxaRetorno = valorPrimeiro(
    taxas,
    ["return_fee"],
    valorPrimeiro(
      viagem,
      ["return_fee"],
      0
    )
  );

  const taxaEspera = valorPrimeiro(
    taxas,
    ["waiting_fee"],
    0
  );

  const taxaOciosidade = valorPrimeiro(
    taxas,
    ["idle_fee"],
    0
  );

  const taxaAtraso = valorPrimeiro(
    taxas,
    ["delay_fee"],
    0
  );

  const imposto = valorPrimeiro(
    taxas,
    ["vat_tax"],
    0
  );

  const gorjeta = valorPrimeiro(
    taxas,
    ["tips"],
    valorPrimeiro(
      viagem,
      ["tips"],
      0
    )
  );

  const comissao = valorPrimeiro(
    taxas,
    ["admin_commission"],
    0
  );

  const motoristaObjeto = obterPrimeiroObjeto(
    viagem.motorista,
    viagem.driver
  );

  const motoristaNome = valorPrimeiro(
    motoristaObjeto || viagem,
    [
      "nome",
      "name",
      "full_name",
      "motorista_nome",
      "driver_name",
      "driver_full_name",
    ],
    "Motorista não informado"
  );

  const motoristaFoto = valorPrimeiro(
    motoristaObjeto || viagem,
    [
      "foto",
      "photo",
      "avatar",
      "image",
      "profile_photo",
      "profile_image",
      "motorista_foto",
      "driver_photo",
      "driver_avatar",
    ],
    ""
  );

  const motoristaAvaliacao = valorPrimeiro(
    motoristaObjeto || viagem,
    [
      "avaliacao",
      "rating",
      "driver_rating",
      "motorista_avaliacao",
    ],
    null
  );

  const motoristaViagens = valorPrimeiro(
    motoristaObjeto || viagem,
    [
      "viagens",
      "trips",
      "total_trips",
      "driver_trips",
      "motorista_viagens",
    ],
    null
  );

  const motoristaTelefone = valorPrimeiro(
    motoristaObjeto || viagem,
    [
      "telefone",
      "phone",
      "phone_number",
      "driver_phone",
      "motorista_telefone",
    ],
    ""
  );

  const categoria =
    valorPrimeiro(
      motoristaObjeto,
      [
        "categoria",
        "category",
        "service_type",
        "ride_type",
      ],
      ""
    ) ||
    valorPrimeiro(
      viagem,
      [
        "categoria",
        "category",
        "service_type",
        "ride_request_type",
        "type",
      ],
      "-"
    );

  const veiculoObjeto = obterPrimeiroObjeto(
    viagem.vehicle,
    viagem.veiculo
  );

  const veiculo =
    valorPrimeiro(
      veiculoObjeto,
      [
        "model",
        "modelo",
        "vehicle_model",
        "car_model",
        "name",
      ],
      ""
    ) ||
    valorPrimeiro(
      motoristaObjeto,
      [
        "veiculo",
        "vehicle",
        "vehicle_model",
        "car_model",
        "model",
      ],
      "-"
    );

  const cor =
    valorPrimeiro(
      veiculoObjeto,
      [
        "color",
        "cor",
        "vehicle_color",
        "car_color",
      ],
      ""
    ) ||
    valorPrimeiro(
      motoristaObjeto,
      [
        "cor",
        "color",
        "vehicle_color",
        "car_color",
      ],
      "-"
    );

  const placa =
    valorPrimeiro(
      veiculoObjeto,
      [
        "plate",
        "placa",
        "license_plate",
        "vehicle_plate",
      ],
      ""
    ) ||
    valorPrimeiro(
      motoristaObjeto,
      [
        "placa",
        "plate",
        "license_plate",
        "vehicle_plate",
      ],
      "-"
    );

  const motivoCancelamento = valorPrimeiro(
    viagem,
    [
      "trip_cancellation_reason",
      "cancellation_reason",
      "cancel_reason",
      "motivo_cancelamento",
      "motivoCancelamento",
      "reason",
    ],
    "A viagem foi cancelada."
  );

  const statusConfig = cancelada
    ? {
      header:
        "from-red-700 via-red-700 to-red-800",
      badge:
        "border-red-200 bg-red-50 text-red-700",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      text: "text-red-700",
      title: "text-red-800",
      border: "border-red-200",
      soft: "bg-red-50",
      icon: <XCircle size={16} />,
    }
    : finalizada
      ? {
        header:
          "from-emerald-700 via-emerald-700 to-emerald-800",
        badge:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        text: "text-emerald-700",
        title: "text-emerald-800",
        border: "border-emerald-200",
        soft: "bg-emerald-50",
        icon: <CheckCircle2 size={16} />,
      }
      : emAndamento
        ? {
          header:
            "from-amber-600 via-orange-600 to-orange-700",
          badge:
            "border-amber-200 bg-amber-50 text-amber-700",
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
          text: "text-amber-700",
          title: "text-amber-800",
          border: "border-amber-200",
          soft: "bg-amber-50",
          icon: <Clock3 size={16} />,
        }
        : {
          header:
            "from-slate-700 via-slate-700 to-slate-800",
          badge:
            "border-slate-200 bg-slate-50 text-slate-700",
          iconBg: "bg-slate-100",
          iconColor: "text-slate-600",
          text: "text-slate-700",
          title: "text-slate-800",
          border: "border-slate-200",
          soft: "bg-slate-50",
          icon: <Clock3 size={16} />,
        };

  const temDetalhamentoFinanceiro =
    Number(taxaCancelamento) > 0 ||
    Number(taxaRetorno) > 0 ||
    Number(taxaEspera) > 0 ||
    Number(taxaOciosidade) > 0 ||
    Number(taxaAtraso) > 0 ||
    Number(imposto) > 0 ||
    Number(gorjeta) > 0 ||
    Number(comissao) > 0;

  return (
    <main className="min-h-screen min-w-0">
      <div className="mx-auto w-full min-w-0 max-w-8xl px-0 sm:px-0 md:px-2 lg:px-0 2xl:max-w-8xl">
        <div className="mb-4 flex flex-col gap-2.5 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 print:hidden">
          <Link
            href="/passageiro/viagens"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <ArrowLeft size={17} />
            Voltar para viagens
          </Link>
          <button
            type="button"
            onClick={imprimirRecibo}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#087f73] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#066b61] sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <ReceiptText size={17} />
            Imprimir recibo
          </button>
        </div>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-[26px] print:rounded-none print:border-0 print:shadow-none">
          <header
            className={`bg-gradient-to-r px-4 py-5 text-white sm:px-6 sm:py-6 md:px-8 xl:px-10 print:px-5 print:py-4 ${statusConfig.header}`}
          >
            <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-white/75 sm:text-xs">
                  <ReceiptText size={15} />
                  Histórico de viagem
                </div>

                <h1 className="text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
                  Viagem #{viagem.id || id}
                </h1>

                <div className="mt-1 text-xs text-white/70 sm:text-sm">
                  Detalhes completos da sua viagem
                </div>
              </div>

              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-black sm:px-4 sm:py-2 sm:text-sm ${statusConfig.badge}`}
              >
                {statusConfig.icon}
                {String(statusOriginal)}
              </div>
            </div>
          </header>

          <div className="px-4 pt-4 sm:px-5 sm:pt-5 md:px-7">
            {cancelada && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 sm:rounded-2xl sm:p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 sm:h-10 sm:w-10">
                  <XCircle size={19} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-red-800 sm:text-base">
                    Viagem cancelada
                  </h3>
                  <div className="mt-1 text-xs text-red-700 sm:text-sm">
                    {String(motivoCancelamento)}
                  </div>
                </div>
              </div>
            )}

            {finalizada && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 sm:rounded-2xl sm:p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 sm:h-10 sm:w-10">
                  <CheckCircle2 size={19} />
                </div>

                <div>
                  <h3 className="text-sm font-black text-emerald-800 sm:text-base">
                    Viagem finalizada
                  </h3>

                  <div className="mt-1 text-xs text-emerald-700 sm:text-sm">
                    Viagem concluída com sucesso.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-5 md:p-7">
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
              <div className="min-w-0 space-y-4 sm:space-y-5">
                <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5 print:shadow-none">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-600 sm:text-[10px]">
                        Motorista
                      </div>
                      <h2 className="mt-1 text-base font-black text-slate-900 sm:text-lg">
                        Seu motorista
                      </h2>
                    </div>
                    {motoristaAvaliacao !== null &&
                      motoristaAvaliacao !== "" && (
                        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-600 sm:px-3 sm:py-1.5 sm:text-sm">
                          <Star
                            size={15}
                            fill="currentColor"
                          />
                          {Number(
                            motoristaAvaliacao
                          ).toFixed(1)}
                        </div>
                      )}
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                    <div className="relative shrink-0">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal-100 to-slate-100 ring-4 ring-white shadow-sm sm:h-20 sm:w-20">
                        {motoristaFoto ? (
                          <img
                            src={String(motoristaFoto)}
                            alt={String(motoristaNome)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound
                            size={28}
                            className="text-teal-700 sm:hidden"
                          />
                        )}
                        {!motoristaFoto && (
                          <UserRound
                            size={34}
                            className="hidden text-teal-700 sm:block"
                          />
                        )}
                      </div>

                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 sm:h-6 sm:w-6">
                        <CheckCircle2
                          size={12}
                          className="text-white sm:hidden"
                        />
                        <CheckCircle2
                          size={14}
                          className="hidden text-white sm:block"
                        />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-black text-slate-900 sm:text-xl">
                        {String(motoristaNome)}
                      </h3>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 sm:text-sm">
                        {motoristaAvaliacao !== null &&
                          motoristaAvaliacao !== "" && (
                            <span className="flex items-center gap-1">
                              <Star
                                size={14}
                                className="text-amber-500"
                                fill="currentColor"
                              />
                              {Number(
                                motoristaAvaliacao
                              ).toFixed(1)}
                            </span>
                          )}

                        {motoristaViagens !== null &&
                          motoristaViagens !== "" && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-slate-300" />
                              <span>
                                {Number(
                                  motoristaViagens
                                ).toLocaleString(
                                  "pt-BR"
                                )}{" "}
                                viagens
                              </span>
                            </>
                          )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                        {categoria !== "-" && (
                          <span className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-[11px] font-bold text-teal-700 sm:px-3 sm:text-xs">
                            {String(categoria)}
                          </span>
                        )}

                        {motoristaTelefone && (
                          <a
                            href={`tel:${formatarTelefone(
                              motoristaTelefone
                            )}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-teal-200 hover:text-teal-700 sm:px-3 sm:text-xs print:hidden"
                          >
                            <Phone size={13} />
                            Contatar
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5 print:shadow-none">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 sm:h-10 sm:w-10">
                      <CarFront size={19} />
                    </div>

                    <div>
                      <h2 className="text-sm font-black text-slate-900 sm:text-base">
                        Veículo
                      </h2>

                      <div className="text-[11px] text-slate-500 sm:text-xs">
                        Informações do veículo utilizado
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                        Modelo
                      </div>

                      <div className="mt-1 text-sm font-black text-slate-800 sm:text-base">
                        {String(veiculo)}
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                        Cor
                      </div>

                      <div className="mt-1 text-sm font-black text-slate-800 sm:text-base">
                        {String(cor)}
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                        Placa
                      </div>

                      <div className="mt-1 text-sm font-black tracking-wide text-slate-800 sm:text-base">
                        {String(placa)}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5 print:shadow-none">
                  <div className="mb-4 flex items-center gap-3 sm:mb-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 sm:h-10 sm:w-10">
                      <Navigation size={19} />
                    </div>

                    <div>
                      <h2 className="text-sm font-black text-slate-900 sm:text-base">
                        Rota da viagem
                      </h2>

                      <div className="text-[11px] text-slate-500 sm:text-xs">
                        Percurso registrado
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute bottom-8 left-4 top-8 border-l border-dashed border-slate-300" />

                    <div className="relative flex gap-3 sm:gap-4">
                      <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white ring-4 ring-white sm:h-8 sm:w-8">
                        <MapPin size={15} />
                      </div>

                      <div className="min-w-0 pb-6 sm:pb-7">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Origem
                        </div>

                        <div className="mt-1 text-sm font-bold leading-5 text-slate-800">
                          {String(origem)}
                        </div>

                        {pickupCoordinates && (
                          <div className="mt-1 text-[10px] text-slate-400 sm:text-[11px]">
                            Coordenadas:{" "}
                            {String(pickupCoordinates)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative flex gap-3 sm:gap-4">
                      <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white ring-4 ring-white sm:h-8 sm:w-8">
                        <MapPin size={15} />
                      </div>

                      <div className="min-w-0">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Destino
                        </div>

                        <div className="mt-1 text-sm font-bold leading-5 text-slate-800">
                          {String(destino)}
                        </div>

                        {destinationCoordinates && (
                          <div className="mt-1 text-[10px] text-slate-400 sm:text-[11px]">
                            Coordenadas:{" "}
                            {String(
                              destinationCoordinates
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:rounded-2xl sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:h-9 sm:w-9">
                        <CalendarDays size={17} />
                      </div>

                      <div>
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Data
                        </div>

                        <div className="mt-1 text-sm font-black text-slate-800">
                          {formatarData(data)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:rounded-2xl sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:h-9 sm:w-9">
                        <Clock3 size={17} />
                      </div>

                      <div>
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Horário
                        </div>

                        <div className="mt-1 text-sm font-black text-slate-800">
                          {horario}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:rounded-2xl sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:h-9 sm:w-9">
                        <Navigation size={17} />
                      </div>

                      <div>
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Distância
                        </div>

                        <div className="mt-1 text-sm font-black text-slate-800">
                          {distancia !== "-"
                            ? `${formatarNumero(
                              distancia,
                              2
                            )} km`
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {temDetalhamentoFinanceiro && (
                  <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5 print:shadow-none">
                    <div className="mb-4 flex items-center gap-3 sm:mb-5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 sm:h-10 sm:w-10">
                        <ReceiptText size={19} />
                      </div>

                      <div>
                        <h2 className="text-sm font-black text-slate-900 sm:text-base">
                          Detalhamento financeiro
                        </h2>

                        <div className="text-[11px] text-slate-500 sm:text-xs">
                          Taxas e valores adicionais da viagem
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {Number(taxaCancelamento) > 0 && (
                        <div className="flex justify-between gap-4 text-xs sm:text-sm">
                          <span className="text-slate-500">
                            Taxa de cancelamento
                          </span>

                          <span className="font-black text-slate-800">
                            {formatarValor(
                              taxaCancelamento
                            )}
                          </span>
                        </div>
                      )}

                      {Number(taxaRetorno) > 0 && (
                        <div className="flex justify-between gap-4 text-xs sm:text-sm">
                          <span className="text-slate-500">
                            Taxa de retorno
                          </span>

                          <span className="font-black text-slate-800">
                            {formatarValor(taxaRetorno)}
                          </span>
                        </div>
                      )}

                      {Number(taxaEspera) > 0 && (
                        <div className="flex justify-between gap-4 text-xs sm:text-sm">
                          <span className="text-slate-500">
                            Taxa de espera
                          </span>

                          <span className="font-black text-slate-800">
                            {formatarValor(taxaEspera)}
                          </span>
                        </div>
                      )}

                      {Number(taxaOciosidade) > 0 && (
                        <div className="flex justify-between gap-4 text-xs sm:text-sm">
                          <span className="text-slate-500">
                            Taxa de ociosidade
                          </span>

                          <span className="font-black text-slate-800">
                            {formatarValor(
                              taxaOciosidade
                            )}
                          </span>
                        </div>
                      )}

                      {Number(taxaAtraso) > 0 && (
                        <div className="flex justify-between gap-4 text-xs sm:text-sm">
                          <span className="text-slate-500">
                            Taxa de atraso
                          </span>

                          <span className="font-black text-slate-800">
                            {formatarValor(taxaAtraso)}
                          </span>
                        </div>
                      )}

                      {Number(imposto) > 0 && (
                        <div className="flex justify-between gap-4 text-xs sm:text-sm">
                          <span className="text-slate-500">
                            Impostos
                          </span>

                          <span className="font-black text-slate-800">
                            {formatarValor(imposto)}
                          </span>
                        </div>
                      )}

                      {Number(gorjeta) > 0 && (
                        <div className="flex justify-between gap-4 text-xs sm:text-sm">
                          <span className="text-slate-500">
                            Gorjeta
                          </span>

                          <span className="font-black text-slate-800">
                            {formatarValor(gorjeta)}
                          </span>
                        </div>
                      )}

                      {Number(comissao) > 0 && (
                        <div className="flex justify-between gap-4 text-xs sm:text-sm">
                          <span className="text-slate-500">
                            Comissão administrativa
                          </span>

                          <span className="font-black text-slate-800">
                            {formatarValor(comissao)}
                          </span>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>

              <aside className="min-w-0 space-y-4 sm:space-y-5">
                <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl print:shadow-none">
                  <div className="border-b border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4">
                    <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-[10px]">
                      Resumo financeiro
                    </div>

                    <h2 className="mt-1 text-base font-black text-slate-900 sm:text-lg">
                      Pagamento
                    </h2>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="text-xs font-medium text-slate-500 sm:text-sm">
                      Valor total
                    </div>

                    <div
                      className={`mt-1 text-3xl font-black tracking-tight sm:text-4xl ${cancelada
                          ? "text-red-600"
                          : finalizada
                            ? "text-emerald-600"
                            : emAndamento
                              ? "text-amber-600"
                              : "text-teal-600"
                        }`}
                    >
                      {formatarValor(valor)}
                    </div>

                    <div className="my-4 h-px bg-slate-100 sm:my-5" />

                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-slate-500 sm:text-sm">
                          Passageiro
                        </span>

                        <span className="text-right text-xs font-black text-slate-800 sm:text-sm">
                          {String(passageiro)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-slate-500 sm:text-sm">
                          Categoria
                        </span>

                        <span className="text-right text-xs font-black text-slate-800 sm:text-sm">
                          {String(categoria)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-slate-500 sm:text-sm">
                          Distância
                        </span>

                        <span className="text-xs font-black text-slate-800 sm:text-sm">
                          {distancia !== "-"
                            ? `${formatarNumero(
                              distancia,
                              2
                            )} km`
                            : "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-slate-500 sm:text-sm">
                          Duração
                        </span>

                        <span className="text-xs font-black text-slate-800 sm:text-sm">
                          {duracao !== "-"
                            ? `${String(duracao)} min`
                            : "-"}
                        </span>
                      </div>
                    </div>

                    {pagamento !== "-" && (
                      <div
                        className={`mt-4 rounded-xl border p-3.5 sm:mt-5 sm:p-4 ${cancelada
                            ? "border-red-200 bg-red-50"
                            : "border-emerald-200 bg-emerald-50"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${cancelada
                                ? "bg-red-100 text-red-600"
                                : "bg-emerald-100 text-emerald-600"
                              }`}
                          >
                            <CreditCard size={17} />
                          </div>

                          <div className="min-w-0">
                            <div
                              className={`text-[9px] font-black uppercase tracking-wider sm:text-[10px] ${cancelada
                                  ? "text-red-600"
                                  : "text-emerald-600"
                                }`}
                            >
                              Forma de pagamento
                            </div>

                            <div
                              className={`mt-1 truncate text-xs font-black capitalize sm:text-sm ${cancelada
                                  ? "text-red-800"
                                  : "text-emerald-800"
                                }`}
                            >
                              {String(pagamento)}
                            </div>

                            {pagamentoStatus !== "-" && (
                              <div className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
                                Status:{" "}
                                {String(
                                  pagamentoStatus
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {Object.keys(tarifa).length > 0 && (
                  <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5 print:shadow-none">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-[10px]">
                          Configuração da tarifa
                        </div>

                        <h2 className="mt-1 text-sm font-black text-slate-900 sm:text-base">
                          Tarifa aplicada
                        </h2>

                        <div className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                          Valores utilizados no cálculo desta viagem
                        </div>
                      </div>

                      {tarifa.id && (
                        <span className="shrink-0 rounded-lg bg-teal-50 px-2.5 py-1 text-[10px] font-black text-teal-700 sm:text-[11px]">
                          #{String(tarifa.id)}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 2xl:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Tarifa base
                        </div>

                        <div className="mt-1 text-base font-black text-slate-900 sm:text-lg">
                          {formatarValor(tarifa.base_fare)}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Valor por km
                        </div>

                        <div className="mt-1 text-base font-black text-slate-900 sm:text-lg">
                          {formatarValor(tarifa.base_fare_per_km)}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Espera por minuto
                        </div>

                        <div className="mt-1 text-base font-black text-slate-900 sm:text-lg">
                          {formatarValor(tarifa.waiting_fee_per_min)}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Ociosidade por minuto
                        </div>

                        <div className="mt-1 text-base font-black text-slate-900 sm:text-lg">
                          {formatarValor(tarifa.idle_fee_per_min)}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Atraso por minuto
                        </div>

                        <div className="mt-1 text-base font-black text-slate-900 sm:text-lg">
                          {formatarValor(tarifa.trip_delay_fee_per_min)}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Cancelamento
                        </div>

                        <div className="mt-1 text-base font-black text-slate-900 sm:text-lg">
                          {formatarNumero(
                            tarifa.cancellation_fee_percent,
                            2
                          )}
                          %
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Mínimo de cancelamento
                        </div>

                        <div className="mt-1 text-base font-black text-slate-900 sm:text-lg">
                          {formatarValor(
                            tarifa.min_cancellation_fee
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Penalidade por cancelamento
                        </div>

                        <div className="mt-1 text-base font-black text-slate-900 sm:text-lg">
                          {formatarValor(
                            tarifa.penalty_fee_for_cancel
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 p-3.5 sm:p-4">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Adicionar taxa à próxima viagem
                        </div>

                        <div className="mt-1 text-xs font-black text-slate-800 sm:text-sm">
                          {formatarValor(tarifa.fee_add_to_next)}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-100 p-3.5 sm:p-4">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Zona
                        </div>

                        <div className="mt-1 text-xs font-black text-slate-800 sm:text-sm">
                          {String(
                            tarifa.zone_id ??
                            viagem.zone_id ??
                            "-"
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-100 p-3.5 sm:p-4">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Categoria do veículo
                        </div>

                        <div className="mt-1 text-xs font-black text-slate-800 sm:text-sm">
                          {String(
                            tarifa.vehicle_category_id ??
                            viagem.vehicle_category_id ??
                            "-"
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-100 p-3.5 sm:p-4">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 sm:text-[10px]">
                          Tarifa padrão
                        </div>

                        <div className="mt-1 text-xs font-black text-slate-800 sm:text-sm">
                          {String(
                            tarifa.zone_wise_default_trip_fare_id ??
                            "-"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5 print:shadow-none">
                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-[10px]">
                    Status
                  </div>

                  <div
                    className={`mt-3 flex items-center gap-3 rounded-xl border p-3.5 sm:p-4 ${statusConfig.border} ${statusConfig.soft}`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9 ${statusConfig.iconBg} ${statusConfig.iconColor}`}
                    >
                      {statusConfig.icon}
                    </span>

                    <div className="min-w-0">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">
                        Situação atual
                      </div>

                      <div
                        className={`mt-0.5 truncate text-xs font-black sm:text-sm ${statusConfig.text}`}
                      >
                        {String(statusOriginal)}
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          html,
          body {
            background: #fff !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          main {
            min-height: auto !important;
            padding: 0 !important;
            background: #fff !important;
          }

          section,
          aside {
            break-inside: avoid;
          }

          img {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </main>
  );
}