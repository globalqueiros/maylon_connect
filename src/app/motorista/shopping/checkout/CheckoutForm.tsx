"use client";

import { useState } from "react";
import {
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";

type Props = {
  carrinho: any[];
  mostrarAlerta: (
    tipo: "sucesso" | "erro" | "recusado",
    titulo: string,
    mensagem: string
  ) => void;
};

export default function CheckoutForm({
  carrinho,
  mostrarAlerta,
}: Props) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);

  async function pagar() {
    if (!stripe || !elements) return;

    setLoading(true);

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ carrinho }),
      });

      const { clientSecret } = await res.json();

      const card = elements.getElement(CardElement);

      if (!card) {
        mostrarAlerta("erro", "Erro", "Cartão inválido");
        setLoading(false);
        return;
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
        },
      });

      if (result.error) {
        mostrarAlerta(
          "recusado",
          "Pagamento recusado",
          result.error.message || "Erro no pagamento"
        );
      } else if (result.paymentIntent?.status === "succeeded") {
        mostrarAlerta(
          "sucesso",
          "Pagamento aprovado",
          "Compra realizada com sucesso"
        );
      }
    } catch (err) {
      mostrarAlerta(
        "erro",
        "Erro",
        "Falha ao processar pagamento"
      );
    }

    setLoading(false);
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="border rounded-xl p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#1f2937",
                "::placeholder": {
                  color: "#9ca3af",
                },
              },
            },
          }}
        />
      </div>

      <button
        onClick={pagar}
        disabled={loading}
        className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-semibold"
      >
        {loading ? "Processando..." : "Pagar com Cartão"}
      </button>
    </div>
  );
}