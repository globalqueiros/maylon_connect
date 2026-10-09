"use client";
import { useEffect, useState } from "react";
import {
    CreditCard,
    QrCode,
    FileText,
    ShieldCheck,
    Lock,
    X,
} from "lucide-react";

// Mesma chave usada na Home (antes estava "carrinho", causando o bug)
const CART_STORAGE_KEY = "maylon-cart";

type Produto = {
    id: number;
    nome: string;
    preco: number | string;
    imagem: string;
    // pode vir com nome de campo diferente dependendo de onde foi salvo
    imagem_principal?: string;
    quantidade?: number;
};

type Alerta = {
    tipo: "sucesso" | "erro" | "recusado" | "autenticacao";
    titulo: string;
    mensagem: string;
};

type CheckoutResponse = {
    success?: boolean;
    url?: string;
    message?: string;
};

export default function CheckoutPage() {
    const [carrinho, setCarrinho] = useState<Produto[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagamento, setPagamento] = useState("cartao");
    const [numeroCartao, setNumeroCartao] = useState("");
    const [alerta, setAlerta] = useState<Alerta | null>(null);

    useEffect(() => {
        try {
            const dados = JSON.parse(
                localStorage.getItem(CART_STORAGE_KEY) || "[]"
            );
            setCarrinho(Array.isArray(dados) ? dados : []);
        } catch (error) {
            console.error("Erro ao carregar carrinho:", error);
            setCarrinho([]);
        }
    }, []);

    // Considera a quantidade de cada item no total (antes somava só o preço unitário)
    const total = carrinho.reduce((acc, item) => {
        const preco = Number(item.preco) || 0;
        const quantidade = Number(item.quantidade) || 1;
        return acc + preco * quantidade;
    }, 0);

    function mostrarAlerta(
        tipo: Alerta["tipo"],
        titulo: string,
        mensagem: string
    ) {
        setAlerta({ tipo, titulo, mensagem });

        setTimeout(() => {
            setAlerta(null);
        }, 5000);
    }

    async function finalizarPagamento() {
        setLoading(true);

        try {
            const numero = numeroCartao.replace(/\s/g, "");
            if (pagamento === "cartao") {
                if (numero === "4000000000009995") {
                    mostrarAlerta(
                        "erro",
                        "Saldo insuficiente",
                        "O cartão não possui limite disponível."
                    );
                    setLoading(false);
                    return;
                }
                if (numero === "4000000000000002") {
                    mostrarAlerta(
                        "recusado",
                        "Cartão recusado",
                        "O banco emissor recusou a compra."
                    );
                    setLoading(false);
                    return;
                }
                if (numero === "4000002500003155") {
                    mostrarAlerta(
                        "autenticacao",
                        "Autenticação necessária",
                        "Confirme a compra via 3D Secure."
                    );
                    setLoading(false);
                    return;
                }
            }

            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    carrinho,
                    metodo: pagamento,
                }),
            });

            const data: CheckoutResponse = await res.json();

            // Antes o "sucesso" aparecia sempre, mesmo quando a API falhava.
            if (!res.ok || data.success === false) {
                mostrarAlerta(
                    "recusado",
                    "Pagamento não concluído",
                    data.message || "Não foi possível concluir o pagamento."
                );
                setLoading(false);
                return;
            }

            mostrarAlerta(
                "sucesso",
                "Compra aprovada",
                "Pagamento realizado com sucesso."
            );

            if (data.url) {
                setTimeout(() => {
                    window.location.href = data.url as string;
                }, 1500);
            }
        } catch {
            mostrarAlerta(
                "erro",
                "Erro",
                "Não foi possível processar pagamento."
            );
        }

        setLoading(false);
    }

    function detectarBandeira(numero: string) {
        const n = numero.replace(/\s/g, "");

        if (/^4/.test(n))
            return {
                nome: "Visa",
                img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Visa_Inc._logo_%282021%E2%80%93present%29.svg/500px-Visa_Inc._logo_%282021%E2%80%93present%29.svg.png",
            };

        if (/^(5[1-5]|2[2-7])/.test(n))
            return {
                nome: "Mastercard",
                img: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg",
            };

        if (/^3[47]/.test(n))
            return {
                nome: "Amex",
                img: "https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg",
            };

        if (/^(4011|4312|4389)/.test(n))
            return {
                nome: "Elo",
                img: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Elo_card_association_logo.png",
            };

        if (/^606282/.test(n))
            return {
                nome: "Hipercard",
                img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Hipercard_logo.svg/512px-Hipercard_logo.svg.png",
            };

        return null;
    }

    function formatarCartao(valor: string) {
        return valor
            .replace(/\D/g, "")
            .replace(/(.{4})/g, "$1 ")
            .trim()
            .slice(0, 19);
    }

    const bandeira = detectarBandeira(numeroCartao);

    return (
        <div className="min-h-screen p-4 flex flex-col justify-center">
            {alerta && (
                <div className="max-w-7xl mx-auto mb-6">
                    <div
                        className={`rounded-2xl p-4 shadow-lg border flex justify-between gap-4 ${alerta.tipo === "sucesso"
                            ? "bg-green-50 border-green-300"
                            : alerta.tipo === "erro"
                                ? "bg-orange-50 border-orange-300"
                                : alerta.tipo === "recusado"
                                    ? "bg-red-50 border-red-300"
                                    : "bg-blue-50 border-blue-300"
                            }`}
                    >
                        <div>
                            <h3 className="font-bold">
                                {alerta.titulo}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {alerta.mensagem}
                            </p>
                        </div>
                        <button
                            onClick={() => setAlerta(null)}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl shadow-xl p-8 border">
                    <h1 className="text-2xl font-bold">
                        Resumo da Compra
                    </h1>
                    <div className="space-y-5 mt-6">
                        {carrinho.map((item, index) => {
                            const precoUnitario = Number(item.preco) || 0;
                            const quantidade = Number(item.quantidade) || 1;
                            const imagem = item.imagem || item.imagem_principal;

                            return (
                                <div
                                    key={index}
                                    className="flex justify-between items-start gap-3 border-b pb-4"
                                >
                                    <div className="flex gap-4 min-w-0 flex-1">
                                        {imagem && (
                                            <img
                                                src={imagem}
                                                alt={item.nome}
                                                className="
                                                    w-14
                                                    h-14
                                                    rounded-xl
                                                    object-contain
                                                    bg-white
                                                    p-1
                                                    flex-shrink-0
                                                "
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <h2 className="font-semibold line-clamp-2">
                                                {item.nome}
                                            </h2>
                                            {quantidade > 1 && (
                                                <p className="text-xs text-gray-500">
                                                    {quantidade} x R$ {precoUnitario.toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="font-bold whitespace-nowrap flex-shrink-0">
                                        R$ {(precoUnitario * quantidade).toFixed(2)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-0 text-sm pt-6 space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Taxa de Envio</span>
                            <span>R$ 0,00</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-teal-600">
                            <span>Total</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="mt-8 bg-teal-50 rounded-2xl p-5 flex gap-4">
                        <ShieldCheck className="text-teal-600" />
                        <div>
                            <h3 className="font-semibold">
                                Compra 100% Segura
                            </h3>
                            <p className="text-sm text-gray-500">
                                Ambiente protegido por SSL.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-3xl shadow-xl p-8 border">
                    <h2 className="text-2xl font-bold">
                        Meios de Pagamento
                    </h2>
                    <div className="space-y-4 mt-6">
                        {[
                            {
                                id: "pix",
                                nome: "PIX",
                                icon: QrCode,
                            },
                            {
                                id: "boleto",
                                nome: "Boleto Bancário",
                                icon: FileText,
                            },
                            {
                                id: "cartao",
                                nome: "Cartão Crédito / Débito",
                                icon: CreditCard,
                            },
                        ].map((item) => {
                            const Icon = item.icon;

                            return (
                                <label
                                    key={item.id}
                                    className={`border rounded-2xl p-5 flex gap-4 cursor-pointer ${pagamento === item.id
                                        ? "border-teal-600 bg-teal-50"
                                        : ""
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        checked={
                                            pagamento === item.id
                                        }
                                        onChange={() =>
                                            setPagamento(item.id)
                                        }
                                    />
                                    <Icon className="text-teal-600" />
                                    <span className="font-semibold">
                                        {item.nome}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                    {pagamento === "cartao" && (
                        <div className="mt-8 space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={numeroCartao}
                                    onChange={(e) =>
                                        setNumeroCartao(
                                            formatarCartao(
                                                e.target.value
                                            )
                                        )
                                    }
                                    placeholder="Número do cartão"
                                    className="w-full border rounded-xl px-4 py-3 pr-24"
                                />
                                {bandeira && (
                                    <img
                                        src={bandeira.img}
                                        alt={bandeira.nome}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-15"
                                    />
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="MM/AA"
                                    maxLength={5}
                                    onChange={(e) => {
                                        let valor = e.target.value.replace(/\D/g, "");

                                        if (valor.length >= 3) {
                                            valor =
                                                valor.slice(0, 2) +
                                                "/" +
                                                valor.slice(2, 4);
                                        }

                                        e.target.value = valor;
                                    }}
                                    className="border rounded-xl px-4 py-3"
                                />
                                <input
                                    type="text"
                                    placeholder="CVV"
                                    className="border rounded-xl px-4 py-3"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Nome no cartão"
                                className="w-full border rounded-xl px-4 py-3"
                            />
                        </div>
                    )}
                    <button
                        onClick={finalizarPagamento}
                        disabled={loading}
                        className="w-full cursor-pointer mt-8 bg-teal-600 hover:bg-teal-500 text-white py-4 rounded-2xl font-bold"
                    >
                        {loading
                            ? "Processando..."
                            : "Finalizar Pagamento"}
                    </button>
                    <div className="mt-6 flex justify-center gap-2 text-xs">
                        <Lock size={16} />
                        Dados protegidos com segurança máxima
                    </div>
                </div>
            </div>
        </div>
    );
}