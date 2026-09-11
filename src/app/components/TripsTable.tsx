"use client";

import {
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  Navigation,
  Pencil,
  ReceiptText,
  XCircle,
} from "lucide-react";

export type TripRow = {
  id?: number | string | null;
  trip_request_id?: number | string | null;
  status?: string | number | null;
  origin?: string | null;
  pickup_address?: string | null;
  origin_address?: string | null;
  pickupAddress?: string | null;
  originAddress?: string | null;
  destination?: string | null;
  destination_address?: string | null;
  dropoff_address?: string | null;
  destinationAddress?: string | null;
  dropoffAddress?: string | null;
  base_fare?: number | string | null;
  baseFare?: number | string | null;
  fare?: number | string | null;
  price?: number | string | null;
  total?: number | string | null;
  amount?: number | string | null;
  value?: number | string | null;
  fare_amount?: number | string | null;
  fareAmount?: number | string | null;
  trip_price?: number | string | null;
  tripPrice?: number | string | null;
  ride_price?: number | string | null;
  ridePrice?: number | string | null;
  total_value?: number | string | null;
  totalValue?: number | string | null;
  amount_paid?: number | string | null;
  amountPaid?: number | string | null;
  valor?: number | string | null;
  valor_corrida?: number | string | null;
  valor_viagem?: number | string | null;
  valor_total?: number | string | null;
  valor_pago?: number | string | null;
  preco?: number | string | null;
  created_at?: string | null;
  requested_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  date?: string | null;
  data?: string | null;
  data_viagem?: string | null;
  status_pending?: number | boolean | null;
  status_accepted?: number | boolean | null;
  status_out_for_pickup?: number | boolean | null;
  status_picked_up?: number | boolean | null;
  status_ongoing?: number | boolean | null;
  status_completed?: number | boolean | null;
  status_cancelled?: number | boolean | null;
  status_failed?: number | boolean | null;
  status_returning?: number | boolean | null;
  status_returned?: number | boolean | null;
  status_note?: string | null;
  status_created_at?: string | null;
  status_updated_at?: string | null;
  [key: string]: unknown;
};

type TripsTableProps = {
  trips: TripRow[];
  loading?: boolean;
  emptyMessage?: string;
  headerTone?: "dark" | "light";
  onView?: (trip: TripRow) => void;
  onEdit?: (trip: TripRow) => void;
};

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function hasValue(value: unknown) {
  return value !== undefined && value !== null && value !== "";
}

function getValue(trip: TripRow, keys: string[]): unknown {
  const normalizedKeys = keys.map(normalizeKey);

  function search(object: unknown, depth = 0): unknown {
    if (
      object === null ||
      object === undefined ||
      depth > 5
    ) {
      return null;
    }

    if (typeof object !== "object") {
      return null;
    }

    if (Array.isArray(object)) {
      for (const item of object) {
        const result = search(item, depth + 1);

        if (hasValue(result)) {
          return result;
        }
      }

      return null;
    }

    const record = object as Record<string, unknown>;

    for (const key of keys) {
      if (hasValue(record[key])) {
        return record[key];
      }
    }

    for (const [key, value] of Object.entries(record)) {
      if (!hasValue(value)) {
        continue;
      }

      const normalized = normalizeKey(key);

      if (normalizedKeys.includes(normalized)) {
        return value;
      }
    }

    for (const value of Object.values(record)) {
      if (value && typeof value === "object") {
        const result = search(value, depth + 1);

        if (hasValue(result)) {
          return result;
        }
      }
    }

    return null;
  }

  return search(trip);
}

