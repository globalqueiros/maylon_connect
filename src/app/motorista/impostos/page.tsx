"use client";
import { useEffect, useState } from "react";

type User = {
    id: number;
    full_name: string;
    email: string;
};

export default function Page() {
    const [user, setUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/me", {
                    credentials: "include",
                });
                if (!res.ok) {
                    setUser(null);
                    return;
                }
                const data = await res.json();
                setUser(data);
            } catch (error) {
                console.error("Erro ao buscar usuário:", error);
                setUser(null);
            } finally {
                setLoadingUser(false);
            }
        };
        fetchUser();
    }, []);

    if (loadingUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-gray-400 p-8 rounded-2xl shadow-lg flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-700 font-medium">
                        Aguarde, carregando página...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-500 font-semibold">
                    Você precisa estar logado para acessar esta página.
                </p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-1">Imposto de renda</h1>
            <p className="text-sm text-black mb-4">
                Aqui você pode baixar uma declaração referente a suas despesas com saúde no ano selecionado.</p>


            <div className="max-w-md">
                <label className="block text-sm font-semibold text-black mb-2">
                    Ano de declaração
                </label>

                <div className="relative">
                    <select
                        className="
                            w-full
                            appearance-none
                            bg-gray-900
                            border border-gray-500/40
                            text-white
                            text-sm
                            rounded-xl
                            px-4 py-3
                            pr-10
                            focus:outline-none
                            focus:ring-2
                            focus:ring-teal-500
                        "
                    >
                        <option value="">Selecione o ano</option>
                        <option value={currentYear}>{currentYear}</option>
                        <option value={previousYear}>{previousYear}</option>
                    </select>

                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-300">
                        ▼
                    </div>
                </div>

                <p className="text-xs text-black mt-2">
                    Informe o ano de consulta do imposto de renda.
                </p>
            </div>
        </div>
    );
}