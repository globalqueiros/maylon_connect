"use client";

import {
    ArrowRight,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    Clock3,
    Eye,
    MapPin,
    ReceiptText,
    Route,
    XCircle,
} from "lucide-react";
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

                const response = await fetch(
                    "/api/trips/drives",
                    {
                        method: "GET",
                        credentials: "include",
                        cache: "no-store",
                        headers: {
                            Accept: "application/json",
                        },
                    }
                );

                let data: TripsResponse = {};

                try {
                    data = await response.json();
                } catch {
                    data = {};
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                            "Erro ao buscar viagens."
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
                        )
                            .trim()
                            .toLowerCase();

                        return {
                            trip_request_id: tripId,
                            pickup_address: String(pickup),
                            destination_address:
                                String(destination),
                            valor,
                            current_status:
                                status || "pending",
                        };
                    })
                    .filter(
                        (item) =>
                            item.trip_request_id.length > 0
                    );

                if (ativo) {
                    setRows(viagensFormatadas);
                    setPaginaAtual(1);
                }
            } catch (error) {
                console.error(
                    "ERRO AO CARREGAR VIAGENS:",
                    error
                );

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

    const normalizarStatus = (status: string) => {
        return String(status || "")
            .toLowerCase()
            .trim();
    };

    const traduzirStatus = (status: string) => {
        const statusNormalizado =
            normalizarStatus(status);

        switch (statusNormalizado) {
            case "completed":
            case "complete":
            case "finished":
                return "Finalizada";

            case "cancelled":
            case "canceled":
            case "failed":
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

            default:
                return status || "Desconhecido";
        }
    };

    const statusConfig = (status: string) => {
        const statusNormalizado =
            normalizarStatus(status);

        if (
            STATUS_FINALIZADOS.includes(
                statusNormalizado
            )
        ) {
            return {
                label: "Finalizada",
                className:
                    "bg-emerald-50 text-emerald-700 border-emerald-100",
                icon: CheckCircle2,
            };
        }

        if (
            STATUS_CANCELADOS.includes(
                statusNormalizado
            )
        ) {
            return {
                label: "Cancelada",
                className:
                    "bg-red-50 text-red-700 border-red-100",
                icon: XCircle,
            };
        }

        if (
            STATUS_EM_ANDAMENTO.includes(
                statusNormalizado
            )
        ) {
            return {
                label: traduzirStatus(status),
                className:
                    "bg-amber-50 text-amber-700 border-amber-100",
                icon: Clock3,
            };
        }

        if (
            STATUS_RETORNADOS.includes(
                statusNormalizado
            )
        ) {
            return {
                label: traduzirStatus(status),
                className:
                    "bg-blue-50 text-blue-700 border-blue-100",
                icon: Route,
            };
        }

        return {
            label: traduzirStatus(status),
            className:
                "bg-slate-50 text-slate-600 border-slate-200",
            icon: Clock3,
        };
    };

    /*
     * Define como o valor deve aparecer de acordo
     * com o status da viagem.
     *
     * Cancelada:
     * R$ 0,00
     *
     * Finalizada:
     * mostra o valor da corrida
     *
     * Outros status:
     * Aguardando caso ainda não exista valor.
     */
    const obterValorViagem = (item: Trip) => {
        const status = normalizarStatus(
            item.current_status
        );

        if (STATUS_CANCELADOS.includes(status)) {
            return {
                label: "Valor",
                value: formatCurrency(0),
                type: "cancelada" as const,
            };
        }

        if (STATUS_FINALIZADOS.includes(status)) {
            return {
                label: "Recebido",
                value: formatCurrency(item.valor),
                type: "finalizada" as const,
            };
        }

        if (item.valor <= 0) {
            return {
                label: "Valor",
                value: "Aguardando",
                type: "aguardando" as const,
            };
        }

        return {
            label: "Valor",
            value: formatCurrency(item.valor),
            type: "normal" as const,
        };
    };

    const totalViagens = rows.length;

    const totalViagensFinalizadas = useMemo(() => {
        return rows.filter((viagem) => {
            const status = normalizarStatus(
                viagem.current_status
            );

            return STATUS_FINALIZADOS.includes(status);
        }).length;
    }, [rows]);

    const totalEmAndamento = useMemo(() => {
        return rows.filter((viagem) => {
            const status = normalizarStatus(
                viagem.current_status
            );

            return STATUS_EM_ANDAMENTO.includes(status);
        }).length;
    }, [rows]);

    const totalCanceladas = useMemo(() => {
        return rows.filter((viagem) => {
            const status = normalizarStatus(
                viagem.current_status
            );

            return STATUS_CANCELADOS.includes(status);
        }).length;
    }, [rows]);

    const totalGasto = useMemo(() => {
        return rows.reduce((total, viagem) => {
            const status = normalizarStatus(
                viagem.current_status
            );

            if (
                STATUS_FINALIZADOS.includes(status)
            ) {
                return total + viagem.valor;
            }

            return total;
        }, 0);
    }, [rows]);

    const totalPaginas = Math.max(
        1,
        Math.ceil(
            totalViagens / VIAGENS_POR_PAGINA
        )
    );

    const paginaSegura = Math.min(
        paginaAtual,
        totalPaginas
    );

    const indiceInicio =
        (paginaSegura - 1) *
        VIAGENS_POR_PAGINA;

    const indiceFim =
        indiceInicio +
        VIAGENS_POR_PAGINA;

    const viagensPaginadas = rows.slice(
        indiceInicio,
        indiceFim
    );

    const irParaPagina = (pagina: number) => {
        if (
            pagina < 1 ||
            pagina > totalPaginas
        ) {
            return;
        }

        setPaginaAtual(pagina);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const gerarPaginas = () => {
        if (totalPaginas <= 5) {
            return Array.from(
                {
                    length: totalPaginas,
                },
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

        if (
            paginaSegura + 1 <
            totalPaginas
        ) {
            paginas.add(paginaSegura + 1);
        }

        return Array.from(paginas).sort(
            (a, b) => a - b
        );
    };

    const paginas = gerarPaginas();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    function StatCard({
        title,
        value,
        icon: Icon,
        iconClass,
    }: {
        title: string;
        value: string | number;
        icon: typeof Route;
        iconClass: string;
    }) {
        return (
            <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(15,23,42,0.07)]">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                            {title}
                        </p>

                        <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                            {value}
                        </p>
                    </div>

                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                    >
                        <Icon size={20} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="w-full pb-10">
            <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                        Minhas viagens
                    </h1>

                    <p className="mt-0 max-w-2xl text-sm leading-6 text-white">
                        Acompanhe suas corridas,
                        valores recebidos e o status
                        de cada viagem.
                    </p>
                </div>

                <Link
                    href="/motorista/impostos"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#05b8aa] px-5 text-sm font-bold text-white shadow-[0_5px_15px_rgba(5,184,170,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#04a99c] hover:shadow-[0_8px_20px_rgba(5,184,170,0.25)] active:translate-y-0"
                >
                    <ReceiptText size={17} />
                    Imposto de Renda
                </Link>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total de viagens"
                    value={totalViagens}
                    icon={Route}
                    iconClass="bg-teal-50 text-teal-600"
                />

                <StatCard
                    title="Finalizadas"
                    value={totalViagensFinalizadas}
                    icon={CheckCircle2}
                    iconClass="bg-emerald-50 text-emerald-600"
                />

                <StatCard
                    title="Em andamento"
                    value={totalEmAndamento}
                    icon={Clock3}
                    iconClass="bg-amber-50 text-amber-600"
                />

                <StatCard
                    title="Total recebido"
                    value={formatCurrency(totalGasto)}
                    icon={CircleDollarSign}
                    iconClass="bg-blue-50 text-blue-600"
                />
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_25px_rgba(15,23,42,0.04)]">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                                <Route size={17} />
                            </div>

                            <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
                                Histórico de viagens
                            </h2>
                        </div>

                        <p className="mt-0 text-xs text-slate-400 sm:text-sm">
                            Confira suas viagens realizadas
                            e seus respectivos valores.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                            {totalViagens}{" "}
                            {totalViagens === 1
                                ? "viagem"
                                : "viagens"}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-[360px] items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-100 border-t-teal-500" />
                            </div>

                            <div className="text-center">
                                <p className="text-sm font-semibold text-slate-700">
                                    Carregando viagens
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Aguarde enquanto buscamos
                                    seu histórico.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                            <MapPin
                                size={28}
                                className="text-slate-300"
                            />
                        </div>

                        <h3 className="text-base font-bold text-slate-800 sm:text-lg">
                            Nenhuma viagem encontrada
                        </h3>

                        <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-400">
                            Suas viagens aparecerão aqui
                            assim que você realizar uma
                            corrida.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[900px] border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70">
                                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                            Viagem
                                        </th>

                                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                            Rota
                                        </th>

                                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                            Valor
                                        </th>

                                        <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                            Status
                                        </th>

                                        <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                            Ação
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {viagensPaginadas.map(
                                        (item) => {
                                            const status =
                                                statusConfig(
                                                    item.current_status
                                                );

                                            const StatusIcon =
                                                status.icon;

                                            const valorViagem =
                                                obterValorViagem(
                                                    item
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        item.trip_request_id
                                                    }
                                                    className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                                                >
                                                    <td className="px-6 py-5">
                                                        <div>
                                                            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                                                ID
                                                            </span>

                                                            <p className="mt-1 font-bold text-slate-700">
                                                                #
                                                                {
                                                                    item.trip_request_id
                                                                }
                                                            </p>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <div className="flex min-w-[430px] max-w-[650px] items-center gap-3">
                                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                                                                    <MapPin
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="text-emerald-500"
                                                                    />
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                                        Origem
                                                                    </p>

                                                                    <p
                                                                        className="mt-0.5 truncate text-sm font-medium text-slate-700"
                                                                        title={
                                                                            item.pickup_address
                                                                        }
                                                                    >
                                                                        {
                                                                            item.pickup_address
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <ArrowRight
                                                                size={
                                                                    16
                                                                }
                                                                className="shrink-0 text-slate-300"
                                                            />

                                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50">
                                                                    <MapPin
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="text-red-500"
                                                                    />
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                                        Destino
                                                                    </p>

                                                                    <p
                                                                        className="mt-0.5 truncate text-sm font-medium text-slate-700"
                                                                        title={
                                                                            item.destination_address
                                                                        }
                                                                    >
                                                                        {
                                                                            item.destination_address
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="whitespace-nowrap px-6 py-5">
                                                        <div>
                                                            <p className="text-xs font-medium text-slate-400">
                                                                {
                                                                    valorViagem.label
                                                                }
                                                            </p>

                                                            <p
                                                                className={`mt-1 text-sm ${
                                                                    valorViagem.type ===
                                                                    "finalizada"
                                                                        ? "font-extrabold text-slate-800"
                                                                        : valorViagem.type ===
                                                                          "cancelada"
                                                                        ? "font-extrabold text-slate-600"
                                                                        : valorViagem.type ===
                                                                          "aguardando"
                                                                        ? "font-medium text-slate-400"
                                                                        : "font-extrabold text-slate-800"
                                                                }`}
                                                            >
                                                                {
                                                                    valorViagem.value
                                                                }
                                                            </p>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${status.className}`}
                                                        >
                                                            <StatusIcon
                                                                size={
                                                                    13
                                                                }
                                                            />

                                                            {
                                                                status.label
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-5 text-right">
                                                        <Link
                                                            href={`/motorista/viagens/${item.trip_request_id}`}
                                                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-all hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                                                        >
                                                            <Eye
                                                                size={
                                                                    15
                                                                }
                                                            />

                                                            Ver detalhes
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                            {viagensPaginadas.map(
                                (item) => {
                                    const status =
                                        statusConfig(
                                            item.current_status
                                        );

                                    const StatusIcon =
                                        status.icon;

                                    const valorViagem =
                                        obterValorViagem(
                                            item
                                        );

                                    return (
                                        <article
                                            key={
                                                item.trip_request_id
                                            }
                                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_3px_15px_rgba(15,23,42,0.04)]"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                                        ID da viagem
                                                    </p>

                                                    <p className="mt-1 text-sm font-extrabold text-slate-800">
                                                        #
                                                        {
                                                            item.trip_request_id
                                                        }
                                                    </p>
                                                </div>

                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold ${status.className}`}
                                                >
                                                    <StatusIcon
                                                        size={
                                                            12
                                                        }
                                                    />

                                                    {
                                                        status.label
                                                    }
                                                </span>
                                            </div>

                                            <div className="mt-5">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                                                        <MapPin
                                                            size={
                                                                14
                                                            }
                                                            className="text-emerald-500"
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                            Origem
                                                        </p>

                                                        <p className="mt-1 text-sm leading-5 text-slate-700">
                                                            {
                                                                item.pickup_address
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="ml-4 h-6 border-l border-dashed border-slate-200" />

                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50">
                                                        <MapPin
                                                            size={
                                                                14
                                                            }
                                                            className="text-red-500"
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                            Destino
                                                        </p>

                                                        <p className="mt-1 text-sm leading-5 text-slate-700">
                                                            {
                                                                item.destination_address
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        Valor
                                                    </p>

                                                    <p
                                                        className={`mt-1 text-sm ${
                                                            valorViagem.type ===
                                                            "finalizada"
                                                                ? "font-extrabold text-slate-800"
                                                                : valorViagem.type ===
                                                                  "cancelada"
                                                                ? "font-extrabold text-slate-600"
                                                                : valorViagem.type ===
                                                                  "aguardando"
                                                                ? "font-medium text-slate-400"
                                                                : "font-extrabold text-slate-800"
                                                        }`}
                                                    >
                                                        {
                                                            valorViagem.value
                                                        }
                                                    </p>
                                                </div>

                                                <div className="flex justify-end">
                                                    <Link
                                                        href={`/motorista/viagens/${item.trip_request_id}`}
                                                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-teal-50 px-3 text-xs font-bold text-teal-700 transition hover:bg-teal-100"
                                                    >
                                                        <Eye
                                                            size={
                                                                14
                                                            }
                                                        />

                                                        Detalhes
                                                    </Link>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                }
                            )}
                        </div>
                    </>
                )}

                {!loading && totalViagens > 0 && (
                    <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <p className="text-xs text-slate-400">
                            Mostrando{" "}
                            <strong className="text-slate-600">
                                {indiceInicio + 1}
                            </strong>{" "}
                            até{" "}
                            <strong className="text-slate-600">
                                {Math.min(
                                    indiceFim,
                                    totalViagens
                                )}
                            </strong>{" "}
                            de{" "}
                            <strong className="text-slate-600">
                                {totalViagens}
                            </strong>{" "}
                            viagens
                        </p>

                        {totalPaginas > 1 && (
                            <div className="flex items-center justify-center gap-1.5">
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
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft size={16} />
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
                                            <div
                                                key={
                                                    pagina
                                                }
                                                className="flex items-center gap-1.5"
                                            >
                                                {mostrarReticencias && (
                                                    <span className="px-1 text-xs text-slate-400">
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
                                                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-xs font-bold transition ${
                                                        pagina ===
                                                        paginaSegura
                                                            ? "border-teal-500 bg-teal-500 text-white shadow-sm"
                                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    {
                                                        pagina
                                                    }
                                                </button>
                                            </div>
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
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronRight
                                        size={16}
                                    />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}