function formatDate(value: unknown) {
  if (!hasValue(value)) {
    return "—";
  }

  const raw = String(value).trim();

  if (/^\d{2}\/\d{2}\/\d{4}/.test(raw)) {
    return raw;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(value: unknown) {
  if (!hasValue(value)) {
    return "—";
  }

  let numericValue: number;

  if (typeof value === "number") {
    numericValue = value;
  } else {
    let raw = String(value)
      .trim()
      .replace(/R\$/gi, "")
      .replace(/\s/g, "");

    if (raw.includes(".") && raw.includes(",")) {
      const lastComma = raw.lastIndexOf(",");
      const lastDot = raw.lastIndexOf(".");

      if (lastComma > lastDot) {
        raw = raw.replace(/\./g, "").replace(",", ".");
      } else {
        raw = raw.replace(/,/g, "");
      }
    } else if (raw.includes(",")) {
      raw = raw.replace(",", ".");
    }

    numericValue = Number(raw);
  }

  if (Number.isNaN(numericValue)) {
    return "—";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function normalizeStatus(value: unknown) {
  if (!hasValue(value)) {
    return {
      label: "Sem status",
      type: "neutral" as const,
    };
  }

  const original = String(value).trim();

  const status = original
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  switch (status) {
    case "pending":
    case "pendente":
    case "1":
      return {
        label: "Pendente",
        type: "warning" as const,
      };

    case "accepted":
    case "aceita":
    case "aceito":
    case "2":
      return {
        label: "Aceita",
        type: "info" as const,
      };

    case "out for pickup":
    case "out_for_pickup":
    case "a caminho":
      return {
        label: "A caminho",
        type: "info" as const,
      };

    case "picked up":
    case "picked_up":
    case "embarcado":
      return {
        label: "Passageiro embarcado",
        type: "info" as const,
      };

    case "ongoing":
    case "em andamento":
    case "in progress":
      return {
        label: "Em andamento",
        type: "info" as const,
      };

    case "completed":
    case "complete":
    case "concluida":
    case "concluido":
    case "finalizada":
    case "finalizado":
    case "finished":
    case "success":
    case "3":
      return {
        label: "Concluída",
        type: "success" as const,
      };

    case "cancelled":
    case "canceled":
    case "cancelada":
    case "cancelado":
    case "4":
      return {
        label: "Cancelada",
        type: "danger" as const,
      };

    case "failed":
    case "failure":
    case "falhou":
    case "erro":
      return {
        label: "Falhou",
        type: "danger" as const,
      };

    case "returning":
    case "retornando":
      return {
        label: "Retornando",
        type: "warning" as const,
      };

    case "returned":
    case "retornado":
      return {
        label: "Retornado",
        type: "success" as const,
      };

    default:
      return {
        label: original,
        type: "neutral" as const,
      };
  }
}

function StatusBadge({ value }: { value: unknown }) {
  const status = normalizeStatus(value);

  const styles = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    danger: "bg-red-50 text-red-600 ring-red-200",
    warning: "bg-amber-50 text-amber-700 ring-amber-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  const icons = {
    success: CheckCircle2,
    danger: XCircle,
    warning: Clock3,
    info: Navigation,
    neutral: Clock3,
  };

  const Icon = icons[status.type];

  return (
    <span
      className={`
        inline-flex
        items-center
        justify-center
        gap-1.5
        rounded-full
        px-3
        py-2
        text-[11px]
        font-bold
        leading-none
        whitespace-nowrap
        ring-1
        ${styles[status.type]}
      `}
    >
      <Icon size={13} strokeWidth={2.5} />
      {status.label}
    </span>
  );
}

function LoadingRows() {
  return (
    <tbody className="divide-y divide-slate-100">
      {Array.from({ length: 7 }).map((_, index) => (
        <tr key={index}>
          {Array.from({ length: 7 }).map((_, cell) => (
            <td key={cell} className="px-5 py-5">
              <div
                className={`
                  h-4
                  animate-pulse
                  rounded-md
                  bg-slate-100
                  ${
                    cell === 0
                      ? "w-20"
                      : cell === 1
                        ? "w-44"
                        : cell === 2
                          ? "w-44"
                          : cell === 3
                            ? "w-24"
                            : cell === 4
                              ? "w-28"
                              : cell === 5
                                ? "w-28"
                                : "w-20"
                  }
                `}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function ActionButton({
  title,
  onClick,
  children,
  variant,
}: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant: "view" | "edit";
}) {
  const styles =
    variant === "view"
      ? `
        bg-slate-50
        text-slate-500
        ring-slate-200
        hover:bg-[#e8f7f3]
        hover:text-[#23886f]
        hover:ring-[#bce9dd]
      `
      : `
        bg-slate-50
        text-slate-500
        ring-slate-200
        hover:bg-blue-50
        hover:text-blue-600
        hover:ring-blue-200
      `;

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-xl
        ring-1
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:shadow-sm
        ${styles}
      `}
    >
      {children}
    </button>
  );
}

export default function TripsTable({
  trips,
  loading = false,
  emptyMessage = "Nenhuma viagem encontrada.",
  headerTone = "dark",
  onView,
  onEdit,
}: TripsTableProps) {
  if (loading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {[
                "Viagem",
                "Origem",
                "Destino",
                "Valor",
                "Data",
                "Status",
                "Ações",
              ].map((title) => (
                <th
                  key={title}
                  className="
                    whitespace-nowrap
                    px-5
                    py-4
                    text-left
                    text-[10px]
                    font-extrabold
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <LoadingRows />
        </table>
      </div>
    );
  }

  if (!trips.length) {
    return (
      <div className="flex min-h-[380px] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-100">
          <ReceiptText size={27} className="text-slate-400" />
        </div>
        <h3 className="mt-5 text-base font-bold text-slate-800">
          Nenhuma viagem encontrada
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[1050px] border-collapse text-left">
        <thead>
          <tr
            className={
              headerTone === "dark"
                ? "bg-[#073b70]"
                : "bg-slate-50"
            }
          >
            {[
              "Viagem",
              "Origem",
              "Destino",
              "Valor",
              "Data",
              "Status",
              "Ações",
            ].map((title) => (
              <th
                key={title}
                className={`
                  whitespace-nowrap
                  px-5
                  py-4
                  text-[10px]
                  font-extrabold
                  uppercase
                  tracking-[0.08em]
                  ${
                    headerTone === "dark"
                      ? "text-white/80"
                      : "text-slate-500"
                  }
                `}
              >
                {title}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {trips.map((trip, index) => {
            const tripId = getValue(trip, [
              "trip_request_id",
              "trip_id",
              "ride_id",
              "request_id",
              "id",
            ]);

            const origin = getValue(trip, [
              "origin",
              "pickup_address",
              "pickupAddress",
              "origin_address",
              "originAddress",
              "endereco_origem",
              "endereco_partida",
            ]);

            const destination = getValue(trip, [
              "destination",
              "destination_address",
              "destinationAddress",
              "dropoff_address",
              "dropoffAddress",
              "endereco_destino",
              "endereco_chegada",
            ]);

            const price = getValue(trip, [
              "base_fare",
              "baseFare",
              "valor",
              "valor_corrida",
              "valor_viagem",
              "valor_total",
              "valor_pago",
              "price",
              "fare",
              "fare_amount",
              "fareAmount",
              "trip_price",
              "tripPrice",
              "ride_price",
              "ridePrice",
              "total",
              "total_value",
              "totalValue",
              "amount",
              "amount_paid",
              "amountPaid",
              "value",
              "preco",
            ]);

            const date = getValue(trip, [
              "created_at",
              "createdAt",
              "requested_at",
              "requestedAt",
              "started_at",
              "startedAt",
              "completed_at",
              "completedAt",
              "date",
              "data",
              "data_viagem",
            ]);

            const status = getValue(trip, ["status"]);

            return (
              <tr
                key={`${String(tripId ?? "trip")}-${index}`}
                className="
                  group
                  transition-colors
                  duration-150
                  hover:bg-[#f7fcfa]
                "
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-[#e8f7f3]
                        text-[#35a989]
                        transition-transform
                        duration-200
                        group-hover:scale-105
                      "
                    >
                      <ReceiptText size={16} />
                    </div>

                    <div>
                      <p className="text-xs font-extrabold text-slate-800">
                        #{tripId ?? "—"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Viagem
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="flex max-w-[250px] items-start gap-2.5">
                    <div className="mt-0.5 shrink-0 text-[#35a989]">
                      <MapPin size={15} />
                    </div>

                    <span
                      className="
                        line-clamp-2
                        text-xs
                        leading-5
                        text-slate-600
                      "
                      title={String(origin ?? "")}
                    >
                      {hasValue(origin)
                        ? String(origin)
                        : "Não informado"}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="flex max-w-[250px] items-start gap-2.5">
                    <div className="mt-0.5 shrink-0 text-red-400">
                      <MapPin size={15} />
                    </div>

                    <span
                      className="
                        line-clamp-2
                        text-xs
                        leading-5
                        text-slate-600
                      "
                      title={String(destination ?? "")}
                    >
                      {hasValue(destination)
                        ? String(destination)
                        : "Não informado"}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span
                    className="
                      whitespace-nowrap
                      text-xs
                      font-extrabold
                      text-[#23886f]
                    "
                  >
                    {formatCurrency(price)}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span
                    className="
                      whitespace-nowrap
                      text-xs
                      font-medium
                      text-slate-500
                    "
                  >
                    {formatDate(date)}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <StatusBadge value={status} />
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <ActionButton
                      title="Visualizar viagem"
                      variant="view"
                      onClick={() => onView?.(trip)}
                    >
                      <Eye size={16} strokeWidth={2.2} />
                    </ActionButton>

                    <ActionButton
                      title="Editar viagem"
                      variant="edit"
                      onClick={() => onEdit?.(trip)}
                    >
                      <Pencil size={15} strokeWidth={2.2} />
                    </ActionButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}