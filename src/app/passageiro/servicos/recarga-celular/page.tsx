"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Smartphone,
  Search,
  ChevronRight,
  CheckCircle2,
  Zap,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Phone,
  CircleDollarSign,
  AlertTriangle,
} from "lucide-react";

type Operadora = {
  id: string;
  nome: string;
  cor: string;
  logo: string;
};

/**
 * Estilo visual por operadora. A lista de operadoras em si vem da RVHub
 * (GET /api/rvhub/recarga/operadoras); aqui só guardamos cor e rótulo
 * conhecidos. Qualquer operadora nova cai num estilo padrão.
 */
const ESTILO_OPERADORA: Record<string, { nome: string; cor: string; logo: string }> = {
  claro: { nome: "Claro", cor: "#E30613", logo: "CLARO" },
  tim: { nome: "TIM", cor: "#003B7A", logo: "TIM" },
  vivo: { nome: "Vivo", cor: "#660099", logo: "VIVO" },
  oi: { nome: "Oi", cor: "#FFCC00", logo: "Oi" },
};

function estiloOperadora(nome: string): Operadora {
  const id = nome.toLowerCase();
  const estilo = ESTILO_OPERADORA[id];
  if (estilo) return { id, ...estilo };
  // Operadora desconhecida: usa o próprio nome e um tom neutro.
  return { id, nome, cor: "#334155", logo: nome };
}

const VALORES = [10, 15, 20, 25, 30, 40, 50, 100];

function formatarTelefone(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);

  if (numbers.length <= 2) {
    return numbers;
  }

  if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }

  return `(${numbers.slice(0, 2)}) ${numbers.slice(
    2,
    7
  )}-${numbers.slice(7)}`;
}

function somenteNumeros(value: string) {
  return value.replace(/\D/g, "");
}

