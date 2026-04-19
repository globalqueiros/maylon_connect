"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

type Beneficio = {
    id: number;
    imagem: string;
    titulo: string;
    descricao: string;
    valor: string;
    ativo: boolean;
};

type Usuario = {
    id: number;
    tipo: string;
};

export default function BeneficiosPage() {
    const [alerta, setAlerta] = useState<{
        tipo: "success" | "error" | "warning";
        mensagem: string;
    } | null>(null);
    const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingId, setLoadingId] = useState<number | null>(null);

    useEffect(() => {
        const carregarUsuario = async () => {
            try {
                const res = await fetch("/api/me", {
                    method: "GET",
                    credentials: "include",
                });

                if (!res.ok) {
                    window.location.href = "/";
                    return;
                }

                const data = await res.json();

                if (!data?.id) {
                    window.location.href = "/";
                    return;
                }

                setUsuario(data);
            } catch (error) {
                console.error("Erro ao buscar usuário:", error);
                window.location.href = "/";
            } finally {
                setLoadingUser(false);
            }
        };

        carregarUsuario();
    }, []);

    useEffect(() => {
        if (!usuario) return;

        const carregarBeneficios = async () => {
            const res = await fetch("/api/beneficios", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    usuario_id: usuario.id,
                    tipo: usuario.tipo,
                }),
            });

            const data = await res.json();
            setBeneficios(data);
        };

        carregarBeneficios();
    }, [usuario]);

    const toggleBeneficio = async (beneficio_id: number) => {
        if (!usuario) return;

        setLoadingId(beneficio_id);

        try {
            const res = await fetch("/api/beneficios/toggle", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    usuario_id: usuario.id,
                    beneficio_id,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setBeneficios(prev =>
                    prev.map(b =>
                        b.id === beneficio_id ? { ...b, ativo: data.ativo } : b
                    )
                );

                if (data.ativo) {
                    setAlerta({
                        tipo: "success",
                        mensagem: "Benefício ativado com sucesso!",
                    });
                } else {
                    setAlerta({
                        tipo: "warning",
                        mensagem: "Benefício desativado com sucesso!",
                    });
                }
            } else {
                setAlerta({
                    tipo: "error",
                    mensagem: data.error || "Erro ao atualizar benefício",
                });
            }
        } catch (error) {
            console.error("Erro ao atualizar benefício:", error);

            setAlerta({
                tipo: "error",
                mensagem: "Erro na requisição",
            });
        } finally {
            setLoadingId(null);
            setTimeout(() => setAlerta(null), 5000);
        }
    };

    const ativos = beneficios.filter(b => b.ativo);
    const disponiveis = beneficios.filter(b => !b.ativo);

    const getImageSrc = (img?: string) => {
        if (!img) return "/bg-login.png";
        if (img.startsWith("http://") || img.startsWith("https://")) {
            return img;
        }
        return img.startsWith("/") ? img : `/${img}`;
    };

    if (loadingUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-gray-400 p-8 rounded-2xl shadow-lg flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-300 font-medium">
                        Aguarde, carregando página...
                    </p>
                </div>
            </div>
        );
    }

    if (!usuario) return null;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-3">Área de Benefícios</h1>
            {alerta && (
                <div
                    className={`my-3 p-3 rounded-xl text-white text-sm font-medium ${alerta.tipo === "success"
                            ? "bg-green-500"
                            : alerta.tipo === "error"
                                ? "bg-red-500"
                                : "bg-red-500"
                        }`}
                >
                    {alerta.mensagem}
                </div>
            )}
            <h2 className="text-xl font-bold mb-4">Benefícios Ativos</h2>
            {ativos.length === 0 && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-xl text-sm">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01M12 3l9 16H3L12 3z"
                        />
                    </svg>
                    <p>Nenhum benefício ativo no momento.</p>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {ativos.map(b => (
                    <div
                        key={b.id}
                        className="bg-teal-700 rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition duration-300 flex flex-col h-full"
                    >
                        <div className="relative w-full h-38">
                            <Image
                                src={getImageSrc(b.imagem)}
                                alt={b.titulo || "Imagem"}
                                fill
                                sizes="(max-width: 768px) 100vw, 25vw"
                                className="object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/bg-login.png";
                                }}
                            />
                        </div>
                        <div className="p-4 pt-2 flex flex-col flex-1">
                            <div className="flex-1">
                                <h2 className="text-sm font-semibold text-white">
                                    {b.titulo}
                                </h2>
                                <p className="text-xs text-justify leading-5 text-white mt-1 mb-4">
                                    {b.descricao}
                                </p>
                                <p className="text-white font-semibold text-sm">
                                    {new Intl.NumberFormat("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                    }).format(Number(b.valor))}
                                </p>
                            </div>
                            <button
                                onClick={() => toggleBeneficio(b.id)}
                                disabled={loadingId === b.id}
                                className={`mt-4 text-sm w-full p-2 rounded-xl font-semibold text-white transition cursor-pointer ${loadingId === b.id
                                    ? "bg-red-400"
                                    : "bg-red-500 hover:bg-red-400"
                                    }`}
                            >
                                {loadingId === b.id ? "Desativando..." : "Desativar"}
                            </button>

                        </div>
                    </div>
                ))}
            </div>
            <h2 className="text-xl font-bold mt-8 mb-4">
                Benefícios Disponíveis
            </h2>
            {disponiveis.length === 0 && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-xl text-sm">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01M12 3l9 16H3L12 3z"
                        />
                    </svg>
                    <p>Nenhum benefício disponível no momento.</p>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {disponiveis.map(b => (
                    <div
                        key={b.id}
                        className="bg-teal-700 rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition duration-300 flex flex-col h-full"
                    >
                        <div className="relative w-full h-38">
                            <Image
                                src={getImageSrc(b.imagem)}
                                alt={b.titulo || "Imagem"}
                                fill
                                sizes="(max-width: 768px) 100vw, 25vw"
                                className="object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/bg-login.png";
                                }}
                            />
                        </div>
                        <div className="p-4 pt-2 flex flex-col flex-1">
                            <div className="flex-1">
                                <h2 className="text-sm font-semibold text-white">
                                    {b.titulo}
                                </h2>
                                <p className="text-xs text-justify leading-5 text-white mt-1 mb-4">
                                    {b.descricao}
                                </p>
                                <p className="text-white font-semibold text-sm">
                                    {new Intl.NumberFormat("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                    }).format(Number(b.valor))}
                                </p>
                            </div>
                            <button
                                onClick={() => toggleBeneficio(b.id)}
                                disabled={loadingId === b.id}
                                className={`mt-4 text-sm w-full p-2 rounded-xl font-semibold text-white transition cursor-pointer ${loadingId === b.id
                                    ? "bg-gray-400"
                                    : "bg-teal-500 hover:bg-teal-600"
                                    }`}
                            >
                                {loadingId === b.id ? "Ativando..." : "Ativar"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}