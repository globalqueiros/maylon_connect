"use client";

import Link from "next/link";
import {
  CalendarDays,
  Eye,
  MapPin,
  MoreVertical,
} from "lucide-react";

export type TripRow = {
  trip_request_id: number;
  pickup_address?: string | null;
  destination_address?: string | null;
  pickup_city?: string | null;
  pickup_state?: string | null;
  destination_city?: string | null;
  destination_state?: string | null;
  valor?: number | string | null;
  current_status?: string | null;
  created_at?: string | null;
};

function traduzirStatus(status?: string | null) {
  switch (String(status || "").toLowerCase()) {
    case "completed":
    case "complete":
    case "finished":
      return "Finalizada";

    case "cancelled":
    case "canceled":
      return "Cancelada";

    case "in_progress":
    case "ongoing":
      return "Em andamento";

    case "pending":
      return "Pendente";

    default:
      return status || "Pendente";
  }
}

function statusClasses(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (
    s === "completed" ||
    s === "complete" ||
    s === "finished"
  ) {
    return {
      badge: "bg-green-100 text-green-700",
      dot: "bg-green-600",
    };
  }

  if (s === "cancelled" || s === "canceled") {
    return {
      badge: "bg-red-100 text-red-700",
      dot: "bg-red-600",
    };
  }

  if (s === "in_progress" || s === "ongoing") {
    return {
      badge: "bg-yellow-100 text-yellow-700",
      dot: "bg-yellow-500",
    };
  }

  return {
    badge: "bg-gray-100 text-gray-700",
    dot: "bg-gray-500",
  };
}

function formatMoney(valor?: number | string | null) {
  const n = Number(valor || 0);

  if (!n) {
    return (
      <span className="text-xs text-gray-400">
        Aguardando
      </span>
    );
  }

  return (
    <span className="text-xs font-bold text-[#149C8B]">
      {new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(n)}
    </span>
  );
}

type Props = {
  trips: TripRow[];
  loading?: boolean;
  emptyMessage?: string;
  headerTone?: "dark" | "teal";
};

export default function TripsTable({
  trips,
  loading = false,
  emptyMessage = "Nenhuma viagem encontrada.",
  headerTone = "dark",
}: Props) {
  const headClass =
    headerTone === "teal"
      ? "bg-gradient-to-r from-[#11897D] to-[#149C8B] text-white"
      : "bg-gradient-to-r from-[#0c453f] to-[#133631] text-white";

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-xs">
        <thead>
          <tr className={`${headClass} text-center text-xs`}>
            <th className="rounded-tl-xl px-6 py-4 text-xs font-semibold">
              Data
            </th>

            <th className="px-6 py-4 text-xs font-semibold">
              Origem
            </th>

            <th className="px-6 py-4 text-xs font-semibold">
              Destino
            </th>

            <th className="px-6 py-4 text-xs font-semibold">
              Valor
            </th>

            <th className="px-6 py-4 text-xs font-semibold">
              Status
            </th>

            <th className="rounded-tr-xl px-6 py-4 text-center text-xs" />
          </tr>
        </thead>

        <tbody className="bg-white text-xs">
          {loading ? (
            <tr>
              <td
                colSpan={6}
                className="py-12 text-center text-xs text-gray-500"
              >
                Carregando viagens...
              </td>
            </tr>
          ) : trips.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="bg-red-50 py-10 text-center text-xs font-medium text-red-600"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            trips.map((item) => {
              const status = statusClasses(item.current_status);

              return (
                <tr
                  key={item.trip_request_id}
                  className="border-b border-gray-100 transition hover:bg-gray-50"
                >
                  {/* DATA */}
                  <td className="px-6 py-5 align-top text-xs">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                        <CalendarDays
                          size={18}
                          className="text-[#149C8B]"
                        />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-900">
                          {item.created_at &&
                            new Date(
                              item.created_at
                            ).toLocaleDateString("pt-BR")}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.created_at &&
                            new Date(
                              item.created_at
                            ).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* ORIGEM */}
                  <td className="px-6 py-5 align-top text-xs">
                    <div className="flex gap-2">
                      <MapPin
                        size={20}
                        className="mt-0.5 shrink-0 text-[#149C8B]"
                      />

                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-5 text-gray-900">
                          {item.pickup_address || "—"}
                        </p>

                        <p className="text-xs text-gray-500">
                          {item.pickup_city || "São Paulo"}{" "}
                          -{" "}
                          {item.pickup_state || "SP"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* DESTINO */}
                  <td className="px-6 py-5 align-top text-xs">
                    <div className="flex gap-2">
                      <MapPin
                        size={20}
                        className="mt-0.5 shrink-0 text-[#149C8B]"
                      />

                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-5 text-gray-900">
                          {item.destination_address || "—"}
                        </p>

                        <p className="text-xs text-gray-500">
                          {item.destination_city || "São Paulo"}{" "}
                          -{" "}
                          {item.destination_state || "SP"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* VALOR */}
                  <td className="px-6 py-5 align-top text-xs">
                    {formatMoney(item.valor)}
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-5 align-top text-xs">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.badge}`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${status.dot}`}
                      />

                      {traduzirStatus(item.current_status)}
                    </span>
                  </td>

                  {/* AÇÕES */}
                  <td className="px-6 py-5 text-center align-top text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/passageiro/trips/${item.trip_request_id}`}
                        className="rounded-lg p-1.5 transition hover:bg-gray-100"
                        title="Ver detalhes"
                      >
                        <Eye
                          size={17}
                          className="text-[#149C8B]"
                        />
                      </Link>

                      <button
                        type="button"
                        className="cursor-pointer rounded-lg p-1.5 transition hover:bg-gray-100"
                        aria-label="Mais opções"
                      >
                        <MoreVertical
                          size={17}
                          className="text-gray-500"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}