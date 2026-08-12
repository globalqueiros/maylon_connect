"use client";

import { useEffect, useState } from "react";
import { Bell, CircleX, Monitor, Save, UserRound } from "lucide-react";

type Preferencias = {
  email: boolean;
  push: boolean;
  sms: boolean;
  notificacoes_viagens: boolean;
  compartilhar_localizacao: boolean;
  receber_promocoes: boolean;
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
  const [mensagem, setMensagem] = useState<{
    tipo: "success" | "error";
    texto: string;
  } | null>(null);

  const handleChange = (campo: keyof Preferencias) => {
    setPreferencias((prev) => ({
      ...prev,
      [campo]: !prev[campo],
    }));
  };

  useEffect(() => {
    async function carregarDados() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("Erro ao buscar usuário");
        }
        const usuario = await res.json();
        const id = Number(usuario.id);
        setUsuarioId(id);

        const prefsRes = await fetch(`/api/notificacoes?usuario_id=${id}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (prefsRes.ok) {
          const prefsData = await prefsRes.json();
          if (prefsData?.preferencias) {
            setPreferencias({
              ...defaultPreferencias,
              ...prefsData.preferencias,
            });
          }
        }
      } catch (error) {
        console.error(error);
        setMensagem({
          tipo: "error",
          texto: "Não foi possível carregar suas configurações.",
        });
      } finally {
        setLoading(false);
      }
    }
    void carregarDados();
  }, []);

  const salvarPreferencias = async () => {
    if (!usuarioId) {
      setMensagem({ tipo: "error", texto: "Usuário não encontrado" });
      return;
    }

    setSalvando(true);
    setMensagem(null);

    try {
      const response = await fetch("/api/notificacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          usuarioId,
          ...preferencias,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Erro ao salvar");
      }

      if (data.preferencias) {
        setPreferencias({
          ...defaultPreferencias,
          ...data.preferencias,
        });
      }

      setMensagem({
        tipo: "success",
        texto: data.message || "Configurações salvas!",
      });
    } catch (error: any) {
      console.error(error);
      setMensagem({
        tipo: "error",
        texto: error?.message || "Erro ao salvar",
      });
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#35A78D] border-t-transparent" />
          <p className="mt-4 text-center font-medium text-gray-600">
            Carregando informações...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen p-6">
      <div className="mx-auto w-full max-w-7xl flex-1 space-y-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold leading-none text-white">
            Configurações
          </h1>
          <p className="mt-1 text-sm text-teal-100">
            Gerencie sua conta e preferências de passageiro.
          </p>
        </div>

        {mensagem && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              mensagem.tipo === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {mensagem.texto}
          </div>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-md">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50">
              <UserRound className="h-7 w-7 text-[#149C8B]" />
            </div>
            <div className="flex-1">
              <h2 className="mb-4 text-2xl font-bold text-black">
                Preferências do Passageiro
              </h2>
              <div className="space-y-4">
                <label className="flex cursor-pointer items-center gap-4 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={preferencias.notificacoes_viagens}
                    onChange={() => handleChange("notificacoes_viagens")}
                    className="h-5 w-5 cursor-pointer rounded border-gray-300 text-[#149C8B] focus:ring-[#149C8B]"
                  />
                  <span>Receber notificações das minhas viagens</span>
                </label>
                <label className="flex cursor-pointer items-center gap-4 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={preferencias.compartilhar_localizacao}
                    onChange={() => handleChange("compartilhar_localizacao")}
                    className="h-5 w-5 cursor-pointer rounded border-gray-300 text-[#149C8B] focus:ring-[#149C8B]"
                  />
                  <span>
                    Compartilhar minha localização durante a viagem
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-4 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={preferencias.receber_promocoes}
                    onChange={() => handleChange("receber_promocoes")}
                    className="h-5 w-5 cursor-pointer rounded border-gray-300 text-[#149C8B] focus:ring-[#149C8B]"
                  />
                  <span>Receber promoções e benefícios</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50">
              <Bell size={30} className="text-[#149C8B]" />
            </div>
            <div>
              <h2 className="mb-4 text-2xl font-bold text-black">
                Canais de notificação
              </h2>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 text-gray-700">
                  <input
                    type="checkbox"
                    checked={preferencias.email}
                    onChange={() => handleChange("email")}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#149C8B]"
                  />
                  <span className="text-sm">E-mail</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 text-gray-700">
                  <input
                    type="checkbox"
                    checked={preferencias.push}
                    onChange={() => handleChange("push")}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#149C8B]"
                  />
                  <span className="text-sm">Push</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 text-gray-700">
                  <input
                    type="checkbox"
                    checked={preferencias.sms}
                    onChange={() => handleChange("sms")}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#149C8B]"
                  />
                  <span className="text-sm">SMS</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50">
                <Monitor size={30} className="text-[#149C8B]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Dispositivos acessados
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Veja e gerencie onde sua conta de passageiro está conectada.
                </p>
              </div>
            </div>
            <a
              href="/passageiro/sessoes"
              className="inline-flex items-center gap-2 rounded-xl bg-[#149C8B] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#11897D] hover:shadow-lg"
            >
              <Monitor size={18} />
              <span>Gerenciar dispositivos</span>
            </a>
          </div>
        </section>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => void salvarPreferencias()}
            disabled={salvando}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#149C8B] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Save size={18} />
            {salvando ? "Salvando..." : "Salvar Alterações"}
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/passageiro";
            }}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <CircleX size={18} />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
