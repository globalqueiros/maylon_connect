"use client";
import { useState, useEffect } from "react";
import { Bell, CircleX, Monitor, Save, UserRound } from "lucide-react";

export default function ConfiguracoesPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState<
    "passageiro" | "motorista"
  >("passageiro");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [preferencias, setPreferencias] = useState({
    email: false,
    push: false,
    sms: false,
    notificacoes_viagens: false,
    compartilhar_localizacao: false,
    receber_promocoes: false,
  });

  const handleChange = (
    campo: keyof typeof preferencias
  ) => {
    setPreferencias((prev) => ({
      ...prev,
      [campo]: !prev[campo],
    }));
  };

  useEffect(() => {
    async function carregarDados() {
      try {
        const saved = localStorage.getItem("sidebar");
        if (saved) {
          setCollapsed(saved === "true");
        }
        const res = await fetch("/api/me", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Erro ao buscar usuário");
        }
        const usuario = await res.json();
        setUsuarioId(usuario.id);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "sidebar",
      String(collapsed)
    );
  }, [collapsed]);

  const salvarPreferencias = async () => {

    if (!usuarioId) {
      alert("Usuário não encontrado");
      return;
    }

    setSalvando(true);

    try {

      const response = await fetch("/api/notificacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          usuarioId,
          ...preferencias,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Configurações salvas!");
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao salvar");
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
      <div className="flex flex-col flex-1">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-white leading-none">
              Configurações
            </h1>
            <p className="text-teal-100 text-sm mt-1">
              Gerencie sua conta e preferências.
            </p>
          </div>
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
                      className="h-5 w-5 rounded border-gray-300 text-[#149C8B] cursor-pointer focus:ring-[#149C8B]"
                    />
                    <span>Receber notificações de viagens</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-4 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={preferencias.compartilhar_localizacao}
                      onChange={() => handleChange("compartilhar_localizacao")}
                      className="h-5 w-5 rounded border-gray-300 text-[#149C8B] cursor-pointer focus:ring-[#149C8B]"
                    />
                    <span>Compartilhar localização em tempo real</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-4 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={preferencias.receber_promocoes}
                      onChange={() => handleChange("receber_promocoes")}
                      className="h-5 w-5 rounded border-gray-300 text-[#149C8B] cursor-pointer focus:ring-[#149C8B]"
                    />
                    <span>Receber promoções</span>
                  </label>
                </div>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50">
                <Bell
                  size={30}
                  className="text-[#149C8B]"
                />
              </div>
              <div>
                <h2 className="mb-4 text-2xl font-bold text-black">
                  Notificações
                </h2>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-3 text-gray-700">
                    <input
                      type="checkbox"
                      checked={preferencias.email}
                      onChange={() => handleChange("email")}
                      className="h-4 w-4 rounded border-gray-300 cursor-pointer text-[#149C8B]"
                    />

                    <span className="text-sm">E-mail</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 text-gray-700">
                    <input
                      type="checkbox"
                      checked={preferencias.push}
                      onChange={() => handleChange("push")}
                      className="h-4 w-4 rounded border-gray-300 cursor-pointer text-[#149C8B]"
                    />
                    <span className="text-sm">Push</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 text-gray-700">
                    <input
                      type="checkbox"
                      checked={preferencias.sms}
                      onChange={() => handleChange("sms")}
                      className="h-4 w-4 rounded border-gray-300 cursor-pointer text-[#149C8B]"
                    />
                    <span className="text-sm">SMS</span>
                  </label>
                </div>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50">
                  <Monitor
                    size={30}
                    className="text-[#149C8B]"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Dispositivos Acessados
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Visualize e gerencie os dispositivos onde sua conta está conectada.
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
              onClick={salvarPreferencias}
              disabled={salvando}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#149C8B] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save size={18} />
              {salvando ? "Salvando..." : "Salvar Alterações"}
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex cursor-pointer items-center gap-2 rounded-xl text-sm border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <CircleX size={18} />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
