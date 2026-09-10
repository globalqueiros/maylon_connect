"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Eye,
    CreditCard,
    Trash2,
    Search,
} from "lucide-react";

type Produto = {
    id: number;
    nome: string;
    descricao: string;
    imagem: string;
    preco: number;
};

export default function Relatorio() {
    const [loadingUser, setLoadingUser] = useState(true);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]);
    const [carrinho, setCarrinho] = useState<Produto[]>([]);
    const [search, setSearch] = useState("");
    const [loadingBtn, setLoadingBtn] = useState<number | null>(null);

    useEffect(() => {
        async function carregarPagina() {
            try {
                const res = await fetch("/api/produtos");
                const data = await res.json();

                setProdutos(data);
                setTodosProdutos(data);

                const carrinhoSalvo = JSON.parse(
                    localStorage.getItem("carrinho") || "[]"
                );

                setCarrinho(carrinhoSalvo);
            } catch (error) {
                console.error("Erro ao buscar produtos");
            } finally {
                setTimeout(() => {
                    setLoadingUser(false);
                }, 800);
            }
        }

        carregarPagina();
    }, []);

    function salvarCarrinho(lista: Produto[]) {
        setCarrinho(lista);
        localStorage.setItem("carrinho", JSON.stringify(lista));
    }

    function addCarrinho(produto: Produto) {
        setLoadingBtn(produto.id);

        const novoCarrinho = [...carrinho, produto];
        salvarCarrinho(novoCarrinho);

        setTimeout(() => {
            setLoadingBtn(null);
        }, 700);
    }

    function removerItem(index: number) {
        const novoCarrinho = carrinho.filter((_, i) => i !== index);
        salvarCarrinho(novoCarrinho);
    }

    const total = carrinho.reduce(
        (acc, item) => acc + Number(item.preco),
        0
    );

    if (loadingUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>

                    <p className="text-gray-700 font-semibold">
                        Carregando loja...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-44">
            <div className="max-w-7xl mx-auto mb-8">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900">
                    Loja Maylon
                </h1>

                <p className="text-gray-500 mt-2 text-sm md:text-base">
                    Encontre os melhores produtos para carro e moto.
                </p>
            </div>

            <form className="w-full max-w-4xl mx-auto mb-10">
                <div
                    className="
                        flex
                        items-center
                        h-[68px]
                        bg-white
                        rounded-[30px]
                        border
                        border-gray-200
                        shadow-md
                        overflow-hidden
                        transition-all
                        duration-300
                        hover:shadow-xl
                    "
                >
                    <div className="pl-5">
                        <div
                            className="
                                w-11
                                h-11
                                rounded-2xl
                                bg-gray-100
                                flex
                                items-center
                                justify-center
                            "
                        >
                            <Search
                                size={20}
                                className="text-gray-500"
                            />
                        </div>
                    </div>

                    <input
                        type="text"
                        placeholder="Pesquisar produtos..."
                        value={search}
                        onChange={(e) => {
                            const value = e.target.value;

                            setSearch(value);

                            if (!value.trim()) {
                                setProdutos(todosProdutos);
                                return;
                            }

                            const filtrados = todosProdutos.filter((item) =>
                                item.nome
                                    .toLowerCase()
                                    .includes(value.toLowerCase())
                            );

                            setProdutos(filtrados);
                        }}
                        className="
                            flex-1
                            h-full
                            px-5
                            bg-transparent
                            outline-none
                            text-gray-800
                            placeholder:text-gray-400
                            text-sm
                            md:text-base
                            font-medium
                        "
                    />

                    <div className="w-px h-8 bg-gray-200" />

                    <button
                        type="button"
                        className="
                            mx-3
                            px-6
                            h-12
                            rounded-2xl
                            bg-black
                            text-white
                            text-sm
                            font-semibold
                            hover:scale-105
                            active:scale-95
                            transition-all
                            duration-300
                        "
                    >
                        Buscar
                    </button>
                </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-5 max-w-[1800px] mx-auto">
                {produtos.map((item) => (
                    <div
                        key={item.id}
                        className="
                            group
                            bg-white
                            rounded-3xl
                            border
                            border-gray-100
                            shadow-sm
                            hover:shadow-2xl
                            hover:-translate-y-1
                            transition-all
                            duration-300
                            overflow-hidden
                        "
                    >
                        <div className="relative overflow-hidden bg-gray-50">
                            <Image
                                src={item.imagem}
                                alt={item.nome}
                                width={500}
                                height={300}
                                className="
                                    h-42
                                    w-full
                                    object-contain
                                    bg-white
                                    p-4
                                    group-hover:scale-105
                                    transition-transform
                                    duration-500
                                "
                            />
                        </div>

                        <div className="p-4 pt-0">
                            <h2 className="text-sm font-bold text-gray-800 line-clamp-1">
                                {item.nome}
                            </h2>

                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[35px]">
                                {item.descricao}
                            </p>

                            <div>
                                <p className="text-[11px] text-gray-400">
                                    Preço
                                </p>

                                <h3 className="text-xl font-bold text-green-600">
                                    R$ {Number(item.preco).toFixed(2)}
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-5">
                                <button
                                    onClick={() => addCarrinho(item)}
                                    disabled={loadingBtn === item.id}
                                    className={`
                                    group
                                    relative
                                    overflow-hidden
                                    h-12
                                    rounded-2xl
                                    text-sm
                                    font-semibold
                                    tracking-wide
                                    text-white
                                    transition-all
                                    duration-500
                                    shadow-lg
                                    cursor-pointer
                                    ${loadingBtn === item.id
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : `
                                                        bg-gradient-to-r
                                                        from-teal-600
                                                        via-emerald-500
                                                        to-teal-700
                                                        hover:shadow-2xl
                                                        hover:-translate-y-0.5
                                                        active:scale-[0.98]
                                                    `
                                                                        }
                                        `}
                                >
                                    <span
                                        className="
                                            absolute
                                            inset-0
                                            bg-white/10
                                            opacity-0
                                            group-hover:opacity-100
                                            transition-opacity
                                            duration-500
                                        "
                                    />

                                    <span
                                        className="
                                            absolute
                                            -top-10
                                            left-[-120%]
                                            w-32
                                            h-32
                                            rotate-12
                                            bg-white/20
                                            blur-2xl
                                            group-hover:left-[120%]
                                            transition-all
                                            duration-1000
                                        "
                                    />

                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {loadingBtn === item.id ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                                                Adicionando...
                                            </>
                                        ) : (
                                            <>
                                                Comprar
                                                <span
                                                    className="
                                                        transition-transform
                                                        duration-300
                                                        group-hover:translate-x-1
                                                    "
                                                >
                                                    →
                                                </span>
                                            </>
                                        )}
                                    </span>
                                </button>

                                <Link
                                    href={`/motorista/produto/${item.id}`}
                                    className="
                                        group
                                        relative
                                        overflow-hidden
                                        h-12
                                        rounded-2xl
                                        bg-white
                                        border
                                        border-gray-200
                                        text-gray-800
                                        text-sm
                                        font-semibold
                                        tracking-wide
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                        transition-all
                                        duration-500
                                        hover:-translate-y-0.5
                                        hover:shadow-2xl
                                        hover:border-blue-200
                                    "
                                >
                                    <span
                                        className="
                                            absolute
                                            inset-0
                                            bg-gradient-to-r
                                            from-blue-50
                                            to-cyan-50
                                            opacity-0
                                            group-hover:opacity-100
                                            transition-opacity
                                            duration-500
                                        "
                                    />
                                    <Eye
                                        size={17}
                                        className="
                                            relative
                                            z-10
                                            text-blue-600
                                            transition-transform
                                            duration-300
                                            group-hover:scale-110
                                        "
                                    />
                                    <span className="relative z-10">
                                        Ver produto
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {carrinho.length > 0 && (
                <div className="fixed bottom-5 left-4 right-4 lg:left-[340px] z-50">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-5">
                        <div className="flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
                            <div className="flex-1">
                                <h2 className="font-bold text-gray-800 mb-3">
                                    Itens adicionados
                                </h2>

                                <div className="max-h-44 overflow-y-auto space-y-2 pr-2">
                                    {carrinho.map((item, index) => (
                                        <div
                                            key={index}
                                            className="
                                                flex
                                                items-center
                                                justify-between
                                                bg-gray-50
                                                rounded-2xl
                                                px-4
                                                py-3
                                            "
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {item.nome}
                                                </p>

                                                <p className="text-sm font-bold text-green-600">
                                                    R$ {Number(item.preco).toFixed(2)}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => removerItem(index)}
                                                className="text-red-500 hover:text-red-700 transition"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:w-72 bg-gray-50 rounded-3xl p-5">
                                <p className="text-sm text-gray-500">
                                    Total da compra
                                </p>

                                <h3 className="text-2xl font-semibold text-green-600 mt-1">
                                    R$ {total.toFixed(2)}
                                </h3>

                                <Link
                                    href="/motorista/shopping/checkout"
                                    className="
                                        group
                                        mt-5
                                        relative
                                        overflow-hidden
                                        rounded-2xl
                                        bg-gradient-to-r
                                        from-teal-600
                                        via-emerald-500
                                        to-teal-700
                                        px-4
                                        h-12
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                        text-white
                                        font-semibold
                                        tracking-wide
                                        transition-all
                                        duration-300
                                        hover:opacity-90
                                        active:scale-[0.98]
                                    "
                                >
                                    <span
                                        className="
                                            absolute
                                            inset-0
                                            bg-white/10
                                            opacity-0
                                            group-hover:opacity-100
                                            transition-opacity
                                            duration-300
                                        "
                                    />

                                    <CreditCard
                                        size={18}
                                        className="
                                            relative
                                            z-10
                                            transition-transform
                                            duration-300
                                            group-hover:-translate-y-0.5
                                        "
                                    />

                                    <span className="relative z-10 text-sm">
                                        Finalizar Compra
                                    </span>

                                    <span
                                        className="
                                            relative
                                            z-10
                                            text-base
                                            transition-transform
                                            duration-500
                                            group-hover:translate-x-1
                                            animate-[arrowMove_1s_ease-in-out_infinite]
                                        "
                                    >
                                        →
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}