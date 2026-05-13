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
};

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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-6">
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
            <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-6">
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

    const statusColor =
        trip.current_status === "completed"
            ? "bg-emerald-100 text-emerald-700"
            : trip.current_status === "cancelled"
                ? "bg-red-100 text-red-600"
                : "bg-yellow-100 text-yellow-700";

    const statusLabel =
        trip.current_status === "completed"
            ? "Concluída"
            : trip.current_status === "cancelled"
                ? "Cancelada"
                : "Pendente";

    return (
        <div className="min-h-screen p-4 lg:p-4">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-900 rounded-[35px] p-8 text-white shadow-2xl overflow-hidden relative border border-white/10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-300/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-xl">
                                    <CarFront className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <p className="text-white uppercase text-teal-100/80 text-sm font-medium">
                                        Maylon
                                    </p>
                                    <h1 className="text-2xl lg:text-3xl font-black mt-0 drop-shadow-lg">
                                        Corrida #{trip.ref_id}
                                    </h1>
                                </div>
                            </div>
                            <p className="text-white mt-4 max-w-2xl leading-relaxed text-sm tracking-[0.1px]">
                                Visualize informações completas da viagem, status da corrida,
                                passageiro, motorista e detalhes financeiros.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 min-w-[180px] shadow-xl">
                                <p className="text-white text-sm">
                                    Valor Total
                                </p>
                                <h2 className="text-2xl font-semibold mt-1">
                                    {trip.current_status === "cancelled"
                                        ? "R$ 00,00"
                                        : `R$ ${Number(trip.actual_fare || 0).toFixed(2)}`}
                                </h2>
                            </div>
                            <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 min-w-[180px] shadow-xl">
                                <p className="text-white text-sm">
                                    Distância
                                </p>
                                <h2 className="text-2xl font-semibold mt-1">
                                    {trip.current_status === "cancelled"
                                        ? "0 km"
                                        : `${trip.actual_distance || 0} km`}
                                </h2>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 flex flex-col gap-6">
                        <div className="bg-white rounded-[35px] p-7 shadow-sm border border-zinc-100">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-zinc-900">
                                        Status da Corrida
                                    </h2>

                                    <p className="text-zinc-500 mt-1">
                                        Informações atualizadas da viagem
                                    </p>
                                </div>

                                <div
                                    className={`px-5 py-2 rounded-2xl font-semibold ${statusColor}`}
                                >
                                    {statusLabel}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-5 mt-8">
                                <div className="bg-zinc-50 rounded-3xl p-5">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                                        <CalendarDays className="w-6 h-6 text-emerald-600" />
                                    </div>

                                    <p className="text-zinc-500 text-sm">
                                        Data da corrida
                                    </p>

                                    <h3 className="font-bold text-lg mt-1">
                                        {new Date(trip.created_at).toLocaleDateString(
                                            "pt-BR"
                                        )}
                                    </h3>
                                </div>

                                <div className="bg-zinc-50 rounded-3xl p-5">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                                        <Clock3 className="w-6 h-6 text-blue-600" />
                                    </div>

                                    <p className="text-zinc-500 text-sm">
                                        Pagamento
                                    </p>

                                    <h3 className="font-bold text-lg mt-1 capitalize">
                                        {trip.payment_status || "unpaid"}
                                    </h3>
                                </div>

                                <div className="bg-zinc-50 rounded-3xl p-5">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                                        <Wallet className="w-6 h-6 text-orange-600" />
                                    </div>

                                    <p className="text-zinc-500 text-sm">
                                        Valor
                                    </p>

                                    <h3 className="font-bold text-lg mt-1">
                                        R$ {Number(trip.actual_fare || 0).toFixed(2)}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* ROTA */}
                        <div className="bg-white rounded-[35px] p-7 shadow-sm border border-zinc-100">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white">
                                    <Navigation className="w-7 h-7" />
                                </div>

                                <div>
                                    <h2 className="text-2xl font-black text-zinc-900">
                                        Trajeto da Corrida
                                    </h2>

                                    <p className="text-zinc-500">
                                        Origem e destino da viagem
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-8">
                                <div className="flex gap-5">
                                    <div className="flex flex-col items-center">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500"></div>

                                        <div className="w-1 h-full bg-zinc-200"></div>
                                    </div>

                                    <div>
                                        <p className="text-zinc-500 text-sm">
                                            Local de embarque
                                        </p>

                                        <h3 className="text-xl font-bold text-zinc-900 mt-1">
                                            {trip.entrance || "Não informado"}
                                        </h3>
                                    </div>
                                </div>

                                <div className="flex gap-5">
                                    <div className="flex flex-col items-center">
                                        <div className="w-5 h-5 rounded-full bg-red-500"></div>
                                    </div>

                                    <div>
                                        <p className="text-zinc-500 text-sm">
                                            Destino final
                                        </p>

                                        <h3 className="text-xl font-bold text-zinc-900 mt-1">
                                            {trip.note || "Não informado"}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                            <div className="maps">
                                
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex flex-col gap-6">
                        {/* PASSAGEIRO */}
                        <div className="bg-white rounded-[35px] p-7 shadow-sm border border-zinc-100">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                    <User className="w-7 h-7 text-emerald-600" />
                                </div>

                                <div>
                                    <h2 className="text-2xl font-black text-zinc-900">
                                        Passageiro
                                    </h2>

                                    <p className="text-zinc-500">
                                        Informações do cliente
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-5">
                                <div>
                                    <p className="text-zinc-500 text-sm">
                                        Nome
                                    </p>

                                    <h3 className="font-bold text-xl text-zinc-900">
                                        {trip.passenger_name || "Não informado"}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-4 bg-zinc-50 rounded-2xl p-4">
                                    <Phone className="w-5 h-5 text-zinc-500" />

                                    <span className="text-zinc-700">
                                        {trip.passenger_phone || "Não informado"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 bg-zinc-50 rounded-2xl p-4">
                                    <Mail className="w-5 h-5 text-zinc-500" />

                                    <span className="text-zinc-700 break-all">
                                        {trip.passenger_email || "Não informado"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 bg-zinc-50 rounded-2xl p-4">
                                    <Receipt className="w-5 h-5 text-zinc-500" />   
                                    <Link href={`/comprovante`} className="text-zinc-700">
                                        Ver comprovante
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* MOTORISTA */}
                        <div className="bg-white rounded-[35px] p-7 shadow-sm border border-zinc-100">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                                    <CarFront className="w-7 h-7 text-blue-600" />
                                </div>

                                <div>
                                    <h2 className="text-2xl font-black text-zinc-900">
                                        Motorista
                                    </h2>

                                    <p className="text-zinc-500">
                                        Dados do motorista
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-5">
                                <div>
                                    <p className="text-zinc-500 text-sm">
                                        Nome
                                    </p>

                                    <h3 className="font-bold text-xl text-zinc-900">
                                        {trip.driver_name || "Aguardando motorista"}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-4 bg-zinc-50 rounded-2xl p-4">
                                    <Phone className="w-5 h-5 text-zinc-500" />

                                    <span className="text-zinc-700">
                                        {trip.driver_phone || "Não informado"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={`rounded-[35px] p-6 text-white shadow-xl ${trip.current_status === "completed"
                            ? "bg-gradient-to-br from-emerald-500 to-emerald-700"
                            : trip.current_status === "cancelled"
                                ? "bg-gradient-to-br from-red-500 to-red-700"
                                : "bg-gradient-to-br from-yellow-500 to-yellow-700"}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p
                                        className={`text-sm ${trip.current_status === "completed"
                                            ? "text-emerald-100"
                                            : trip.current_status === "cancelled"
                                                ? "text-red-100"
                                                : "text-yellow-100"
                                            }`}
                                    >
                                        Total da corrida
                                    </p>
                                    <h2 className="text-4xl font-semibold mt-2">
                                        R$ {Number(trip.actual_fare || 0).toFixed(2)}
                                    </h2>
                                </div>
                                {trip.current_status === "completed" ? (
                                    <CheckCircle2 className="w-10 h-10" />
                                ) : (
                                    <XCircle className="w-10 h-10" />
                                )}
                            </div>
                            <div className="mt-3 border-t border-white/30 pt-3 flex items-center justify-between">
                                <span
                                    className={`text-sm ${trip.current_status === "completed"
                                        ? "text-emerald-100"
                                        : trip.current_status === "cancelled"
                                            ? "text-red-100"
                                            : "text-yellow-100"
                                        }`}
                                >
                                    Status atual
                                </span>
                                <span className="text-sm font-semibold uppercase">
                                    {statusLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}