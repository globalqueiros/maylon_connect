"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { AlertTriangle, CheckCircle, Gift } from "lucide-react";
import Cards from "react-credit-cards-2";
import "react-credit-cards-2/dist/es/styles-compiled.css";
import CardCheckoutModal from "../../components/CardCheckoutModal";
import {
  CreditCard
} from "lucide-react";

type Beneficio = {
    id: number;
    tipo: string;
    imagem: string;
    titulo: string;
    descricao: string;
    valor: string;
    status: boolean;
    status_assinatura: "aprovado" | "pendente" | "cancelado" | "expirado" | "erro";
};

type Usuario = {
    id: number;
    tipo: string;
};

type MetodoPagamento =
    | "boleto_btg"
    | "stripe_recorrente";

export default function BeneficiosPage() {
    const [alerta, setAlerta] = useState<{
        tipo: "success" | "error" | "warning";
        mensagem: string;
    } | null>(null);
    const [pixModalOpen, setPixModalOpen] = useState(false);
    const [etapa, setEtapa] = useState<"metodo" | "cartao">("metodo");
    const [number, setNumber] = useState("");
    const [name, setName] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [focus, setFocus] = useState("");
    const [openCartao, setOpenCartao] = useState(false);
    const [beneficios, setBeneficios] = useState<
        Beneficio[]
    >([]);

    const [usuario, setUsuario] =
        useState<Usuario | null>(null);

    const [loadingUser, setLoadingUser] =
        useState(true);

    const [loadingId, setLoadingId] = useState<
        number | null
    >(null);

    const [modalOpen, setModalOpen] =
        useState(false);

    const [beneficioSelecionado, setBeneficioSelecionado] =
        useState<Beneficio | null>(null);

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
                console.error(
                    "Erro ao buscar usuário:",
                    error
                );

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
                credentials: "include",
                body: JSON.stringify({
                    usuario_id: usuario.id,
                    tipo: usuario.tipo,
                }),
            });

            const texto = await res.text();

            console.log("Status API benefícios:", res.status);
            console.log("Resposta bruta:", texto);

            let data;

            try {
                data = JSON.parse(texto);
            } catch {
                console.error("API não retornou JSON");
                setBeneficios([]);
                return;
            }

            console.log("Resposta da API:", data);

            let lista: Beneficio[] = [];

            if (Array.isArray(data)) {
                lista = data;
            } else if (Array.isArray(data.beneficios)) {
                lista = data.beneficios;
            } else if (Array.isArray(data.data)) {
                lista = data.data;
            } else {
                console.error("Formato inválido:", data);
                setBeneficios([]);
                return;
            }
            setBeneficios(
                lista.filter(b => b.tipo === "passageiro")
            );
        };

        carregarBeneficios();
    }, [usuario]);

    const abrirModal = (beneficio: Beneficio) => {
        setBeneficioSelecionado(beneficio);
        setModalOpen(true);
    };

    const abrirPixModal = () => {
        setModalOpen(false);

        setTimeout(() => {
            setPixModalOpen(true);
        }, 200);
    };

    const fecharPixModal = () => {
        setPixModalOpen(false);
    };

    const fecharModal = () => {
        setModalOpen(false);
        setBeneficioSelecionado(null);
    };

    const toggleBeneficio = async (
        beneficio_id: number,
        metodo_pagamento?: MetodoPagamento
    ) => {
        if (!usuario) return;

        setLoadingId(beneficio_id);

        try {
            const res = await fetch(
                "/api/beneficios/toggle",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        usuario_id: usuario.id,
                        beneficio_id,
                        metodo_pagamento,
                    }),
                }
            );

            const data = await res.json();

            if (res.ok) {
                setBeneficios(prev =>
                    prev.map(b =>
                        b.id === beneficio_id
                            ? {
                                ...b,
                                ativo: data.ativo,
                                status_assinatura: data.status_assinatura,
                            }
                            : b
                    )
                );

                if (data.ativo) {
                    setAlerta({
                        tipo: "success",
                        mensagem:
                            "Benefício ativado com sucesso!",
                    });
                } else {
                    setAlerta({
                        tipo: "warning",
                        mensagem:
                            "Benefício desativado com sucesso!",
                    });
                }

                fecharModal();
            } else {
                setAlerta({
                    tipo: "error",
                    mensagem:
                        data.error ||
                        "Erro ao atualizar benefício",
                });
            }
        } catch (error) {
            console.error(
                "Erro ao atualizar benefício:",
                error
            );

            setAlerta({
                tipo: "error",
                mensagem: "Erro na requisição",
            });
        } finally {
            setLoadingId(null);

            setTimeout(
                () => setAlerta(null),
                5000
            );
        }
    };

    const ativos = beneficios.filter(
        b => !b.status
    );

    const disponiveis = beneficios.filter(
        b => b.status
    );

    const possuiAprovado = ativos.some(
        b => b.status_assinatura === "aprovado"
    );

    const getImageSrc = (img?: string) => {
        if (!img) return "/bg-login.png";
        if (
            img.startsWith("http://") ||
            img.startsWith("https://")
        ) {
            return img;
        }
        return img.startsWith("/")
            ? img
            : `/${img}`;
    };

    useEffect(() => {
        const params = new URLSearchParams(
            window.location.search
        );

        const success = params.get("success");

        if (success) {
            setAlerta({
                tipo: "success",
                mensagem:
                    "Pagamento aprovado com sucesso!",
            });
            setTimeout(() => {
                window.location.href =
                    "/passageiro/beneficios";
            }, 2000);
        }
    }, []);

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
    return (
        <div className="min-h-screen p-6">
            <div className="mb-10">
                <h1 className="text-xl font-bold text-white leading-none">
                    Área de Benefícios
                </h1>
                <p className="text-teal-100 text-sm mt-1">
                    Gerencie seus benefícios e aproveite nossas vantagens exclusivas.
                </p>
            </div>
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-300" />
                    </div>
                    <h2 className="text-xl font-bold text-white leading-none">
                        Benefícios Ativos
                    </h2>
                </div>
                {ativos.length === 0 && (
                    <div className="bg-white border border-red-300 rounded-2xl px-6 py-5 flex items-center gap-4 shadow">
                        <AlertTriangle className="text-red-500 w-6 h-6" />
                        <span className="text-red-500 font-medium">
                            Nenhum benefício ativo no momento.
                        </span>
                    </div>
                )}
            </div>
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white leading-none">
                        Benefícios Disponíveis
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                    {disponiveis.map((b) => (
                        <div
                            key={b.id}
                            className="group overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                        >
                            <div className="relative h-60 overflow-hidden">
                                <Image
                                    src={getImageSrc(b.imagem)}
                                    alt={b.titulo}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-1 rounded-full text-sm font-semibold text-[#009688]">
                                    Benefício Exclusivo
                                </span>
                                <div className="absolute bottom-5 left-6 right-6">
                                    <h3 className="text-2xl font-bold text-white">
                                        {b.titulo}
                                    </h3>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col pt-4">
                                <p className="text-gray-600 leading-6 text-justify text-sm line-clamp-4 flex-1">
                                    {b.descricao}
                                </p>
                                <div className="mt-3 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs mb-0 uppercase tracking-widest text-gray-400">
                                            Valor
                                        </span>
                                        <h4 className="text-xl mt-0 font-extrabold text-[#009688]">
                                            {new Intl.NumberFormat("pt-BR", {
                                                style: "currency",
                                                currency: "BRL",
                                            }).format(Number(b.valor))}
                                        </h4>
                                    </div>
                                </div>
                                <button
                                    onClick={() => abrirModal(b)}
                                    className="mt-3 w-full cursor-pointer rounded-2xl bg-[#009688] py-2 text-base font-semibold text-white shadow-lg hover:bg-[#00796B] hover:shadow-xl transition-all duration-300"
                                >
                                    Ativar Benefício
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {modalOpen && beneficioSelecionado && (
                    <div
                        className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-sm p-4"
                        onClick={fecharModal}
                    >
                        <div className="flex min-h-screen items-center justify-center p-6">
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-[fadeIn_.25s_ease]"
                            >
                                <div className="relative h-52">
                                    <Image
                                        src={getImageSrc(beneficioSelecionado.imagem)}
                                        alt={beneficioSelecionado.titulo}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#003d39] via-[#003d3990] to-transparent" />
                                    <button
                                        onClick={fecharModal}
                                        className="absolute cursor-pointer right-4 top-4 h-10 w-10 rounded-full bg-white/90 text-gray-700 hover:bg-white"
                                    >
                                        ✕
                                    </button>
                                    <div className="absolute bottom-6 left-6">
                                        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                                            BENEFÍCIO EXCLUSIVO
                                        </span>
                                        <h2 className="mt-3 text-3xl font-bold text-white">
                                            {beneficioSelecionado.titulo}
                                        </h2>
                                        <p className="text-white/90">
                                            Proteção em todas as suas viagens
                                        </p>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="rounded-2xl bg-gray-50 p-5 border">
                                        <h3 className="font-semibold text-gray-900">
                                            O que está incluso?
                                        </h3>
                                        <p className="mt-2 text-gray-600 text-sm text-justify leading-6">
                                            {beneficioSelecionado.descricao}
                                        </p>
                                    </div>
                                    <div className="mt-6 flex items-center justify-between rounded-2xl bg-teal-50 border border-teal-200 p-5">
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Assinatura Mensal
                                            </p>
                                            <h3 className="text-2xl font-bold text-[#009688]">
                                                {new Intl.NumberFormat("pt-BR", {
                                                    style: "currency",
                                                    currency: "BRL",
                                                }).format(Number(beneficioSelecionado.valor))}
                                            </h3>
                                        </div>
                                        <div className="rounded-full bg-[#009688] p-4 text-white text-2xl">
                                            🛡️
                                        </div>
                                    </div>
                                    <h3 className="mt-8 text-lg font-bold text-gray-900">
                                        Forma de pagamento
                                    </h3>
                                    <div className="mt-4 grid gap-4">
                                        <button
                                            onClick={abrirPixModal}
                                            disabled={loadingId === beneficioSelecionado.id}
                                            className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-gray-200 p-5 transition hover:border-[#009688] hover:bg-teal-50"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 text-3xl">
                                                    ⚡
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-semibold">
                                                        PIX
                                                    </h4>
                                                    <p className="text-sm text-gray-500">
                                                        Pagamento recorrente via PIX
                                                    </p>
                                                </div>
                                            </div>

                                            ➜
                                        </button>
                                        <button
                                            onClick={() => setOpenCartao(true)}
                                            disabled={loadingId === beneficioSelecionado.id}
                                            className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-gray-200 p-5 transition hover:border-[#009688] hover:bg-teal-50"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-3xl">
                                                    💳
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-semibold">
                                                        Cartão de Crédito
                                                    </h4>
                                                    <p className="text-sm text-gray-500">
                                                        Cobrança recorrente
                                                    </p>
                                                </div>
                                            </div>

                                            ➜
                                        </button>
                                        <CardCheckoutModal

                                            open={openCartao}

                                            onClose={() =>
                                                setOpenCartao(false)
                                            }

                                        />
                                    </div>
                                    <div className="mt-8 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-justify text-amber-800">
                                        Ao prosseguir, sua assinatura será processada após a confirmação do pagamento, e os benefícios contratados serão liberados automaticamente.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {pixModalOpen && beneficioSelecionado && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                >
                    <div className="bg-white rounded-3xl w-full max-w-md p-8">
                        <h2 className="text-2xl font-bold text-center">
                            Pagamento via PIX
                        </h2>
                        <p className="text-gray-500 text-center mt-2">
                            Escaneie o QR Code ou copie o código PIX.
                        </p>
                        <div className="flex justify-center my-8">
                            <div className="w-56 h-56 bg-gray-100 rounded-xl flex items-center justify-center">
                                QR CODE
                            </div>
                        </div>
                        <button
                            className="w-full cursor-pointer bg-[#009688] text-white rounded-xl py-3"
                            onClick={() =>
                                toggleBeneficio(
                                    beneficioSelecionado.id,
                                    "boleto_btg"
                                )
                            }
                        >
                            Gerar PIX
                        </button>
                        <button
                            onClick={fecharPixModal}
                            className="mt-3 cursor-pointer w-full border rounded-xl py-3"
                        >
                            Cancelar
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
}