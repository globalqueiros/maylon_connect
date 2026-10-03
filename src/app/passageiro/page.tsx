"use client";

import {
  ArrowUpRight,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Receipt,
  Smartphone,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  consultarConta,
  formatarDataConta,
  formatarValorConta,
  pagarConta,
  type ContaConsultada,
} from "../lib/rvhub/contaCliente";

/* ------------------------------------------------------------------ */
/* TIPOS                                                              */
/* ------------------------------------------------------------------ */

type User = {
  id: number;
  full_name: string;
  email: string;
};

type Banner = {
  id: number;
  image: string;
  title?: string;
};

type Trip = {
  id: number | string | null;
  trip_request_id: number | string | null;
  created_at: string | null;
  valor: number;
  origin: string | null;
  destination: string | null;
  status: string | null;
  pickup_city?: string | null;
  pickup_state?: string | null;
  destination_city?: string | null;
  destination_state?: string | null;
  [key: string]: unknown;
};

type ModalType = "recarga" | "conta" | null;

/* ------------------------------------------------------------------ */
/* STATUS                                                             */
/* ------------------------------------------------------------------ */

const STATUS_COMPLETED = [
  "completed",
  "complete",
  "concluida",
  "concluído",
  "concluída",
  "realizada",
  "finished",
];

const STATUS_CANCELLED = [
  "cancelled",
  "canceled",
  "cancelada",
  "cancelado",
];

const STATUS_PENDING = ["pending", "pendente"];

const STATUS_ACCEPTED = [
  "accepted",
  "aceita",
  "aceitado",
];

const STATUS_IN_PROGRESS = [
  "started",
  "in_progress",
  "em_andamento",
  "em andamento",
];

/* ------------------------------------------------------------------ */
/* HELPERS                                                            */
/* ------------------------------------------------------------------ */

function parseDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();

  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(text)) {
    const [datePart, timePart] = text.split(" ");

    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second] = timePart.split(":").map(Number);

    const date = new Date(
      year,
      month - 1,
      day,
      hour || 0,
      minute || 0,
      second || 0
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameMonth(value: unknown, reference: Date): boolean {
  const date = parseDate(value);

  if (!date) return false;

  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

function parseMoney(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") return 0;

  let text = value
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .trim();

  if (!text) return 0;

  if (text.includes(",") && text.includes(".")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  }

  const numberValue = Number(text);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: unknown): string {
  const date = parseDate(value);

  if (!date) return "—";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatTime(value: unknown): string {
  const date = parseDate(value);

  if (!date) return "—";

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/* USUÁRIO                                                            */
/* ------------------------------------------------------------------ */

function normalizeUser(response: unknown): User | null {
  if (!response || typeof response !== "object") return null;

  const root = response as Record<string, unknown>;

  let userData: Record<string, unknown> | null = null;

  if (root.user && typeof root.user === "object") {
    userData = root.user as Record<string, unknown>;
  } else if (root.usuario && typeof root.usuario === "object") {
    userData = root.usuario as Record<string, unknown>;
  } else if (
    root.data &&
    typeof root.data === "object" &&
    !Array.isArray(root.data)
  ) {
    const data = root.data as Record<string, unknown>;

    if (data.user && typeof data.user === "object") {
      userData = data.user as Record<string, unknown>;
    } else if (data.usuario && typeof data.usuario === "object") {
      userData = data.usuario as Record<string, unknown>;
    } else {
      userData = data;
    }
  } else {
    userData = root;
  }

  const fullName =
    userData.full_name ??
    userData.fullName ??
    userData.name ??
    userData.nome ??
    userData.nome_completo ??
    userData.nomeCompleto;

  if (typeof fullName !== "string" || !fullName.trim()) {
    return null;
  }

  const id =
    userData.id ??
    userData.usuario_id ??
    userData.user_id ??
    0;

  const email = userData.email;

  return {
    id: Number(id) || 0,
    full_name: fullName.trim(),
    email: typeof email === "string" ? email : "",
  };
}

function extractUser(response: unknown): User | null {
  return normalizeUser(response);
}

/* ------------------------------------------------------------------ */
/* VIAGENS                                                            */
/* ------------------------------------------------------------------ */

function normalizeTrip(raw: unknown): Trip {
  if (!raw || typeof raw !== "object") {
    return {
      id: null,
      trip_request_id: null,
      created_at: null,
      valor: 0,
      origin: null,
      destination: null,
      status: null,
    };
  }

  const trip = raw as Record<string, unknown>;

  const id =
    trip.id ??
    trip.trip_request_id ??
    trip.tripRequestId ??
    null;

  const tripRequestId =
    trip.trip_request_id ??
    trip.tripRequestId ??
    trip.request_id ??
    trip.requestId ??
    trip.id ??
    null;

  const createdAt =
    trip.created_at ??
    trip.createdAt ??
    trip.data_criacao ??
    trip.dataCriacao ??
    trip.created ??
    null;

  const origin =
    trip.pickup_address ??
    trip.pickupAddress ??
    trip.origin ??
    trip.origem ??
    trip.endereco_origem ??
    trip.enderecoOrigem ??
    trip.pickup ??
    null;

  const destination =
    trip.destination_address ??
    trip.destinationAddress ??
    trip.dropoff_address ??
    trip.dropoffAddress ??
    trip.destination ??
    trip.destino ??
    trip.endereco_destino ??
    trip.enderecoDestino ??
    trip.dropoff ??
    null;

  const status =
    trip.current_status ??
    trip.currentStatus ??
    trip.status ??
    trip.trip_status ??
    trip.status_viagem ??
    trip.tripStatus ??
    null;

  const valor =
    trip.valor ??
    trip.actual_fare ??
    trip.actualFare ??
    trip.estimated_fare ??
    trip.estimatedFare ??
    trip.price ??
    trip.preco ??
    trip.valor_viagem ??
    trip.valorViagem ??
    0;

  return {
    ...trip,

    id:
      typeof id === "number" || typeof id === "string"
        ? id
        : null,

    trip_request_id:
      typeof tripRequestId === "number" ||
      typeof tripRequestId === "string"
        ? tripRequestId
        : null,

    created_at:
      createdAt !== null && createdAt !== undefined
        ? String(createdAt)
        : null,

    valor: parseMoney(valor),

    origin:
      typeof origin === "string"
        ? origin.trim()
        : null,

    destination:
      typeof destination === "string"
        ? destination.trim()
        : null,

    status:
      typeof status === "string"
        ? status.trim()
        : null,

    pickup_city:
      typeof trip.pickup_city === "string"
        ? trip.pickup_city
        : null,

    pickup_state:
      typeof trip.pickup_state === "string"
        ? trip.pickup_state
        : null,

    destination_city:
      typeof trip.destination_city === "string"
        ? trip.destination_city
        : null,

    destination_state:
      typeof trip.destination_state === "string"
        ? trip.destination_state
        : null,
  };
}

function extractTrips(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;

  if (!response || typeof response !== "object") {
    return [];
  }

  const root = response as Record<string, unknown>;

  const possibleArrays = [
    root.trips,
    root.viagens,
    root.rows,
    root.results,
  ];

  for (const item of possibleArrays) {
    if (Array.isArray(item)) {
      return item;
    }
  }

  if (root.data && typeof root.data === "object") {
    if (Array.isArray(root.data)) {
      return root.data;
    }

    const data = root.data as Record<string, unknown>;

    const nestedArrays = [
      data.trips,
      data.viagens,
      data.rows,
      data.results,
    ];

    for (const item of nestedArrays) {
      if (Array.isArray(item)) {
        return item;
      }
    }
  }

  return [];
}

/* ------------------------------------------------------------------ */
/* STATUS VIAGEM                                                      */
/* ------------------------------------------------------------------ */

function normalizeStatus(status: string | null): string {
  return String(status ?? "")
    .trim()
    .toLowerCase();
}

function getTripTitle(trip: Trip): string {
  const status = normalizeStatus(trip.status);

  if (STATUS_COMPLETED.includes(status)) {
    return "Viagem realizada";
  }

  if (STATUS_CANCELLED.includes(status)) {
    return "Viagem cancelada";
  }

  if (STATUS_PENDING.includes(status)) {
    return "Viagem pendente";
  }

  if (STATUS_ACCEPTED.includes(status)) {
    return "Viagem aceita";
  }

  if (STATUS_IN_PROGRESS.includes(status)) {
    return "Viagem em andamento";
  }

  return "Viagem registrada";
}

function getTripLocation(trip: Trip): string {
  const origin = trip.origin?.trim();
  const destination = trip.destination?.trim();

  if (origin && destination) {
    return `${origin} → ${destination}`;
  }

  if (destination) return destination;

  if (origin) return origin;

  return "Local não informado";
}

function getTripStatusClass(status: string | null): string {
  const value = normalizeStatus(status);

  if (STATUS_COMPLETED.includes(value)) {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (STATUS_CANCELLED.includes(value)) {
    return "bg-red-50 text-red-600 border-red-100";
  }

  if (
    STATUS_PENDING.includes(value) ||
    STATUS_IN_PROGRESS.includes(value)
  ) {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }

  return "bg-[#e9f8f5] text-[#078f80] border-[#cceee8]";
}

function getTripStatusLabel(status: string | null): string {
  const value = normalizeStatus(status);

  if (STATUS_COMPLETED.includes(value)) {
    return "Concluída";
  }

  if (STATUS_CANCELLED.includes(value)) {
    return "Cancelada";
  }

  if (STATUS_PENDING.includes(value)) {
    return "Pendente";
  }

  if (STATUS_IN_PROGRESS.includes(value)) {
    return "Em andamento";
  }

  if (STATUS_ACCEPTED.includes(value)) {
    return "Aceita";
  }

  return "Registrada";
}

/* ------------------------------------------------------------------ */
/* MÁSCARAS                                                           */
/* ------------------------------------------------------------------ */

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);

  if (d.length <= 2) {
    return d ? `(${d}` : "";
  }

  if (d.length <= 6) {
    return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  }

  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }

  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskBarcode(value: string): string {
  const digits = onlyDigits(value).slice(0, 48);

  if (digits.length <= 5) {
    return digits;
  }

  if (digits.length <= 10) {
    return `${digits.slice(0, 5)}.${digits.slice(5)}`;
  }

  if (digits.length <= 15) {
    return `${digits.slice(0, 5)}.${digits.slice(
      5,
      10
    )} ${digits.slice(10)}`;
  }

  if (digits.length <= 20) {
    return `${digits.slice(0, 5)}.${digits.slice(
      5,
      10
    )} ${digits.slice(10, 15)}.${digits.slice(15)}`;
  }

  if (digits.length <= 25) {
    return `${digits.slice(0, 5)}.${digits.slice(
      5,
      10
    )} ${digits.slice(10, 15)}.${digits.slice(
      15,
      20
    )} ${digits.slice(20)}`;
  }

  if (digits.length <= 30) {
    return `${digits.slice(0, 5)}.${digits.slice(
      5,
      10
    )} ${digits.slice(10, 15)}.${digits.slice(
      15,
      20
    )} ${digits.slice(20, 25)} ${digits.slice(25)}`;
  }

  return `${digits.slice(0, 5)}.${digits.slice(
    5,
    10
  )} ${digits.slice(10, 15)}.${digits.slice(
    15,
    20
  )} ${digits.slice(20, 25)} ${digits.slice(
    25,
    30
  )} ${digits.slice(30)}`;
}

/* ------------------------------------------------------------------ */
/* POST JSON                                                          */
/* ------------------------------------------------------------------ */

async function postJson(
  url: string,
  body: Record<string, unknown>
): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    let message = "";

    try {
      const data =
        (await response.json()) as Record<string, unknown>;

      if (typeof data?.message === "string") {
        message = data.message;
      } else if (typeof data?.error === "string") {
        message = data.error;
      }
    } catch {
      /* resposta sem JSON */
    }

    if (!response.ok) {
      return {
        ok: false,
        message:
          message ||
          `Não foi possível concluir (${response.status}).`,
      };
    }

    return {
      ok: true,
      message,
    };
  } catch (err) {
    console.error(`Erro em ${url}:`, err);

    return {
      ok: false,
      message: "Falha de conexão. Tente novamente.",
    };
  }
}

/* ------------------------------------------------------------------ */
/* MODAL BASE                                                         */
/* ------------------------------------------------------------------ */

function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#062b4f]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] bg-white shadow-[0_30px_80px_rgba(6,43,79,0.35)] sm:max-w-md sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#edf1f4] px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e5f8f4] text-[#08a89d]">
              {icon}
            </div>

            <div>
              <h3 className="text-base font-black text-[#062b4f] sm:text-lg">
                {title}
              </h3>

              <p className="text-[11px] text-[#71869a] sm:text-xs">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#71869a] transition hover:bg-[#f2f6f7] hover:text-[#062b4f]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FEEDBACK                                                           */
/* ------------------------------------------------------------------ */

function Feedback({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const styles =
    type === "success"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : "border-red-100 bg-red-50 text-red-600";

  return (
    <div
      className={`mt-4 rounded-xl border px-4 py-3 text-xs font-medium sm:text-sm ${styles}`}
    >
      {message}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#dce5e9] bg-white px-4 py-3 text-sm font-semibold text-[#062b4f] outline-none transition placeholder:font-normal placeholder:text-[#a3b3bf] focus:border-[#08a89d] focus:ring-4 focus:ring-[#08a89d]/10";

const labelClass =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#71869a]";

const primaryButtonClass =
  "mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#08a89d] px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(8,168,157,0.2)] transition hover:-translate-y-0.5 hover:bg-[#078f80] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

/* ------------------------------------------------------------------ */
/* MODAL RECARGA                                                      */
/* ------------------------------------------------------------------ */

const RECHARGE_VALUES = [
  15,
  20,
  30,
  50,
  100,
];

function RecargaModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [operator, setOperator] = useState("");
  const [operators, setOperators] = useState<string[]>([]);
  const [amount, setAmount] = useState<number>(20);
  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setPhone("");
      setAmount(20);
      setLoading(false);
      setFeedback(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || operators.length > 0) return;

    let ativo = true;

    (async () => {
      try {
        const res = await fetch(
          "/api/rvhub/recarga/operadoras",
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await res.json().catch(() => null);

        if (!ativo || !res.ok) return;

        const lista: string[] = Array.isArray(data?.operadoras)
          ? data.operadoras.map(
              (o: { provider: string }) =>
                String(o.provider)
            )
          : [];

        setOperators(lista);

        setOperator(
          (atual) =>
            atual || lista[0] || ""
        );
      } catch {
        // Sem lista.
      }
    })();

    return () => {
      ativo = false;
    };
  }, [open, operators.length]);

  async function handleSubmit() {
    const digits = onlyDigits(phone);

    if (digits.length < 10) {
      setFeedback({
        type: "error",
        message:
          "Informe um número de celular válido com DDD.",
      });

      return;
    }

    setLoading(true);
    setFeedback(null);

    const result = await postJson(
      "/api/rvhub/recarga",
      {
        telefone: digits,
        valor: amount,
        provider: operator,
      }
    );

    setLoading(false);

    setFeedback(
      result.ok
        ? {
            type: "success",
            message:
              result.message ||
              "Recarga solicitada com sucesso!",
          }
        : {
            type: "error",
            message: result.message,
          }
    );
  }

  const done = feedback?.type === "success";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recarga de Celular"
      subtitle="Adicione créditos de forma rápida e segura"
      icon={<Smartphone size={20} />}
    >
      <div className="space-y-4">
        <div>
          <label
            className={labelClass}
            htmlFor="recarga-phone"
          >
            Número do celular
          </label>

          <input
            id="recarga-phone"
            type="tel"
            inputMode="numeric"
            placeholder="(11) 91234-5678"
            value={phone}
            onChange={(event) =>
              setPhone(
                maskPhone(event.target.value)
              )
            }
            disabled={loading || done}
            className={inputClass}
          />
        </div>

        <div>
          <span className={labelClass}>
            Operadora
          </span>

          <div className="grid grid-cols-4 gap-2">
            {operators.length === 0 && (
              <span className="col-span-full text-xs text-[#8ca0b2]">
                Carregando operadoras...
              </span>
            )}

            {operators.map((item) => (
              <button
                key={item}
                type="button"
                disabled={loading || done}
                onClick={() =>
                  setOperator(item)
                }
                className={`rounded-xl cursor-pointer border px-2 py-2.5 text-xs font-bold transition ${
                  operator === item
                    ? "border-[#08a89d] bg-[#e5f8f4] text-[#078f80]"
                    : "border-[#dce5e9] bg-white text-[#506a82] hover:border-[#08a89d]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className={labelClass}>
            Valor da recarga
          </span>

          <div className="grid grid-cols-3 gap-2">
            {RECHARGE_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                disabled={loading || done}
                onClick={() =>
                  setAmount(value)
                }
                className={`rounded-xl cursor-pointer border px-2 py-2.5 text-sm font-bold transition ${
                  amount === value
                    ? "border-[#08a89d] bg-[#e5f8f4] text-[#078f80]"
                    : "border-[#dce5e9] bg-white text-[#506a82] hover:border-[#08a89d]"
                }`}
              >
                {formatCurrency(value)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {feedback && (
        <Feedback
          type={feedback.type}
          message={feedback.message}
        />
      )}

      {done ? (
        <button
          type="button"
          onClick={onClose}
          className={primaryButtonClass}
        >
          Fechar
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={primaryButtonClass}
        >
          {loading ? (
            <>
              <Loader2
                size={17}
                className="animate-spin"
              />
              Processando...
            </>
          ) : (
            <>
              Recarregar{" "}
              {formatCurrency(amount)}
            </>
          )}
        </button>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* MODAL CONTA                                                        */
/* ------------------------------------------------------------------ */

function ContaModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [consulta, setConsulta] =
    useState<ContaConsultada | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setCode("");
      setLoading(false);
      setConsulta(null);
      setFeedback(null);
    }
  }, [open]);

  async function handleSubmit() {
    const digits = onlyDigits(code);

    if (digits.length < 44) {
      setFeedback({
        type: "error",
        message:
          "Código inválido. Digite os 44 a 48 números do boleto ou da conta.",
      });

      return;
    }

    if (digits.length > 48) {
      setFeedback({
        type: "error",
        message:
          "O código informado possui mais de 48 dígitos.",
      });

      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      if (!consulta) {
        const resultado =
          await consultarConta(digits);

        setConsulta(resultado);

        return;
      }

      await pagarConta(
        consulta.linhaDigitavel
      );

      setFeedback({
        type: "success",
        message:
          "Pagamento enviado! Ele aparece no seu histórico assim que for confirmado.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao pagar a conta.",
      });
    } finally {
      setLoading(false);
    }
  }

  const done =
    feedback?.type === "success";

  const barcodeDigits = onlyDigits(code);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pagamento de Conta"
      subtitle="Pague boletos e contas direto pelo app"
      icon={<Receipt size={20} />}
    >
      <div>
        <label
          className={labelClass}
          htmlFor="conta-code"
        >
          Código de barras / linha digitável
        </label>

        <textarea
          id="conta-code"
          rows={4}
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          placeholder="Digite ou cole o código do boleto"
          value={code}
          onChange={(event) => {
            const masked =
              maskBarcode(
                event.target.value
              );

            setCode(masked);
            setConsulta(null);
            setFeedback(null);
          }}
          disabled={loading || done}
          className={`${inputClass} resize-none font-mono text-sm tracking-wider`}
        />

        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[11px] text-[#8ca0b2]">
            {barcodeDigits.length}/48 dígitos
          </p>

          {barcodeDigits.length >= 44 && (
            <span className="rounded-full bg-[#e5f8f4] px-2.5 py-1 text-[10px] font-bold text-[#078f80]">
              Código completo
            </span>
          )}
        </div>

        <p className="mt-1 text-[10px] leading-4 text-[#9aabb7]">
          Você pode digitar ou colar o código.
          Pontos e espaços são aplicados automaticamente.
        </p>
      </div>

      {consulta && (
        <div className="mt-4 space-y-2 rounded-xl border border-[#dce9e7] bg-[#f7fbfa] p-4 text-xs text-[#506a82]">
          <div className="flex justify-between gap-3">
            <span>Quem recebe</span>

            <span className="text-right font-bold text-[#062b4f]">
              {consulta.beneficiario || "—"}
            </span>
          </div>

          <div className="flex justify-between gap-3">
            <span>Vencimento</span>

            <span className="font-bold text-[#062b4f]">
              {formatarDataConta(
                consulta.vencimento
              )}

              {consulta.vencida
                ? " (vencida)"
                : ""}
            </span>
          </div>

          <div className="flex justify-between gap-3">
            <span>Valor</span>

            <span className="text-sm font-black text-[#08a89d]">
              {formatarValorConta(
                consulta.valor
              )}
            </span>
          </div>
        </div>
      )}

      {feedback && (
        <Feedback
          type={feedback.type}
          message={feedback.message}
        />
      )}

      {done ? (
        <button
          type="button"
          onClick={onClose}
          className={primaryButtonClass}
        >
          Fechar
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            loading ||
            barcodeDigits.length < 44
          }
          className={primaryButtonClass}
        >
          {loading ? (
            <>
              <Loader2
                size={17}
                className="animate-spin"
              />
              Processando...
            </>
          ) : consulta ? (
            <>
              Confirmar pagamento de{" "}
              {formatarValorConta(
                consulta.valor
              )}
            </>
          ) : (
            "Consultar conta"
          )}
        </button>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* DASHBOARD                                                          */
/* ------------------------------------------------------------------ */

export default function PassageiroDashboard() {
  const [user, setUser] =
    useState<User | null>(null);

  const [rows, setRows] =
    useState<Trip[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [banners, setBanners] =
    useState<Banner[]>([]);

  const [modal, setModal] =
    useState<ModalType>(null);

  /* -------------------------------------------------------------- */
  /* WALLET                                                         */
  /* -------------------------------------------------------------- */

  const [walletExists, setWalletExists] =
    useState(false);

  const [walletLoading, setWalletLoading] =
    useState(true);

  /* -------------------------------------------------------------- */
  /* DATA                                                           */
  /* -------------------------------------------------------------- */

  const hoje = useMemo(
    () => new Date(),
    []
  );

  const hora = new Date().getHours();

  const texto =
    hora < 12
      ? "Bom dia ☀️"
      : hora < 18
        ? "Boa tarde 🌤️"
        : "Boa noite 🌙";

  /* -------------------------------------------------------------- */
  /* USUÁRIO                                                        */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    async function loadUser() {
      try {
        const response =
          await fetch("/api/me", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          });

        if (!response.ok) return;

        const data =
          await response.json();

        const usuario =
          extractUser(data);

        if (usuario) {
          setUser(usuario);
        }
      } catch (err) {
        console.error(
          "Erro /api/me:",
          err
        );
      }
    }

    void loadUser();
  }, []);

  /* -------------------------------------------------------------- */
  /* VERIFICAR WALLET NO BANCO                                     */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    let ativo = true;

    async function checkWallet() {
      try {
        setWalletLoading(true);

        const response =
          await fetch("/api/wallet", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          });

        if (!response.ok) {
          if (ativo) {
            setWalletExists(false);
          }

          return;
        }

        const data =
          await response.json();

        /*
         * Esperado da API:
         *
         * {
         *   exists: true
         * }
         *
         * ou
         *
         * {
         *   exists: false
         * }
         */

        if (ativo) {
          setWalletExists(
            data?.exists === true
          );
        }
      } catch (err) {
        console.error(
          "Erro ao verificar wallet:",
          err
        );

        if (ativo) {
          setWalletExists(false);
        }
      } finally {
        if (ativo) {
          setWalletLoading(false);
        }
      }
    }

    void checkWallet();

    return () => {
      ativo = false;
    };
  }, []);

  /* -------------------------------------------------------------- */
  /* VIAGENS                                                        */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    let ativo = true;

    async function loadTrips() {
      try {
        setLoading(true);
        setError(null);

        const response =
          await fetch("/api/trips", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              Accept:
                "application/json",
            },
          });

        const contentType =
          response.headers.get(
            "content-type"
          ) || "";

        let data: unknown;

        if (
          contentType.includes(
            "application/json"
          )
        ) {
          data =
            await response.json();
        } else {
          const text =
            await response.text();

          console.error(
            "/api/trips não retornou JSON:",
            text
          );

          throw new Error(
            "A API de viagens não retornou JSON."
          );
        }

        if (!response.ok) {
          let mensagem =
            "Não foi possível carregar suas viagens.";

          if (
            data &&
            typeof data === "object"
          ) {
            const obj =
              data as Record<
                string,
                unknown
              >;

            if (
              typeof obj.message ===
              "string"
            ) {
              mensagem =
                obj.message;
            } else if (
              typeof obj.error ===
              "string"
            ) {
              mensagem =
                obj.error;
            }
          }

          throw new Error(
            `${mensagem} (${response.status})`
          );
        }

        const viagens =
          extractTrips(data);

        const normalizadas =
          viagens
            .map(normalizeTrip)
            .filter(
              (trip) =>
                trip.created_at !==
                null
            );

        if (ativo) {
          setRows(normalizadas);

          const usuario =
            extractUser(data);

          if (usuario) {
            setUser(usuario);
          }
        }
      } catch (err) {
        console.error(
          "Erro ao carregar viagens:",
          err
        );

        if (ativo) {
          setRows([]);

          setError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar viagens."
          );
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    void loadTrips();

    return () => {
      ativo = false;
    };
  }, []);

  /* -------------------------------------------------------------- */
  /* BANNERS                                                        */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    async function loadBanners() {
      try {
        const response =
          await fetch(
            "/api/banners",
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        if (!response.ok) return;

        const data =
          await response.json();

        const lista =
          Array.isArray(data)
            ? data
            : Array.isArray(
                  data?.banners
                )
              ? data.banners
              : Array.isArray(
                    data?.data
                  )
                ? data.data
                : [];

        const validos =
          lista.filter(
            (banner: Banner) =>
              typeof banner?.image ===
                "string" &&
              banner.image
                .trim()
                .length > 0
          );

        setBanners(validos);
      } catch (err) {
        console.error(
          "Erro ao carregar banners:",
          err
        );
      }
    }

    void loadBanners();
  }, []);

  /* -------------------------------------------------------------- */
  /* MÉTRICAS                                                       */
  /* -------------------------------------------------------------- */

  const viagensMes = useMemo(() => {
    return rows.filter((trip) =>
      isSameMonth(
        trip.created_at,
        hoje
      )
    );
  }, [rows, hoje]);

  const totalViagens =
    rows.length;

  const totalGastoMes =
    useMemo(() => {
      return viagensMes.reduce(
        (total, trip) =>
          total +
          parseMoney(
            trip.valor
          ),
        0
      );
    }, [viagensMes]);

  const ultimasViagens =
    useMemo(() => {
      return [...rows]
        .sort((a, b) => {
          const dateA =
            parseDate(
              a.created_at
            )?.getTime() ?? 0;

          const dateB =
            parseDate(
              b.created_at
            )?.getTime() ?? 0;

          return dateB - dateA;
        })
        .slice(0, 5);
    }, [rows]);

  const chartData =
    useMemo(() => {
      const grouped =
        new Map<
          string,
          number
        >();

      const inicio =
        new Date();

      inicio.setHours(
        0,
        0,
        0,
        0
      );

      inicio.setDate(
        inicio.getDate() - 6
      );

      for (
        let index = 0;
        index < 7;
        index++
      ) {
        const date =
          new Date(inicio);

        date.setDate(
          inicio.getDate() +
            index
        );

        const label =
          date.toLocaleDateString(
            "pt-BR",
            {
              day: "2-digit",
              month: "2-digit",
            }
          );

        grouped.set(
          label,
          0
        );
      }

      rows.forEach(
        (trip) => {
          const date =
            parseDate(
              trip.created_at
            );

          if (!date) return;

          if (
            date.getTime() <
            inicio.getTime()
          ) {
            return;
          }

          const label =
            date.toLocaleDateString(
              "pt-BR",
              {
                day: "2-digit",
                month: "2-digit",
              }
            );

          grouped.set(
            label,
            (grouped.get(
              label
            ) ?? 0) + 1
          );
        }
      );

      return Array.from(
        grouped.entries()
      ).map(
        ([label, value]) => ({
          label,
          value,
        })
      );
    }, [rows]);

  const maxChartValue =
    Math.max(
      ...chartData.map(
        (item) =>
          item.value
      ),
      1
    );

  /* -------------------------------------------------------------- */
  /* RENDER                                                          */
  /* -------------------------------------------------------------- */

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto w-full max-w-8xl px-3 sm:px-4 md:px-6 lg:px-0 2xl:max-w-[1600px]">

        {/* HEADER */}

        <section className="relative mt-3 overflow-hidden rounded-2xl sm:rounded-[28px] lg:rounded-[32px] bg-white shadow-[0_20px_60px_rgba(6,43,79,0.12)]">
          <div className="relative min-h-[190px] sm:min-h-[210px] md:min-h-[230px] lg:min-h-[245px] overflow-hidden">

            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('/bg-fundo.png')",
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-br from-[#0a9d86]/95 via-[#0b9b85]/80 to-[#062b4f]/85" />

            <div className="absolute -right-16 -top-20 h-56 w-56 sm:-right-24 sm:-top-32 sm:h-80 sm:w-80 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute -bottom-28 right-1/4 h-56 w-56 sm:-bottom-40 sm:h-80 sm:w-80 rounded-full bg-[#5be0c8]/10 blur-3xl" />

            <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-7 md:px-8 md:py-8 lg:px-10 lg:py-9 xl:px-12 xl:py-10">

              <p className="mt-4 sm:mt-6 lg:mt-7 text-sm sm:text-base font-medium text-white/85">
                {texto},
              </p>

              <h1 className="mt-1 max-w-3xl text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-white">
                {loading
                  ? "Carregando..."
                  : user?.full_name ||
                    "Bem-vindo à Maylon"}
              </h1>

              <p className="mt-2 sm:mt-3 max-w-2xl text-xs sm:text-sm leading-6 text-white/80 lg:text-base">
                Acompanhe suas viagens,
                seus gastos e tudo o que
                acontece na sua conta Maylon.
              </p>
            </div>
          </div>
        </section>

        {/* ERRO */}

        {error && (
          <div className="mt-5 sm:mt-6 rounded-xl sm:rounded-2xl border border-red-200 bg-white px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-red-600 shadow-sm">
            <strong>
              Erro ao carregar viagens:
            </strong>{" "}
            {error}
          </div>
        )}

        {/* BANNER */}

        {banners.length > 0 &&
          banners[0]?.image && (
            <section className="mt-5 sm:mt-6 lg:mt-7 overflow-hidden rounded-2xl sm:rounded-[24px] lg:rounded-[28px] border border-white/60 bg-white shadow-[0_15px_45px_rgba(6,43,79,0.1)]">
              <div className="relative min-h-[150px] sm:min-h-[180px] md:min-h-[200px] lg:min-h-[220px] xl:min-h-[240px] overflow-hidden">
                <img
                  src={banners[0].image}
                  alt={
                    banners[0].title ||
                    "Banner Maylon"
                  }
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0" />
                <div className="relative z-10 flex min-h-[150px] sm:min-h-[180px] md:min-h-[210px] lg:min-h-[250px] xl:min-h-[260px] items-center px-4 py-6 sm:px-6 sm:py-7 md:px-8 md:py-8 lg:px-10 xl:px-12" />
              </div>
            </section>
          )}
        <div className="h-2" />
        {!walletLoading && walletExists && (
          <section className="mt-4 sm:mt-5">
            <div className="mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Serviços rápidos
              </h2>

              <p className="mt-0 text-xs sm:text-sm text-white">
                Recarregue seu celular e
                pague contas sem sair da
                Maylon.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">

              {/* RECARGA */}

              <button
                type="button"
                onClick={() =>
                  setModal("recarga")
                }
                className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl sm:rounded-[26px] border border-[#e2ebee] bg-white p-5 sm:p-6 text-left shadow-[0_10px_35px_rgba(6,43,79,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(6,43,79,0.11)]"
              >
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#08a89d]/5 transition group-hover:scale-125" />

                <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e5f8f4] text-[#08a89d] transition group-hover:bg-[#08a89d] group-hover:text-white">
                  <Smartphone size={24} />
                </div>

                <div className="relative min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-black text-[#062b4f]">
                    Recarga de Celular
                  </p>

                  <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-[#71869a]">
                    Adicione créditos de forma rápida e segura.
                  </p>
                </div>

                <ArrowUpRight
                  size={18}
                  className="relative shrink-0 text-[#08a89d]"
                />
              </button>

              {/* CONTA */}

              <button
                type="button"
                onClick={() =>
                  setModal("conta")
                }
                className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl sm:rounded-[26px] border border-[#e2ebee] bg-white p-5 sm:p-6 text-left shadow-[0_10px_35px_rgba(6,43,79,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(6,43,79,0.11)]"
              >
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#0c75bd]/5 transition group-hover:scale-125" />

                <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e5f8f4] text-[#08a89d] transition group-hover:bg-[#08a89d] group-hover:text-white">
                  <Receipt size={24} />
                </div>

                <div className="relative min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-black text-[#062b4f]">
                    Pagamento de Conta
                  </p>

                  <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-[#71869a]">
                    Pague boletos e contas direto pelo app.
                  </p>
                </div>

                <ArrowUpRight
                  size={18}
                  className="relative shrink-0 text-[#08a89d]"
                />
              </button>
            </div>
          </section>
        )}

        {/* SUA MOVIMENTAÇÃO */}

        <section className="mt-6 sm:mt-7">
          <div className="mb-4 sm:mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <h2 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-white">
                Sua movimentação
              </h2>

              <p className="mt-0 text-xs sm:text-sm text-white">
                Uma visão rápida da sua
                atividade na Maylon.
              </p>
            </div>

            <Link
              href="/passageiro/viagens"
              className="inline-flex items-center gap-2 self-start rounded-xl border border-[#dce5e9] bg-white px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-[#163a59] shadow-sm transition hover:border-[#08a89d] hover:text-[#08a89d] sm:self-auto"
            >
              Ver histórico
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">

            {/* CARD 1 */}

            <div className="group relative overflow-hidden rounded-2xl sm:rounded-[26px] border border-[#e2ebee] bg-white p-5 sm:p-6 shadow-[0_10px_35px_rgba(6,43,79,0.07)]">
              <div className="relative">
                <div className="flex items-start justify-between">

                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#e5f8f4] text-[#08a89d]">
                    <Car size={25} />
                  </div>

                  <span className="rounded-full bg-[#effaf8] px-2.5 py-1 text-[9px] font-bold uppercase text-[#078f80]">
                    Mês atual
                  </span>
                </div>

                <p className="mt-5 text-xs sm:text-sm font-semibold text-[#71869a]">
                  Viagens no mês
                </p>

                <p className="mt-1 text-2xl sm:text-3xl font-black text-[#062b4f]">
                  {loading
                    ? "—"
                    : viagensMes.length}
                </p>

                <p className="mt-2 text-[11px] sm:text-xs font-medium text-[#08a89d]">
                  Atividade deste mês
                </p>
              </div>
            </div>

            {/* CARD 2 */}

            <div className="group relative overflow-hidden rounded-2xl sm:rounded-[26px] border border-[#e2ebee] bg-white p-5 sm:p-6 shadow-[0_10px_35px_rgba(6,43,79,0.07)]">
              <div className="relative">

                <div className="flex items-start justify-between">

                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#e5f8f4] text-[#08a89d]">
                    <Car size={25} />
                  </div>

                  <span className="rounded-full bg-[#effaf8] px-2.5 py-1 text-[9px] font-bold uppercase text-[#078f80]">
                    Histórico
                  </span>
                </div>

                <p className="mt-5 text-xs sm:text-sm font-semibold text-[#71869a]">
                  Total de viagens
                </p>

                <p className="mt-1 text-2xl sm:text-3xl font-black text-[#062b4f]">
                  {loading
                    ? "—"
                    : totalViagens}
                </p>

                <p className="mt-2 text-[11px] sm:text-xs font-medium text-[#1676b7]">
                  Todas as viagens registradas
                </p>
              </div>
            </div>

            {/* CARD 3 */}

            <div className="group relative overflow-hidden rounded-2xl sm:rounded-[26px] border border-[#e2ebee] bg-white p-5 sm:p-6 shadow-[0_10px_35px_rgba(6,43,79,0.07)] sm:col-span-2 lg:col-span-1">
              <div className="relative">

                <div className="flex items-start justify-between">

                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#e5f8f4] text-[#08a89d]">
                    <Wallet size={25} />
                  </div>

                  <span className="rounded-full bg-[#effaf8] px-2.5 py-1 text-[9px] font-bold uppercase text-[#078f80]">
                    Gastos
                  </span>
                </div>

                <p className="mt-5 text-xs sm:text-sm font-semibold text-[#71869a]">
                  Gasto do mês
                </p>

                <p className="mt-1 text-2xl sm:text-3xl font-black text-[#062b4f]">
                  {loading
                    ? "—"
                    : formatCurrency(
                        totalGastoMes
                      )}
                </p>

                <p className="mt-2 text-[11px] sm:text-xs font-medium text-[#08a89d]">
                  Total acumulado no mês
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTEÚDO PRINCIPAL */}

        <section className="mt-6 sm:mt-7 grid grid-cols-1 gap-5 sm:gap-6 lg:gap-7 xl:grid-cols-[1.45fr_0.95fr] 2xl:grid-cols-[1.6fr_1fr]">

          {/* GRÁFICO */}

          <div className="overflow-hidden rounded-2xl sm:rounded-[28px] border border-[#e2ebee] bg-white shadow-[0_12px_40px_rgba(6,43,79,0.07)]">

            <div className="flex flex-col gap-3 border-b border-[#edf1f4] px-4 py-5 sm:px-6 sm:py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#e5f8f4] text-[#08a89d]">
                  <Car size={20} />
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#062b4f]">
                    Atividade recente
                  </h2>

                  <p className="mt-0 text-[11px] sm:text-xs text-[#71869a]">
                    Viagens dos últimos 7 dias
                  </p>
                </div>
              </div>

              <div className="self-start rounded-xl bg-[#eaf8f5] px-3.5 py-1.5 text-[11px] font-bold text-[#078f80]">
                Últimos 7 dias
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">

              <div className="relative h-[240px] sm:h-[270px] md:h-[290px] lg:h-[310px] w-full">

                <div className="absolute inset-0 flex flex-col justify-between pb-9 pt-3">
                  {[4, 3, 2, 1, 0].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3"
                      >
                        <div className="h-px flex-1 bg-[#edf1f4]" />
                      </div>
                    )
                  )}
                </div>

                <div className="absolute inset-0 flex items-end gap-1.5 px-1 pb-9 pt-5 sm:gap-2 md:gap-3 lg:gap-4">

                  {chartData.map(
                    (
                      item,
                      index
                    ) => {
                      const height =
                        item.value === 0
                          ? 3
                          : Math.max(
                              (item.value /
                                maxChartValue) *
                                82,
                              8
                            );

                      return (
                        <div
                          key={`${item.label}-${index}`}
                          className="group relative flex h-full flex-1 flex-col justify-end"
                        >
                          {item.value > 0 && (
                            <div
                              className="absolute left-1/2 z-20 flex -translate-x-1/2 -translate-y-2 items-center justify-center rounded-lg bg-[#062b4f] px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100"
                              style={{
                                bottom: `${height}%`,
                              }}
                            >
                              {item.value}
                            </div>
                          )}

                          <div
                            className="relative w-full overflow-hidden rounded-t-xl bg-gradient-to-t from-[#07947e] via-[#12aa91] to-[#54d1ba] shadow-[0_8px_20px_rgba(8,168,157,0.18)]"
                            style={{
                              height: `${height}%`,
                              opacity:
                                item.value === 0
                                  ? 0.18
                                  : 1,
                            }}
                          >
                            <div className="absolute inset-x-0 top-0 h-1 bg-white/30" />
                          </div>

                          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold text-[#71869a]">
                            {item.label}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>

                {!loading &&
                  rows.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-2xl border border-dashed border-[#dbe5e9] bg-[#fbfcfd] px-5 py-4 text-center">

                        <Car
                          size={28}
                          className="mx-auto text-[#9aafbd]"
                        />

                        <p className="mt-2 text-xs sm:text-sm font-semibold text-[#506a82]">
                          Nenhuma viagem encontrada
                        </p>

                        <p className="mt-1 text-[11px] sm:text-xs text-[#8ca0b2]">
                          Suas próximas viagens aparecerão aqui.
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* ATIVIDADES */}

          <div className="overflow-hidden rounded-2xl sm:rounded-[28px] border border-[#e2ebee] bg-white shadow-[0_12px_40px_rgba(6,43,79,0.07)]">

            <div className="flex items-center justify-between border-b border-[#edf1f4] px-4 py-5 sm:px-6 sm:py-6">

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#08a89d]">
                  Histórico
                </p>

                <h2 className="text-base sm:text-lg font-black text-[#062b4f]">
                  Últimas atividades
                </h2>

                <p className="mt-0 text-[11px] sm:text-xs text-[#71869a]">
                  Suas viagens mais recentes
                </p>
              </div>

              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#e6f7f4] text-[#08a89d]">
                <Clock3 size={20} />
              </div>
            </div>

            <div className="px-4 sm:px-6">

              {loading && (
                <div className="py-10 text-center">

                  <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#dceceb] border-t-[#08a89d]" />

                  <p className="mt-3 text-xs font-medium text-[#71869a]">
                    Carregando atividades...
                  </p>
                </div>
              )}

              {!loading &&
                ultimasViagens.length === 0 && (
                  <div className="py-10 text-center">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2f6f7] text-[#91a5b3]">
                      <CalendarDays size={23} />
                    </div>

                    <p className="mt-4 text-xs sm:text-sm font-bold text-[#506a82]">
                      Nenhuma atividade recente
                    </p>

                    <p className="mt-1 text-[11px] sm:text-xs text-[#8ca0b2]">
                      Você ainda não possui viagens.
                    </p>
                  </div>
                )}

              {!loading &&
                ultimasViagens.length > 0 &&
                ultimasViagens.map(
                  (
                    trip,
                    index
                  ) => (
                    <div
                      key={`${trip.trip_request_id ?? trip.id ?? "trip"}-${index}`}
                      onClick={() => {
                        const tripId =
                          trip.trip_request_id ??
                          trip.id;

                        if (!tripId) return;

                        window.location.href =
                          `/passageiro/viagens/${tripId}`;
                      }}
                      className="group flex cursor-pointer gap-3 border-b border-[#edf1f4] py-4 sm:py-5 transition hover:bg-[#f8fbfc] last:border-0"
                    >

                      <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-[#e6f7f4] text-[#08a89d] transition group-hover:bg-[#08a89d] group-hover:text-white">

                        {index === 0 ? (
                          <CheckCircle2 size={19} />
                        ) : (
                          <CalendarDays size={19} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-2">

                          <p className="truncate text-xs sm:text-sm font-bold text-[#163a59]">
                            {getTripTitle(trip)}
                          </p>

                          <span
                            className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold ${getTripStatusClass(
                              trip.status
                            )}`}
                          >
                            {getTripStatusLabel(
                              trip.status
                            )}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#71869a]">

                          <MapPin
                            size={12}
                            className="shrink-0"
                          />

                          <span className="truncate">
                            {getTripLocation(trip)}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-[10px] text-[#8ca0b2]">

                          <span>
                            {formatDate(
                              trip.created_at
                            )}
                          </span>

                          <span className="h-1 w-1 rounded-full bg-[#c5d1d8]" />

                          <span>
                            {formatTime(
                              trip.created_at
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
            </div>

            <div className="p-4 pt-2 sm:p-6 sm:pt-3">

              <Link
                href="/passageiro/viagens"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#08a89d] px-4 py-3.5 text-xs sm:text-sm font-bold text-white shadow-[0_8px_20px_rgba(8,168,157,0.2)] transition hover:-translate-y-0.5 hover:bg-[#078f80]"
              >
                Ver todas as viagens
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* MODAIS */}

      <RecargaModal
        open={modal === "recarga"}
        onClose={() => setModal(null)}
      />

      <ContaModal
        open={modal === "conta"}
        onClose={() => setModal(null)}
      />
    </main>
  );
}