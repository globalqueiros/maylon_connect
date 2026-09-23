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
          <div className="flex w-full max-w-[280px] flex-col items-center rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-black/5 sm:max-w-[320px] sm:rounded-[24px] sm:p-8 md:max-w-[340px] md:rounded-[28px] md:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f7f3] sm:h-14 sm:w-14 sm:rounded-2xl md:h-16 md:w-16">
              <Loader2
                size={24}
                strokeWidth={2.5}
                className="animate-spin text-[#35a989] sm:hidden"
              />
              <Loader2
                size={28}
                strokeWidth={2.5}
                className="hidden animate-spin text-[#35a989] sm:block md:hidden"
              />
              <Loader2
                size={32}
                strokeWidth={2.5}
                className="hidden animate-spin text-[#35a989] md:block"
              />
            </div>
            <p className="mt-4 text-xs font-bold text-[#23886f] sm:mt-5 sm:text-sm">
              Carregando viagens
            </p>
            <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
              Aguarde um momento...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen min-w-0 w-full overflow-hidden text-slate-900">
      <section className="min-w-0 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)] sm:rounded-[24px] lg:rounded-[28px]">
        <div className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f7f3] sm:h-9 sm:w-9 sm:rounded-xl">
                <Route
                  size={15}
                  strokeWidth={2.3}
                  className="text-[#35a989] sm:hidden"
                />
                <Route
                  size={17}
                  strokeWidth={2.3}
                  className="hidden text-[#35a989] sm:block"
                />
              </div>
              <h2 className="truncate text-base font-extrabold text-slate-900 sm:text-lg">
                Histórico de viagens
              </h2>
            </div>
            <p className="mt-0 hidden text-xs text-slate-400 sm:mt-1.5 sm:block sm:text-sm">
              Dados carregados diretamente do sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadTrips()}
            disabled={loading}
            className="group inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition-all hover:border-[#35a989] hover:text-[#35a989] disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-3.5"
          >
            <RefreshCw
              size={14}
              className="transition-transform duration-500 group-hover:rotate-180"
            />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>

        <div className="w-full min-w-0 overflow-x-auto">
          <div className="min-w-[720px] sm:min-w-[850px] lg:min-w-[1050px]">
            <TripsTable
              trips={currentTrips}
              loading={loading}
              emptyMessage="Nenhuma viagem encontrada."
              headerTone="dark"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                <p className="text-xs text-slate-400 sm:text-sm">
                  Nenhum registro disponível.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-1.5 sm:gap-2 lg:justify-end">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(page - 1, 1)
                  )
                }
                disabled={currentPage === 1}
                className="group inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-[#35a989] hover:text-[#35a989] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:text-sm md:px-4"
              >
                <ChevronLeft
                  size={16}
                  className="transition-transform group-hover:-translate-x-0.5"
                />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <div className="flex items-center gap-1 sm:gap-1.5">
                {paginationPages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 min-w-9 cursor-pointer rounded-lg px-1.5 text-xs font-extrabold transition-all duration-200 sm:h-10 sm:min-w-10 sm:rounded-xl sm:px-2 sm:text-sm ${
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
                className="group inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-[#35a989] hover:text-[#35a989] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:text-sm md:px-4"
              >
                <span className="hidden sm:inline">Próxima</span>
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