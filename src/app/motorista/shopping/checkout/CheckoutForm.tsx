"use client";

import { FormEvent, useState } from "react";
import {
    PaymentElement,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js";

type Produto = {
    id: number;
    nome: string;
    preco: number | string;
    imagem: string;
    imagem_principal?: string;
    quantidade?: number;
};

type TipoAlerta =
    | "sucesso"
    | "erro"
    | "recusado"
    | "autenticacao";

type CheckoutFormProps = {
    carrinho: Produto[];
    mostrarAlerta: (
        tipo: TipoAlerta,
        titulo: string,
        mensagem: string
    ) => void;
};

type PaymentIntentResponse = {
    success?: boolean;
    clientSecret?: string;
    message?: string;
    error?: string;
};

export default function CheckoutForm({
    carrinho,
    mostrarAlerta,
}: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();

    const [loading, setLoading] = useState(false);

    const total = carrinho.reduce((acc, item) => {
        const preco = Number(item.preco) || 0;
        const quantidade = Number(item.quantidade) || 1;

        return acc + preco * quantidade;
    }, 0);

    async function criarPagamento() {
        const res = await fetch("/api/checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                carrinho,
                metodo: "cartao",
            }),
        });

        const data: PaymentIntentResponse = await res.json();

        if (!res.ok || data.success === false) {
            throw new Error(
                data.message ||
                    data.error ||
                    "Não foi possível iniciar o pagamento."
            );
        }

        return data;
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (loading) {
            return;
        }

        if (!stripe || !elements) {
            mostrarAlerta(
                "erro",
                "Pagamento indisponível",
                "O sistema de pagamento ainda está carregando. Tente novamente em alguns segundos."
            );

            return;
        }

        if (!carrinho.length) {
            mostrarAlerta(
                "erro",
                "Carrinho vazio",
                "Adicione pelo menos um produto antes de finalizar a compra."
            );

            return;
        }

        if (total <= 0) {
            mostrarAlerta(
                "erro",
                "Valor inválido",
                "O valor total da compra precisa ser maior que zero."
            );

            return;
        }

        try {
            setLoading(true);

            /*
             * Primeiro cria o pagamento no backend.
             *
             * A API deve retornar:
             *
             * {
             *   success: true,
             *   clientSecret: "..."
             * }
             *
             * Caso sua API já crie o PaymentIntent
             * antes de renderizar o formulário, essa etapa
             * pode ser adaptada.
             */
            const pagamento = await criarPagamento();

            if (!pagamento.clientSecret) {
                mostrarAlerta(
                    "erro",
                    "Erro no pagamento",
                    "O servidor não retornou o código necessário para confirmar o pagamento."
                );

                return;
            }

            const resultado =
                await stripe.confirmPayment({
                    elements,
                    clientSecret:
                        pagamento.clientSecret,
                    confirmParams: {
                        return_url:
                            `${window.location.origin}/motorista/shopping/checkout/sucesso`,
                    },
                    redirect: "if_required",
                });

            if (resultado.error) {
                const codigoErro =
                    resultado.error.code;

                if (
                    codigoErro ===
                        "authentication_required" ||
                    codigoErro ===
                        "payment_intent_authentication_failure"
                ) {
                    mostrarAlerta(
                        "autenticacao",
                        "Autenticação necessária",
                        resultado.error.message ||
                            "Seu banco solicitou uma autenticação adicional."
                    );

                    return;
                }

                mostrarAlerta(
                    "recusado",
                    "Pagamento recusado",
                    resultado.error.message ||
                        "Não foi possível concluir o pagamento."
                );

                return;
            }

            /*
             * Quando redirect === "if_required",
             * pagamentos que não precisam de redirecionamento
             * retornam aqui.
             */
            if (
                resultado.paymentIntent &&
                resultado.paymentIntent.status ===
                    "succeeded"
            ) {
                mostrarAlerta(
                    "sucesso",
                    "Compra aprovada",
                    "Seu pagamento foi realizado com sucesso."
                );

                /*
                 * Limpa o carrinho depois da confirmação.
                 */
                try {
                    localStorage.removeItem(
                        "maylon-cart"
                    );
                } catch (error) {
                    console.error(
                        "Erro ao limpar carrinho:",
                        error
                    );
                }

                return;
            }

            /*
             * Outros estados possíveis do PaymentIntent.
             */
            if (
                resultado.paymentIntent?.status ===
                "processing"
            ) {
                mostrarAlerta(
                    "sucesso",
                    "Pagamento em processamento",
                    "Seu pagamento foi recebido e está sendo processado."
                );

                return;
            }

            mostrarAlerta(
                "erro",
                "Pagamento não confirmado",
                "O pagamento ainda não foi confirmado. Verifique o status da sua compra."
            );
        } catch (error) {
            console.error(
                "Erro ao processar pagamento:",
                error
            );

            mostrarAlerta(
                "erro",
                "Erro no pagamento",
                error instanceof Error
                    ? error.message
                    : "Não foi possível processar o pagamento."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
        >
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <PaymentElement
                    options={{
                        layout: "tabs",
                    }}
                />
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Total da compra
                    </span>

                    <strong className="text-xl font-bold text-teal-600">
                        R${" "}
                        {total.toFixed(2)}
                    </strong>
                </div>
            </div>

            <button
                type="submit"
                disabled={
                    loading ||
                    !stripe ||
                    !elements ||
                    carrinho.length === 0
                }
                className={`w-full rounded-2xl py-4 font-bold text-white transition ${
                    loading ||
                    !stripe ||
                    !elements ||
                    carrinho.length === 0
                        ? "cursor-not-allowed bg-gray-400"
                        : "cursor-pointer bg-teal-600 hover:bg-teal-500"
                }`}
            >
                {loading
                    ? "Processando pagamento..."
                    : "Pagar agora"}
            </button>
        </form>
    );
}
