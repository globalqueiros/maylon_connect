"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Gift,
  Loader2,
  Smartphone,
  X,
} from "lucide-react";

import BtgPactualModal from "../../components/BtgPactualModalPage";
import CajuBeneficiosModal from "../../components/CajuBeneficiosModal";
import ConectCarModal from "../../components/ConectCarModal";
import SeguroVidaModal from "../../components/SeguroVidaModal";
import LomaModal from "../../components/LomaModal";
import Ademicon from "../../components/Ademicon";

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

const STATUS_ATIVOS = new Set([
  "ativo",
  "aprovado",
  "autorizado",
]);

const LOMA_GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=br.com.hinovamobile.lomaprotecao&hl=en";

const LOMA_APP_STORE_URL =
  "https://apps.apple.com/au/app/loma-prote%C3%A7%C3%A3o-veicular/id1456159026";

function ehBeneficioLoma(beneficio: Beneficio): boolean {
  const texto = `${beneficio.tipo} ${beneficio.titulo}`.toLowerCase();

  return texto.includes("loma");
}

function ehBeneficioAdemicon(beneficio: Beneficio): boolean {
  const texto = `${beneficio.tipo} ${beneficio.titulo} ${beneficio.descricao}`.toLowerCase();

  return (
    texto.includes("ademicon") ||
    texto.includes("consórcio ademicon") ||
    texto.includes("consorcio ademicon")
  );
}

function statusHabilitado(
  status: Beneficio["status"]
): boolean {
  return (
    status === true ||
    Number(status) === 1 ||
    String(status).trim().toLowerCase() === "1" ||
    String(status).trim().toLowerCase() === "true"
  );
}

function estaAtivo(beneficio: Beneficio): boolean {
  const assinatura = String(
    beneficio.status_assinatura ?? ""
  )
    .trim()
    .toLowerCase();

  return (
    statusHabilitado(beneficio.status) &&
    STATUS_ATIVOS.has(assinatura)
  );
}

function estaPendente(beneficio: Beneficio): boolean {
  return (
    String(beneficio.status_assinatura ?? "")
      .trim()
      .toLowerCase() === "pendente"
  );
}

function dedupeBeneficios(
  lista: Beneficio[]
): Beneficio[] {
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
      status_assinatura:
        item.status_assinatura ?? null,
    };

    const existente = map.get(id);

    if (!existente) {
      map.set(id, beneficio);
      continue;
    }

    if (
      estaAtivo(beneficio) &&
      !estaAtivo(existente)
    ) {
      map.set(id, beneficio);
    }
  }

  return Array.from(map.values());
}

