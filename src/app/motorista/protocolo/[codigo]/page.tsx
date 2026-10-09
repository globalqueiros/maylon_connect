
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";

type Protocolo = {
  codigo?: string;
  nome?: string;
  email?: string;
  assunto?: string;
  mensagem?: string;
  categoria?: string | null;
  categoria_nome?: string | null;
  category?: string | null;
  status?: string;
  resposta?: string | null;
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
  try {
    return decodeURIComponent(codigo)
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  } catch {
    return codigo.trim().toLowerCase();
  }
}

function obterCategoria(protocolo: Protocolo) {
  const categoria = [
    protocolo.categoria,
    protocolo.categoria_nome,
    protocolo.category,
  ].find(
    (valor) =>
      typeof valor === "string" && valor.trim().length > 0
  );

  if (!categoria) return "Categoria não informada";

  return categoria
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letra) => letra.toLocaleUpperCase("pt-BR"));
}

function statusConfig(status?: string) {
  const value = String(status || "").toLowerCase().trim();

  if (
    ["finalizado", "resolvido", "fechado"].includes(value)
  ) {
    return {
      label: status || "Finalizado",
      icon: CheckCircle2,
    };
  }

  if (
    ["em andamento", "andamento", "em análise"].includes(value)
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

function extrairLista(data: unknown): Protocolo[] {
  if (Array.isArray(data)) {
    return data as Protocolo[];
  }

  if (data && typeof data === "object") {
    const objeto = data as {
      protocolos?: unknown;
      data?: unknown;
      protocolo?: unknown;
    };

    if (Array.isArray(objeto.protocolos)) {
      return objeto.protocolos as Protocolo[];
    }

    if (Array.isArray(objeto.data)) {
      return objeto.data as Protocolo[];
    }

    if (
      objeto.protocolo &&
      typeof objeto.protocolo === "object"
    ) {
      return [objeto.protocolo as Protocolo];
    }

    if ("codigo" in data) {
      return [data as Protocolo];
    }
  }

  return [];
}

export default function ProtocoloPage() {
  const params = useParams<{ codigo: string | string[] }>();

  const codigoParam = Array.isArray(params?.codigo)
    ? params.codigo[0]
    : params?.codigo;

  const codigo = String(codigoParam || "");

  const [protocolo, setProtocolo] = useState<Protocolo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [respostaUsuario, setRespostaUsuario] = useState("");
  const [enviandoResposta, setEnviandoResposta] = useState(false);
  const [respostaEnviada, setRespostaEnviada] = useState(false);
  const [erroResposta, setErroResposta] = useState("");

  const carregarProtocolo = useCallback(async () => {
    if (!codigo) {
      setErro("Código do protocolo não informado.");
      setProtocolo(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErro("");

      const response = await fetch("/api/protocolo", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const erroApi = data as {
          error?: string;
          message?: string;
        } | null;

        throw new Error(
          erroApi?.error ||
            erroApi?.message ||
            "Não foi possível carregar os protocolos."
        );
      }

      const lista = extrairLista(data);
      const codigoNormalizado = normalizarCodigo(codigo);

      const encontrado = lista.find(
        (item) =>
          normalizarCodigo(String(item.codigo || "")) ===
          codigoNormalizado
      );

      if (!encontrado) {
        setProtocolo(null);
        setErro("Protocolo não encontrado.");
        return;
      }

      setProtocolo(encontrado);
    } catch (error) {
      setProtocolo(null);
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o protocolo."
      );
    } finally {
      setLoading(false);
    }
  }, [codigo]);

  useEffect(() => {
    void carregarProtocolo();
  }, [carregarProtocolo]);

  async function enviarResposta() {
    const mensagem = respostaUsuario.trim();

    if (!mensagem) {
      setErroResposta("Digite uma resposta antes de enviar.");
      return;
    }

    if (!protocolo?.codigo) {
      setErroResposta("Protocolo inválido.");
      return;
    }

    try {
      setEnviandoResposta(true);
      setErroResposta("");
      setRespostaEnviada(false);

      const response = await fetch("/api/protocolo/resposta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          codigo: protocolo.codigo,
          resposta: mensagem,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Não foi possível enviar a mensagem."
        );
      }

      setRespostaUsuario("");
      setRespostaEnviada(true);

      if (data?.protocolo) {
        setProtocolo((anterior) => ({
          ...anterior,
          ...data.protocolo,
        }));
      } else {
        await carregarProtocolo();
      }
    } catch (error) {
      setErroResposta(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a mensagem."
      );
    } finally {
      setEnviandoResposta(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen px-4">
        <div className="mx-auto flex min-h-[75vh] max-w-5xl items-center justify-center">
          <div className="w-full max-w-lg rounded-[28px] border border-teal-100 bg-white p-8 text-center shadow-xl sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
              <Loader2 size={30} className="animate-spin" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Carregando atendimento
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Estamos buscando as informações do seu protocolo.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (erro || !protocolo) {
    return (
      <main className="min-h-screen px-4">
        <div className="mx-auto flex min-h-[75vh] max-w-5xl items-center justify-center">
          <div className="w-full max-w-lg rounded-[28px] border border-teal-100 bg-white p-8 text-center shadow-xl sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
              <FileText size={30} />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Protocolo não encontrado
            </h1>

            <p className="mt-3 break-words text-sm leading-6 text-slate-500">
              {erro || "Não foi possível localizar este protocolo."}
            </p>

            <Link
              href="/protocolo"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700 sm:w-auto"
            >
              <ArrowLeft size={17} />
              Voltar para protocolos
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const status = statusConfig(protocolo.status);
  const StatusIcon = status.icon;

  const categoria = obterCategoria(protocolo);
  const possuiResposta = Boolean(protocolo.resposta?.trim());

  const statusValue = String(protocolo.status || "")
    .toLowerCase()
    .trim();

  const finalizado = [
    "finalizado",
    "resolvido",
    "fechado",
  ].includes(statusValue);

  const andamento = [
    "em andamento",
    "andamento",
    "em análise",
  ].includes(statusValue);

  return (
    <main className="min-h-screen mb-3">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/motorista/central_ajuda"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 sm:w-fit"
          >
            <ArrowLeft
              size={17}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Voltar para protocolos
          </Link>

          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-700">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500" />
            </span>
            Central de Atendimento Maylon
          </div>
        </div>

        <section className="overflow-hidden rounded-[22px] border border-teal-100 bg-white shadow-[0_25px_90px_rgba(13,148,136,0.09)] sm:rounded-[26px] lg:rounded-[30px]">
          <div className="relative overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-teal-500 px-5 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10 2xl:px-14 2xl:py-12">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl 2xl:text-4xl">
                  Acompanhamento
                  <br className="sm:hidden" /> do protocolo
                </h1>
                <p className="mt-0 max-w-xl text-sm leading-6 text-white/75 2xl:text-sm">
                  Consulte sua solicitação, acompanhe o atendimento e
                  mantenha contato com nossa equipe.
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
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-white sm:text-lg">
                      {protocolo.codigo}
                    </p>
                    <p className="text-xs text-white/70">
                      Aberto em {formatarData(protocolo.criado_em)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-100 px-5 py-5 sm:px-8 lg:px-10 2xl:px-14">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <StatusIcon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Status atual
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {status.label}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 items-center lg:max-w-xl">
                <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      finalizado
                        ? "w-full bg-teal-500"
                        : andamento
                          ? "w-2/3 bg-teal-500"
                          : "w-1/3 bg-teal-500"
                    }`}
                  />
                </div>
                <span className="ml-3 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-teal-600">
                  {finalizado
                    ? "Concluído"
                    : andamento
                      ? "Em andamento"
                      : "Recebido"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[280px_1fr] lg:gap-8 lg:p-8 xl:p-10 2xl:grid-cols-[340px_1fr] 2xl:gap-10 2xl:p-12">
            <aside className="grid content-start gap-4 md:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Informações
                </p>

                <div className="mt-5 space-y-5">
                  <div>
                    <p className="text-xs text-slate-400">
                      Categoria
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-slate-900 2xl:text-base">
                      {categoria}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Data de abertura
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 2xl:text-base">
                      {formatarData(protocolo.criado_em)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Última atualização
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 2xl:text-base">
                      {formatarData(protocolo.atualizado_em)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 sm:p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
                  <MessageCircle size={18} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-teal-900">
                  Atendimento online
                </h3>
                <p className="mt-1 text-xs leading-5 text-teal-700">
                  Todas as mensagens relacionadas ao seu protocolo
                  ficam registradas neste atendimento.
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

              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 2xl:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Sua solicitação
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatarData(protocolo.criado_em)}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase text-slate-500">
                      Cliente
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
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

                <div className="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white p-4 shadow-sm sm:p-5 2xl:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
                        <MessageCircle size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Resposta da equipe
                        </p>
                        <p className="text-[11px] text-teal-600">
                          Central de Atendimento
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-teal-100 bg-white px-3 py-1 text-[10px] font-bold uppercase text-teal-600">
                      Maylon
                    </span>
                  </div>

                  <div className="rounded-xl border border-teal-100 bg-white p-4 sm:p-5">
                    <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                      {possuiResposta
                        ? protocolo.resposta
                        : "Sua solicitação foi recebida e está aguardando uma resposta da equipe de atendimento."}
                    </p>
                  </div>
                </div>

                {possuiResposta && !finalizado && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
                    <div className="mb-5 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                        <Send size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Continuar atendimento
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Envie uma nova mensagem para nossa equipe.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-500/10">
                      <textarea
                        value={respostaUsuario}
                        onChange={(event) => {
                          setRespostaUsuario(event.target.value);
                          setErroResposta("");
                          setRespostaEnviada(false);
                        }}
                        placeholder="Escreva sua mensagem..."
                        rows={5}
                        maxLength={5000}
                        disabled={enviandoResposta}
                        className="w-full resize-none border-0 bg-transparent px-4 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60 sm:px-5 sm:py-4"
                      />

                      <div className="flex flex-col gap-3 border-t border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="px-2">
                          {erroResposta && (
                            <p role="alert" className="text-xs font-semibold text-red-600">
                              {erroResposta}
                            </p>
                          )}

                          {respostaEnviada && (
                            <p role="status" className="flex items-center gap-2 text-xs font-semibold text-teal-600">
                              <CheckCircle2 size={15} />
                              Mensagem enviada com sucesso.
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={enviarResposta}
                          disabled={
                            enviandoResposta ||
                            !respostaUsuario.trim()
                          }
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                          {enviandoResposta ? (
                            <>
                              <Loader2 size={17} className="animate-spin" />
                              Enviando
                            </>
                          ) : (
                            <>
                              <Send size={17} />
                              Enviar mensagem
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!possuiResposta && (
                  <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                        <Clock3 size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-teal-900">
                          Aguardando resposta
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-teal-700">
                          Nossa equipe está analisando sua solicitação.
                          Assim que houver uma resposta, ela aparecerá
                          nesta página.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {finalizado && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={20} className="shrink-0 text-teal-600" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Atendimento finalizado
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          Este protocolo foi finalizado. Caso precise de
                          ajuda novamente, abra uma nova solicitação.
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