"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MapPin } from "lucide-react";

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

        const fetchTrip = async () => {
            try {
                const res = await fetch(`/api/trips/${id}`);
                const data = await res.json();
                setTrip(data);
            } catch (error) {
                console.error("Erro ao buscar corrida");
            } finally {
                setLoading(false);
            }
        };

        fetchTrip();
    }, [id]);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-gray-400 p-8 rounded-2xl shadow-lg flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-300 font-medium">
                        Aguarde, carregando página...
                    </p>
                </div>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="p-6 text-center text-red-500">
                Corrida não encontrada
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="bg-white shadow rounded-2xl p-6 space-y-6">

                <h1 className="text-xl font-bold">
                    Detalhes da Corrida #{trip.trip_request_id}
                </h1>
                <div className="text-center border-b pb-3 mb-4 print:block hidden">
                    <h1 className="text-lg font-bold">Comprovante de Corrida</h1>
                    <p className="text-xs text-gray-500">
                        ID: #{trip.trip_request_id}
                    </p>
                </div>

                {/* STATUS */}
                <div>
                    <span className="text-sm text-gray-500">Status</span>
                    <div className="mt-1">
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${trip.current_status === "completed"
                                ? "bg-green-100 text-green-600"
                                : trip.current_status === "cancelled"
                                    ? "bg-red-100 text-red-600"
                                    : trip.current_status === "in_progress"
                                        ? "bg-yellow-100 text-yellow-600"
                                        : "bg-gray-100 text-gray-600"
                                }`}
                        >
                            {traduzirStatus(trip.current_status)}
                        </span>
                    </div>
                </div>

                {/* ENDEREÇOS */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <MapPin className="text-green-500" size={18} />
                        <span>{trip.pickup_address}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <MapPin className="text-red-500" size={18} />
                        <span>{trip.destination_address}</span>
                    </div>
                </div>

                {/* VALOR */}
                <div>
                    <span className="text-sm text-gray-500">Valor da viagem</span>
                    <p className="text-lg font-semibold text-black mt-1">
                        {trip.valor === 0 ? (
                            <span className="text-gray-400">Aguardando cálculo</span>
                        ) : (
                            new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                            }).format(trip.valor)
                        )}
                    </p>
                    <button
                        onClick={() => window.print()}
                        className="mt-4 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm"
                    >
                        Imprimir
                    </button>
                </div>

            </div>
        </div>
    );
}