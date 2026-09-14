"use client";

import { Eye, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Trip = {
    trip_request_id: number;
    pickup_address: string;
    destination_address: string;
    valor: number;
    current_status: string;
};

type ApiTrip = {
    id?: number | string | null;
    trip_request_id?: number | string | null;
    request_id?: number | string | null;

    origin?: string | null;
    destination?: string | null;

    pickup_address?: string | null;
    destination_address?: string | null;

    pickup_location?: string | null;
    dropoff_address?: string | null;
    dropoff_location?: string | null;

    fare?: number | string | null;
    amount?: number | string | null;
    valor?: number | string | null;

    status?: string | null;
    current_status?: string | null;
};

type TripsResponse = {
    success?: boolean;
    driver_id?: string;
    trips?: ApiTrip[];
    message?: string;
};

export default function Relatorio() {
    const [rows, setRows] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let ativo = true;

        async function buscarViagens() {
            try {
                setLoading(true);

                const response = await fetch("/api/trips", {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                    headers: {
                        Accept: "application/json",
                    },
                });

                const data: TripsResponse = await response.json();

                console.log("Resposta /api/trips:", data);
                console.log("Viagens recebidas:", data?.trips);

                if (!response.ok) {
                    throw new Error(
                        data?.message || "Erro ao buscar viagens."
                    );
                }

                // A API retorna:
                // {
                //   success: true,
                //   driver_id: "...",
                //   trips: [...]
                // }

                const viagens = Array.isArray(data?.trips)
                    ? data.trips
                    : [];

                console.log(
                    "Quantidade de viagens:",
                    viagens.length
                );

                const viagensFormatadas: Trip[] = viagens
                    .map((item) => {
                        const tripId = Number(
                            item.trip_request_id ??
                                item.request_id ??
                                item.id ??
                                0
                        );

                        const pickup =
                            item.pickup_address ??
                            item.origin ??
                            item.pickup_location ??
                            "Origem não informada";

                        const destination =
                            item.destination_address ??
                            item.destination ??
                            item.dropoff_address ??
                            item.dropoff_location ??
                            "Destino não informado";

                        let valor = Number(
                            item.valor ??
                                item.fare ??
                                item.amount ??
                                0
                        );

                        if (!Number.isFinite(valor)) {
                            valor = 0;
                        }

                        const status =
                            item.current_status ??
                            item.status ??
                            "pending";

                        return {
                            trip_request_id: tripId,
                            pickup_address: pickup,
                            destination_address: destination,
                            valor,
                            current_status: status,
                        };
                    })
                    .filter(
                        (item) =>
                            item.trip_request_id > 0
                    );

                console.log(
                    "Viagens formatadas:",
                    viagensFormatadas
                );

                if (ativo) {
                    setRows(viagensFormatadas);
                }
            } catch (error) {
                console.error(
                    "Erro ao buscar viagens:",
                    error
                );

                if (ativo) {
                    setRows([]);
                }
            } finally {
                if (ativo) {
                    setLoading(false);
                }
            }
        }

        buscarViagens();

        return () => {
            ativo = false;
        };
    }, []);

    /*
     * TOTAL DE VIAGENS
     */
    const totalViagens = rows.length;

    /*
     * TOTAL MOVIMENTADO
     */
    const totalGasto = rows.reduce(
        (total, viagem) =>
            total + viagem.valor,
        0
    );

    /*
     * FORMATAÇÃO DE MOEDA
     */
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    /*
     * TRADUZ STATUS
     */
    const traduzirStatus = (status: string) => {
        switch (status.toLowerCase()) {
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

    /*
     * CLASSE DO STATUS
     */
    const statusClass = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
            case "complete":
            case "finished":
                return "bg-green-100 text-green-600";

            case "cancelled":
            case "canceled":
            case "failed":
                return "bg-red-100 text-red-600";

            case "in_progress":
            case "ongoing":
            case "accepted":
            case "picked_up":
            case "out_for_pickup":
                return "bg-yellow-100 text-yellow-600";

            case "pending":
                return "bg-gray-100 text-gray-600";

            case "returned":
            case "returning":
                return "bg-blue-100 text-blue-600";

            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    return (
        <div className="p-6">
            <div className="rounded-2xl bg-white p-5 shadow">
                {/* CABEÇALHO */}
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h5 className="text-xl font-bold text-black">
                            Últimas Viagens
                        </h5>

                        <p className="mt-1 text-sm text-gray-500">
                            Confira suas viagens realizadas
                        </p>
                    </div>

                    <Link
                        href="/motorista/impostos"
                        className="inline-flex items-center justify-center rounded-2xl bg-[#05b8aa] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#04a99c] hover:shadow-md active:scale-95"
                    >
                        Imposto de Renda
                    </Link>
                </div>

                {/* TOTAL MOVIMENTADO */}
                {totalGasto > 0 && (
                    <div className="mb-4 rounded-xl bg-teal-50 px-4 py-3">
                        <p className="text-xs text-teal-600">
                            Total movimentado
                        </p>

                        <p className="text-lg font-bold text-teal-700">
                            {formatCurrency(totalGasto)}
                        </p>
                    </div>
                )}

                {/* TABELA */}
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b bg-gray-50">
                            <tr className="text-xs uppercase text-gray-600">
                                <th className="px-6 py-3">
                                    ID
                                </th>

                                <th className="px-6 py-3">
                                    Origem x Destino
                                </th>

                                <th className="px-6 py-3">
                                    Valor
                                </th>

                                <th className="px-6 py-3">
                                    Status
                                </th>

                                <th className="px-6 py-3 text-center">
                                    Ação
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {/* CARREGANDO */}
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-10 text-center text-gray-500"
                                    >
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-teal-500" />

                                            <span>
                                                Carregando viagens...
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                /* SEM VIAGENS */
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-14 text-center"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                                                <MapPin
                                                    size={20}
                                                    className="text-gray-400"
                                                />
                                            </div>

                                            <p className="text-sm font-medium text-gray-700">
                                                Nenhuma corrida encontrada
                                            </p>

                                            <p className="mt-1 text-xs text-gray-400">
                                                Suas viagens aparecerão aqui.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                /* VIAGENS */
                                rows.map((item) => (
                                    <tr
                                        key={item.trip_request_id}
                                        className="transition-colors hover:bg-gray-50"
                                    >
                                        {/* ID */}
                                        <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-700">
                                            #{item.trip_request_id}
                                        </td>

                                        {/* ORIGEM / DESTINO */}
                                        <td className="px-6 py-4">
                                            <div className="flex min-w-[450px] items-center gap-3">
                                                {/* ORIGEM */}
                                                <div className="flex min-w-0 items-center gap-1.5">
                                                    <MapPin
                                                        size={14}
                                                        className="shrink-0 text-green-500"
                                                    />

                                                    <span className="truncate text-gray-700">
                                                        {item.pickup_address}
                                                    </span>
                                                </div>

                                                <span className="shrink-0 text-gray-400">
                                                    →
                                                </span>

                                                {/* DESTINO */}
                                                <div className="flex min-w-0 items-center gap-1.5">
                                                    <MapPin
                                                        size={14}
                                                        className="shrink-0 text-red-500"
                                                    />

                                                    <span className="truncate text-gray-700">
                                                        {item.destination_address}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* VALOR */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            {item.valor <= 0 ? (
                                                <span className="text-gray-400">
                                                    Aguardando
                                                </span>
                                            ) : (
                                                <span className="font-semibold text-gray-700">
                                                    {formatCurrency(
                                                        item.valor
                                                    )}
                                                </span>
                                            )}
                                        </td>

                                        {/* STATUS */}
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                                                    item.current_status
                                                )}`}
                                            >
                                                {traduzirStatus(
                                                    item.current_status
                                                )}
                                            </span>
                                        </td>

                                        {/* AÇÃO */}
                                        <td className="px-6 py-4 text-center">
                                            <Link
                                                href={`/motorista/trips/${item.trip_request_id}`}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-teal-500 transition-colors hover:bg-teal-50 hover:text-teal-700"
                                                title="Ver viagem"
                                                aria-label={`Ver viagem ${item.trip_request_id}`}
                                            >
                                                <Eye size={17} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* RODAPÉ */}
                {!loading && totalViagens > 0 && (
                    <div className="mt-4 border-t pt-4">
                        <p className="text-xs text-gray-400">
                            {totalViagens}{" "}
                            {totalViagens === 1
                                ? "viagem encontrada"
                                : "viagens encontradas"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}