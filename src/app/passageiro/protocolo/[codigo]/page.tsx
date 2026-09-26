"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";

type Protocolo = {
  codigo?: string;
  nome?: string;
  email?: string;
  assunto?: string;
  mensagem?: string;
  categoria?: string;
  status?: string;
  resposta?: string;
  criado_em?: string;
  atualizado_em?: string;
};

function formatarData(data?: string) {
  if (!data) return "—";

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) return data;

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function normalizarCodigo(codigo: string) {
  return decodeURIComponent(codigo)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function statusConfig(status?: string) {
  const value = String(status || "")
    .toLowerCase()
    .trim();

  if (
    value === "finalizado" ||
    value === "resolvido" ||
    value === "fechado"
  ) {
    return {
      label: status || "Finalizado",
      icon: CheckCircle2,
    };
  }

  if (
    value === "em andamento" ||
    value === "andamento" ||
    value === "em análise"
  ) {
    return {
      label: status || "Em andamento",
      icon: Clock3,
    };
  }

  return {
    label: status || "Aberto",
    icon: MessageCircle,
  };
}

export default function ProtocoloPage() {
  const params = useParams<{ codigo: string }>();

  const [protocolo, setProtocolo] =
    useState<Protocolo | null>(null);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [respostaUsuario, setRespostaUsuario] =
    useState("");

  const [enviandoResposta, setEnviandoResposta] =
    useState(false);

  const [respostaEnviada, setRespostaEnviada] =
    useState(false);

  const [erroResposta, setErroResposta] =
    useState("");

  const codigo = Array.isArray(params?.codigo)
    ? params.codigo[0]
    : params?.codigo || "";

  useEffect(() => {
    if (!codigo) return;

    let ativo = true;

    async function carregarProtocolo() {
      try {
        setLoading(true);
        setErro("");

        const response = await fetch(
          "/api/protocolo",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error ||
            data?.message ||
            "Não foi possível carregar os protocolos."
          );
        }

        const lista: Protocolo[] =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.protocolos)
              ? data.protocolos
              : Array.isArray(data?.data)
                ? data.data
                : [];

        const codigoNormalizado =
          normalizarCodigo(codigo);

        const encontrado = lista.find(
          (item) =>
            normalizarCodigo(
              String(item.codigo || "")
            ) === codigoNormalizado
        );

        if (!ativo) return;

        if (!encontrado) {
          setErro("Protocolo não encontrado.");
          setProtocolo(null);
          return;
        }

        setProtocolo(encontrado);
      } catch (error) {
        if (!ativo) return;

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o protocolo."
        );

        setProtocolo(null);
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregarProtocolo();

    return () => {
      ativo = false;
    };
  }, [codigo]);

  async function enviarResposta() {
    const mensagem =
      respostaUsuario.trim();

    if (!mensagem) {
      setErroResposta(
        "Digite uma resposta antes de enviar."
      );
      return;
    }

    if (!protocolo?.codigo) {
      setErroResposta(
        "Protocolo inválido."
      );
      return;
    }

    try {
      setEnviandoResposta(true);
      setErroResposta("");
      setRespostaEnviada(false);

      const response = await fetch(
        "/api/protocolo/resposta",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            codigo: protocolo.codigo,
            resposta: mensagem,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          "Não foi possível enviar a resposta."
        );
      }

      setRespostaUsuario("");
      setRespostaEnviada(true);

      if (data?.protocolo) {
        setProtocolo(data.protocolo);
      }
    } catch (error) {
      setErroResposta(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a resposta."
      );
    } finally {
      setEnviandoResposta(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen px-4 sm:px-0">
        <div className="mx-auto flex min-h-[75vh] max-w-5xl items-center justify-center">
          <div className="w-full max-w-md rounded-[22px] border border-teal-100 bg-white p-7 text-center shadow-[0_25px_80px_rgba(13,148,136,0.10)] sm:max-w-lg sm:rounded-[28px] sm:p-10 2xl:max-w-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 sm:h-16 sm:w-16">
              <Loader2
                size={30}
                className="animate-spin"
              />
            </div>

            <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-900 sm:mt-6 sm:text-2xl 2xl:text-3xl">
              Carregando atendimento
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500 2xl:text-base">
              Estamos buscando as informações
              do seu protocolo.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (erro || !protocolo) {
    return (
      <main className="min-h-screen px-4 sm:px-0">
        <div className="mx-auto flex min-h-[75vh] max-w-5xl items-center justify-center">
          <div className="w-full max-w-md rounded-[22px] border border-teal-100 bg-white p-7 text-center shadow-[0_25px_80px_rgba(13,148,136,0.10)] sm:max-w-lg sm:rounded-[28px] sm:p-10 2xl:max-w-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 sm:h-16 sm:w-16">
              <FileText size={30} />
            </div>

            <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-900 sm:mt-6 sm:text-2xl 2xl:text-3xl">
              Protocolo não encontrado
            </h1>

            <p className="mt-3 break-words text-sm leading-6 text-slate-500 2xl:text-base">
              O protocolo{" "}
              <strong className="text-slate-800">
                {decodeURIComponent(codigo)}
              </strong>{" "}
              não foi localizado na sua conta.
            </p>

            <Link
              href="/protocolo"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 sm:mt-7 sm:w-auto"
            >
              <ArrowLeft size={17} />
              Voltar para protocolos
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const status = statusConfig(
    protocolo.status
  );

  const StatusIcon = status.icon;

  const possuiResposta =
    Boolean(
      protocolo.resposta?.trim()
    );

  const statusValue = String(
    protocolo.status || ""
  )
    .toLowerCase()
    .trim();

  const finalizado =
    statusValue === "finalizado" ||
    statusValue === "resolvido" ||
    statusValue === "fechado";

  const andamento =
    statusValue === "em andamento" ||
    statusValue === "andamento" ||
    statusValue === "em análise";

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-full 2xl:max-w-[1600px]">

        {/* TOPO */}
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:mb-7">
          <Link
            href="/protocolo"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 hover:shadow-md sm:w-fit sm:justify-start 2xl:text-base"
          >
            <ArrowLeft
              size={17}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Voltar para protocolos
          </Link>

          <div className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-[11px] font-semibold text-teal-700 sm:w-fit sm:text-xs 2xl:text-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500" />
            </span>

            Central de Atendimento Maylon
          </div>
        </div>

        <section className="overflow-hidden rounded-[22px] border border-teal-100 bg-white shadow-[0_25px_90px_rgba(13,148,136,0.09)] sm:rounded-[26px] lg:rounded-[30px]">

          {/* HERO */}
          <div className="relative overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-teal-500 px-5 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10 2xl:px-14 2xl:py-12">
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl sm:h-72 sm:w-72" />

            <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-teal-300/20 blur-3xl sm:h-80 sm:w-80" />

            <div className="relative">
              <div className="flex flex-col gap-6 sm:gap-7 lg:flex-row lg:items-end lg:justify-between">

                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl 2xl:text-5xl">
                    Acompanhamento
                    <br className="sm:hidden" />{" "}
                    do protocolo
                  </h1>

                  <p className="mt-1 max-w-xl text-xs leading-5 text-white/75 sm:text-sm sm:leading-6 2xl:max-w-2xl 2xl:text-base 2xl:leading-7">
                    Consulte sua solicitação,
                    acompanhe o atendimento e
                    mantenha contato com nossa
                    equipe.
                  </p>
                </div>

                <div className="w-full rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl sm:max-w-sm 2xl:max-w-md 2xl:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                      Protocolo
                    </span>

                    <span className="max-w-[60%] truncate rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/80">
                      {protocolo.codigo}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white sm:h-11 sm:w-11">
                      <FileText size={20} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-white sm:text-lg 2xl:text-xl">
                        {protocolo.codigo}
                      </p>

                      <p className="text-xs text-white/60">
                        Aberto em{" "}
                        {formatarData(
                          protocolo.criado_em
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STATUS */}
          <div className="border-b border-slate-100 bg-white px-5 py-4 sm:px-8 sm:py-5 lg:px-10 2xl:px-14">
            <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 sm:h-11 sm:w-11">
                  <StatusIcon size={20} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Status atual
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900 2xl:text-base">
                    {status.label}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 items-center lg:max-w-xl 2xl:max-w-2xl">
                <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                  <div
                    className={`h-1.5 rounded-full transition-all ${finalizado
                        ? "w-full bg-teal-500"
                        : andamento
                          ? "w-2/3 bg-teal-500"
                          : "w-1/3 bg-teal-500"
                      }`}
                  />
                </div>

                <span className="ml-3 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-teal-600 2xl:text-xs">
                  {finalizado
                    ? "Concluído"
                    : andamento
                      ? "Em andamento"
                      : "Recebido"}
                </span>
              </div>
            </div>
          </div>

          {/* CONTEÚDO */}
          <div className="grid gap-5 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[260px_1fr] lg:gap-8 lg:p-8 xl:grid-cols-[280px_1fr] xl:p-10 2xl:grid-cols-[340px_1fr] 2xl:gap-10 2xl:p-12">

            <aside className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 lg:content-start">

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Informações
                </p>

                <div className="mt-4 space-y-4 sm:mt-5 sm:space-y-5">

                  <div>
                    <p className="text-xs text-slate-400 2xl:text-sm">
                      Categoria
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900 2xl:text-base">
                      {protocolo.categoria || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 2xl:text-sm">
                      Data de abertura
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900 2xl:text-base">
                      {formatarData(
                        protocolo.criado_em
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 2xl:text-sm">
                      Última atualização
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900 2xl:text-base">
                      {formatarData(
                        protocolo.atualizado_em
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 sm:p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
                  <MessageCircle size={18} />
                </div>

                <h3 className="mt-4 text-sm font-bold text-teal-900 2xl:text-base">
                  Atendimento online
                </h3>

                <p className="mt-1 text-xs leading-5 text-teal-700 sm:text-justify 2xl:text-sm 2xl:leading-6">
                  Todas as mensagens relacionadas
                  ao seu protocolo ficam registradas
                  neste atendimento.
                </p>
              </div>

            </aside>

            <div className="min-w-0">

              <div className="mb-5 sm:mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-600">
                  Solicitação
                </p>

                <h2 className="mt-1 break-words text-lg font-bold tracking-tight text-slate-900 sm:text-xl lg:text-2xl 2xl:text-3xl">
                  {protocolo.assunto || "Sem assunto"}
                </h2>
              </div>

              <div className="space-y-4 sm:space-y-5">

                {/* SOLICITAÇÃO DO CLIENTE */}
                <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 2xl:p-6">
                  <div className="absolute -left-1 top-7 hidden h-8 w-1 rounded-r-full bg-slate-300 sm:block" />

                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <FileText size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 2xl:text-base">
                          Sua solicitação
                        </p>

                        <p className="text-[11px] text-slate-400 2xl:text-xs">
                          {formatarData(
                            protocolo.criado_em
                          )}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-3">
                      Cliente
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 sm:p-4">
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 sm:leading-7 2xl:text-base 2xl:leading-8">
                      {protocolo.mensagem ||
                        "Nenhuma mensagem registrada."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-slate-100" />

                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                    Atendimento
                  </span>

                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                {/* RESPOSTA DA EQUIPE */}
                <div className="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white p-4 shadow-sm sm:p-5 2xl:p-6">

                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-teal-200/30 blur-3xl" />

                  <div className="relative">

                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
                          <MessageCircle size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 2xl:text-base">
                            Resposta da equipe
                          </p>

                          <p className="text-[11px] text-teal-600 2xl:text-xs">
                            Central de Atendimento
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full border border-teal-100 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-600 sm:px-3">
                        Maylon
                      </span>
                    </div>

                    <div className="rounded-xl border border-teal-100 bg-white p-4 sm:p-5">
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 sm:leading-7 2xl:text-base 2xl:leading-8">
                        {possuiResposta
                          ? protocolo.resposta
                          : "Sua solicitação foi recebida e está aguardando uma resposta da equipe de atendimento."}
                      </p>
                    </div>

                  </div>
                </div>

                {/* CONTINUAR ATENDIMENTO */}
                {possuiResposta && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6 2xl:p-7">

                    <div className="mb-4 flex items-start gap-3 sm:mb-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                        <Send size={18} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900 2xl:text-base">
                          Continuar atendimento
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-slate-500 2xl:text-sm">
                          Envie uma nova mensagem para
                          nossa equipe.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition focus-within:border-teal-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10">
                      <textarea
                        value={
                          respostaUsuario
                        }
                        onChange={(e) => {
                          setRespostaUsuario(
                            e.target.value
                          );
                          setErroResposta("");
                          setRespostaEnviada(
                            false
                          );
                        }}
                        placeholder="Escreva sua mensagem..."
                        rows={5}
                        disabled={
                          enviandoResposta
                        }
                        className="w-full resize-none border-0 bg-transparent px-4 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-4 2xl:min-h-[180px] 2xl:text-base"
                      />

                      <div className="flex flex-col gap-3 border-t border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">

                        <div className="px-2">
                          {erroResposta && (
                            <p className="text-xs font-semibold text-red-600">
                              {erroResposta}
                            </p>
                          )}

                          {respostaEnviada && (
                            <p className="flex items-center gap-2 text-xs font-semibold text-teal-600">
                              <CheckCircle2
                                size={15}
                              />
                              Mensagem enviada com sucesso.
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={
                            enviarResposta
                          }
                          disabled={
                            enviandoResposta ||
                            !respostaUsuario.trim()
                          }
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto 2xl:px-6 2xl:text-base"
                        >
                          {enviandoResposta ? (
                            <>
                              <Loader2
                                size={17}
                                className="animate-spin"
                              />
                              Enviando
                            </>
                          ) : (
                            <>
                              <Send
                                size={17}
                              />
                              Enviar mensagem
                            </>
                          )}
                        </button>

                      </div>
                    </div>
                  </div>
                )}

                {/* AGUARDANDO */}
                {!possuiResposta && (
                  <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                        <Clock3 size={18} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-teal-900 2xl:text-base">
                          Aguardando resposta
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-teal-700 2xl:text-sm 2xl:leading-6">
                          Nossa equipe está analisando
                          sua solicitação. Assim que houver
                          uma resposta, ela aparecerá
                          automaticamente nesta página.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}