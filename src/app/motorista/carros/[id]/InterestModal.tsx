"use client";

import { useEffect, useState } from "react";
import {
  X,
  CheckCircle2,
  Loader2,
  Send,
  CarFront,
  Phone,
  Mail,
  User,
  MessageSquare,
} from "lucide-react";

type InterestModalProps = {
  carId: number;
  carName: string;
  carModel: string;
};

export default function InterestModal({
  carId,
  carName,
  carModel,
}: InterestModalProps) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const formatarNome = (valor: string) => {
    const palavrasMinusculas = ["de", "da", "do", "das", "dos", "e"];

    return valor
      .toLowerCase()
      .replace(/\s+/g, " ")
      .split(" ")
      .map((palavra, index) => {
        if (!palavra) return "";

        if (
          index > 0 &&
          palavrasMinusculas.includes(palavra)
        ) {
          return palavra;
        }

        return (
          palavra.charAt(0).toUpperCase() +
          palavra.slice(1)
        );
      })
      .join(" ");
  };

  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length === 0) return "";

    if (numeros.length <= 2) {
      return `(${numeros}`;
    }

    if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    if (numeros.length <= 10) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(
        2,
        6
      )}-${numeros.slice(6)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(
      2,
      7
    )}-${numeros.slice(7)}`;
  };

  const handleOpen = () => {
    setError("");
    setSuccess(false);
    setOpen(true);
  };

  const handleClose = () => {
    if (loading) return;

    setOpen(false);
    setError("");
  };

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, loading]);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    const nomeLimpo = nome.trim();
    const telefoneLimpo = telefone.trim();
    const emailLimpo = email.trim();
    const mensagemLimpa = mensagem.trim();

    if (!nomeLimpo) {
      setError("Digite seu nome completo.");
      return;
    }

    if (nomeLimpo.length < 3) {
      setError("Digite um nome válido.");
      return;
    }

    const telefoneNumeros = telefoneLimpo.replace(/\D/g, "");

    if (telefoneNumeros.length < 10) {
      setError("Digite um telefone válido.");
      return;
    }

    if (!emailLimpo) {
      setError("Digite seu e-mail.");
      return;
    }

    const emailValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo);

    if (!emailValido) {
      setError("Digite um e-mail válido.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/interesse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          carro_id: carId,
          nome: nomeLimpo,
          telefone: telefoneLimpo,
          email: emailLimpo,
          mensagem: mensagemLimpa,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Não foi possível enviar sua solicitação."
        );
      }

      setSuccess(true);
      setNome("");
      setTelefone("");
      setEmail("");
      setMensagem("");
    } catch (error) {
      console.error("Erro ao enviar interesse:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao enviar sua solicitação."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-500 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-teal-700 hover:to-teal-600 hover:shadow-xl active:translate-y-0"
      >
        <Send size={17} />
        Tenho interesse neste veículo
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="interest-modal-title"
            className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50">
                  <CarFront
                    size={22}
                    className="text-teal-600"
                  />
                </div>

                <div>
                  <h2
                    id="interest-modal-title"
                    className="text-lg font-extrabold tracking-tight text-slate-900"
                  >
                    Tenho interesse
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Fale conosco sobre este veículo
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                aria-label="Fechar modal"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto">
              {success ? (
                <div className="px-6 py-12 text-center sm:px-10">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-50">
                    <CheckCircle2
                      size={44}
                      strokeWidth={1.8}
                      className="text-teal-600"
                    />
                  </div>

                  <h3 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">
                    Interesse enviado!
                  </h3>

                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                    Recebemos seus dados com sucesso. Em breve
                    nossa equipe entrará em contato com você.
                  </p>

                  <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                      Veículo
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {carName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {carModel}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="mt-6 w-full cursor-pointer rounded-xl bg-teal-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-teal-700 active:scale-[0.98]"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5 p-5 sm:p-7"
                >
                  <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-slate-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                      Você está interessado em
                    </p>

                    <p className="mt-1 text-base font-extrabold text-slate-900">
                      {carName}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {carModel}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="nome"
                      className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                      <User
                        size={15}
                        className="text-teal-600"
                      />
                      Nome completo
                    </label>

                    <input
                      id="nome"
                      type="text"
                      value={nome}
                      onChange={(e) =>
                        setNome(formatarNome(e.target.value))
                      }
                      placeholder="Digite seu nome"
                      disabled={loading}
                      autoComplete="name"
                      maxLength={150}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="telefone"
                      className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                      <Phone
                        size={15}
                        className="text-teal-600"
                      />
                      Telefone
                    </label>

                    <input
                      id="telefone"
                      type="tel"
                      inputMode="numeric"
                      value={telefone}
                      onChange={(e) =>
                        setTelefone(
                          formatarTelefone(e.target.value)
                        )
                      }
                      placeholder="(00) 00000-0000"
                      disabled={loading}
                      autoComplete="tel"
                      maxLength={15}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                      <Mail
                        size={15}
                        className="text-teal-600"
                      />
                      E-mail
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="seu@email.com"
                      disabled={loading}
                      autoComplete="email"
                      maxLength={180}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="mensagem"
                      className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                      <MessageSquare
                        size={15}
                        className="text-teal-600"
                      />
                      Mensagem
                      <span className="font-normal text-slate-400">
                        opcional
                      </span>
                    </label>

                    <textarea
                      id="mensagem"
                      value={mensagem}
                      onChange={(e) =>
                        setMensagem(e.target.value)
                      }
                      placeholder="Gostaria de saber mais sobre este veículo..."
                      disabled={loading}
                      rows={4}
                      maxLength={1000}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                    <div className="mt-1 text-right text-[10px] text-slate-400">
                      {mensagem.length}/1000
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

                      <p className="text-sm font-medium leading-5 text-red-600">
                        {error}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:-translate-y-0.5 hover:from-teal-700 hover:to-teal-600 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={17} />
                        Enviar interesse
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] leading-5 text-slate-400">
                    Seus dados serão utilizados exclusivamente
                    para entrar em contato sobre este veículo.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}