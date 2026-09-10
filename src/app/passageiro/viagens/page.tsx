"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, ReceiptText } from "lucide-react";
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
        (a, b) => Number(b.trip_request_id) - Number(a.trip_request_id)
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex w-full max-w-[320px] flex-col items-center rounded-[28px] bg-white p-10 shadow-xl ring-1 ring-black/5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f7f4]">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#149C8B] border-t-transparent" />
          </div>
          <p className="mt-5 text-sm font-semibold text-gray-700">
            Carregando seu página
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Aguarde um momemento...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1600px]">
        {/* Cabeçalho */}
        <div className="my-5 mt-2 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-[#073b70]/15">
              <ReceiptText
                size={28}
                strokeWidth={2}
                className="text-white"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-2xl">
                Relatórios de Viagens
              </h1>

              <p className="mt-0 text-xs text-white/70">
                Confira o histórico completo de viagens realizadas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadTrips()}
            disabled={loading}
            className="inline-flex w-fit cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#073b70] shadow-sm transition hover:border-[#149c8b] hover:text-[#149c8b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Atualizar dados
          </button>
        </div>

        {/* Tabela */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-[#073b70]">
                Histórico de viagens
              </h2>

              <p className="mt-0 text-sm text-slate-500">
                Dados carregados diretamente do sistema.
              </p>
            </div>

            <span className="w-fit rounded-full bg-[#e8f7f3] px-3 py-1.5 text-xs font-bold text-[#149c8b]">
              {viagens.length} registro(s)
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <div
              className="
                min-w-[1100px]
                text-xs
                [&_table]:text-xs
                [&_thead]:text-xs
                [&_tbody]:text-xs
                [&_th]:text-xs
                [&_td]:text-xs
                [&_span]:text-xs
                [&_p]:text-xs
                [&_button]:text-xs
              "
            >
              <TripsTable
                trips={currentTrips}
                loading={loading}
                emptyMessage="Nenhuma viagem encontrada."
                headerTone="dark"
              />
            </div>
          </div>

          {/* Paginação */}
          <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">
              Página{" "}
              <span className="font-semibold text-[#073b70]">
                {currentPage}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-[#073b70]">
                {totalPages}
              </span>
              {viagens.length > 0 && <> · {viagens.length} viagem(ns)</>}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.max(p - 1, 1))
                }
                disabled={currentPage === 1}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-[#149c8b] hover:text-[#149c8b] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`h-9 min-w-9 cursor-pointer rounded-xl px-2.5 text-sm font-bold transition ${
                    currentPage === i + 1
                      ? "bg-[#149c8b] text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-[#149c8b] hover:text-[#149c8b]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-[#149c8b] hover:text-[#149c8b] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}