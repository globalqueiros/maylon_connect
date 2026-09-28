"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import {
    CalendarDays,
    Car,
    CheckCircle2,
    Clock3,
    Home,
    Mail,
    MessageCircle,
    User,
    WalletCards,
    X,
} from "lucide-react";

type AdemiconProps = {
    beneficioId: number;
    onClose: () => void;
};

type TipoCarta = "automovel" | "imovel" | "";

type AlertType = "error" | "success";

type AlertState = {
    type: AlertType;
    message: string;
} | null;

const WHATSAPP = "5513991857777";

export default function Ademicon({
    beneficioId,
    onClose,
}: AdemiconProps) {
    const [nome, setNome] = useState("");
    const [telefone, setTelefone] = useState("");
    const [email, setEmail] = useState("");
    const [data, setData] = useState("");
    const [horario, setHorario] = useState("");
    const [tipoCarta, setTipoCarta] = useState<TipoCarta>("");
    const [valor, setValor] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [alert, setAlert] = useState<AlertState>(null);

    function mostrarAlert(
        message: string,
        type: AlertType = "error"
    ) {
        setAlert({
            type,
            message,
        });
    }

    function formatarTelefone(value: string) {
        const numeros = value.replace(/\D/g, "").slice(0, 11);

        if (numeros.length <= 2) {
            return numeros;
        }

        if (numeros.length <= 7) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
        }

        return `(${numeros.slice(0, 2)}) ${numeros.slice(
            2,
            7
        )}-${numeros.slice(7)}`;
    }

    function formatarValor(value: string) {
        const numeros = value.replace(/\D/g, "");

        if (!numeros) {
            return "";
        }

        const numero = Number(numeros) / 100;

        return numero.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }

    function obterValorNumerico() {
        return Number(
            valor
                .replace(/[^\d,]/g, "")
                .replace(/\./g, "")
                .replace(",", ".")
        );
    }

    function formatarData(dataSelecionada: string) {
        if (!dataSelecionada) {
            return "";
        }

        const [ano, mes, dia] = dataSelecionada.split("-");

        return `${dia}/${mes}/${ano}`;
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setAlert(null);

        const telefoneNumeros = telefone.replace(/\D/g, "");
        const valorNumerico = obterValorNumerico();

        if (!nome.trim()) {
            mostrarAlert("Informe seu nome completo.");
            return;
        }

        if (telefoneNumeros.length < 10) {
            mostrarAlert("Informe um telefone válido.");
            return;
        }

        if (!email.trim()) {
            mostrarAlert("Informe seu e-mail.");
            return;
        }

        if (!data) {
            mostrarAlert("Selecione a data da reunião.");
            return;
        }

        if (!horario) {
            mostrarAlert("Selecione o horário da reunião.");
            return;
        }

        if (!tipoCarta) {
            mostrarAlert(
                "Selecione o tipo de carta de crédito."
            );
            return;
        }

        if (!valorNumerico || valorNumerico < 1000) {
            mostrarAlert(
                "O valor mínimo da carta é R$ 1.000,00."
            );
            return;
        }

        if (valorNumerico > 750000) {
            mostrarAlert(
                "O valor máximo da carta é R$ 750.000,00."
            );
            return;
        }

        setEnviando(true);

        const tipoFormatado =
            tipoCarta === "automovel"
                ? "Automóvel"
                : "Imóvel";

        const mensagem = [
            "Olá! Gostaria de agendar uma reunião sobre carta de crédito Ademicon.",
            "",
            "📋 *Dados do cliente*",
            `👤 Nome: ${nome}`,
            `📱 Telefone: ${telefone}`,
            `📧 E-mail: ${email}`,
            "",
            "📅 *Dados da reunião*",
            `Data: ${formatarData(data)}`,
            `Horário: ${horario}`,
            "",
            "💳 *Carta de crédito*",
            `Tipo: ${tipoFormatado}`,
            `Valor: ${valor}`,
            "",
            "Gostaria de receber o contato para confirmar a reunião.",
        ].join("\n");

        const whatsappUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
            mensagem
        )}`;

        window.open(
            whatsappUrl,
            "_blank",
            "noopener,noreferrer"
        );

        mostrarAlert(
            "WhatsApp aberto com os dados da sua solicitação.",
            "success"
        );

        setEnviando(false);
    }

    const hoje = new Date();

    const dataMinima = [
        hoje.getFullYear(),
        String(hoje.getMonth() + 1).padStart(2, "0"),
        String(hoje.getDate()).padStart(2, "0"),
    ].join("-");

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="my-4 w-full max-w-3xl overflow-hidden rounded-[30px] bg-white shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ademicon-modal-title"
            >
                <div className="relative overflow-hidden bg-gradient-to-r from-teal-800 via-teal-700 to-teal-500 px-6 py-7 text-white sm:px-8">
                    <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-4 top-4 cursor-pointer rounded-xl p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                        aria-label="Fechar formulário Ademicon"
                    >
                        <X size={20} />
                    </button>

                    <div className="relative">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                            <WalletCards size={25} />
                        </div>

                        <h2
                            id="ademicon-modal-title"
                            className="text-2xl font-black tracking-tight sm:text-3xl"
                        >
                            Carta de Crédito Ademicon
                        </h2>

                        <p className="mt-1 max-w-xl text-sm leading-6 text-white/75">
                            Preencha seus dados para solicitar uma reunião
                            sobre carta de crédito para automóvel ou imóvel.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 p-5 sm:p-8"
                >
                    {alert && (
                        <div
                            className={`flex items-start gap-3 rounded-2xl border p-4 ${
                                alert.type === "error"
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                            role="alert"
                        >
                            <div className="mt-0.5 shrink-0">
                                <CheckCircle2
                                    size={20}
                                    className={
                                        alert.type === "error"
                                            ? "text-red-600"
                                            : "text-emerald-600"
                                    }
                                />
                            </div>

                            <div className="flex-1">
                                <p className="text-sm font-semibold leading-5">
                                    {alert.message}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setAlert(null)}
                                className="shrink-0 cursor-pointer rounded-lg p-1 transition hover:bg-black/5"
                                aria-label="Fechar mensagem"
                            >
                                <X size={17} />
                            </button>
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="ademicon-nome"
                            className="mb-2 block text-sm font-bold text-slate-700"
                        >
                            Nome completo
                        </label>

                        <div className="relative">
                            <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                            <input
                                id="ademicon-nome"
                                type="text"
                                value={nome}
                                onChange={(event) => {
                                    setNome(event.target.value);
                                    setAlert(null);
                                }}
                                placeholder="Digite seu nome completo"
                                required
                                className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm capitalize outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                            />
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="ademicon-telefone"
                                className="mb-2 block text-sm font-bold text-slate-700"
                            >
                                Telefone
                            </label>

                            <input
                                id="ademicon-telefone"
                                type="tel"
                                value={telefone}
                                onChange={(event) => {
                                    setTelefone(
                                        formatarTelefone(
                                            event.target.value
                                        )
                                    );
                                    setAlert(null);
                                }}
                                placeholder="(11) 99999-9999"
                                required
                                className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="ademicon-email"
                                className="mb-2 block text-sm font-bold text-slate-700"
                            >
                                E-mail
                            </label>

                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                                <input
                                    id="ademicon-email"
                                    type="email"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        setAlert(null);
                                    }}
                                    placeholder="seu@email.com"
                                    required
                                    className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-sm font-bold text-slate-700">
                            Tipo de carta de crédito
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setTipoCarta("automovel");
                                    setAlert(null);
                                }}
                                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-left transition ${
                                    tipoCarta === "automovel"
                                        ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/10"
                                        : "border-slate-200 bg-slate-50 hover:border-teal-300 hover:bg-white"
                                }`}
                            >
                                <span
                                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                                        tipoCarta === "automovel"
                                            ? "bg-teal-600 text-white"
                                            : "bg-white text-slate-500"
                                    }`}
                                >
                                    <Car size={21} />
                                </span>

                                <span>
                                    <span className="block text-sm font-black text-slate-800">
                                        Automóvel
                                    </span>

                                    <span className="mt-1 block text-xs text-slate-500">
                                        Carros e veículos
                                    </span>
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setTipoCarta("imovel");
                                    setAlert(null);
                                }}
                                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-left transition ${
                                    tipoCarta === "imovel"
                                        ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/10"
                                        : "border-slate-200 bg-slate-50 hover:border-teal-300 hover:bg-white"
                                }`}
                            >
                                <span
                                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                                        tipoCarta === "imovel"
                                            ? "bg-teal-600 text-white"
                                            : "bg-white text-slate-500"
                                    }`}
                                >
                                    <Home size={21} />
                                </span>

                                <span>
                                    <span className="block text-sm font-black text-slate-800">
                                        Imóvel
                                    </span>

                                    <span className="mt-1 block text-xs text-slate-500">
                                        Casa, apartamento ou terreno
                                    </span>
                                </span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="ademicon-valor"
                            className="mb-2 block text-sm font-bold text-slate-700"
                        >
                            Valor da carta de crédito
                        </label>

                        <div className="relative">
                            <WalletCards className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                            <input
                                id="ademicon-valor"
                                type="text"
                                inputMode="numeric"
                                value={valor}
                                onChange={(event) => {
                                    setValor(
                                        formatarValor(
                                            event.target.value
                                        )
                                    );
                                    setAlert(null);
                                }}
                                placeholder="R$ 750.000,00"
                                required
                                className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                            />
                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                            Informe um valor entre R$ 1.000,00 e
                            R$ 750.000,00.
                        </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="ademicon-data"
                                className="mb-2 block text-sm font-bold text-slate-700"
                            >
                                Data da reunião
                            </label>

                            <div className="relative">
                                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                                <input
                                    id="ademicon-data"
                                    type="date"
                                    min={dataMinima}
                                    value={data}
                                    onChange={(event) => {
                                        setData(event.target.value);
                                        setAlert(null);
                                    }}
                                    required
                                    className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="ademicon-horario"
                                className="mb-2 block text-sm font-bold text-slate-700"
                            >
                                Horário da reunião
                            </label>

                            <div className="relative">
                                <Clock3 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                                <input
                                    id="ademicon-horario"
                                    type="time"
                                    value={horario}
                                    onChange={(event) => {
                                        setHorario(event.target.value);
                                        setAlert(null);
                                    }}
                                    required
                                    className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-teal-100 bg-teal-50 p-4">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />

                        <p className="text-xs leading-5 text-teal-800">
                            Após enviar, o WhatsApp será aberto com todos os
                            dados preenchidos para solicitar a reunião.
                        </p>
                    </div>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={enviando}
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <MessageCircle size={18} />

                            {enviando
                                ? "Abrindo WhatsApp..."
                                : "Enviar pelo WhatsApp"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}