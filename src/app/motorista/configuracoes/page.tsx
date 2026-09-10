"use client";
import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import Header from "../../components/header";
import { Bell, CircleX, Monitor, Save, UserRound } from "lucide-react";

export default function ConfiguracoesPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState<
    "passageiro" | "motorista"
  >("passageiro");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
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
        if (usuario.tipo === "motorista") {
          setTipoUsuario("motorista");
        } else {
          setTipoUsuario("passageiro");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    carregarDados();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar");
    if (saved) setCollapsed(saved === "true");
    const tipo = localStorage.getItem("tipoUsuario");
    if (tipo === "motorista") {
      setTipoUsuario("motorista");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar", String(collapsed));
  }, [collapsed]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0B6F68] via-[#35A78D] to-white">
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
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1">
        <Header toggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="p-6 bg-gray-50 min-h-screen bg-gradient-to-b from-[#0B6F68] via-[#35A78D] via-40% to-[#F7FDFC]">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white">
                Configurações
              </h1>
              <p className="mt-1 text-base text-white/80">
                Gerencie sua conta e preferências.
              </p>
            </div>
            {tipoUsuario === "passageiro" && (
              <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-md">
                <div className="flex items-start gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50">
                    <UserRound className="h-7 w-7 text-[#149C8B]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="mb-6 text-3xl font-bold text-gray-900">
                      Preferências do Passageiro
                    </h2>
                    <div className="space-y-5">
                      <label className="flex cursor-pointer items-center gap-4 text-lg text-gray-700">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-gray-300 text-[#149C8B] focus:ring-[#149C8B]"
                        />
                        <span>Receber notificações de viagens</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-4 text-lg text-gray-700">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-gray-300 text-[#149C8B] focus:ring-[#149C8B]"
                        />
                        <span>Compartilhar localização em tempo real</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-4 text-lg text-gray-700">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-gray-300 text-[#149C8B] focus:ring-[#149C8B]"
                        />
                        <span>Receber promoções</span>
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Configurações Motorista */}
            {tipoUsuario === "motorista" && (
              <section className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Configurações do Motorista
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Modelo do veículo"
                    className="border rounded-lg p-3"
                  />
                  <input
                    type="text"
                    placeholder="Placa"
                    className="border rounded-lg p-3"
                  />
                  <input
                    type="text"
                    placeholder="CNH"
                    className="border rounded-lg p-3"
                  />
                </div>
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" />
                    Aceitar viagens automaticamente
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" />
                    Receber notificações de corridas
                  </label>
                </div>
              </section>
            )}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50">
                  <Bell
                    size={30}
                    className="text-[#149C8B]"
                  />
                </div>
                <div>
                  <h2 className="mb-4 text-xl font-bold text-gray-900">
                    Notificações
                  </h2>
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center gap-3 text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-[#149C8B] focus:ring-[#149C8B]"
                      />
                      <span>
                        E-mail
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-[#149C8B] focus:ring-[#149C8B]"
                      />
                      <span>
                        Push
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-[#149C8B] focus:ring-[#149C8B]"
                      />
                      <span>
                        SMS
                      </span>
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
                <button
                  className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#149C8B] px-6 py-3 font-semibold text-white transition hover:bg-[#11897D]"
                >
                  <Monitor size={18} />
                  Gerenciar Dispositivos
                </button>
              </div>
            </section>
            <div className="flex justify-end gap-4">
              <button
                className="flex cursor-pointer cursor-pointer items-center gap-2 rounded-xl bg-[#149C8B] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#11897D]"
              >
                <Save size={18} />
                Salvar Alterações
              </button>
              <button
                className="flex cursor-pointer cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <CircleX size={18} />
                Cancelar
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}