"use client";

import { useEffect, useState } from "react";
import { Bell, CircleX, Monitor, Save, UserRound, Check } from "lucide-react";

type Preferencias = {
  email: boolean;
  push: boolean;
  sms: boolean;
  notificacoes_viagens: boolean;
  compartilhar_localizacao: boolean;
  receber_promocoes: boolean;
};

type Mensagem = {
  tipo: "success" | "error";
  texto: string;
};

const defaultPreferencias: Preferencias = {
  email: false,
  push: false,
  sms: false,
  notificacoes_viagens: false,
  compartilhar_localizacao: false,
  receber_promocoes: false,
};

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [preferencias, setPreferencias] =
    useState<Preferencias>(defaultPreferencias);
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);

  const handleChange = (campo: keyof Preferencias) => {
    setPreferencias((prev) => ({
      ...prev,
      [campo]: !prev[campo],
    }));
  };

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          window.location.href = "/";
          return;
        }

        const usuario = await res.json();
        const id = Number(usuario?.id);

        if (!id) {
          window.location.href = "/";
          return;
        }

        if (!ativo) return;

        setUsuarioId(id);

        const prefsRes = await fetch(`/api/notificacoes?usuario_id=${id}`, {
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        if (!prefsRes.ok) return;

        const prefsData = await prefsRes.json();

        if (prefsData?.preferencias && ativo) {
          setPreferencias({
            ...defaultPreferencias,
            ...prefsData.preferencias,
          });
        }
      } catch (error) {
        console.error(error);

        if (ativo) {
          setMensagem({
            tipo: "error",
            texto: "Não foi possível carregar suas configurações.",
          });
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    void carregarDados();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!mensagem) return;

    const timer = window.setTimeout(() => {
      setMensagem(null);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [mensagem]);

  const salvarPreferencias = async () => {
    if (!usuarioId) {
      setMensagem({
        tipo: "error",
        texto: "Usuário não encontrado.",
      });
      return;
    }

    setSalvando(true);
    setMensagem(null);

    try {
      const response = await fetch("/api/notificacoes", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          usuarioId,
          ...preferencias,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Erro ao salvar as configurações."
        );
      }

      if (data?.preferencias) {
        setPreferencias({
          ...defaultPreferencias,
          ...data.preferencias,
        });
      }

      setMensagem({
        tipo: "success",
        texto: data?.message || "Configurações salvas com sucesso!",
      });
    } catch (error) {
      console.error(error);

      setMensagem({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "Erro ao salvar as configurações.",
      });
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-3xl border border-gray-100 bg-white px-10 py-9 shadow-lg">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#149C8B] border-t-transparent" />
          <p className="mt-4 text-center text-sm font-medium text-gray-600">
            Carregando configurações...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-8xl space-y-6">
        <header className="relative overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/[0.04]">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#149C8B]/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-[#35A78D]/10 blur-2xl" />

          <div className="relative flex flex-col justify-between gap-5 px-6 py-7 sm:px-8 sm:py-8 lg:flex-row lg:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Configurações
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
                Personalize suas preferências e escolha como deseja receber
                informações da Maylon.
              </p>
            </div>

            <div className="hidden h-16 w-16 items-center justify-center rounded-2xl bg-[#149C8B]/10 lg:flex">
              <UserRound className="h-8 w-8 text-[#149C8B]" />
            </div>
          </div>
        </header>

        {mensagem && (
          <div
            className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm ${
              mensagem.tipo === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {mensagem.tipo === "success" ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-4 w-4" />
              </div>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                <CircleX className="h-4 w-4" />
              </div>
            )}
            {mensagem.texto}
          </div>
        )}

        <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#149C8B]/10">
                <UserRound className="h-6 w-6 text-[#149C8B]" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Preferências do Passageiro
                </h2>
                <p className="mt-0 text-sm text-gray-500">
                  Controle os recursos e permissões da sua experiência.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label
                className={`group flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-5 transition ${
                  preferencias.notificacoes_viagens
                    ? "border-[#149C8B]/30 bg-[#149C8B]/5"
                    : "border-gray-100 bg-gray-50 hover:border-[#149C8B]/20 hover:bg-[#149C8B]/5"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Notificações de viagens
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Receba atualizações sobre suas viagens.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={preferencias.notificacoes_viagens}
                  onChange={() => handleChange("notificacoes_viagens")}
                  className="h-5 w-5 cursor-pointer rounded border-gray-300 text-[#149C8B] focus:ring-[#149C8B]"
                />
              </label>

              <label
                className={`group flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-5 transition ${
                  preferencias.compartilhar_localizacao
                    ? "border-[#149C8B]/30 bg-[#149C8B]/5"
                    : "border-gray-100 bg-gray-50 hover:border-[#149C8B]/20 hover:bg-[#149C8B]/5"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Compartilhar localização
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Permita o compartilhamento durante a viagem.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={preferencias.compartilhar_localizacao}
                  onChange={() => handleChange("compartilhar_localizacao")}
                  className="h-5 w-5 cursor-pointer rounded border-gray-300 text-[#149C8B] focus:ring-[#149C8B]"
                />
              </label>

              <label
                className={`group flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-5 transition md:col-span-2 ${
                  preferencias.receber_promocoes
                    ? "border-[#149C8B]/30 bg-[#149C8B]/5"
                    : "border-gray-100 bg-gray-50 hover:border-[#149C8B]/20 hover:bg-[#149C8B]/5"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Promoções e benefícios
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Receba novidades, ofertas e benefícios exclusivos Maylon.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={preferencias.receber_promocoes}
                  onChange={() => handleChange("receber_promocoes")}
                  className="h-5 w-5 cursor-pointer rounded border-gray-300 text-[#149C8B] focus:ring-[#149C8B]"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#149C8B]/10">
                <Bell className="h-6 w-6 text-[#149C8B]" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Canais de notificação
                </h2>
                <p className="mt-0 text-sm text-gray-500">
                  Escolha onde deseja receber as comunicações.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  campo: "email" as const,
                  titulo: "E-mail",
                  descricao: "Comunicações por e-mail.",
                },
                {
                  campo: "push" as const,
                  titulo: "Push",
                  descricao: "Alertas diretamente no dispositivo.",
                },
                {
                  campo: "sms" as const,
                  titulo: "SMS",
                  descricao: "Mensagens importantes por SMS.",
                },
              ].map((item) => (
                <label
                  key={item.campo}
                  className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-5 transition ${
                    preferencias[item.campo]
                      ? "border-[#149C8B]/30 bg-[#149C8B]/5"
                      : "border-gray-100 bg-gray-50 hover:border-[#149C8B]/20 hover:bg-[#149C8B]/5"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {item.titulo}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.descricao}
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={preferencias[item.campo]}
                    onChange={() => handleChange(item.campo)}
                    className="h-5 w-5 cursor-pointer rounded border-gray-300 text-[#149C8B] focus:ring-[#149C8B]"
                  />
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#149C8B]/10">
                <Monitor className="h-6 w-6 text-[#149C8B]" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Dispositivos acessados
                </h2>
                <p className="mt-0 max-w-2xl text-sm leading-6 text-gray-500">
                  Veja onde sua conta está conectada e gerencie suas sessões.
                </p>
              </div>
            </div>

            <a
              href="/passageiro/sessoes"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#149C8B]/20 bg-[#149C8B]/10 px-6 py-3 text-sm font-bold text-[#11897D] transition hover:bg-[#149C8B] hover:text-white lg:w-auto"
            >
              <Monitor size={18} />
              Gerenciar dispositivos
            </a>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/passageiro";
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-sm font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
          >
            <CircleX size={18} />
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => void salvarPreferencias()}
            disabled={salvando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#149C8B] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#149C8B]/20 transition hover:bg-[#11897D] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={18} />
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}