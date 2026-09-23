"use client";

import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type TripDetails = {
    trip_request_id: string;
    pickup_address: string;
    destination_address: string;
    valor: number;
    current_status: string;
};

type ApiTrip = {
    id?: string | number | null;
    trip_request_id?: string | number | null;
    request_id?: string | number | null;

    origin?: string | null;
    destination?: string | null;

    pickup_address?: string | null;
    destination_address?: string | null;

    pickup_location?: string | null;
    dropoff_address?: string | null;
    dropoff_location?: string | null;

    fare?: string | number | null;
    amount?: string | number | null;
    valor?: string | number | null;
    price?: string | number | null;

    status?: string | null;
    current_status?: string | null;
    trip_status?: string | null;
};

type ApiResponse = {
    success?: boolean;
    trip?: ApiTrip | null;
    message?: string;
    error?: string;
};

export default function DetalheViagem() {
    const params = useParams();

    const id = String(params?.id ?? "").trim();

    const [trip, setTrip] = useState<TripDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function buscarViagem() {
            if (!id) {
                if (mounted) {
                    setErro("ID da viagem não informado.");
                    setLoading(false);
                }

                return;
            }

            try {
                if (mounted) {
                    setLoading(true);
                    setErro(null);
                    setTrip(null);
                }

                const url = `/api/trips/drives/${encodeURIComponent(id)}`;

                console.log("=================================");
                console.log("BUSCANDO VIAGEM");
                console.log("ID:", id);
                console.log("URL:", url);
                console.log("=================================");

                const response = await fetch(url, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                    headers: {
                        Accept: "application/json",
                    },
                });

                const contentType =
                    response.headers.get("content-type") || "";

                const text = await response.text();

                console.log("RESPOSTA API:", {
                    status: response.status,
                    contentType,
                    body: text.substring(0, 1000),
                });

                let data: ApiResponse = {};

                if (text) {
                    try {
                        data = JSON.parse(text);
                    } catch {
                        console.error(
                            "Resposta não é JSON:",
                            text
                        );

                        throw new Error(
                            `A API retornou uma resposta inválida (${response.status}).`
                        );
                    }
                }

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            data.error ||
                            `Erro ao buscar a viagem (${response.status}).`
                    );
                }

                if (data.success === false) {
                    throw new Error(
                        data.message ||
                            data.error ||
                            "Não foi possível encontrar a viagem."
                    );
                }

                if (!data.trip) {
                    throw new Error(
                        "Viagem não encontrada."
                    );
                }

                const item = data.trip;

                const tripId = String(
                    item.trip_request_id ??
                        item.request_id ??
                        item.id ??
                        id
                ).trim();

                const pickup = String(
                    item.pickup_address ??
                        item.origin ??
                        item.pickup_location ??
                        ""
                ).trim();

                const destination = String(
                    item.destination_address ??
                        item.destination ??
                        item.dropoff_address ??
                        item.dropoff_location ??
                        ""
                ).trim();

                const valorBruto =
                    item.valor ??
                    item.fare ??
                    item.amount ??
                    item.price ??
                    0;

                const valor = Number(
                    String(valorBruto)
                        .replace(",", ".")
                        .replace(/[^\d.-]/g, "")
                );

                const status = String(
                    item.current_status ??
                        item.status ??
                        item.trip_status ??
                        "pending"
                ).trim();

                if (!mounted) return;

                setTrip({
                    trip_request_id: tripId || id,
                    pickup_address:
                        pickup || "Origem não informada",
                    destination_address:
                        destination ||
                        "Destino não informado",
                    valor: Number.isFinite(valor)
                        ? valor
                        : 0,
                    current_status:
                        status || "pending",
                });
            } catch (error) {
                console.error(
                    "================================="
                );

                console.error(
                    "ERRO AO BUSCAR VIAGEM"
                );

                console.error(error);

                console.error(
                    "================================="
                );

                if (!mounted) return;

                setTrip(null);

                setErro(
                    error instanceof Error
                        ? error.message
                        : "Erro ao buscar a viagem."
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        buscarViagem();

        return () => {
            mounted = false;
        };
    }, [id]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const normalizarStatus = (status: string) => {
        return String(status || "")
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_");
    };

    const traduzirStatus = (status: string) => {
        switch (normalizarStatus(status)) {
            case "completed":
            case "complete":
            case "finished":
                return "Finalizada";

            case "cancelled":
            case "canceled":
                return "Cancelada";

            case "in_progress":
            case "ongoing":
                return "Em andamento";

            case "accepted":
                return "Aceita";

            case "picked_up":
                return "Passageiro embarcou";

            case "out_for_pickup":
                return "A caminho";

            case "pending":
                return "Pendente";

            case "returned":
                return "Retornada";

            case "returning":
                return "Retornando";

            case "failed":
                return "Falhou";

            default:
                return status || "Desconhecido";
        }
    };

    const statusClass = (status: string) => {
        switch (normalizarStatus(status)) {
            case "completed":
            case "complete":
            case "finished":
                return "bg-green-100 text-green-700";

            case "cancelled":
            case "canceled":
            case "failed":
                return "bg-red-100 text-red-700";

            case "in_progress":
            case "ongoing":
            case "accepted":
            case "picked_up":
            case "out_for_pickup":
                return "bg-yellow-100 text-yellow-700";

            case "returned":
            case "returning":
                return "bg-blue-100 text-blue-700";

            case "pending":
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <main className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-4 sm:py-6 md:px-6">
            <Link
                href="/motorista/viagens"
                className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-800"
            >
                <ArrowLeft size={17} />
                Voltar para o relatório
            </Link>

            <section className="overflow-hidden rounded-2xl bg-white shadow-sm sm:rounded-3xl">
                {loading ? (
                    <div className="flex min-h-[300px] items-center justify-center">
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-teal-500" />
                            Carregando viagem...
                        </div>
                    </div>
                ) : erro || !trip ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-12 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                            <MapPin
                                size={22}
                                className="text-gray-400"
                            />
                        </div>

                        <h2 className="text-base font-semibold text-gray-800 sm:text-lg">
                            Não foi possível carregar a viagem
                        </h2>

                        <p className="mt-2 max-w-md text-sm text-gray-500">
                            {erro ||
                                "Viagem não encontrada."}
                        </p>

                        {id && (
                            <p className="mt-3 max-w-full break-all text-xs text-gray-400">
                                ID: {id}
                            </p>
                        )}

                        <Link
                            href="/motorista/viagens"
                            className="mt-6 inline-flex rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                        >
                            Voltar para viagens
                        </Link>
                    </div>
                ) : (
                    <div className="p-5 sm:p-7 md:p-8">
                        <div className="mb-8 text-center">
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                ID da viagem
                            </p>

                            <h1 className="mt-1 break-all text-lg font-bold text-gray-800 sm:text-xl">
                                #{trip.trip_request_id}
                            </h1>

                            <span
                                className={`mt-3 inline-flex rounded-full px-3.5 py-1.5 text-xs font-semibold ${statusClass(
                                    trip.current_status
                                )}`}
                            >
                                {traduzirStatus(
                                    trip.current_status
                                )}
                            </span>
                        </div>

                        <div className="space-y-1">
                            <div className="flex flex-col items-center text-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                                    <MapPin
                                        size={17}
                                        className="text-green-500"
                                    />
                                </div>

                                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                    Origem
                                </p>

                                <p className="mt-1 max-w-xl break-words text-sm leading-6 text-gray-700 sm:text-base">
                                    {trip.pickup_address}
                                </p>
                            </div>

                            <div className="mx-auto h-8 w-px border-l border-dashed border-gray-300" />

                            <div className="flex flex-col items-center text-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                                    <MapPin
                                        size={17}
                                        className="text-red-500"
                                    />
                                </div>

                                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                    Destino
                                </p>

                                <p className="mt-1 max-w-xl break-words text-sm leading-6 text-gray-700 sm:text-base">
                                    {trip.destination_address}
                                </p>
                            </div>
                        </div>

                        <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-teal-100 bg-teal-50 px-5 py-4 text-center">
                            <p className="text-xs font-medium text-teal-600">
                                Valor da corrida
                            </p>

                            <p className="mt-1 text-xl font-bold text-teal-700 sm:text-2xl">
                                {trip.valor > 0
                                    ? formatCurrency(
                                          trip.valor
                                      )
                                    : "Aguardando"}
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}