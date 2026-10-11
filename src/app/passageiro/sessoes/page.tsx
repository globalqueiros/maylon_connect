
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Clock,
  Monitor,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Ban,
} from "lucide-react";

type Session = {
  session_uuid: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  ip_address: string | null;
  device_name: string | null;
  browser_name: string | null;
  operating_system: string | null;
  effective_status: "active" | "inactive" | "revoked";
  created_at: string;
  last_activity_at: string | null;
  expires_at: string;
  ended_at: string | null;
  end_reason: string | null;
};

type Counts = {
  total: number;
  active: number;
  inactive: number;
  revoked: number;
};

const filters = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Ativas" },
  { value: "inactive", label: "Inativas" },
  { value: "revoked", label: "Revogadas" },
];

function formatDate(value: string | null) {
  if (!value) return "—";

  const normalized = value.includes("T")
    ? value
    : value.replace(" ", "T") + "Z";

  const date = new Date(normalized);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("pt-BR");
}

function StatusBadge({
  status,
}: {
  status: Session["effective_status"];
}) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700",
    inactive: "bg-amber-50 text-amber-700",
    revoked: "bg-red-50 text-red-700",
  };

  const labels = {
    active: "Ativa",
    inactive: "Inativa",
    revoked: "Revogada",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default function SessoesPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [counts, setCounts] = useState<Counts>({
    total: 0,
    active: 0,
    inactive: 0,
    revoked: 0,
  });

  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/backoffice/sessions?status=${filter}`,
        {
          cache: "no-store",
          credentials: "same-origin",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao consultar sessões.");
      }

      setSessions(data.sessions);
      setCounts(data.counts);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao carregar as sessões."
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function revokeSession(session: Session) {
    const confirmed = window.confirm(
      `Deseja encerrar a sessão de ${
        session.user_name || session.user_email || session.user_id
      } neste dispositivo?`
    );

    if (!confirmed) return;

    setRevoking(session.session_uuid);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/backoffice/sessions/${session.session_uuid}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível encerrar a sessão.");
      }

      setMessage(data.message);
      await loadSessions();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao encerrar sessão."
      );
    } finally {
      setRevoking(null);
    }
  }

  const cards = [
    {
      label: "Total de sessões",
      value: counts.total,
      icon: Activity,
      color: "text-slate-700",
    },
    {
      label: "Sessões ativas",
      value: counts.active,
      icon: ShieldCheck,
      color: "text-emerald-600",
    },
    {
      label: "Sessões inativas",
      value: counts.inactive,
      icon: Clock,
      color: "text-amber-600",
    },
    {
      label: "Sessões revogadas",
      value: counts.revoked,
      icon: ShieldOff,
      color: "text-red-600",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Sessões e acessos
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitore os dispositivos conectados ao Backoffice Maylon.
            </p>
          </div>

          <button
            onClick={() => void loadSessions()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Atualizar
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            {message}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">
                    {card.label}
                  </span>
                  <Icon size={22} className={card.color} />
                </div>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {card.value}
                </p>
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-slate-900">
                Histórico de sessões
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Exibe até 500 registros, do mais recente ao mais antigo.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  aria-pressed={filter === item.value}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    filter === item.value
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              Carregando sessões...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center">
              <Monitor
                size={32}
                className="mx-auto mb-3 text-slate-300"
              />
              <p className="font-medium text-slate-700">
                Nenhuma sessão encontrada
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Tente selecionar outro filtro.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Usuário</th>
                    <th className="px-5 py-4">Dispositivo</th>
                    <th className="px-5 py-4">Endereço IP</th>
                    <th className="px-5 py-4">Última atividade</th>
                    <th className="px-5 py-4">Expiração</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Ação</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {sessions.map((session) => (
                    <tr
                      key={session.session_uuid}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">
                          {session.user_name || "Usuário"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {session.user_email || session.user_id}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Login: {formatDate(session.created_at)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          {session.device_name === "Dispositivo móvel"
                            ? <Smartphone size={17} />
                            : <Monitor size={17} />}
                          {session.device_name || "Não identificado"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {[
                            session.browser_name,
                            session.operating_system,
                          ].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {session.ip_address || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(session.last_activity_at)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(session.expires_at)}
                        {session.ended_at && (
                          <div className="mt-1 text-xs text-slate-400">
                            Encerrada: {formatDate(session.ended_at)}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={session.effective_status} />
                        {session.end_reason && (
                          <div className="mt-1 text-xs text-slate-500">
                            {session.end_reason}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {session.effective_status === "active" ? (
                          <button
                            onClick={() => void revokeSession(session)}
                            disabled={revoking === session.session_uuid}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Ban size={14} />
                            {revoking === session.session_uuid
                              ? "Encerrando..."
                              : "Encerrar"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Sem ações
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <footer className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            Os registros históricos são preservados após o encerramento.
          </footer>
        </section>
      </div>
    </main>
  );
}
