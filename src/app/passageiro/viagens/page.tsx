"use client";

import { useEffect, useMemo, useState } from "react";
import { ReceiptText } from "lucide-react";
import { fetchTripsSafe } from "../../lib/authFetch";
import TripsTable, { type TripRow } from "../../components/TripsTable";

export default function ViagensPage() {
  const [rows, setRows] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const { trips } = await fetchTripsSafe();
        setRows(Array.isArray(trips) ? trips : []);
        setCurrentPage(1);
      } catch (error) {
        console.error("Erro ao buscar viagens:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const viagens = useMemo(
    () =>
      [...rows].sort(
        (a, b) => Number(b.trip_request_id) - Number(a.trip_request_id)
      ),
    [rows]
  );

  const totalPages = Math.max(1, Math.ceil(viagens.length / ITEMS_PER_PAGE));
  const currentTrips = viagens.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-gray-400 p-8 shadow-lg">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="font-medium text-gray-300">
            Aguarde, carregando página...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto mb-8 max-w-7xl">
        <div className="flex items-start gap-4">
          <div className="mt-1">
            <ReceiptText size={38} strokeWidth={2.2} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none text-white">
              Relatórios de Viagens
            </h1>
            <p className="mt-1 text-sm text-teal-100">
              Confira o histórico completo de viagens realizadas.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-white shadow-lg">
        <TripsTable
          trips={currentTrips}
          loading={false}
          emptyMessage="Nenhuma viagem encontrada."
          headerTone="dark"
        />

        <div className="flex items-center justify-between px-6 py-5">
          <p className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
            {viagens.length > 0 ? ` · ${viagens.length} viagem(ns)` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="cursor-pointer rounded-lg border px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentPage(i + 1)}
                className={`h-10 w-10 cursor-pointer rounded-lg text-sm font-semibold transition ${
                  currentPage === i + 1
                    ? "bg-[#149C8B] text-white"
                    : "border hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="cursor-pointer rounded-lg border px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
