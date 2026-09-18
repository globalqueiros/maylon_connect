"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  Gift,
  Loader2,
  ChevronRight,
  X,
} from "lucide-react";
import BtgPactualModal from "../../components/BtgPactualModalPage";
import CajuBeneficiosModal from "../../components/CajuBeneficiosModal";
import ConectCarModal from "../../components/ConectCarModal";
import SeguroVidaModal from "../../components/SeguroVidaModal";

type Beneficio = {
  id: number;
  tipo: string;
  imagem: string;
  titulo: string;
  descricao: string;
  valor: string;
  status: boolean | number | string;
  status_assinatura?:
    | "ativo"
    | "aprovado"
    | "pendente"
    | "cancelado"
    | "expirado"
    | "erro"
    | "autorizado"
    | string
    | null;
};

type Usuario = {
  id: string;
  full_name?: string;
  email?: string;
};

type Alerta = {
  tipo: "success" | "error" | "warning";
  mensagem: string;
};

const STATUS_ATIVOS = new Set(["ativo", "aprovado", "autorizado"]);

function statusHabilitado(status: Beneficio["status"]): boolean {
  return (
    status === true ||
    Number(status) === 1 ||
    String(status).trim().toLowerCase() === "1" ||
    String(status).trim().toLowerCase() === "true"
  );
}

function estaAtivo(beneficio: Beneficio): boolean {
  const assinatura = String(beneficio.status_assinatura ?? "")
    .trim()
    .toLowerCase();

  return statusHabilitado(beneficio.status) && STATUS_ATIVOS.has(assinatura);
}

function dedupeBeneficios(lista: Beneficio[]): Beneficio[] {
  const map = new Map<number, Beneficio>();

  for (const item of lista) {
    const id = Number(item.id);

    if (!Number.isFinite(id)) {
      continue;
    }

    const beneficio: Beneficio = {
      ...item,
      id,
      tipo: String(item.tipo ?? ""),
      imagem: String(item.imagem ?? ""),
      titulo: String(item.titulo ?? ""),
      descricao: String(item.descricao ?? ""),
      valor: String(item.valor ?? ""),
      status_assinatura: item.status_assinatura ?? null,
    };

    const existente = map.get(id);

    if (!existente) {
      map.set(id, beneficio);
      continue;
    }

    // Se houver duplicidade, o registro com assinatura ativa tem prioridade.
    if (estaAtivo(beneficio) && !estaAtivo(existente)) {
      map.set(id, beneficio);
    }
  }

  return Array.from(map.values());
}

function formatValor(valor?: string | number | null): string {
  if (valor === null || valor === undefined || valor === "") {
    return "R$ 0,00";
  }

  let numero: number;

  if (typeof valor === "number") {
    numero = valor;
  } else {
    const texto = String(valor).trim();

    if (texto.includes(",")) {
      numero = Number(texto.replace(/\./g, "").replace(",", "."));
    } else {
      numero = Number(texto);
    }
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0);
}

async function lerResposta(res: Response) {
  const texto = await res.text();

  if (!texto) {
    return {};
  }

  try {
    return JSON.parse(texto);
  } catch {
    return {
      error: res.ok
        ? "A resposta do servidor não está em formato JSON."
        : `Erro do servidor (${res.status}).`,
    };
  }
}

