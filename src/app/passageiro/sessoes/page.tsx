"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  UserRound,
  Laptop,
  LogOut,
  Wifi,
  CheckCircle2,
} from "lucide-react";

type Usuario = {
  id: string | number;
  nome?: string;
  email?: string;
  whatsapp?: string;
  profile_image?: string | null;
  tipo?: string;
  user_type?: string;
};

type Session = {
  id: string | number;
  user_id: string;
  ip: string | null;
  user_agent: string | null;
  refresh_token?: string;
  created_at: string;
};

type DeviceInfo = {
  device: "Smartphone" | "Computador";
  browser: string;
  os: string;
};

const ITEMS_PER_PAGE = 15;

function getUserId(user: any): string | null {
  const id =
    user?.id ??
    user?.user_id ??
    user?.usuario_id ??
    user?.userId ??
    user?.usuarioId;

  if (id === undefined || id === null) {
    return null;
  }

  const value = String(id).trim();

  return value || null;
}

function extractSessions(data: any): any[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.sessions)) {
    return data.sessions;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (Array.isArray(data.rows)) {
    return data.rows;
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  if (Array.isArray(data?.data?.sessions)) {
    return data.data.sessions;
  }

  if (Array.isArray(data?.data?.rows)) {
    return data.data.rows;
  }

  return [];
}

function normalizarSessoes(data: any): Session[] {
  return extractSessions(data)
    .filter(Boolean)
    .map((session: any, index: number) => ({
      id:
        session?.id ??
        session?.session_id ??
        session?.sessionId ??
        `session-${index}`,

      user_id: String(
        session?.user_id ??
          session?.usuario_id ??
          session?.userId ??
          ""
      ),

      ip:
        session?.ip ??
        session?.ip_address ??
        session?.ipAddress ??
        null,

      user_agent:
        session?.user_agent ??
        session?.userAgent ??
        session?.device_info ??
        null,

      refresh_token:
        session?.refresh_token ??
        session?.refreshToken ??
        "",

      created_at: String(
        session?.created_at ??
          session?.createdAt ??
          session?.criado_em ??
          session?.data_acesso ??
          session?.login_at ??
          ""
      ),
    }));
}

function getDeviceType(
  userAgent: string | null
): "mobile" | "desktop" {
  if (!userAgent) {
    return "desktop";
  }

  const ua = userAgent.toLowerCase();

  return /android|iphone|ipad|ipod|mobile/.test(ua)
    ? "mobile"
    : "desktop";
}

function parseUserAgent(
  userAgent: string | null
): DeviceInfo {
  if (!userAgent) {
    return {
      device: "Computador",
      browser: "Navegador desconhecido",
      os: "Sistema desconhecido",
    };
  }

  const ua = userAgent.toLowerCase();

  const mobile =
    /android|iphone|ipad|ipod|mobile/.test(ua);

  let os = "Sistema desconhecido";

  if (ua.includes("windows")) {
    os = "Windows";
  } else if (
    ua.includes("iphone") ||
    ua.includes("ipad") ||
    ua.includes("ipod")
  ) {
    os = "iOS";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (
    ua.includes("macintosh") ||
    ua.includes("mac os")
  ) {
    os = "macOS";
  } else if (ua.includes("cros")) {
    os = "ChromeOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  }

  let browser = "Navegador desconhecido";

  if (
    ua.includes("edg/") ||
    ua.includes("edgios") ||
    ua.includes("edga")
  ) {
    browser = "Microsoft Edge";
  } else if (
    ua.includes("opr/") ||
    ua.includes("opera")
  ) {
    browser = "Opera";
  } else if (ua.includes("firefox")) {
    browser = "Mozilla Firefox";
  } else if (
    ua.includes("chrome") &&
    !ua.includes("edg")
  ) {
    browser = "Google Chrome";
  } else if (
    ua.includes("safari") &&
    !ua.includes("chrome")
  ) {
    browser = "Safari";
  }

  return {
    device: mobile
      ? "Smartphone"
      : "Computador",
    browser,
    os,
  };
}

function formatDateTime(dateString: string) {
  if (!dateString) {
    return "Data desconhecida";
  }

  let date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    date = new Date(
      dateString.replace(" ", "T")
    );
  }

  if (Number.isNaN(date.getTime())) {
    return "Data desconhecida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [sessions, setSessions] =
    useState<Session[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [loadingLogout, setLoadingLogout] =
    useState(false);

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  const [selectedSession, setSelectedSession] =
    useState<Session | null>(null);

  // PAGINA ATUAL
  const [currentPage, setCurrentPage] =
    useState(1);

  const carregarSessoes =
    useCallback(async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const response = await fetch(
          `/api/sessions?_t=${Date.now()}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              Accept: "application/json",
              "Cache-Control":
                "no-cache, no-store, must-revalidate",
            },
          }
        );

        const text =
          await response.text();

        let data: any = null;

        try {
          data = text
            ? JSON.parse(text)
            : null;
        } catch {
          throw new Error(
            "A API de sessões não retornou JSON válido."
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.error ??
              data?.message ??
              `Erro HTTP ${response.status}.`
          );
        }

        const lista =
          normalizarSessoes(data);

        setSessions(lista);

        // Volta para a primeira página
        // sempre que atualizar as sessões.
        setCurrentPage(1);
      } catch (err) {
        console.error(
          "[SESSIONS] Erro:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os acessos."
        );

        setSessions([]);
        setCurrentPage(1);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

  useEffect(() => {
    let mounted = true;

    async function carregarUsuario() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "/api/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              Accept: "application/json",
              "Cache-Control":
                "no-cache, no-store, must-revalidate",
            },
          }
        );

        const text =
          await response.text();

        let data: any = null;

        try {
          data = text
            ? JSON.parse(text)
            : null;
        } catch {
          throw new Error(
            "A API /api/me não retornou JSON válido."
          );
        }

        if (!response.ok) {
          window.location.href = "/";
          return;
        }

        const usuarioData =
          data?.usuario ??
          data?.user ??
          data?.data ??
          data;

        const userId =
          getUserId(usuarioData);

        if (!userId) {
          throw new Error(
            "A API /api/me não enviou o ID do usuário."
          );
        }

        if (!mounted) {
          return;
        }

        setUsuario({
          ...usuarioData,
          id: userId,
        });

        await carregarSessoes();
      } catch (err) {
        console.error(
          "[ME] Erro:",
          err
        );

        if (!mounted) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar sua conta."
        );

        setSessions([]);
        setLoading(false);
      }
    }

    void carregarUsuario();

    return () => {
      mounted = false;
    };
  }, [carregarSessoes]);

  const mobileSessions =
    useMemo(
      () =>
        sessions.filter(
          (session) =>
            getDeviceType(
              session.user_agent
            ) === "mobile"
        ).length,
      [sessions]
    );

  const desktopSessions =
    useMemo(
      () =>
        sessions.filter(
          (session) =>
            getDeviceType(
              session.user_agent
            ) === "desktop"
        ).length,
      [sessions]
    );

  // ============================================
  // PAGINAÇÃO
  // ============================================

  const totalPages = Math.ceil(
    sessions.length / ITEMS_PER_PAGE
  );

  const paginatedSessions = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    return sessions.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [sessions, currentPage]);

  const firstItem =
    sessions.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    sessions.length
  );

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);

    // Volta suavemente para o topo da lista
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const atualizar = useCallback(
    async () => {
      await carregarSessoes(true);
    },
    [carregarSessoes]
  );

  const abrirModalLogout = (
    session: Session
  ) => {
    setSelectedSession(session);
    setShowLogoutModal(true);
  };

  const fecharModalLogout = () => {
    if (loadingLogout) {
      return;
    }

    setShowLogoutModal(false);
    setSelectedSession(null);
  };

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
            "Content-Type":
              "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            id: selectedSession.id,
            session_id:
              selectedSession.id,
          }),
        }
      );

      const text =
        await response.text();

      let data: any = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {}

      if (!response.ok) {
        throw new Error(
          data?.error ??
            data?.message ??
            `Erro HTTP ${response.status}.`
        );
      }

      const removedIndex =
        sessions.findIndex(
          (session) =>
            String(session.id) ===
            String(selectedSession.id)
        );

      setSessions((prev) =>
        prev.filter(
          (session) =>
            String(session.id) !==
            String(selectedSession.id)
        )
      );

      /*
       * Se remover o último item da página atual,
       * volta uma página quando necessário.
       */
      const newTotal =
        sessions.length - 1;

      const newTotalPages =
        Math.ceil(
          newTotal / ITEMS_PER_PAGE
        );

      if (
        currentPage > newTotalPages &&
        newTotalPages > 0
      ) {
        setCurrentPage(
          newTotalPages
        );
      } else if (
        removedIndex === -1
      ) {
        setCurrentPage(1);
      }

      fecharModalLogout();
    } catch (err) {
      console.error(
        "[LOGOUT DEVICE]",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Erro ao encerrar dispositivo."
      );
    } finally {
      setLoadingLogout(false);
    }
  };

 if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex w-full max-w-[320px] flex-col items-center rounded-[28px] bg-white p-10 shadow-xl ring-1 ring-black/5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f7f4]">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#149C8B] border-t-transparent" />
          </div>
          <p className="mt-5 text-sm font-semibold text-gray-700">
            Carregando seus acessos
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Aguarde um momemento...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-8xl">

        {/* HEADER */}
        <header className="relative overflow-hidden rounded-[32px] bg-[#102F2C] p-6 shadow-xl sm:p-8">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#149C8B]/30 blur-3xl" />

          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#149C8B]/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#149C8B] shadow-lg shadow-[#149C8B]/20">
                <ShieldCheck
                  size={32}
                  className="text-white"
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  Dispositivos conectados
                </h1>

                <p className="mt-0 max-w-xl text-sm leading-6 text-white/60">
                  Veja onde sua conta está conectada e encerre acessos que você não reconhece.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ERRO */}
        {error && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertTriangle
              size={19}
              className="shrink-0"
            />

            <span className="flex-1">
              {error}
            </span>
          </div>
        )}

        {/* ESTATÍSTICAS */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<ShieldCheck size={22} />}
            label="Sessões"
            value={sessions.length}
          />

          <StatCard
            icon={<Smartphone size={22} />}
            label="Celulares"
            value={mobileSessions}
          />

          <StatCard
            icon={<Laptop size={22} />}
            label="Computadores"
            value={desktopSessions}
          />

          <StatCard
            icon={<Globe size={22} />}
            label="Status"
            value="Seguro"
            green
          />
        </div>

        {/* SESSÕES */}
        <section className="mt-5">
          <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#173B3A]">
                Seus acessos
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {sessions.length}{" "}
                {sessions.length === 1
                  ? "dispositivo conectado"
                  : "dispositivos conectados"}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void atualizar()
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#149C8B] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#11897D] disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Atualizar
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#149C8B]/10">
                <Wifi
                  size={34}
                  className="text-[#149C8B]"
                />
              </div>

              <h2 className="mt-6 text-xl font-bold text-[#173B3A]">
                Nenhuma sessão encontrada
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Não encontramos outros dispositivos conectados à sua conta.
              </p>
            </div>
          ) : (
            <>
              {/* GRID DE DISPOSITIVOS */}
              <div className="grid gap-4 lg:grid-cols-2">
                {paginatedSessions.map(
                  (session) => {
                    const info =
                      parseUserAgent(
                        session.user_agent
                      );

                    const mobile =
                      getDeviceType(
                        session.user_agent
                      ) === "mobile";

                    return (
                      <div
                        key={`${session.id}-${session.created_at}`}
                        className="group rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#149C8B]/30 hover:shadow-xl"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF7F4]">
                              {mobile ? (
                                <Smartphone
                                  size={27}
                                  className="text-[#149C8B]"
                                />
                              ) : (
                                <Monitor
                                  size={27}
                                  className="text-[#149C8B]"
                                />
                              )}
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-[#173B3A]">
                                  {info.device}
                                </h3>

                                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-600">
                                  Ativo
                                </span>
                              </div>

                              <p className="mt-1 text-sm font-semibold text-[#149C8B]">
                                {info.browser}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {info.os}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              abrirModalLogout(
                                session
                              )
                            }
                            className="rounded-xl cursor-pointer p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                            title="Encerrar acesso"
                          >
                            <LogOut size={18} />
                          </button>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <InfoItem
                            icon={
                              <MapPin
                                size={17}
                              />
                            }
                            label="Endereço IP"
                            value={
                              session.ip ||
                              "Não informado"
                            }
                          />

                          <InfoItem
                            icon={
                              <Clock3
                                size={17}
                              />
                            }
                            label="Último acesso"
                            value={formatDateTime(
                              session.created_at
                            )}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            abrirModalLogout(
                              session
                            )
                          }
                          className="mt-4 cursor-pointer flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          Encerrar este acesso

                          <ChevronRight
                            size={17}
                          />
                        </button>
                      </div>
                    );
                  }
                )}
              </div>

              {/* PAGINAÇÃO */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  {/* CONTADOR */}
                  <p className="text-center text-sm text-slate-500 sm:text-left">
                    Mostrando{" "}
                    <span className="font-bold text-slate-700">
                      {firstItem}
                    </span>
                    {" - "}
                    <span className="font-bold text-slate-700">
                      {lastItem}
                    </span>
                    {" de "}
                    <span className="font-bold text-slate-700">
                      {sessions.length}
                    </span>
                    {" dispositivos"}
                  </p>

                  {/* CONTROLES */}
                  <div className="flex items-center justify-center gap-2">
                    {/* ANTERIOR */}
                    <button
                      type="button"
                      onClick={() =>
                        goToPage(
                          currentPage - 1
                        )
                      }
                      disabled={
                        currentPage === 1
                      }
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Anterior
                    </button>

                    {/* NÚMEROS */}
                    <div className="flex items-center gap-1">
                      {Array.from(
                        {
                          length: totalPages,
                        },
                        (_, index) =>
                          index + 1
                      ).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() =>
                            goToPage(page)
                          }
                          className={`h-9 min-w-9 rounded-lg px-3 text-sm font-bold transition ${
                            currentPage ===
                            page
                              ? "bg-[#149C8B] text-white shadow-sm"
                              : "text-slate-600 hover:bg-[#EAF7F4] hover:text-[#149C8B]"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    {/* PRÓXIMA */}
                    <button
                      type="button"
                      onClick={() =>
                        goToPage(
                          currentPage + 1
                        )
                      }
                      disabled={
                        currentPage ===
                        totalPages
                      }
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {children}
      </div>

      {/* MODAL LOGOUT */}
      {showLogoutModal &&
        selectedSession && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>

                  <h2 className="mt-1 text-lg font-bold text-[#173B3A]">
                    Encerrar acesso
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    fecharModalLogout
                  }
                  disabled={loadingLogout}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                  <AlertTriangle
                    size={30}
                    className="text-red-500"
                  />
                </div>

                <h3 className="mt-5 text-center text-xl font-bold text-[#173B3A]">
                  Encerrar esta sessão?
                </h3>

                <p className="mt-2 text-center text-sm text-slate-500">
                  O dispositivo perderá imediatamente o acesso à sua conta.
                </p>

                {(() => {
                  const info =
                    parseUserAgent(
                      selectedSession.user_agent
                    );

                  const mobile =
                    getDeviceType(
                      selectedSession.user_agent
                    ) === "mobile";

                  return (
                    <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                          {mobile ? (
                            <Smartphone
                              size={23}
                              className="text-[#149C8B]"
                            />
                          ) : (
                            <Monitor
                              size={23}
                              className="text-[#149C8B]"
                            />
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-[#173B3A]">
                            {info.device}
                          </p>

                          <p className="text-sm font-semibold text-[#149C8B]">
                            {info.browser}
                          </p>

                          <p className="text-xs text-slate-400">
                            {info.os}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                        <div className="flex justify-between gap-4 text-sm">
                          <span className="text-slate-500">
                            IP
                          </span>

                          <strong className="text-right text-slate-700">
                            {selectedSession.ip ||
                              "Não informado"}
                          </strong>
                        </div>

                        <div className="flex justify-between gap-4 text-sm">
                          <span className="text-slate-500">
                            Acesso
                          </span>

                          <strong className="text-right text-slate-700">
                            {formatDateTime(
                              selectedSession.created_at
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={
                      fecharModalLogout
                    }
                    disabled={loadingLogout}
                    className="flex-1 cursor-pointer rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void logoutDevice()
                    }
                    disabled={loadingLogout}
                    className="flex-1 cursor-pointer rounded-xl bg-red-500 px-4 py-3.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
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

function StatCard({
  icon,
  label,
  value,
  green = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  green?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF7F4] text-[#149C8B]">
          {icon}
        </div>

        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
            {label}
          </p>

          <p
            className={`mt-0' text-xl font-bold ${
              green
                ? "text-emerald-600"
                : "text-[#173B3A]"
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#149C8B]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-1 truncate text-xs font-bold text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}