export default function RecargaCelularPage() {
  const [telefone, setTelefone] = useState("");
  const [operadora, setOperadora] = useState("");
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);
  const [valor, setValor] = useState<number | null>(null);
  const [valorCustomizado, setValorCustomizado] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  // Operadoras habilitadas na conta RVHub (vem da API, não é lista fixa).
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const res = await fetch("/api/rvhub/recarga/operadoras", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (!ativo || !res.ok) return;
        const lista: Operadora[] = Array.isArray(data?.operadoras)
          ? data.operadoras.map((o: { provider: string }) =>
              estiloOperadora(String(o.provider))
            )
          : [];
        setOperadoras(lista);
      } catch {
        // Sem operadoras dinâmicas a tela fica só com o aviso de indisponível.
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const valorFinal = useMemo(() => {
    if (valor !== null) {
      return valor;
    }

    const numero = Number(
      valorCustomizado.replace(",", ".")
    );

    return Number.isFinite(numero) ? numero : 0;
  }, [valor, valorCustomizado]);

  const telefoneValido =
    somenteNumeros(telefone).length === 11;

  const valorValido =
    valorFinal >= 10 && valorFinal <= 500;

  const podeContinuar =
    telefoneValido &&
    !!operadora &&
    valorValido &&
    !loading;

  const selecionarValor = (novoValor: number) => {
    setValor(novoValor);
    setValorCustomizado("");
    setErro(null);
  };

  const alterarValorCustomizado = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;

    setValor(null);
    setValorCustomizado(value);
    setErro(null);
  };

  const continuarRecarga = async () => {
    if (!podeContinuar) {
      setErro(
        "Preencha o número, a operadora e um valor válido."
      );
      return;
    }

    try {
      setLoading(true);
      setErro(null);

      // A operadora é escolhida na tela e enviada para a RVHub.
      const response = await fetch("/api/rvhub/recarga", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          telefone: somenteNumeros(telefone),
          valor: valorFinal,
          // Nome exato da operadora, como a RVHub retorna no portfólio.
          provider: operadora,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao realizar recarga.");
      }

      setSucesso(true);
    } catch (error) {
      console.error("[RECARGA]", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar a recarga."
      );
    } finally {
      setLoading(false);
    }
  };

  const voltar = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  if (sucesso) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-7xl items-center justify-center">
          <div className="w-full rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-xl sm:rounded-[32px] sm:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-emerald-50">
              <CheckCircle2
                size={42}
                className="text-emerald-500"
              />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-[#173B3A] sm:text-3xl">
              Recarga iniciada!
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
              Sua solicitação de recarga foi recebida e está
              sendo processada.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-left">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Número
                </span>

                <strong className="text-sm text-[#173B3A]">
                  {telefone}
                </strong>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Operadora
                </span>

                <strong className="text-sm capitalize text-[#173B3A]">
                  {operadora}
                </strong>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Valor
                </span>

                <strong className="text-base text-[#149C8B]">
                  R$ {valorFinal.toFixed(2).replace(".", ",")}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSucesso(false);
                setValor(null);
                setValorCustomizado("");
              }}
              className="mt-6 w-full cursor-pointer rounded-xl bg-[#149C8B] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#11897D]"
            >
              Fazer outra recarga
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-7xl">
        {/* HEADER */}
        <header className="relative overflow-hidden rounded-[24px] p-5 shadow-xl sm:rounded-[28px] sm:p-7 lg:p-9">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#149C8B]/30 blur-3xl" />

          <div className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-[#149C8B]/20 blur-3xl" />

          <div className="relative">
            <button
              type="button"
              onClick={voltar}
              className="mb-6 cursor-pointer inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white sm:text-sm"
            >
              <ArrowLeft size={17} />
              Voltar
            </button>

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#149C8B] shadow-lg shadow-[#149C8B]/20 sm:h-16 sm:w-16">
                <Smartphone
                  className="text-white"
                  size={30}
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                  Recarga de celular
                </h1>

                <p className="mt-1 max-w-xl text-xs leading-5 text-white/60 sm:text-sm sm:leading-6">
                  Recarregue seu celular de forma rápida e segura.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ERRO */}
        {erro && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertTriangle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <span className="min-w-0 flex-1">
              {erro}
            </span>

            <button
              type="button"
              onClick={() => setErro(null)}
              className="text-red-400 transition hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
          {/* FORMULÁRIO */}
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF7F4] text-[#149C8B]">
                <Phone size={20} />
              </div>

              <div>
                <h2 className="font-bold text-[#173B3A] sm:text-lg">
                  Dados da recarga
                </h2>

                <p className="text-xs text-slate-400 sm:text-sm">
                  Informe os dados do número que receberá a recarga.
                </p>
              </div>
            </div>

            {/* TELEFONE */}
            <div className="mt-7">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Número do celular
              </label>

              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="tel"
                  inputMode="numeric"
                  value={telefone}
                  onChange={(event) =>
                    setTelefone(
                      formatarTelefone(
                        event.target.value
                      )
                    )
                  }
                  placeholder="(00) 00000-0000"
                  className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-[#173B3A] outline-none transition placeholder:text-slate-400 focus:border-[#149C8B] focus:bg-white focus:ring-4 focus:ring-[#149C8B]/10"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Digite o número com DDD.
              </p>
            </div>

            {/* OPERADORA */}
            <div className="mt-6">
              <label className="mb-3 block text-sm font-bold text-slate-700">
                Operadora
              </label>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {operadoras.length === 0 && (
                  <p className="col-span-full text-xs text-slate-400">
                    Carregando operadoras...
                  </p>
                )}

                {operadoras.map((item) => {
                  const selecionada = operadora === item.nome;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setOperadora(item.nome);
                        setErro(null);
                      }}
                      className={`relative cursor-pointer flex h-20 flex-col items-center justify-center rounded-2xl border-2 transition ${
                        selecionada
                          ? "border-[#149C8B] bg-[#EAF7F4] shadow-sm"
                          : "border-slate-200 bg-white hover:border-[#149C8B]/40 hover:bg-slate-50"
                      }`}
                    >
                      {selecionada && (
                        <CheckCircle2
                          size={16}
                          className="absolute right-2 top-2 text-[#149C8B]"
                        />
                      )}

                      <span
                        className="text-lg font-black tracking-tight"
                        style={{
                          color: item.cor,
                        }}
                      >
                        {item.logo}
                      </span>

                      <span className="mt-1 text-[10px] font-semibold text-slate-400">
                        {item.nome}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* VALORES */}
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-bold text-slate-700">
                  Valor da recarga
                </label>

                <span className="text-xs font-semibold text-slate-400">
                  Mínimo R$ 10,00
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {VALORES.map((item) => {
                  const selecionado = valor === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        selecionarValor(item)
                      }
                      className={`rounded-xl cursor-pointer border-2 px-4 py-3.5 text-sm font-extrabold transition ${
                        selecionado
                          ? "border-[#149C8B] bg-[#EAF7F4] text-[#149C8B]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#149C8B]/40 hover:bg-slate-50"
                      }`}
                    >
                      R$ {item},00
                    </button>
                  );
                })}
              </div>

              <div className="mt-3">
                <div className="relative">
                  <CircleDollarSign
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    inputMode="decimal"
                    value={valorCustomizado}
                    onChange={alterarValorCustomizado}
                    placeholder="Outro valor"
                    className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-[#173B3A] outline-none transition placeholder:text-slate-400 focus:border-[#149C8B] focus:bg-white focus:ring-4 focus:ring-[#149C8B]/10"
                  />
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Você pode informar um valor entre R$ 10,00 e R$ 500,00.
                </p>
              </div>
            </div>

            {/* BOTÃO */}
            <button
              type="button"
              onClick={() =>
                void continuarRecarga()
              }
              disabled={!podeContinuar}
              className="mt-7 flex h-14 cursor-pointer w-full items-center justify-center gap-2 rounded-xl bg-[#149C8B] px-5 text-sm font-extrabold text-white shadow-lg shadow-[#149C8B]/15 transition hover:bg-[#11897D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                  Processando...
                </>
              ) : (
                <>
                  Continuar recarga
                  <ChevronRight size={19} />
                </>
              )}
            </button>
          </section>

          {/* RESUMO */}
          <aside className="h-fit space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF7F4] text-[#149C8B]">
                  <Zap size={21} />
                </div>

                <div>
                  <h2 className="font-bold text-[#173B3A]">
                    Resumo
                  </h2>

                  <p className="text-xs text-slate-400">
                    Confira os dados
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <ResumoItem
                  label="Número"
                  value={
                    telefone || "Não informado"
                  }
                />

                <ResumoItem
                  label="Operadora"
                  value={operadora || "Não selecionada"}
                />

                <ResumoItem
                  label="Valor"
                  value={
                    valorFinal > 0
                      ? `R$ ${valorFinal
                          .toFixed(2)
                          .replace(".", ",")}`
                      : "R$ 0,00"
                  }
                  destaque
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-[#149C8B]/10 bg-[#EAF7F4] p-5 sm:p-6">
              <div className="flex gap-3">
                <ShieldCheck
                  size={21}
                  className="mt-0.5 shrink-0 text-[#149C8B]"
                />

                <div>
                  <h3 className="text-sm font-bold text-[#173B3A]">
                    Recarga segura
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Seus dados são protegidos durante todo o processo de recarga.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <Search
                  size={19}
                  className="text-[#149C8B]"
                />

                <span className="text-sm font-bold text-[#173B3A]">
                  Como funciona?
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <Passo
                  numero="1"
                  texto="Informe o número"
                />

                <Passo
                  numero="2"
                  texto="Escolha a operadora"
                />

                <Passo
                  numero="3"
                  texto="Selecione o valor"
                />

                <Passo
                  numero="4"
                  texto="Confirme a recarga"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ResumoItem({
  label,
  value,
  destaque = false,
}: {
  label: string;
  value: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-slate-400">
        {label}
      </span>

      <span
        className={`max-w-[65%] truncate text-right text-sm font-bold ${
          destaque
            ? "text-[#149C8B]"
            : "text-[#173B3A]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Passo({
  numero,
  texto,
}: {
  numero: string;
  texto: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#149C8B] text-[11px] font-extrabold text-white">
        {numero}
      </div>

      <span className="text-xs font-semibold text-slate-600">
        {texto}
      </span>
    </div>
  );
}
