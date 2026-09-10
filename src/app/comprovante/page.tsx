"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    MapPin,
    Printer,
    CarFront,
    CheckCircle2,
    XCircle,
    Clock3,
} from "lucide-react";

type Trip = {
    trip_request_id: number;
    pickup_address: string;
    destination_address: string;
    valor: number;
    current_status: string;
};

export default function TripDetailPage() {
    const params = useParams();
    const id = params?.id;

    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        async function fetchTrip() {
            try {
                const res = await fetch(`/api/trips/${id}`);
                const data = await res.json();

                setTrip(data);
            } catch (error) {
                console.error("Erro ao buscar corrida");
            } finally {
                setLoading(false);
            }
        }

        fetchTrip();
    }, [id]);

    useEffect(() => {
        const style = document.createElement("style");

        style.innerHTML = `
            @media print {

                body * {
                    visibility: hidden;
                }

                #print-area,
                #print-area * {
                    visibility: visible;
                }

                #print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    border-radius: 0;
                    box-shadow: none;
                    border: none;
                }

                .print-hide {
                    display: none !important;
                }

                @page {
                    size: auto;
                    margin: 0;
                }
            }
        `;

        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const traduzirStatus = (status: string) => {
        switch (status) {
            case "completed":
                return "Finalizada";

            case "cancelled":
                return "Cancelada";

            case "in_progress":
                return "Em andamento";

            case "pending":
                return "Pendente";

            default:
                return status;
        }
    };

    const renderStatus = () => {
        switch (trip?.current_status) {
            case "completed":
                return {
                    icon: (
                        <CheckCircle2
                            size={18}
                            className="text-emerald-500"
                        />
                    ),
                    text: "text-emerald-600",
                    bg: "bg-emerald-50",
                    border: "border-emerald-100",
                };

            case "cancelled":
                return {
                    icon: (
                        <XCircle
                            size={18}
                            className="text-red-500"
                        />
                    ),
                    text: "text-red-500",
                    bg: "bg-red-50",
                    border: "border-red-100",
                };

            default:
                return {
                    icon: (
                        <Clock3
                            size={18}
                            className="text-yellow-500"
                        />
                    ),
                    text: "text-yellow-600",
                    bg: "bg-yellow-50",
                    border: "border-yellow-100",
                };
        }
    };

    const statusStyle = renderStatus();

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-[32px] p-10 shadow-2xl flex flex-col items-center gap-5">
                    <div className="w-12 h-12 rounded-full border-4 border-black border-t-transparent animate-spin"></div>

                    <p className="text-gray-600 font-medium">
                        Carregando comprovante...
                    </p>
                </div>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-[32px] p-10 shadow-xl">
                    <p className="text-red-500 font-semibold">
                        Corrida não encontrada
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-100 py-10 px-4">

            {/* BOTÃO */}
            <div className="max-w-4xl mx-auto mb-6 print-hide">
                <button
                    onClick={() => window.print()}
                    className="
                        h-12
                        px-6
                        rounded-2xl
                        bg-black
                        hover:bg-zinc-800
                        text-white
                        font-semibold
                        flex
                        items-center
                        gap-2
                        transition-all
                        duration-300
                        shadow-xl
                        hover:scale-[1.02]
                        active:scale-[0.98]
                    "
                >
                    <Printer size={18} />
                    Imprimir comprovante
                </button>
            </div>

            {/* COMPROVANTE */}
            <div
                id="print-area"
                className="
                    max-w-4xl
                    mx-auto
                    bg-white
                    rounded-[40px]
                    overflow-hidden
                    border
                    border-zinc-200
                    shadow-[0_20px_70px_rgba(0,0,0,0.08)]
                "
            >
                {/* HEADER */}
                <div
                    className="
                        relative
                        overflow-hidden
                        bg-gradient-to-r
                        from-zinc-950
                        via-black
                        to-zinc-900
                        px-8
                        py-10
                        text-white
                    "
                >
                    <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full"></div>

                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="uppercase tracking-[0.3em] text-xs text-white/50">
                                MAYLON DRIVE
                            </p>

                            <h1 className="text-4xl font-black mt-3 leading-tight">
                                Comprovante
                                <br />
                                de Corrida
                            </h1>

                            <p className="text-sm text-white/60 mt-4">
                                Corrida #{trip.trip_request_id}
                            </p>
                        </div>

                        <div
                            className="
                                w-24
                                h-24
                                rounded-[32px]
                                bg-white/10
                                border
                                border-white/10
                                flex
                                items-center
                                justify-center
                                backdrop-blur-xl
                            "
                        >
                            <CarFront size={38} />
                        </div>
                    </div>
                </div>

                {/* CONTEÚDO */}
                <div className="p-8 md:p-10">

                    {/* STATUS */}
                    <div
                        className={`
                            flex
                            flex-col
                            md:flex-row
                            md:items-center
                            md:justify-between
                            gap-5
                            rounded-[30px]
                            border
                            p-6
                            ${statusStyle.bg}
                            ${statusStyle.border}
                        `}
                    >
                        <div>
                            <p className="text-sm font-semibold text-gray-500">
                                Status da viagem
                            </p>

                            <div className="mt-3 flex items-center gap-2">
                                {statusStyle.icon}

                                <span
                                    className={`font-bold ${statusStyle.text}`}
                                >
                                    {traduzirStatus(trip.current_status)}
                                </span>
                            </div>
                        </div>

                        <div className="md:text-right">
                            <p className="text-sm font-semibold text-gray-500">
                                Código da corrida
                            </p>

                            <h2 className="text-2xl font-black text-black mt-2">
                                #{trip.trip_request_id}
                            </h2>
                        </div>
                    </div>

                    {/* MAPA */}
                    <div className="mt-8">
                        <div className="mb-5">
                            <p className="text-sm font-semibold text-gray-500">
                                Visualização da rota
                            </p>

                            <h3 className="text-2xl font-black text-black mt-1">
                                Trajeto da corrida
                            </h3>
                        </div>

                        <div
                            className="
                                overflow-hidden
                                rounded-[32px]
                                border
                                border-zinc-200
                                shadow-xl
                            "
                        >
                            <iframe
                                title="Mapa da corrida"
                                width="100%"
                                height="380"
                                loading="lazy"
                                allowFullScreen
                                className="w-full"
                                src={`https://www.google.com/maps?q=${encodeURIComponent(
                                    `${trip.pickup_address} ${trip.destination_address}`
                                )}&output=embed`}
                            />
                        </div>
                    </div>

                    {/* ENDEREÇOS */}
                    <div className="grid md:grid-cols-2 gap-5 mt-8">

                        {/* EMBARQUE */}
                        <div
                            className="
                                bg-emerald-50
                                border
                                border-emerald-100
                                rounded-[30px]
                                p-6
                            "
                        >
                            <div className="flex items-start gap-4">
                                <div
                                    className="
                                        w-14
                                        h-14
                                        rounded-2xl
                                        bg-emerald-100
                                        flex
                                        items-center
                                        justify-center
                                        shrink-0
                                    "
                                >
                                    <MapPin
                                        size={22}
                                        className="text-emerald-600"
                                    />
                                </div>

                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 font-bold">
                                        Embarque
                                    </p>

                                    <p className="text-sm text-gray-800 font-semibold leading-relaxed mt-3">
                                        {trip.pickup_address}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* DESTINO */}
                        <div
                            className="
                                bg-red-50
                                border
                                border-red-100
                                rounded-[30px]
                                p-6
                            "
                        >
                            <div className="flex items-start gap-4">
                                <div
                                    className="
                                        w-14
                                        h-14
                                        rounded-2xl
                                        bg-red-100
                                        flex
                                        items-center
                                        justify-center
                                        shrink-0
                                    "
                                >
                                    <MapPin
                                        size={22}
                                        className="text-red-500"
                                    />
                                </div>

                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-red-500 font-bold">
                                        Destino
                                    </p>

                                    <p className="text-sm text-gray-800 font-semibold leading-relaxed mt-3">
                                        {trip.destination_address}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* INFO */}
                    <div className="grid grid-cols-2 gap-5 mt-8">

                        <div
                            className="
                                bg-zinc-50
                                border
                                border-zinc-200
                                rounded-[30px]
                                p-6
                            "
                        >
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                                Data
                            </p>

                            <h3 className="text-2xl font-black text-black mt-3">
                                {new Date().toLocaleDateString("pt-BR")}
                            </h3>
                        </div>

                        <div
                            className="
                                bg-zinc-50
                                border
                                border-zinc-200
                                rounded-[30px]
                                p-6
                            "
                        >
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                                Horário
                            </p>

                            <h3 className="text-2xl font-black text-black mt-3">
                                {new Date().toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </h3>
                        </div>
                    </div>

                    {/* VALOR */}
                    <div
                        className="
                            mt-8
                            rounded-[34px]
                            overflow-hidden
                            relative
                            bg-gradient-to-r
                            from-black
                            via-zinc-900
                            to-black
                            p-8
                            text-white
                        "
                    >
                        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full"></div>

                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-white/50 uppercase tracking-[0.2em] text-xs">
                                    Valor total
                                </p>

                                <h2 className="text-5xl font-black mt-4">
                                    {trip.valor === 0
                                        ? "R$ 0,00"
                                        : new Intl.NumberFormat("pt-BR", {
                                              style: "currency",
                                              currency: "BRL",
                                          }).format(trip.valor)}
                                </h2>
                            </div>

                            <div
                                className="
                                    w-24
                                    h-24
                                    rounded-[32px]
                                    bg-white/10
                                    border
                                    border-white/10
                                    flex
                                    items-center
                                    justify-center
                                "
                            >
                                <CarFront size={38} />
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-8 border-t border-dashed border-zinc-200 pt-6 text-center">
                        <p className="text-sm text-gray-400">
                            Este comprovante foi gerado automaticamente pela plataforma.
                        </p>

                        <p className="text-sm text-gray-400 mt-1">
                            Obrigado por utilizar a Maylon Drive.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}