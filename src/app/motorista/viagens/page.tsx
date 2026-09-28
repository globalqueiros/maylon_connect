"use client";

import { Eye, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Trip = {
    trip_request_id: string;
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

const VIAGENS_POR_PAGINA = 10;

const STATUS_FINALIZADOS = [
    "completed",
    "complete",
    "finished",
];

const STATUS_CANCELADOS = [
    "cancelled",
    "canceled",
    "failed",
];

const STATUS_EM_ANDAMENTO = [
    "in_progress",
    "ongoing",
    "accepted",
    "picked_up",
    "out_for_pickup",
];

const STATUS_RETORNADOS = [
    "returned",
    "returning",
];

export default function Relatorio() {
    const [rows, setRows] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [paginaAtual, setPaginaAtual] = useState(1);

    useEffect(() => {
        let ativo = true;

        async function buscarViagens() {
            try {
                setLoading(true);

                const response = await fetch("/api/trips/drives", {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                    headers: {
                        Accept: "application/json",
                    },
                });

                let data: TripsResponse = {};

                try {
                    data = await response.json();
                } catch {
                    data = {};
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message || "Erro ao buscar viagens."
                    );
                }

                const viagens = Array.isArray(data?.trips)
                    ? data.trips
                    : [];

                const viagensFormatadas: Trip[] = viagens
                    .map((item) => {
                        const tripId = String(
                            item.trip_request_id ??
                                item.request_id ??
                                item.id ??
                                ""
                        ).trim();

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

                        const status = String(
                            item.current_status ??
                                item.status ??
                                "pending"
                        ).trim();

                        return {
                            trip_request_id: tripId,
                            pickup_address: String(pickup),
                            destination_address: String(destination),
                            valor,
                            current_status: status || "pending",
                        };
                    })
                    .filter(
                        (item) => item.trip_request_id.length > 0
                    );

                if (ativo) {
                    setRows(viagensFormatadas);
                    setPaginaAtual(1);
                }
            } catch {
                if (ativo) {
                    setRows([]);
                    setPaginaAtual(1);
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

    const totalViagens = rows.length;

    const totalGasto = useMemo(() => {
        return rows.reduce((total, viagem) => {
            const status = viagem.current_status
                .toLowerCase()
                .trim();

            const finalizada =
                STATUS_FINALIZADOS.includes(status);

            return finalizada
                ? total + viagem.valor
                : total;
        }, 0);
    }, [rows]);

    const totalViagensFinalizadas = useMemo(() => {
        return rows.filter((viagem) => {
            const status = viagem.current_status
                .toLowerCase()
                .trim();

            return STATUS_FINALIZADOS.includes(status);
        }).length;
    }, [rows]);

    const totalPaginas = Math.max(
        1,
        Math.ceil(totalViagens / VIAGENS_POR_PAGINA)
    );

    const paginaSegura = Math.min(
        paginaAtual,
        totalPaginas
    );

    const indiceInicio =
        (paginaSegura - 1) * VIAGENS_POR_PAGINA;

    const indiceFim =
        indiceInicio + VIAGENS_POR_PAGINA;

    const viagensPaginadas = rows.slice(
        indiceInicio,
        indiceFim
    );

    const irParaPagina = (pagina: number) => {
        if (pagina < 1 || pagina > totalPaginas) {
            return;
        }

        setPaginaAtual(pagina);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const normalizarStatus = (status: string) => {
        return String(status || "")
            .toLowerCase()
            .trim();
    };

    const traduzirStatus = (status: string) => {
        const statusNormalizado = normalizarStatus(status);

        switch (statusNormalizado) {
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
        const statusNormalizado = normalizarStatus(status);

        if (STATUS_FINALIZADOS.includes(statusNormalizado)) {
            return "bg-green-100 text-green-600";
        }

        if (STATUS_CANCELADOS.includes(statusNormalizado)) {
            return "bg-red-100 text-red-600";
        }

        if (STATUS_EM_ANDAMENTO.includes(statusNormalizado)) {
            return "bg-yellow-100 text-yellow-600";
        }

        if (statusNormalizado === "pending") {
            return "bg-gray-100 text-gray-600";
        }

        if (STATUS_RETORNADOS.includes(statusNormalizado)) {
            return "bg-blue-100 text-blue-600";
        }

        return "bg-gray-100 text-gray-600";
    };

    const gerarPaginas = () => {
        if (totalPaginas <= 5) {
            return Array.from(
                { length: totalPaginas },
                (_, index) => index + 1
            );
        }

        const paginas = new Set<number>();

        paginas.add(1);
        paginas.add(totalPaginas);
        paginas.add(paginaSegura);

        if (paginaSegura - 1 > 1) {
            paginas.add(paginaSegura - 1);
        }

        if (paginaSegura + 1 < totalPaginas) {
            paginas.add(paginaSegura + 1);
        }

        return Array.from(paginas).sort(
            (a, b) => a - b
        );
    };

    const paginas = gerarPaginas();

    return (
        <div className="mx-auto w-full max-w-8xl">
            <div className="w-full overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl">
                <div className="mb-3 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h5 className="text-lg font-bold text-black sm:text-xl md:text-2xl 2xl:text-3xl">
                            Últimas Viagens
                        </h5>

                        <p className="mt-0 text-xs text-gray-500 sm:text-sm 2xl:text-base">
                            Confira suas viagens realizadas
                        </p>
                    </div>

                    <Link
                        href="/motorista/impostos"
                        className="inline-flex w-full shrink-0 items-center justify-center rounded-xl bg-[#05b8aa] px-4 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#04a99c] hover:shadow-md active:scale-[0.98] sm:w-auto sm:rounded-2xl sm:px-5 sm:py-2.5 2xl:px-6 2xl:py-3 2xl:text-base"
                    >
                        Imposto de Renda
                    </Link>
                </div>

                {totalViagensFinalizadas > 0 && (
                    <div className="mb-5 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 sm:mb-6 sm:rounded-2xl">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-medium text-teal-600">
                                    Viagens concluídas
                                </p>

                                <p className="mt-1 text-2xl font-bold text-teal-700">
                                    {totalViagensFinalizadas}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-xs font-medium text-teal-600">
                                    Total recebido
                                </p>

                                <p className="mt-1 text-lg font-bold text-teal-700 sm:text-xl">
                                    {formatCurrency(totalGasto)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex min-h-[220px] items-center justify-center">
                        <div className="flex items-center justify-center gap-3 text-sm text-gray-500 2xl:text-base">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-teal-500" />

                            <span>
                                Carregando viagens...
                            </span>
                        </div>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center px-4 py-10 text-center sm:min-h-[260px]">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                            <MapPin
                                size={21}
                                className="text-gray-400"
                            />
                        </div>

                        <p className="text-sm font-medium text-gray-700 sm:text-base 2xl:text-lg">
                            Nenhuma corrida encontrada
                        </p>

                        <p className="mt-1 text-xs text-gray-400 sm:text-sm 2xl:text-base">
                            Suas viagens aparecerão aqui.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[760px] text-left text-sm 2xl:text-base">
                                <thead className="border-b border-gray-200 bg-gray-50">
                                    <tr className="text-xs uppercase tracking-wide text-gray-600 2xl:text-[13px]">
                                        <th className="px-4 py-3 lg:px-6 2xl:px-7 2xl:py-4">
                                            ID
                                        </th>

                                        <th className="px-4 py-3 lg:px-6 2xl:px-7 2xl:py-4">
                                            Origem x Destino
                                        </th>

                                        <th className="px-4 py-3 lg:px-6 2xl:px-7 2xl:py-4">
                                            Valor
                                        </th>

                                        <th className="px-4 py-3 lg:px-6 2xl:px-7 2xl:py-4">
                                            Status
                                        </th>

                                        <th className="px-4 py-3 text-center lg:px-6 2xl:px-7 2xl:py-4">
                                            Ação
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {viagensPaginadas.map(
                                        (item) => (
                                            <tr
                                                key={
                                                    item.trip_request_id
                                                }
                                                className="transition-colors hover:bg-gray-50"
                                            >
                                                <td className="max-w-[190px] px-4 py-4 font-medium text-gray-700 lg:px-6 2xl:px-7 2xl:py-5">
                                                    <span
                                                        className="block truncate"
                                                        title={
                                                            item.trip_request_id
                                                        }
                                                    >
                                                        #
                                                        {
                                                            item.trip_request_id
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 lg:px-6 2xl:px-7 2xl:py-5">
                                                    <div className="flex min-w-[360px] max-w-[650px] items-center gap-3 lg:min-w-[400px] 2xl:min-w-[480px]">
                                                        <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                                            <MapPin
                                                                size={
                                                                    14
                                                                }
                                                                className="shrink-0 text-green-500"
                                                            />

                                                            <span
                                                                className="truncate text-gray-700"
                                                                title={
                                                                    item.pickup_address
                                                                }
                                                            >
                                                                {
                                                                    item.pickup_address
                                                                }
                                                            </span>
                                                        </div>

                                                        <span className="shrink-0 text-gray-400">
                                                            →
                                                        </span>

                                                        <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                                            <MapPin
                                                                size={
                                                                    14
                                                                }
                                                                className="shrink-0 text-red-500"
                                                            />

                                                            <span
                                                                className="truncate text-gray-700"
                                                                title={
                                                                    item.destination_address
                                                                }
                                                            >
                                                                {
                                                                    item.destination_address
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-4 lg:px-6 2xl:px-7 2xl:py-5">
                                                    {item.valor <=
                                                    0 ? (
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

                                                <td className="px-4 py-4 lg:px-6 2xl:px-7 2xl:py-5">
                                                    <span
                                                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold 2xl:px-3 2xl:text-sm ${statusClass(
                                                            item.current_status
                                                        )}`}
                                                    >
                                                        {traduzirStatus(
                                                            item.current_status
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 text-center lg:px-6 2xl:px-7 2xl:py-5">
                                                    <Link
                                                        href={`/motorista/viagens/${item.trip_request_id}`}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-teal-500 transition-colors hover:bg-teal-50 hover:text-teal-700 2xl:h-10 2xl:w-10"
                                                        title="Ver viagem"
                                                        aria-label={`Ver viagem ${item.trip_request_id}`}
                                                    >
                                                        <Eye
                                                            size={
                                                                18
                                                            }
                                                        />
                                                    </Link>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
                            {viagensPaginadas.map(
                                (item) => (
                                    <div
                                        key={
                                            item.trip_request_id
                                        }
                                        className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                                    >
                                        <div className="mb-4 flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                    ID da viagem
                                                </p>

                                                <p
                                                    className="mt-1 truncate text-xs font-semibold text-gray-700"
                                                    title={
                                                        item.trip_request_id
                                                    }
                                                >
                                                    #
                                                    {
                                                        item.trip_request_id
                                                    }
                                                </p>
                                            </div>

                                            <Link
                                                href={`/motorista/viagens/${item.trip_request_id}`}
                                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-colors hover:bg-teal-100"
                                                title="Ver viagem"
                                                aria-label={`Ver viagem ${item.trip_request_id}`}
                                            >
                                                <Eye
                                                    size={18}
                                                />
                                            </Link>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50">
                                                <MapPin
                                                    size={15}
                                                    className="text-green-500"
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                    Origem
                                                </p>

                                                <p className="mt-1 break-words text-sm leading-5 text-gray-700">
                                                    {
                                                        item.pickup_address
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="ml-4 h-5 border-l border-dashed border-gray-300" />

                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50">
                                                <MapPin
                                                    size={15}
                                                    className="text-red-500"
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                    Destino
                                                </p>

                                                <p className="mt-1 break-words text-sm leading-5 text-gray-700">
                                                    {
                                                        item.destination_address
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                    Valor
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-gray-700">
                                                    {item.valor <=
                                                    0
                                                        ? "Aguardando"
                                                        : formatCurrency(
                                                              item.valor
                                                          )}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                    Status
                                                </p>

                                                <span
                                                    className={`mt-1 inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(
                                                        item.current_status
                                                    )}`}
                                                >
                                                    {traduzirStatus(
                                                        item.current_status
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </>
                )}

                {!loading && totalViagens > 0 && (
                    <div className="mt-5 border-t border-gray-100 pt-4 sm:mt-6 2xl:pt-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-center text-xs text-gray-400 sm:text-left 2xl:text-sm">
                                Mostrando{" "}
                                <span className="font-semibold text-gray-600">
                                    {indiceInicio + 1}
                                </span>{" "}
                                a{" "}
                                <span className="font-semibold text-gray-600">
                                    {Math.min(
                                        indiceFim,
                                        totalViagens
                                    )}
                                </span>{" "}
                                de{" "}
                                <span className="font-semibold text-gray-600">
                                    {totalViagens}
                                </span>{" "}
                                {totalViagens === 1
                                    ? "viagem"
                                    : "viagens"}
                            </p>

                            {totalPaginas > 1 && (
                                <div className="flex flex-wrap items-center justify-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            irParaPagina(
                                                paginaSegura - 1
                                            )
                                        }
                                        disabled={
                                            paginaSegura === 1
                                        }
                                        className="inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 px-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 2xl:h-10 2xl:min-w-10 2xl:text-base"
                                        aria-label="Página anterior"
                                    >
                                        ←
                                    </button>

                                    {paginas.map(
                                        (
                                            pagina,
                                            index
                                        ) => {
                                            const paginaAnterior =
                                                paginas[
                                                    index - 1
                                                ];

                                            const mostrarReticencias =
                                                paginaAnterior !==
                                                    undefined &&
                                                pagina -
                                                    paginaAnterior >
                                                    1;

                                            return (
                                                <span
                                                    key={
                                                        pagina
                                                    }
                                                    className="contents"
                                                >
                                                    {mostrarReticencias && (
                                                        <span className="inline-flex h-9 min-w-7 items-center justify-center text-xs text-gray-400">
                                                            ...
                                                        </span>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            irParaPagina(
                                                                pagina
                                                            )
                                                        }
                                                        className={`inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg border px-2 text-sm font-semibold transition 2xl:h-10 2xl:min-w-10 2xl:text-base ${
                                                            pagina ===
                                                            paginaSegura
                                                                ? "border-[#05b8aa] bg-[#05b8aa] text-white"
                                                                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                                        }`}
                                                        aria-current={
                                                            pagina ===
                                                            paginaSegura
                                                                ? "page"
                                                                : undefined
                                                        }
                                                    >
                                                        {
                                                            pagina
                                                        }
                                                    </button>
                                                </span>
                                            );
                                        }
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            irParaPagina(
                                                paginaSegura + 1
                                            )
                                        }
                                        disabled={
                                            paginaSegura ===
                                            totalPaginas
                                        }
                                        className="inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 px-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 2xl:h-10 2xl:min-w-10 2xl:text-base"
                                        aria-label="Próxima página"
                                    >
                                        →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}