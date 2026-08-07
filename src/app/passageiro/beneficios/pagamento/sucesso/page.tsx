"use client";
import { useRef } from "react";
import { useState } from "react";
import { useReactToPrint } from "react-to-print";
import receipt from "./recibo/page";
import Link from "next/link";
import {
    CheckCircle2,
    CreditCard,
    CalendarDays,
    Receipt,
    Mail,
    Home,
    Download,
    User,
    Wallet,
} from "lucide-react";

type PaymentMethod = "card" | "pix";

interface PaymentSuccessProps {
    method?: PaymentMethod;
}

export default function PaymentSuccess({
    method = "card",
}: PaymentSuccessProps) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [loadingPdf, setLoadingPdf] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: "Recibo-MaylonPass",
    });

    const handleDownloadReceipt = async () => {
        setLoadingPdf(true);
        try {
            handlePrint?.();
        } finally {
            setTimeout(() => {
                setLoadingPdf(false);
            }, 2000);
        }
    };

    return (
        <>
            <div className="flex min-h-screen items-center justify-center p-6">
                <div
                    ref={receiptRef}
                    className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
                >
                    <div className="border-b px-8 py-8 text-center">
                        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
                        <h1 className="mt-4 text-2xl font-bold text-gray-900">
                            Pagamento Confirmado
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Obrigado! Seu pagamento foi aprovado.
                        </p>
                    </div>
                    <div className="space-y-3 text-sm border-b p-6">
                        <Info
                            icon={<Receipt className="h-5 w-5" />}
                            label="Pedido"
                            value="#ML202608060001"
                        />
                        <Info
                            icon={<Wallet className="h-5 w-5" />}
                            label="Valor"
                            value="R$ 59,99"
                        />
                        <Info
                            icon={<CreditCard className="h-5 w-5" />}
                            label="Método de Pagamento"
                            value={method === "card" ? "Cartão" : "PIX"}
                        />
                        <Info
                            icon={<CalendarDays className="h-5 w-5" />}
                            label="Data e Hora"
                            value="06/08/2026 17:05"
                        />
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Status de Pagamento</span>
                            <span className="rounded-lg bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                                Pago
                            </span>
                        </div>
                    </div>

                    <div className="border-b p-6">
                        <h2 className="mb-4 font-semibold">Cliente</h2>
                        <div className="flex items-start gap-3">
                            <User className="mt-1 h-5 w-5 text-gray-400" />
                            <div>
                                <p className="font-medium">Humberto Santos</p>
                                <p className="text-sm text-gray-500">
                                    humberto@email.com
                                </p>
                            </div>
                        </div>
                    </div>

                    {method === "card" && (
                        <div className="border-b p-6">
                            <h2 className="mb-4 font-semibold">Cartão</h2>
                            <div className="rounded-lg bg-gray-50 p-4">
                                <p className="font-medium">
                                    Visa **** **** **** 4589
                                </p>
                                <p className="text-sm text-gray-500">
                                    Crédito
                                </p>
                            </div>
                        </div>
                    )}

                    {method === "pix" && (
                        <div className="border-b p-6">
                            <h2 className="mb-4 font-semibold">PIX</h2>

                            <div className="rounded-lg bg-emerald-50 p-4">
                                <p className="font-semibold text-emerald-700">
                                    PIX Recebido
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="fixed bottom-6 right-6 flex flex-col gap-3">
                    <button
                        onClick={handleDownloadReceipt}
                        disabled={loadingPdf}
                        className="flex items-center cursor-pointer justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <Download size={18} />
                        {loadingPdf ? "Aguarde..." : "Baixar Recibo PDF"}
                    </button>
                    <button className="flex items-center justify-center gap-2 rounded-xl border bg-white px-6 py-3 font-semibold hover:bg-gray-50">
                        <Mail size={18} />
                        Enviar Recibo por Email
                    </button>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-6 py-3 font-semibold hover:bg-gray-200"
                    >
                        <Home size={18} />
                        Voltar para o Início
                    </Link>
                </div>
            </div>
            <Receipt className="contents"
                receipt={{
                    order: "#ML202608060001",
                    customer: "Humberto Santos",
                    email: "humberto@email.com",
                    amount: "R$ 59,99",
                    method: "Cartão Visa",
                    transactionId: "TRX982734982",
                    authorization: "584762",
                    status: "PAGO",
                    date: "06/08/2026 17:05",
                }}
            />
        </>
    );
}

interface InfoProps {
    icon?: React.ReactNode;
    label: string;
    value: string;
}

function Info({ icon, label, value }: InfoProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
                {icon}
                <span>{label}</span>
            </div>

            <span className="font-medium text-gray-900">
                {value}
            </span>
        </div>
    );
}