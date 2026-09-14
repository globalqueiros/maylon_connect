"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Route,
} from "lucide-react";
import { fetchTripsSafe } from "../../lib/authFetch";
import TripsTable, { type TripRow } from "../../components/TripsTable";

const ITEMS_PER_PAGE = 20;

export default function ViagensPage() {
  const [rows, setRows] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  async function loadTrips() {
    setLoading(true);
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
  }

  useEffect(() => {
    void loadTrips();
  }, []);

  const viagens = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          Number(b.trip_request_id ?? 0) -
          Number(a.trip_request_id ?? 0)
      ),
    [rows]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(viagens.length / ITEMS_PER_PAGE)
  );

  const currentTrips = viagens.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const firstItem =
    viagens.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const lastItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    viagens.length
  );

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, i) => i + 1
      );
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <main className="min-h-screen bg-transparent">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="flex w-full max-w-[340px] flex-col items-center rounded-[28px] bg-white p-10 text-center shadow-xl ring-1 ring-black/5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f7f3]">
              <Loader2
                size={32}
                strokeWidth={2.5}
                className="animate-spin text-[#35a989]"
              />
            </div>
            <p className="mt-5 text-sm font-bold text-[#23886f]">
              Carregando viagens
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Aguarde um momento...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden text-slate-900">
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f7f3]">
                <Route
                  size={17}
                  strokeWidth={2.3}
                  className="text-[#35a989]"
                />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Histórico de viagens
              </h2>
            </div>
            <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
              Dados carregados diretamente do sistema.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadTrips()}
              disabled={loading}
              className="group cursor-pointer inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition-all hover:border-[#35a989] hover:text-[#35a989] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className="transition-transform duration-500 group-hover:rotate-180"
              />
              Atualizar
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="min-w-[1050px]">
            <TripsTable
              trips={currentTrips}
              loading={loading}
              emptyMessage="Nenhuma viagem encontrada."
              headerTone="dark"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {viagens.length > 0 ? (
                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                  Exibindo{" "}
                  <span className="font-bold text-slate-800">
                    {firstItem}
                  </span>{" "}
                  até{" "}
                  <span className="font-bold text-slate-800">
                    {lastItem}
                  </span>{" "}
                  de{" "}
                  <span className="font-bold text-slate-800">
                    {viagens.length}
                  </span>{" "}
                  viagens
                </p>
              ) : (
                <p className="text-sm text-slate-400">
                  Nenhum registro disponível.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(page - 1, 1)
                  )
                }
                disabled={currentPage === 1}
                className="group inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:border-[#35a989] hover:text-[#35a989] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
              >
                <ChevronLeft
                  size={16}
                  className="transition-transform group-hover:-translate-x-0.5"
                />
                <span className="hidden sm:inline">
                  Anterior
                </span>
              </button>

              <div className="flex items-center gap-1.5">
                {paginationPages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-10 min-w-10 rounded-xl px-2 text-xs font-extrabold transition-all duration-200 sm:text-sm ${
                      currentPage === page
                        ? "bg-[#35a989] text-white shadow-md shadow-[#35a989]/20"
                        : "border border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-[#35a989] hover:text-[#35a989]"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(page + 1, totalPages)
                  )
                }
                disabled={currentPage === totalPages}
                className="group inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:border-[#35a989] hover:text-[#35a989] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
              >
                <span className="hidden sm:inline">
                  Próxima
                </span>
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}