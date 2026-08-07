"use client";
import { useEffect, useState } from "react";
import { MapPin, Eye, ReceiptText, MoreVertical, CalendarDays } from "lucide-react";
import Link from "next/link";

interface Trip {
  pickup_city: string;
  pickup_state: string;
  destination_city: string;
  destination_state: string;
  trip_request_id: number;
  pickup_address: string;
  destination_address: string;
  valor: number;
  current_status: string;
  created_at: string;
}

export default function TripsTable() {
  const [rows, setRows] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  const viagens = rows
    .sort((a, b) => b.trip_request_id - a.trip_request_id);
  const totalPages = Math.ceil(viagens.length / ITEMS_PER_PAGE);

  const currentTrips = viagens.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
    <div className="min-h-screen from-teal-900 to-teal-500 p-6">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-start gap-4">
          <div className="mt-1">
            <ReceiptText
              size={38}
              strokeWidth={2.2}
              className="text-white"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none">
              Relatórios de Viagens
            </h1>
            <p className="text-teal-100 text-sm mt-1">
              Confira o histórico completo de viagens realizadas.
            </p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-gradient-to-r text-sm text-center m-auto from-[#0c453f] to-[#133631] text-white">
              <th className="rounded-tl-xl px-6 py-4 font-semibold">
                Data
              </th>
              <th className="px-6 py-4 font-semibold">
                Origem
              </th>
              <th className="px-6 py-4 font-semibold">
                Destino
              </th>
              <th className="px-6 py-4 font-semibold">
                Valor
              </th>
              <th className="px-6 py-4 font-semibold">
                Status
              </th>
              <th className="rounded-tr-xl px-6 py-4 text-center"></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-gray-500"
                >
                  Carregando viagens...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-red-600"
                >
                  Nenhuma viagem encontrada.
                </td>
              </tr>
            ) : (currentTrips.map((item) => (
              <tr
                key={item.trip_request_id}
                className="border-b border-gray-100 transition hover:bg-gray-50"
              >
                <td className="px-6 py-5 align-top">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
                      <CalendarDays
                        size={22}
                        className="text-[#149C8B]"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.created_at &&
                          new Date(item.created_at).toLocaleDateString(
                            "pt-BR"
                          )}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.created_at &&
                          new Date(item.created_at).toLocaleTimeString(
                            "pt-BR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 align-top">
                  <div className="flex gap-3">
                    <MapPin
                      size={35}
                      className="mt-1 text-[#149C8B]"
                    />
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {item.pickup_address}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.pickup_city || "São Paulo"} -{" "}
                        {item.pickup_state || "SP"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 align-top">
                  <div className="flex gap-3">
                    <MapPin
                      size={35}
                      className="mt-1 text-[#149C8B]"
                    />
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {item.destination_address}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.destination_city || "São Paulo"} -{" "}
                        {item.destination_state || "SP"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 align-top">
                  {item.valor === 0 ? (
                    <span className="text-gray-400">
                      Aguardando
                    </span>
                  ) : (
                    <span className="text-base font-bold text-[#149C8B]">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.valor)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-5 align-top">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold
                            ${item.current_status === "completed"
                        ? "bg-green-100 text-green-700"
                        : item.current_status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : item.current_status === "in_progress"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full
                                ${item.current_status === "completed"
                          ? "bg-green-600"
                          : item.current_status === "cancelled"
                            ? "bg-red-600"
                            : item.current_status === "in_progress"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                        }`}
                    ></span>
                    {traduzirStatus(item.current_status)}
                  </span>
                </td>
                <td className="px-6 py-5 text-center align-top">
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      href={`/passageiro/trips/${item.trip_request_id}`}
                      className="rounded-lg p-2 transition hover:bg-gray-100"
                    >
                      <Eye
                        size={18}
                        className="text-[#149C8B]"
                      />
                    </Link>
                    <button className="rounded-lg cursor-pointer p-2 transition hover:bg-gray-100">
                      <MoreVertical
                        size={18}
                        className="text-gray-500"
                      />
                    </button>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-black">
            Página {currentPage} de {totalPages || 1}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-lg cursor-pointer border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-100"
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`h-10 w-10 rounded-lg cursor-pointer text-sm font-semibold transition ${currentPage === i + 1
                  ? "bg-[#149C8B] text-white"
                  : "border hover:bg-gray-100"
                  }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="rounded-lg cursor-pointer border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-100"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}