export default function BeneficiosPage() {
  const [alerta, setAlerta] = useState<Alerta | null>(null);
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [loadingBeneficios, setLoadingBeneficios] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);

  const [btgModalOpen, setBtgModalOpen] = useState(false);
  const [cajuModalOpen, setCajuModalOpen] = useState(false);
  const [conectcarModalOpen, setConectcarModalOpen] = useState(false);
  const [seguroVidaModalOpen, setSeguroVidaModalOpen] = useState(false);

  const [beneficioSelecionado, setBeneficioSelecionado] =
    useState<Beneficio | null>(null);

  const beneficioRef = useRef<Beneficio | null>(null);

  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [ativandoId, setAtivandoId] = useState<number | null>(null);
  const [beneficioCancelar, setBeneficioCancelar] =
    useState<Beneficio | null>(null);

  const carregarBeneficios = async () => {
    if (!usuario?.id) {
      setLoadingBeneficios(false);
      return;
    }

    setLoadingBeneficios(true);

    try {
      const res = await fetch("/api/beneficios/motorista", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          usuario_id: usuario.id,
        }),
      });

      const data = await lerResposta(res);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Não foi possível carregar os benefícios."
        );
      }

      const lista: Beneficio[] =
        data?.beneficios ??
        data?.data ??
        (Array.isArray(data) ? data : []);

      setBeneficios(dedupeBeneficios(lista));
    } catch (error) {
      setAlerta({
        tipo: "error",
        mensagem:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os benefícios.",
      });
    } finally {
      setLoadingBeneficios(false);
    }
  };

  useEffect(() => {
    if (!usuario?.id) {
      return;
    }

    void carregarBeneficios();
  }, [usuario?.id]);

  useEffect(() => {
    let ativo = true;

    async function carregarUsuario() {
      try {
        setCarregandoUsuario(true);

        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await lerResposta(res);

        if (!res.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              "Não foi possível identificar o usuário."
          );
        }

        const usuarioApi =
          data?.motorista ??
          data?.usuario ??
          data?.user ??
          data?.data?.motorista ??
          data?.data?.usuario ??
          data?.data?.user ??
          data?.data ??
          data;

        const id = String(
          usuarioApi?.id ??
            usuarioApi?.usuario_id ??
            usuarioApi?.user_id ??
            ""
        ).trim();

        if (!id) {
          throw new Error("ID do usuário não encontrado.");
        }

        if (!ativo) {
          return;
        }

        setUsuario({
          id,
          full_name:
            usuarioApi?.full_name ??
            usuarioApi?.fullName ??
            usuarioApi?.name ??
            "",
          email: usuarioApi?.email ?? "",
        });
      } catch (error) {
        if (!ativo) {
          return;
        }

        setAlerta({
          tipo: "error",
          mensagem:
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o usuário.",
        });
      } finally {
        if (ativo) {
          setCarregandoUsuario(false);
        }
      }
    }

    void carregarUsuario();

    return () => {
      ativo = false;
    };
  }, []);

  const ehLojaMaylon = (beneficio: Beneficio) => {
    const texto =
      `${beneficio.tipo} ${beneficio.titulo} ${beneficio.descricao}`.toLowerCase();

    return (
      texto.includes("loja da maylon") ||
      texto.includes("loja maylon") ||
      (texto.includes("loja") && texto.includes("maylon")) ||
      texto.includes("maylon acessórios") ||
      texto.includes("maylon acessorios") ||
      texto.includes("acessórios maylon") ||
      texto.includes("acessorios maylon")
    );
  };

  const ativarBeneficioDireto = async (beneficio: Beneficio) => {
    if (!usuario?.id) {
      setAlerta({
        tipo: "error",
        mensagem: "Usuário não identificado.",
      });
      return;
    }

    if (ativandoId === beneficio.id) {
      return;
    }

    setAtivandoId(beneficio.id);
    setAlerta(null);

    try {
      const res = await fetch("/api/beneficios/ativar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          usuario_id: usuario.id,
          beneficio_id: beneficio.id,
        }),
      });

      const data = await lerResposta(res);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Não foi possível ativar o benefício."
        );
      }

      setAlerta({
        tipo: "success",
        mensagem:
          data?.message ||
          `${beneficio.titulo} ativado com sucesso!`,
      });

      await carregarBeneficios();
    } catch (error) {
      setAlerta({
        tipo: "error",
        mensagem:
          error instanceof Error
            ? error.message
            : "Não foi possível ativar o benefício.",
      });
    } finally {
      setAtivandoId(null);
    }
  };

  const abrirModal = (beneficio: Beneficio) => {
    const normalized: Beneficio = {
      ...beneficio,
      id: Number(beneficio.id),
      tipo: String(beneficio.tipo ?? ""),
      valor: String(beneficio.valor ?? ""),
      titulo: String(beneficio.titulo ?? ""),
      descricao: String(beneficio.descricao ?? ""),
      imagem: String(beneficio.imagem ?? ""),
    };

    beneficioRef.current = normalized;
    setBeneficioSelecionado(normalized);

    setBtgModalOpen(false);
    setCajuModalOpen(false);
    setConectcarModalOpen(false);
    setSeguroVidaModalOpen(false);

    const tipo =
      `${normalized.tipo} ${normalized.titulo}`.toLowerCase();

    if (tipo.includes("btg") || tipo.includes("previd")) {
      setBtgModalOpen(true);
      return;
    }

    if (tipo.includes("caju")) {
      setCajuModalOpen(true);
      return;
    }

    if (
      tipo.includes("conectcar") ||
      tipo.includes("conect car")
    ) {
      setConectcarModalOpen(true);
      return;
    }

    if (
      tipo.includes("seguro") ||
      tipo.includes("vida")
    ) {
      setSeguroVidaModalOpen(true);
      return;
    }

    setBtgModalOpen(true);
  };

  const fecharTodosModais = () => {
    setBtgModalOpen(false);
    setCajuModalOpen(false);
    setConectcarModalOpen(false);
    setSeguroVidaModalOpen(false);
    beneficioRef.current = null;
    setBeneficioSelecionado(null);
  };

  const cancelarComReembolso = async (beneficio: Beneficio) => {
    if (!usuario?.id) {
      setAlerta({
        tipo: "error",
        mensagem: "Usuário não identificado.",
      });
      return;
    }

    if (cancelandoId === beneficio.id) {
      return;
    }

    setCancelandoId(beneficio.id);
    setAlerta(null);

    try {
      const res = await fetch("/api/beneficios/cancelar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          usuario_id: usuario.id,
          beneficio_id: beneficio.id,
        }),
      });

      const data = await lerResposta(res);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Falha ao cancelar o serviço."
        );
      }

      setBeneficioCancelar(null);

      setAlerta({
        tipo: "success",
        mensagem:
          data?.message ||
          "Serviço cancelado. Reembolso em andamento.",
      });

      await carregarBeneficios();
    } catch (error) {
      setAlerta({
        tipo: "error",
        mensagem:
          error instanceof Error
            ? error.message
            : "Erro ao cancelar serviço.",
      });
    } finally {
      setCancelandoId(null);
    }
  };

  // Ativo = beneficio_assinaturas.status_assinatura = "ativo" e status = 1
  const ativos = beneficios.filter((b) => estaAtivo(b));
  const disponiveis = beneficios.filter((b) => !estaAtivo(b));

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-8xl">
        {alerta && (
          <div
            className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm ${
              alerta.tipo === "success"
                ? "border-teal-200 bg-teal-50 text-teal-700"
                : alerta.tipo === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {alerta.tipo === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}

            <span>{alerta.mensagem}</span>

            <button
              type="button"
              onClick={() => setAlerta(null)}
              className="ml-auto cursor-pointer rounded-lg p-1 transition hover:bg-black/5"
              aria-label="Fechar alerta"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="relative my-3 mt-0 overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-r from-teal-700 via-teal-600 to-teal-500 px-5 py-6 shadow-2xl shadow-teal-950/30 sm:px-7 lg:px-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-teal-200/10 blur-3xl" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-[#0f766e]/15">
              <Gift
                size={28}
                strokeWidth={2}
                className="text-white"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Benefícios
              </h1>

              <p className="mt-0 text-sm text-white/70">
                Gerencie seus benefícios e aproveite vantagens exclusivas.
              </p>
            </div>
          </div>
        </div>

        <section className="mb-6 overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-xl shadow-teal-950/10">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                <CheckCircle2
                  size={20}
                  className="text-teal-600"
                />
              </div>

              <div>
                <h2 className="text-lg font-bold text-teal-700">
                  Benefícios Ativos
                </h2>

                <p className="text-xs text-slate-500">
                  Serviços atualmente contratados.
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-600">
              {ativos.length} ativo(s)
            </span>
          </div>

          <div className="p-5 sm:p-6">
            {loadingBeneficios || carregandoUsuario ? (
              <div className="flex min-h-[160px] items-center justify-center">
                <div className="flex flex-col items-center">
                  <Loader2
                    size={28}
                    className="animate-spin text-teal-600"
                  />

                  <p className="mt-3 text-xs font-medium text-gray-500">
                    Carregando benefícios...
                  </p>
                </div>
              </div>
            ) : ativos.length === 0 ? (
              <div className="flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
                <AlertTriangle
                  size={22}
                  className="shrink-0 text-red-500"
                />

                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Nenhum benefício ativo
                  </p>

                  <p className="mt-0.5 text-xs text-red-500">
                    Escolha um dos benefícios disponíveis abaixo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {ativos.map((b) => (
                  <div
                    key={b.id}
                    className="group rounded-[22px] border border-teal-100 bg-gradient-to-br from-white to-teal-50/40 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-900/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                          <CheckCircle2
                            size={19}
                            className="text-teal-600"
                          />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-gray-900">
                            {b.titulo}
                          </h3>

                          <p className="mt-0.5 text-xs capitalize text-gray-500">
                            {b.status_assinatura ?? "ativo"}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                        Ativo
                      </span>
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Mensalidade
                      </p>

                      <p className="mt-1 text-lg font-extrabold text-teal-600">
                        {formatValor(b.valor)}

                        <span className="ml-1 text-[10px] font-medium text-gray-400">
                          /mês
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={cancelandoId === b.id}
                      onClick={() => setBeneficioCancelar(b)}
                      className="mt-4 w-full cursor-pointer rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancelandoId === b.id
                        ? "Cancelando..."
                        : "Cancelar benefício"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-xl shadow-teal-950/10">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                <Gift
                  size={20}
                  className="text-teal-600"
                />
              </div>

              <div>
                <h2 className="text-lg font-bold text-teal-700">
                  Benefícios Disponíveis
                </h2>

                <p className="text-xs text-slate-500">
                  Escolha uma vantagem para ativar.
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-600">
              {disponiveis.length} disponível(is)
            </span>
          </div>

          <div className="p-5 sm:p-6">
            {loadingBeneficios || carregandoUsuario ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="flex flex-col items-center">
                  <Loader2
                    size={28}
                    className="animate-spin text-teal-600"
                  />

                  <p className="mt-3 text-xs font-medium text-gray-500">
                    Carregando benefícios...
                  </p>
                </div>
              </div>
            ) : disponiveis.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-8 text-center">
                <Gift
                  size={28}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Nenhum benefício disponível
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Novos benefícios aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-4">
                {disponiveis.map((b) => {
                  const lojaMaylon = ehLojaMaylon(b);
                  const ativando = ativandoId === b.id;

                  return (
                    <article
                      key={b.id}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-600/30 hover:shadow-xl"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={b.imagem}
                          alt={b.titulo}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-600 shadow-sm">
                          Benefício Exclusivo
                        </span>

                        <div className="absolute bottom-4 left-5 right-5">
                          <h3 className="line-clamp-2 text-base font-bold leading-tight text-white">
                            {b.titulo}
                          </h3>
                        </div>
                      </div>

                      <div className="p-5">
                        <p className="line-clamp-3 min-h-[60px] text-justify text-xs leading-5 text-gray-500">
                          {b.descricao}
                        </p>

                        <div className="mt-5 flex items-end justify-between gap-4 border-t border-gray-100 pt-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                              Valor mensal
                            </p>

                            <p className="mt-1 text-xl font-extrabold text-teal-600">
                              {formatValor(b.valor)}
                            </p>
                          </div>

                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
                            <Gift
                              size={17}
                              className="text-teal-600"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={ativando}
                          onClick={() => {
                            if (lojaMaylon) {
                              void ativarBeneficioDireto(b);
                              return;
                            }

                            abrirModal(b);
                          }}
                          className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-teal-400"
                        >
                          {ativando ? (
                            <>
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                              Ativando...
                            </>
                          ) : (
                            <>
                              Ativar benefício
                              <ChevronRight size={16} />
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {beneficioCancelar && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (
              event.target === event.currentTarget &&
              cancelandoId === null
            ) {
              setBeneficioCancelar(null);
            }
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancelar-beneficio-title"
          >
            <div className="bg-gradient-to-br from-teal-800 via-teal-700 to-teal-500 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                  <AlertTriangle size={22} />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (cancelandoId === null) {
                      setBeneficioCancelar(null);
                    }
                  }}
                  className="cursor-pointer rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                  aria-label="Fechar"
                >
                  <X size={19} />
                </button>
              </div>

              <h3
                id="cancelar-beneficio-title"
                className="mt-4 text-xl font-bold"
              >
                Cancelar benefício?
              </h3>

              <p className="mt-1 text-sm text-white/80">
                Esta ação encerra o serviço e solicita a devolução do valor.
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  Plano
                </p>

                <p className="mt-1 text-sm font-bold text-gray-900">
                  {beneficioCancelar.titulo}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {formatValor(beneficioCancelar.valor)}
                  /mês
                </p>
              </div>

              <p className="text-justify text-xs leading-5 text-gray-500">
                Para pagamentos realizados com cartão, o reembolso é iniciado
                automaticamente. O valor pode levar alguns dias úteis para
                aparecer na conta.
              </p>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    cancelandoId === beneficioCancelar.id
                  }
                  onClick={() => setBeneficioCancelar(null)}
                  className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  Manter benefício
                </button>

                <button
                  type="button"
                  disabled={
                    cancelandoId === beneficioCancelar.id
                  }
                  onClick={() =>
                    void cancelarComReembolso(beneficioCancelar)
                  }
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {cancelandoId === beneficioCancelar.id ? (
                    <>
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                      Cancelando...
                    </>
                  ) : (
                    "Cancelar e devolver"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {btgModalOpen && beneficioSelecionado && (
        <BtgPactualModal
          beneficioId={beneficioSelecionado.id}
          onClose={fecharTodosModais}
        />
      )}

      {cajuModalOpen && beneficioSelecionado && (
        <CajuBeneficiosModal
          beneficioId={beneficioSelecionado.id}
          onClose={fecharTodosModais}
        />
      )}

      {conectcarModalOpen && beneficioSelecionado && (
        <ConectCarModal
          beneficioId={beneficioSelecionado.id}
          onClose={fecharTodosModais}
        />
      )}

      {seguroVidaModalOpen && beneficioSelecionado && (
        <SeguroVidaModal
          beneficioId={beneficioSelecionado.id}
          onClose={fecharTodosModais}
        />
      )}
    </main>
  );
}