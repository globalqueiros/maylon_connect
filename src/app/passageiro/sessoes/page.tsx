"use client";
import { useState, useEffect } from "react";
import { AlertTriangle, Smartphone, Monitor, ChevronRight } from "lucide-react";

type Usuario = {
    id: string;
    nome: string;
    email: string;
    whatsapp: string;
    profile_image: string | null;
    tipo: "driver" | "customer";
};

type Session = {
    id: any;
    user_id: string;
    ip: string | null;
    user_agent: string | null;
    refresh_token: string;
    created_at: string;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loadingLogout, setLoadingLogout] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("sidebar");
        if (saved) setCollapsed(saved === "true");
    }, []);

    useEffect(() => {
        localStorage.setItem("sidebar", String(collapsed));
    }, [collapsed]);

    useEffect(() => {
        const carregarUsuario = async () => {
            try {
                const res = await fetch("/api/me", { credentials: "include" });
                if (!res.ok) return (window.location.href = "/");

                const data: Usuario = await res.json();
                if (!data || !data.id) return (window.location.href = "/");

                setUsuario(data);

                const sessRes = await fetch(`/api/sessions?userId=${data.id}`, {
                    credentials: "include",
                });

                if (sessRes.ok) {
                    const sessData: Session[] = await sessRes.json();
                    setSessions(sessData);
                }
            } catch (error) {
                console.error("Erro:", error);
                window.location.href = "/";
            } finally {
                setLoading(false);
            }
        };

        carregarUsuario();
    }, []);

    const getDeviceType = (userAgent: string | null) => {
        if (!userAgent) return "desktop";
        const ua = userAgent.toLowerCase();
        if (ua.includes("android") || ua.includes("iphone") || ua.includes("mobile")) {
            return "mobile";
        }
        return "desktop";
    };

    const parseUserAgent = (userAgent: string | null) => {
        if (!userAgent) {
            return { device: "Desconhecido", browser: "Desconhecido", os: "Desconhecido" };
        }

        const ua = userAgent.toLowerCase();

        const isMobile =
            ua.includes("android") || ua.includes("iphone") || ua.includes("mobile");

        const device = isMobile ? "Mobile" : "Desktop";

        let os = "Desconhecido";
        if (ua.includes("windows")) os = "Windows";
        else if (ua.includes("mac")) os = "MacOS";
        else if (ua.includes("android")) os = "Android";
        else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
        else if (ua.includes("linux")) os = "Linux";

        let browser = "Desconhecido";
        if (ua.includes("edg")) browser = "Edge";
        else if (ua.includes("chrome")) browser = "Chrome";
        else if (ua.includes("firefox")) browser = "Firefox";
        else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";

        return { device, browser, os };
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const pad = (n: number) => String(n).padStart(2, "0");
        const day = pad(date.getDate());
        const month = pad(date.getMonth() + 1);
        const year = date.getFullYear();
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    const logoutDevice = async () => {
        if (!selectedSession) return;
        try {
            setLoadingLogout(true);
            setError(null);

            const res = await fetch("/api/sessions/logout-device", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    refresh_token: selectedSession.refresh_token,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erro ao encerrar sessão");
                return;
            }
            setSessions((prev) =>
                prev.filter(
                    (session) => session.id !== selectedSession.id
                )
            );
            setShowLogoutModal(false);
            setSelectedSession(null);
        } catch (error) {
            console.error(error);
            setError("Erro ao encerrar dispositivo");
        } finally {
            setLoadingLogout(false);
        }
    };

    const logoutAllSessions = async () => {
        try {
            setLoadingLogout(true);
            setError(null);

            const res = await fetch("/api/logout-all", {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) {
                setError("Erro ao encerrar sessões");
                return;
            }
            localStorage.clear();
            window.location.href = "/";
        } catch (error) {
            console.error(error);
            setError("Erro ao sair de todas as sessões");
        } finally {
            setLoadingLogout(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-gray-400 p-8 rounded-2xl shadow-lg flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-300 font-medium">Aguarde, carregando página...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full p-8">
            <div className="w-full">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white leading-none">
                            Sessões Ativas
                        </h1>
                        <p className="text-teal-100 text-sm mt-1">
                            Gerencie os dispositivos onde sua conta está conectada.
                        </p>
                    </div>
                    <button
                        onClick={logoutAllSessions}
                        disabled={loadingLogout}
                        className="flex items-center gap-3 rounded-2xl text-sm cursor-pointer bg-red-500 px-8 py-4 font-semibold text-white shadow-lg transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
                    >
                        <AlertTriangle size={20} />
                        {loadingLogout
                            ? "Saindo..."
                            : "Sair de Todos os Dispositivos"}
                    </button>
                </div>
                {error && (
                    <div className="mb-4 text-sm flex items-center gap-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                        <span className="font-semibold">Erro:</span>
                        <span>{error}</span>
                    </div>
                )}
                <div className="space-y-4">
                    {sessions.length === 0 ? (
                        <div className="flex items-center gap-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                            <AlertTriangle size={18} />
                            <span>Nenhuma sessão encontrada.</span>
                        </div>
                    ) : (
                        sessions.map((session) => {
                            const deviceType = getDeviceType(session.user_agent);
                            const info = parseUserAgent(session.user_agent);
                            return (
                                <div
                                    key={session.refresh_token}
                                    className="rounded-2xl bg-white shadow-lg transition-all duration-200 hover:shadow-xl"
                                >
                                    <div className="flex items-center justify-between p-6">
                                        <div className="flex items-center gap-5">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
                                                {deviceType === "mobile" ? (
                                                    <Smartphone
                                                        size={30}
                                                        className="text-[#149C8B]"
                                                    />
                                                ) : (
                                                    <Monitor
                                                        size={30}
                                                        className="text-[#149C8B]"
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">
                                                    1 sessão em um{" "}
                                                    {deviceType === "mobile"
                                                        ? "smartphone"
                                                        : "computador"}
                                                </p>
                                                <h3 className="my-0 text-lg font-bold text-gray-900">
                                                    {info.os}
                                                </h3>
                                                <p className="font-semibold text-[#149C8B]">
                                                    {info.browser}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-800">
                                                    {info.device} • {info.os}
                                                </p>
                                                <p className="my-0 text-gray-500">
                                                    {session.ip || "127.0.0.1"}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    {formatDateTime(session.created_at)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedSession(session);
                                                    setShowLogoutModal(true);
                                                }}
                                                className="rounded-full cursor-pointer p-2 transition hover:bg-gray-100">
                                                <ChevronRight
                                                    size={24}
                                                    className="text-gray-400"
                                                />
                                            </button>
                                            {showLogoutModal && selectedSession && (
                                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                                                    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
                                                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                                                            <AlertTriangle
                                                                size={42}
                                                                className="text-red-600"
                                                            />
                                                        </div>
                                                        <h2 className="text-center text-2xl font-bold">
                                                            Encerrar Sessão
                                                        </h2>
                                                        <p className="mt-3 text-center text-gray-500">
                                                            Deseja realmente sair deste dispositivo?
                                                        </p>
                                                        <div className="mt-5 rounded-xl bg-gray-50 p-4 text-center">
                                                            <p className="font-semibold">
                                                                {parseUserAgent(selectedSession.user_agent).device}
                                                            </p>
                                                            <p className="text-gray-500">
                                                                {parseUserAgent(selectedSession.user_agent).browser}
                                                            </p>
                                                            <p className="text-sm text-gray-400">
                                                                {selectedSession.ip}
                                                            </p>
                                                        </div>
                                                        <div className="mt-8 flex gap-4">
                                                            <button
                                                                onClick={() => {
                                                                    setShowLogoutModal(false);
                                                                    setSelectedSession(null);
                                                                }}
                                                                className="flex-1 rounded-xl cursor-pointer border py-3"
                                                            >
                                                                Cancelar
                                                            </button>
                                                            <button
                                                                disabled={loadingLogout}
                                                                onClick={logoutDevice}
                                                                className="flex-1 rounded-xl cursor-pointer bg-red-500 py-3 font-semibold text-white hover:bg-red-600"
                                                            >
                                                                {loadingLogout
                                                                    ? "Saindo..."
                                                                    : "Sair"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}