function formatValor(
  valor?: string | number | null
): string {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "R$ 0,00";
  }

  let numero: number;

  if (typeof valor === "number") {
    numero = valor;
  } else {
    const texto = String(valor).trim();

    if (texto.includes(",")) {
      numero = Number(
        texto.replace(/\./g, "").replace(",", ".")
      );
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

async function lerResposta(
  res: Response
): Promise<any> {
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
  const [alerta, setAlerta] =
    useState<Alerta | null>(null);

  const [beneficios, setBeneficios] =
    useState<Beneficio[]>([]);

  const [loadingBeneficios, setLoadingBeneficios] =
    useState(true);

  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [carregandoUsuario, setCarregandoUsuario] =
    useState(true);

  const [btgModalOpen, setBtgModalOpen] =
    useState(false);

  const [cajuModalOpen, setCajuModalOpen] =
    useState(false);

  const [conectcarModalOpen, setConectcarModalOpen] =
    useState(false);

  const [seguroVidaModalOpen, setSeguroVidaModalOpen] =
    useState(false);

  const [lomaModalOpen, setLomaModalOpen] =
    useState(false);

  const [ademiconModalOpen, setAdemiconModalOpen] =
    useState(false);

  const [beneficioSelecionado, setBeneficioSelecionado] =
    useState<Beneficio | null>(null);

  const beneficioRef =
    useRef<Beneficio | null>(null);

  const [cancelandoId, setCancelandoId] =
    useState<number | null>(null);

  const [ativandoId, setAtivandoId] =
    useState<number | null>(null);

  const [imagensComErro, setImagensComErro] =
    useState<Set<number>>(new Set());

  const [beneficioCancelar, setBeneficioCancelar] =
    useState<Beneficio | null>(null);

  const carregarBeneficios = useCallback(
    async () => {
      if (!usuario?.id) {
        setLoadingBeneficios(false);
        return;
      }

      setLoadingBeneficios(true);

      try {
        const res = await fetch(
          "/api/beneficios/motorista",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            cache: "no-store",
            body: JSON.stringify({
              usuario_id: usuario.id,
            }),
          }
        );

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

        setBeneficios(
          dedupeBeneficios(
            Array.isArray(lista) ? lista : []
          )
        );
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
    },
    [usuario?.id]
  );

  useEffect(() => {
    if (!usuario?.id) {
      return;
    }

    void carregarBeneficios();
  }, [usuario?.id, carregarBeneficios]);

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
          throw new Error(
            "ID do usuário não encontrado."
          );
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

  const ehLojaMaylon = (
    beneficio: Beneficio
  ): boolean => {
    const texto =
      `${beneficio.tipo} ${beneficio.titulo} ${beneficio.descricao}`.toLowerCase();

    return (
      texto.includes("loja da maylon") ||
      texto.includes("loja maylon") ||
      (texto.includes("loja") &&
        texto.includes("maylon")) ||
      texto.includes("maylon acessórios") ||
      texto.includes("maylon acessorios") ||
      texto.includes("acessórios maylon") ||
      texto.includes("acessorios maylon")
    );
  };

  const ativarBeneficioDireto = async (
    beneficio: Beneficio
  ) => {
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
      const res = await fetch(
        "/api/beneficios/ativar",
        {
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
        }
      );

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

  const abrirModal = (
    beneficio: Beneficio
  ) => {
    const normalized: Beneficio = {
      ...beneficio,
      id: Number(beneficio.id),
      tipo: String(beneficio.tipo ?? ""),
      valor: String(beneficio.valor ?? ""),
      titulo: String(beneficio.titulo ?? ""),
      descricao: String(
        beneficio.descricao ?? ""
      ),
      imagem: String(beneficio.imagem ?? ""),
    };

    beneficioRef.current = normalized;
    setBeneficioSelecionado(normalized);

    setBtgModalOpen(false);
    setCajuModalOpen(false);
    setConectcarModalOpen(false);
    setSeguroVidaModalOpen(false);
    setLomaModalOpen(false);
    setAdemiconModalOpen(false);

    const tipo =
      `${normalized.tipo} ${normalized.titulo} ${normalized.descricao}`.toLowerCase();

    if (
      tipo.includes("ademicon") ||
      tipo.includes("consórcio ademicon") ||
      tipo.includes("consorcio ademicon")
    ) {
      setAdemiconModalOpen(true);
      return;
    }

    if (
      tipo.includes("btg") ||
      tipo.includes("previd")
    ) {
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

    if (tipo.includes("loma")) {
      setLomaModalOpen(true);
      return;
    }

    setBtgModalOpen(true);
  };

  const fecharTodosModais = () => {
    setBtgModalOpen(false);
    setCajuModalOpen(false);
    setConectcarModalOpen(false);
    setSeguroVidaModalOpen(false);
    setLomaModalOpen(false);
    setAdemiconModalOpen(false);

    beneficioRef.current = null;
    setBeneficioSelecionado(null);

    void carregarBeneficios();
  };

  const cancelarComReembolso = async (
    beneficio: Beneficio
  ) => {
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
      const res = await fetch(
        "/api/beneficios/cancelar",
        {
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
        }
      );

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

  const ativos = beneficios.filter((b) =>
    estaAtivo(b)
  );

  const disponiveis = beneficios.filter(
    (b) => !estaAtivo(b)
  );

  const carregando =
    loadingBeneficios || carregandoUsuario;

  return (
    <main className="min-h-screen min-w-0">
      <div className="mx-auto w-full min-w-0 max-w-8xl">
        {alerta && (
          <div
            className={`mb-4 flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-medium shadow-sm sm:mb-5 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm ${
              alerta.tipo === "success"
                ? "border-teal-200 bg-teal-50 text-teal-700"
                : alerta.tipo === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {alerta.tipo === "success" ? (
              <CheckCircle2 size={18} className="shrink-0" />
            ) : (
              <AlertTriangle size={18} className="shrink-0" />
            )}

            <span>{alerta.mensagem}</span>

            <button
              type="button"
              onClick={() => setAlerta(null)}
              className="ml-auto shrink-0 cursor-pointer rounded-lg p-1 transition hover:bg-black/5"
              aria-label="Fechar alerta"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="relative my-3 mt-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-teal-700 via-teal-600 to-teal-500 px-4 py-5 shadow-2xl shadow-teal-950/30 sm:rounded-[24px] sm:px-6 sm:py-6 lg:rounded-[30px] lg:px-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:-right-20 sm:-top-24 sm:h-64 sm:w-64" />

          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-teal-200/10 blur-3xl sm:-bottom-28 sm:h-72 sm:w-72" />

          <div className="relative z-10 flex items-center gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg shadow-[#0f766e]/15 sm:h-14 sm:w-14 sm:rounded-2xl">
              <Gift
                size={22}
                strokeWidth={2}
                className="text-white sm:hidden"
              />
              <Gift
                size={28}
                strokeWidth={2}
                className="hidden text-white sm:block"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
                Benefícios
              </h1>

              <p className="mt-0 text-xs text-white/70 sm:text-sm">
                Gerencie seus benefícios e aproveite
                vantagens exclusivas.
              </p>
            </div>
          </div>
        </div>

        <section className="mb-5 overflow-hidden rounded-2xl border border-white/70 bg-white shadow-xl shadow-teal-950/10 sm:mb-6 sm:rounded-[28px]">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 sm:h-10 sm:w-10">
                <CheckCircle2
                  size={19}
                  className="text-teal-600"
                />
              </div>

              <div>
                <h2 className="text-base font-bold text-teal-700 sm:text-lg">
                  Benefícios Ativos
                </h2>

                <p className="text-[11px] text-slate-500 sm:text-xs">
                  Serviços atualmente contratados.
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full bg-teal-50 px-3 py-1.5 text-[11px] font-bold text-teal-600 sm:text-xs">
              {ativos.length} ativo(s)
            </span>
          </div>

          <div className="p-4 sm:p-5 lg:p-6">
            {carregando ? (
              <div className="flex min-h-[140px] items-center justify-center sm:min-h-[160px]">
                <div className="flex flex-col items-center">
                  <Loader2
                    size={26}
                    className="animate-spin text-teal-600 sm:hidden"
                  />
                  <Loader2
                    size={28}
                    className="hidden animate-spin text-teal-600 sm:block"
                  />

                  <p className="mt-3 text-[11px] font-medium text-gray-500 sm:text-xs">
                    Carregando benefícios...
                  </p>
                </div>
              </div>
            ) : ativos.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3.5 sm:gap-4 sm:rounded-2xl sm:px-5 sm:py-4">
                <AlertTriangle
                  size={20}
                  className="shrink-0 text-red-500"
                />

                <div>
                  <p className="text-xs font-semibold text-red-700 sm:text-sm">
                    Nenhum benefício ativo
                  </p>

                  <p className="mt-0.5 text-[11px] text-red-500 sm:text-xs">
                    Escolha um dos benefícios
                    disponíveis abaixo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 xl:grid-cols-3 2xl:grid-cols-4">
                {ativos.map((b) => (
                  <div
                    key={b.id}
                    className="group min-w-0 rounded-2xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/40 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-900/10 sm:rounded-[22px] sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 sm:h-10 sm:w-10">
                          <CheckCircle2
                            size={18}
                            className="text-teal-600"
                          />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-gray-900">
                            {b.titulo}
                          </h3>

                          <p className="mt-0.5 text-[11px] capitalize text-gray-500 sm:text-xs">
                            {b.status_assinatura ??
                              "ativo"}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full bg-teal-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-teal-700 sm:px-2.5 sm:text-[10px]">
                        Ativo
                      </span>
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-3.5 sm:mt-5 sm:pt-4">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 sm:text-[10px]">
                        Mensalidade
                      </p>

                      <p className="mt-1 text-base font-extrabold text-teal-600 sm:text-lg">
                        {formatValor(b.valor)}

                        <span className="ml-1 text-[9px] font-medium text-gray-400 sm:text-[10px]">
                          /mês
                        </span>
                      </p>
                    </div>

                    {ehBeneficioLoma(b) && (
                      <div className="mt-3.5 rounded-xl border border-teal-100 bg-white px-3 py-3 sm:mt-4">
                        <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide text-gray-400 sm:text-[10px]">
                          <Smartphone size={12} />
                          Baixe o app
                        </p>

                        <div className="mt-2 flex flex-col gap-2 min-[380px]:flex-row">
                          <a
                            href={LOMA_GOOGLE_PLAY_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 rounded-lg border border-gray-200 px-2 py-2 text-center text-[10px] font-semibold text-gray-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 sm:text-[11px]"
                          >
                            Google Play
                          </a>

                          <a
                            href={LOMA_APP_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 rounded-lg border border-gray-200 px-2 py-2 text-center text-[10px] font-semibold text-gray-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 sm:text-[11px]"
                          >
                            App Store
                          </a>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={
                        cancelandoId === b.id
                      }
                      onClick={() =>
                        setBeneficioCancelar(b)
                      }
                      className="mt-3.5 w-full cursor-pointer rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-4 sm:py-2.5 sm:text-xs"
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

        <section className="overflow-hidden rounded-2xl border border-white/70 bg-white shadow-xl shadow-teal-950/10 sm:rounded-[28px]">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 sm:h-10 sm:w-10">
                <Gift
                  size={19}
                  className="text-teal-600"
                />
              </div>

              <div>
                <h2 className="text-base font-bold text-teal-700 sm:text-lg">
                  Benefícios Disponíveis
                </h2>

                <p className="text-[11px] text-slate-500 sm:text-xs">
                  Escolha uma vantagem para ativar.
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full bg-teal-50 px-3 py-1.5 text-[11px] font-bold text-teal-600 sm:text-xs">
              {disponiveis.length} disponível(is)
            </span>
          </div>

          <div className="p-4 sm:p-5 lg:p-6">
            {carregando ? (
              <div className="flex min-h-[180px] items-center justify-center sm:min-h-[200px]">
                <div className="flex flex-col items-center">
                  <Loader2
                    size={26}
                    className="animate-spin text-teal-600 sm:hidden"
                  />
                  <Loader2
                    size={28}
                    className="hidden animate-spin text-teal-600 sm:block"
                  />

                  <p className="mt-3 text-[11px] font-medium text-gray-500 sm:text-xs">
                    Carregando benefícios...
                  </p>
                </div>
              </div>
            ) : disponiveis.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-6 text-center sm:rounded-2xl sm:px-5 sm:py-8">
                <Gift
                  size={26}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-xs font-semibold text-slate-600 sm:text-sm">
                  Nenhum benefício disponível
                </p>

                <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                  Novos benefícios aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
                {disponiveis.map((b) => {
                  const lojaMaylon =
                    ehLojaMaylon(b);

                  const ativando =
                    ativandoId === b.id;

                  const pendente =
                    estaPendente(b);

                  const semImagem =
                    !b.imagem ||
                    imagensComErro.has(b.id);

                  return (
                    <article
                      key={b.id}
                      className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-600/30 hover:shadow-xl"
                    >
                      <div className="relative h-40 overflow-hidden sm:h-44 lg:h-48">
                        {semImagem ? (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500">
                            <Image
                              src="/logo.png"
                              alt={b.titulo}
                              width={120}
                              height={40}
                              className="h-auto w-24 opacity-90 sm:w-[120px]"
                            />
                          </div>
                        ) : (
                          <Image
                            src={b.imagem}
                            alt={b.titulo}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, (max-width: 1536px) 25vw, 20vw"
                            className="object-cover transition duration-500 group-hover:scale-105"
                            onError={() => {
                              setImagensComErro(
                                (anterior) => {
                                  const proximo =
                                    new Set(
                                      anterior
                                    );

                                  proximo.add(b.id);

                                  return proximo;
                                }
                              );
                            }}
                          />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-teal-600 shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:text-[10px]">
                          Benefício Exclusivo
                        </span>

                        <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-5 sm:right-5">
                          <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white sm:text-base">
                            {b.titulo}
                          </h3>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5">
                        <p className="line-clamp-3 min-h-[55px] text-justify text-xs leading-5 text-gray-500 sm:min-h-[60px]">
                          {b.descricao}
                        </p>

                        <div className="mt-4 flex items-end justify-between gap-4 border-t border-gray-100 pt-3.5 sm:mt-5 sm:pt-4">
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 sm:text-[10px]">
                              Valor mensal
                            </p>

                            <p className="mt-1 text-lg font-extrabold text-teal-600 sm:text-xl">
                              {formatValor(b.valor)}
                            </p>
                          </div>

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 sm:h-9 sm:w-9">
                            <Gift
                              size={16}
                              className="text-teal-600"
                            />
                          </div>
                        </div>

                        {pendente ? (
                          <div className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-2 text-[11px] font-bold text-amber-700 sm:mt-4 sm:py-2.5 sm:text-xs">
                            <Loader2
                              size={15}
                              className="animate-spin"
                            />
                            Solicitação em análise
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={ativando}
                            onClick={() => {
                              if (lojaMaylon) {
                                void ativarBeneficioDireto(
                                  b
                                );
                                return;
                              }

                              abrirModal(b);
                            }}
                            className="mt-3.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-teal-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-teal-400 sm:mt-4 sm:py-2.5 sm:text-xs"
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
                                <ChevronRight
                                  size={16}
                                />
                              </>
                            )}
                          </button>
                        )}
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
              event.target ===
                event.currentTarget &&
              cancelandoId === null
            ) {
              setBeneficioCancelar(null);
            }
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancelar-beneficio-title"
          >
            <div className="bg-gradient-to-br from-teal-800 via-teal-700 to-teal-500 px-5 py-4 text-white sm:px-6 sm:py-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 sm:h-11 sm:w-11">
                  <AlertTriangle size={20} className="sm:hidden" />
                  <AlertTriangle size={22} className="hidden sm:block" />
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
                className="mt-3.5 text-lg font-bold sm:mt-4 sm:text-xl"
              >
                Cancelar benefício?
              </h3>

              <p className="mt-1 text-xs text-white/80 sm:text-sm">
                Esta ação encerra o serviço e
                solicita a devolução do valor.
              </p>
            </div>

            <div className="space-y-3.5 px-5 py-4 sm:space-y-4 sm:px-6 sm:py-5">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 sm:rounded-2xl">
                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400 sm:text-[10px]">
                  Plano
                </p>

                <p className="mt-1 text-sm font-bold text-gray-900">
                  {beneficioCancelar.titulo}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {formatValor(
                    beneficioCancelar.valor
                  )}
                  /mês
                </p>
              </div>

              <p className="text-justify text-xs leading-5 text-gray-500">
                Para pagamentos realizados com
                cartão, o reembolso é iniciado
                automaticamente. O valor pode levar
                alguns dias úteis para aparecer na
                conta.
              </p>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    cancelandoId ===
                    beneficioCancelar.id
                  }
                  onClick={() =>
                    setBeneficioCancelar(null)
                  }
                  className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  Manter benefício
                </button>

                <button
                  type="button"
                  disabled={
                    cancelandoId ===
                    beneficioCancelar.id
                  }
                  onClick={() =>
                    void cancelarComReembolso(
                      beneficioCancelar
                    )
                  }
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {cancelandoId ===
                  beneficioCancelar.id ? (
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

      {btgModalOpen &&
        beneficioSelecionado && (
          <BtgPactualModal
            beneficioId={
              beneficioSelecionado.id
            }
            onClose={fecharTodosModais}
          />
        )}

      {cajuModalOpen &&
        beneficioSelecionado && (
          <CajuBeneficiosModal
            beneficioId={
              beneficioSelecionado.id
            }
            onClose={fecharTodosModais}
          />
        )}

      {conectcarModalOpen &&
        beneficioSelecionado && (
          <ConectCarModal
            beneficioId={
              beneficioSelecionado.id
            }
            onClose={fecharTodosModais}
          />
        )}

      {seguroVidaModalOpen &&
        beneficioSelecionado && (
          <SeguroVidaModal
            beneficioId={
              beneficioSelecionado.id
            }
            onClose={fecharTodosModais}
          />
        )}

      {lomaModalOpen &&
        beneficioSelecionado && (
          <LomaModal
            beneficioId={
              beneficioSelecionado.id
            }
            onClose={fecharTodosModais}
          />
        )}

      {ademiconModalOpen &&
        beneficioSelecionado && (
          <Ademicon
            beneficioId={
              beneficioSelecionado.id
            }
            onClose={fecharTodosModais}
          />
        )}
    </main>
  );
}