"use client";

import { useEffect, useState } from "react";
import { MapPin, Eye } from "lucide-react";
import Link from "next/link";

interface Trip {
  trip_request_id: number;
  pickup_address: string;
  destination_address: string;
  valor: number;
  current_status: string;
}

export default function TripsTable() {
  const [rows, setRows] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch("/api/trips", {
          credentials: "include",
        });

        if (!res.ok) {
          console.error("Erro API:", res.status);
          setRows([]);
          return;
        }

        const data = await res.json();

        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.trips)
            ? data.trips
            : [];

        setRows(lista);
      } catch (error) {
        console.error("Erro ao buscar viagens:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const traduzirStatus = (status: string) => {
    switch (status) {
      case "completed":
        return "Finalizada";
      case "cancelled":
        return "Cancelada";
      case "in_progress":
        return "Em andamento";
      default:
        return "Pendente";
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

  return (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-3">Relatórios de Viagens</h1>
        <div className="bg-white rounded-2xl shadow p-6">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr className="text-gray-600 uppercase text-xs">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Origem x Destino</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-center">Ação</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-400">
                    Carregando...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-red-500">
                    Nenhuma corrida encontrada 🚫
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.trip_request_id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold">
                      {item.trip_request_id}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <MapPin size={18} className="text-green-500" />
                          <span className="text-xs">{item.pickup_address}</span>
                        </div>
                        <span className="text-gray-400">→</span>
                        <div className="flex items-center gap-1">
                          <MapPin size={18} className="text-red-500" />
                          <span className="text-xs">{item.destination_address}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {item.valor === 0 ? (
                        <span className="text-gray-400">Aguardando</span>
                      ) : (
                        new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.valor)
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${item.current_status === "completed"
                          ? "bg-green-100 text-green-600"
                          : item.current_status === "cancelled"
                            ? "bg-red-100 text-red-600"
                            : item.current_status === "in_progress"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {traduzirStatus(item.current_status)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Link href={`/passageiro/trips/${item.trip_request_id}`}>
                        <Eye size={16} className="cursor-pointer" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}