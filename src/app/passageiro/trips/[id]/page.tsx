"use client";
import { useEffect, useState, use } from "react";
import {
    CarFront,
    CalendarDays,
    Wallet,
    User,
    Phone,
    Mail,
    Clock3,
    CheckCircle2,
    XCircle,
    Receipt,
    Navigation,
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
        ? "bg-red-100 text-red-700"
        : isCompleted
            ? "bg-emerald-100 text-emerald-700"
            : "bg-yellow-100 text-yellow-700";
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
            <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
                <div className="bg-white rounded-[35px] shadow-2xl p-12 flex flex-col items-center gap-6 w-full max-w-md">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-zinc-800">
                            Carregando corrida
                        </h2>
                        <p className="text-zinc-500 mt-2">
                            Aguarde enquanto buscamos os detalhes...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
                <div className="bg-white rounded-[35px] shadow-xl p-12 text-center max-w-md w-full">
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-zinc-800">
                        Corrida não encontrada
                    </h2>
                    <p className="text-zinc-500 mt-3">
                        Não foi possível localizar esta corrida.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 lg:p-4">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                <div className={`rounded-[35px] p-6 py-5 text-white shadow-2xl overflow-hidden relative border border-white/10 ${isCanceled
                    ? "bg-gradient-to-br from-red-600 to-red-900"
                    : isCompleted
                        ? "bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-900"
                        : "bg-gradient-to-br from-yellow-500 to-yellow-700"
                    }`}>
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-xl">
                                    <CarFront className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-black mt-0 drop-shadow-lg">
                                        Corrida #{trip.ref_id}
                                    </h1>
                                    <p className="text-white mt-1 max-w-2xl leading-relaxed text-sm tracking-[0.1px]">
                                        Visualize informações completas da viagem.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 min-w-[180px] shadow-xl">
                                <p className="text-white text-sm">
                                    Valor Total
                                </p>
                                <h2 className="text-2xl font-semibold mt-1">
                                    {isCanceled
                                        ? "R$ 0,00"
                                        : `R$ ${Number(trip.actual_fare || 0).toFixed(2)}`}
                                </h2>
                            </div>
                            <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 min-w-[180px] shadow-xl">
                                <p className="text-white text-sm">
                                    Distância
                                </p>
                                <h2 className="text-2xl font-semibold mt-1">
                                    {isCanceled
                                        ? "0 km"
                                        : `${trip.actual_distance || 0} km`}
                                </h2>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 flex flex-col gap-6">
                        <div className="bg-white rounded-[35px] p-7 shadow-lg border border-zinc-100">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                                <div>
                                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                                        Status da Corrida
                                    </h2>
                                    <p className="text-zinc-500 text-xs mt-1">
                                        Informações atualizadas da viagem em tempo real
                                    </p>
                                </div>
                                <div className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm ${statusColor}`}>
                                    {statusLabel}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="group bg-gradient-to-br from-zinc-50 to-zinc-100/70 rounded-[28px] p-6 pb-3 border border-zinc-100 hover:shadow-md transition-all duration-300">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                                        <CalendarDays className="w-7 h-7 text-emerald-600" />
                                    </div>
                                    <p className="text-zinc-500 text-sm font-medium">
                                        Data da corrida
                                    </p>
                                    <h3 className="font-black text-sm text-zinc-900 mt-0">
                                        {new Date(trip.created_at).toLocaleString("pt-BR")}
                                    </h3>
                                </div>
                                <div className="group bg-gradient-to-br from-zinc-50 to-zinc-100/70 rounded-[28px] p-6 border border-zinc-100 hover:shadow-md transition-all duration-300">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                                        <Clock3 className="w-7 h-7 text-blue-600" />
                                    </div>
                                    <p className="text-zinc-500 text-sm font-medium">
                                        Meio de pagamento
                                    </p>
                                    <div className="mt-2">
                                        <span
                                            className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold ${trip.payment_method === "cash"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-blue-100 text-blue-700"
                                                }`}
                                        >
                                            {traduzirMetodoPagamento(trip.payment_method)}
                                        </span>
                                    </div>
                                </div>
                                <div className="group bg-gradient-to-br from-zinc-50 to-zinc-100/70 rounded-[28px] p-6 border border-zinc-100 hover:shadow-md transition-all duration-300">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                                        <Wallet className="w-7 h-7 text-orange-600" />
                                    </div>
                                    <p className="text-zinc-500 text-sm font-medium">
                                        Valor da corrida
                                    </p>
                                    <h3 className="font-black text-xl text-zinc-900 mt-0">
                                        {isCanceled
                                            ? "R$ 0,00"
                                            : `R$ ${Number(trip.actual_fare || 0).toFixed(2)}`}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        {!isCanceled && (
                            <div className="bg-white rounded-[35px] p-7 shadow-sm border border-zinc-100">
                                <div className="flex items-center gap-4 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-zinc-900">
                                            Trajeto da Corrida
                                        </h2>
                                        <p className="text-zinc-500 text-xs mt-1">
                                            Origem e destino da viagem
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex gap-5">
                                            <div className="flex flex-col items-center">
                                                <div className="w-5 h-5 rounded-full bg-emerald-500"></div>
                                                <div className="w-1 h-full bg-zinc-200"></div>
                                            </div>
                                            <div>
                                                <p className="text-zinc-500 text-xs">
                                                    Local de embarque
                                                </p>
                                                <h3 className="text-base font-bold text-zinc-900 mt-0">
                                                    {trip.entrance || "Não informado"}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="flex gap-5">
                                            <div className="flex flex-col items-center">
                                                <div className="w-5 h-5 rounded-full bg-red-500"></div>
                                            </div>
                                            <div>
                                                <p className="text-zinc-500 text-xs">
                                                    Destino final
                                                </p>
                                                <h3 className="text-base font-bold text-zinc-900 mt-0">
                                                    {trip.note || "Não informado"}
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-[28px] overflow-hidden border border-zinc-200 shadow-sm h-[350px]">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            loading="lazy"
                                            allowFullScreen
                                            referrerPolicy="no-referrer-when-downgrade"
                                            src={`https://www.google.com/maps?q=${encodeURIComponent(trip.entrance || "São Paulo")
                                                }&output=embed`}
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="bg-white rounded-[35px] p-7 shadow-sm border border-zinc-100">
                            <div className="flex items-center gap-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-zinc-900">
                                        Motorista
                                    </h2>
                                    <p className="text-zinc-500 text-xs mt-0">
                                        Informações do condutor
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-5">
                                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                    <p className="text-zinc-500 text-xs mb-1">
                                        Nome do motorista
                                    </p>

                                    <h3 className="text-lg font-bold text-zinc-900">
                                        {trip.driver_name || "Não informado"}
                                    </h3>
                                </div>

                                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                                    <p className="text-zinc-500 text-xs mb-1">
                                        Telefone
                                    </p>

                                    <div className="flex items-center gap-3">
                                        <Phone className="w-5 h-5 text-emerald-600" />

                                        <h3 className="text-base font-bold text-zinc-900">
                                            {trip.driver_phone || "Não informado"}
                                        </h3>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white">
                                    <p className="text-sm text-white/80">
                                        Status do motorista
                                    </p>

                                    <h3 className="text-xl font-black mt-1">
                                        Disponível
                                    </h3>

                                    <p className="text-sm text-white/80 mt-3 leading-relaxed">
                                        Motorista vinculado à corrida e pronto para atendimento.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}