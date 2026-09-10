"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Smartphone,
  Monitor,
  ChevronRight,
  MapPin,
  Clock3,
  Globe,
  X,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

type Usuario = {
  id: string | number;
  nome?: string;
  email?: string;
  whatsapp?: string;
  profile_image?: string | null;
  tipo?: string;
};

type Session = {
  id: string | number;
  user_id: string;
  ip: string | null;
  user_agent: string | null;
  refresh_token: string;
  created_at: string;
};

type DeviceInfo = {
  device: "Smartphone" | "Computador";
  browser: string;
  os: string;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<Session | null>(null);

  const carregarSessoes = async (
    userId: string,
    refresh = false
  ) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response = await fetch(
        `/api/sessions?userId=${encodeURIComponent(userId)}&t=${Date.now()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json().catch(() => null);

      console.log("ID DO USUÁRIO:", userId);
      console.log("RESPOSTA /api/sessions:", data);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Não foi possível carregar os acessos."
        );
      }

      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data?.sessions)
          ? data.sessions
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setSessions(lista);
    } catch (err) {
      console.error("Erro ao carregar sessões:", err);

      setSessions([]);

      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os acessos."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json().catch(() => null);

        console.log("RESPOSTA COMPLETA /api/me:", data);

        if (!response.ok) {
          window.location.href = "/";
          return;
        }

        const usuarioData =
          data?.usuario ||
          data?.user ||
          data?.data ||
          data;

        const userId =
          usuarioData?.id ??
          usuarioData?.user_id ??
          usuarioData?.usuario_id;

        if (!userId) {
          throw new Error(
            "Não foi possível identificar o usuário conectado."
          );
        }

        const usuarioNormalizado: Usuario = {
          ...usuarioData,
          id: userId,
        };

        console.log(
          "USUÁRIO NORMALIZADO:",
          usuarioNormalizado
        );

        console.log(
          "USER ID ENVIADO PARA SESSIONS:",
          String(userId)
        );

        setUsuario(usuarioNormalizado);

        await carregarSessoes(String(userId));
      } catch (err) {
        console.error(
          "Erro ao carregar usuário:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar sua conta."
        );

        setLoading(false);
      }
    };

    void carregarUsuario();
  }, []);

  const getDeviceType = (
    userAgent: string | null
  ) => {
    if (!userAgent) {
      return "desktop";
    }

    const ua = userAgent.toLowerCase();

    if (
      ua.includes("android") ||
      ua.includes("iphone") ||
      ua.includes("ipad") ||
      ua.includes("ipod") ||
      ua.includes("mobile")
    ) {
      return "mobile";
    }

    return "desktop";
  };

  const parseUserAgent = (
    userAgent: string | null
  ): DeviceInfo => {
    if (!userAgent) {
      return {
        device: "Computador",
        browser: "Navegador desconhecido",
        os: "Sistema desconhecido",
      };
    }

    const ua = userAgent.toLowerCase();

    const mobile =
      ua.includes("android") ||
      ua.includes("iphone") ||
      ua.includes("ipad") ||
      ua.includes("ipod") ||
      ua.includes("mobile");

    let os = "Sistema desconhecido";

    if (ua.includes("windows")) {
      os = "Windows";
    } else if (
      ua.includes("macintosh") ||
      ua.includes("mac os")
    ) {
      os = "macOS";
    } else if (ua.includes("android")) {
      os = "Android";
    } else if (
      ua.includes("iphone") ||
      ua.includes("ipad") ||
      ua.includes("ipod")
    ) {
      os = "iOS";
    } else if (ua.includes("cros")) {
      os = "ChromeOS";
    } else if (ua.includes("linux")) {
      os = "Linux";
    }

    let browser = "Navegador desconhecido";

    if (ua.includes("edg")) {
      browser = "Microsoft Edge";
    } else if (
      ua.includes("opr") ||
      ua.includes("opera")
    ) {
      browser = "Opera";
    } else if (ua.includes("firefox")) {
      browser = "Mozilla Firefox";
    } else if (ua.includes("chrome")) {
      browser = "Google Chrome";
    } else if (
      ua.includes("safari") &&
      !ua.includes("chrome")
    ) {
      browser = "Safari";
    }

    return {
      device: mobile ? "Smartphone" : "Computador",
      browser,
      os,
    };
  };

  const formatDateTime = (
    dateString: string
  ) => {
    if (!dateString) {
      return "Data desconhecida";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Data desconhecida";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(date);
  };

  const mobileSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          getDeviceType(session.user_agent) ===
          "mobile"
      ).length,
    [sessions]
  );

  const desktopSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          getDeviceType(session.user_agent) ===
          "desktop"
      ).length,
    [sessions]
  );

  const logoutDevice = async () => {
    if (!selectedSession) {
      return;
    }

    try {
      setLoadingLogout(true);
      setError(null);

      const response = await fetch(
        "/api/sessions/logout-device",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            refresh_token:
              selectedSession.refresh_token,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Erro ao encerrar esta sessão."
        );
      }

      setSessions((prev) =>
        prev.filter(
          (session) =>
            String(session.id) !==
            String(selectedSession.id)
        )
      );

      setSelectedSession(null);
      setShowLogoutModal(false);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Erro ao encerrar dispositivo."
      );
    } finally {
      setLoadingLogout(false);
    }
  };

  const logoutAllSessions = async () => {
    try {
      setLoadingLogout(true);
      setError(null);

      const response = await fetch(
        "/api/logout-all",
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Erro ao encerrar as sessões."
        );
      }

      localStorage.clear();
      window.location.href = "/";
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Erro ao sair de todos os dispositivos."
      );

      setLoadingLogout(false);
    }
  };

  const atualizar = async () => {
    if (!usuario?.id) {
      return;
    }

    await carregarSessoes(
      String(usuario.id),
      true
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f8f7]">
        <div className="rounded-[28px] bg-white p-10 shadow-xl">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#149C8B] border-t-transparent" />

          <p className="mt-4 text-center text-sm font-semibold text-gray-600">
            Carregando acessos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8f7]">
      <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#149C8B]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#11897D]">
              <span className="h-2 w-2 rounded-full bg-[#149C8B]" />
              Segurança da conta
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Sessões ativas
            </h1>

            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              Gerencie os dispositivos onde sua conta está conectada.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void atualizar()}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-[#149C8B]/30 hover:bg-[#149C8B]/5 hover:text-[#11897D] disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Atualizar
            </button>

            {sessions.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  void logoutAllSessions()
                }
                disabled={loadingLogout}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-red-600 disabled:opacity-50"
              >
                <AlertTriangle size={18} />
                Sair de todos
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            <AlertTriangle
              size={20}
              className="shrink-0"
            />

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto rounded-lg p-1 hover:bg-red-100"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#149C8B]/10">
                <ShieldCheck
                  className="text-[#149C8B]"
                  size={25}
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Sessões ativas
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {sessions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#149C8B]/10">
                <Smartphone
                  className="text-[#149C8B]"
                  size={25}
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Smartphones
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {mobileSessions}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#149C8B]/10">
                <Monitor
                  className="text-[#149C8B]"
                  size={25}
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Computadores
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {desktopSessions}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#149C8B]/10">
                <Globe
                  className="text-[#149C8B]"
                  size={25}
                />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Conta conectada
                </p>

                <p className="mt-1 truncate text-sm font-bold text-gray-900">
                  {usuario?.email ||
                    "Usuário conectado"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-gray-900">
                Dispositivos conectados
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Estes são os acessos registrados atualmente na sua conta.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-full bg-[#149C8B]/10 px-4 py-2 text-xs font-bold text-[#11897D]">
              <span className="h-2 w-2 rounded-full bg-[#149C8B]" />

              {sessions.length}{" "}
              {sessions.length === 1
                ? "sessão ativa"
                : "sessões ativas"}
            </div>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-[30px] border border-gray-100 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#149C8B]/10">
              <Monitor
                size={38}
                className="text-[#149C8B]"
              />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Nenhum acesso encontrado
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Não encontramos nenhuma sessão registrada para esta conta.
            </p>

            <button
              type="button"
              onClick={() => void atualizar()}
              disabled={refreshing}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#149C8B] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#11897D] disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Atualizar acessos
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const info = parseUserAgent(
                session.user_agent
              );

              const mobile =
                getDeviceType(
                  session.user_agent
                ) === "mobile";

              return (
                <div
                  key={String(session.id)}
                  className="rounded-[28px] border border-gray-100 bg-white shadow-sm transition hover:border-[#149C8B]/20 hover:shadow-lg"
                >
                  <div className="p-5 sm:p-6 lg:p-7">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex items-center gap-5">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#149C8B]/10">
                          {mobile ? (
                            <Smartphone
                              size={31}
                              className="text-[#149C8B]"
                            />
                          ) : (
                            <Monitor
                              size={31}
                              className="text-[#149C8B]"
                            />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              {info.device}
                            </h3>

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#149C8B]/10 px-2.5 py-1 text-[10px] font-extrabold text-[#11897D]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#149C8B]" />
                              ATIVO
                            </span>
                          </div>

                          <p className="mt-1 text-sm font-bold text-[#149C8B]">
                            {info.browser}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {info.os}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[700px] xl:grid-cols-3">
                        <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                            <MapPin
                              size={20}
                              className="text-gray-500"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Endereço IP
                            </p>

                            <p className="mt-1 truncate text-sm font-bold text-gray-800">
                              {session.ip ||
                                "Não informado"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                            <Clock3
                              size={20}
                              className="text-gray-500"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Data do acesso
                            </p>

                            <p className="mt-1 text-sm font-bold text-gray-800">
                              {formatDateTime(
                                session.created_at
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSession(
                              session
                            );
                            setShowLogoutModal(
                              true
                            );
                          }}
                          className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:col-span-2 xl:col-span-1"
                        >
                          Encerrar acesso
                          <ChevronRight size={19} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {children}
      </div>

      {showLogoutModal &&
        selectedSession && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[30px] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#149C8B]">
                    Segurança
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-gray-900">
                    Encerrar acesso
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!loadingLogout) {
                      setShowLogoutModal(
                        false
                      );
                      setSelectedSession(null);
                    }
                  }}
                  disabled={loadingLogout}
                  className="rounded-xl p-2 text-gray-400 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                  <AlertTriangle
                    size={32}
                    className="text-red-500"
                  />
                </div>

                <h3 className="mt-5 text-center text-xl font-bold text-gray-900">
                  Deseja encerrar esta sessão?
                </h3>

                <p className="mt-2 text-center text-sm text-gray-500">
                  Este dispositivo será desconectado da sua conta.
                </p>

                <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                  {(() => {
                    const info =
                      parseUserAgent(
                        selectedSession.user_agent
                      );

                    return (
                      <>
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                            {getDeviceType(
                              selectedSession.user_agent
                            ) === "mobile" ? (
                              <Smartphone
                                size={24}
                                className="text-[#149C8B]"
                              />
                            ) : (
                              <Monitor
                                size={24}
                                className="text-[#149C8B]"
                              />
                            )}
                          </div>

                          <div>
                            <p className="font-bold text-gray-900">
                              {info.device}
                            </p>

                            <p className="text-sm font-semibold text-[#149C8B]">
                              {info.browser}
                            </p>

                            <p className="text-sm text-gray-500">
                              {info.os}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 space-y-3 border-t border-gray-200 pt-4">
                          <div className="flex justify-between gap-4 text-sm">
                            <span className="text-gray-500">
                              IP
                            </span>

                            <span className="font-bold text-gray-800">
                              {selectedSession.ip ||
                                "Não informado"}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4 text-sm">
                            <span className="text-gray-500">
                              Acesso
                            </span>

                            <span className="text-right font-bold text-gray-800">
                              {formatDateTime(
                                selectedSession.created_at
                              )}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogoutModal(
                        false
                      );
                      setSelectedSession(null);
                    }}
                    disabled={loadingLogout}
                    className="flex-1 rounded-xl border border-gray-200 px-5 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void logoutDevice()
                    }
                    disabled={loadingLogout}
                    className="flex-1 rounded-xl bg-red-500 px-5 py-3.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {loadingLogout
                      ? "Encerrando..."
                      : "Encerrar sessão"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}