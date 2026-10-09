"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CircleX,
  Monitor,
  Save,
  UserRound,
  Check,
  Mail,
  Smartphone,
  MessageSquare,
  MapPin,
  Gift,
  Navigation,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

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
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [preferencias, setPreferencias] =
    useState<Preferencias>(defaultPreferencias);
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);
  const [modalLocalizacao, setModalLocalizacao] = useState(false);
  const [solicitandoLocalizacao, setSolicitandoLocalizacao] = useState(false);

  const handleChange = (campo: keyof Preferencias) => {
    setPreferencias((prev) => ({
      ...prev,
      [campo]: !prev[campo],
    }));
  };

  const handleLocalizacaoChange = () => {
    if (preferencias.compartilhar_localizacao) {
      setPreferencias((prev) => ({
        ...prev,
        compartilhar_localizacao: false,
      }));

      setMensagem({
        tipo: "success",
        texto: "Compartilhamento de localização desativado.",
      });

      return;
    }

    setModalLocalizacao(true);
  };

  const permitirLocalizacao = () => {
    if (!navigator.geolocation) {
      setModalLocalizacao(false);
      setMensagem({
        tipo: "error",
        texto: "Seu navegador não suporta localização.",
      });
      return;
    }

    setSolicitandoLocalizacao(true);

    navigator.geolocation.getCurrentPosition(
      () => {
        setPreferencias((prev) => ({
          ...prev,
          compartilhar_localizacao: true,
        }));

        setSolicitandoLocalizacao(false);
        setModalLocalizacao(false);

        setMensagem({
          tipo: "success",
          texto:
            "Localização autorizada. Clique em salvar para confirmar.",
        });
      },
      (error) => {
        setSolicitandoLocalizacao(false);
        setModalLocalizacao(false);

        let texto = "Não foi possível obter sua localização.";

        if (error.code === error.PERMISSION_DENIED) {
          texto =
            "A permissão de localização foi negada. Você pode permitir o acesso nas configurações do navegador.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          texto = "Sua localização não está disponível no momento.";
        } else if (error.code === error.TIMEOUT) {
          texto =
            "A solicitação de localização demorou demais. Tente novamente.";
        }

        setMensagem({
          tipo: "error",
          texto,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      try {
        setLoading(true);

        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const usuario = await res.json().catch(() => null);

        if (!res.ok) {
          if (ativo) {
            setMensagem({
              tipo: "error",
              texto: "Sua sessão expirou. Faça login novamente.",
            });
          }

          setLoading(false);
          return;
        }

        const id = String(
          usuario?.id ||
            usuario?.user?.id ||
            usuario?.usuario?.id ||
            ""
        ).trim();

        if (!id) {
          if (ativo) {
            setMensagem({
              tipo: "error",
              texto:
                "Não foi possível identificar o usuário logado.",
            });
          }

          setLoading(false);
          return;
        }

        if (!ativo) return;

        setUsuarioId(id);

        const prefsRes = await fetch(
          `/api/notificacoes?usuario_id=${encodeURIComponent(id)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (prefsRes.ok) {
          const prefsData = await prefsRes.json().catch(() => null);

          if (prefsData?.preferencias && ativo) {
            setPreferencias({
              ...defaultPreferencias,
              ...prefsData.preferencias,
            });
          }
        }
      } catch {
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
    }, 5000);

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
          data?.message ||
            data?.error ||
            "Erro ao salvar as configurações."
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
        texto:
          data?.message || "Configurações salvas com sucesso!",
      });
    } catch (error) {
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

  const totalAtivas = Object.values(preferencias).filter(Boolean).length;

  const preferenciasConta = [
    {
      campo: "notificacoes_viagens" as const,
      titulo: "Notificações de viagens",
      descricao: "Receba atualizações sobre suas viagens.",
      icon: Navigation,
    },
    {
      campo: "compartilhar_localizacao" as const,
      titulo: "Compartilhar localização",
      descricao: "Permita o compartilhamento durante a viagem.",
      icon: MapPin,
    },
    {
      campo: "receber_promocoes" as const,
      titulo: "Promoções e benefícios",
      descricao: "Receba ofertas e benefícios exclusivos Maylon.",
      icon: Gift,
    },
  ];

  const canais = [
    {
      campo: "email" as const,
      titulo: "E-mail",
      descricao: "Comunicações e atualizações importantes.",
      icon: Mail,
    },
    {
      campo: "push" as const,
      titulo: "Notificações Push",
      descricao: "Alertas diretamente no seu dispositivo.",
      icon: Smartphone,
    },
    {
      campo: "sms" as const,
      titulo: "SMS",
      descricao: "Mensagens importantes por SMS.",
      icon: MessageSquare,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex w-full max-w-[280px] flex-col items-center rounded-[24px] bg-white p-8 shadow-xl ring-1 ring-black/5 sm:max-w-[320px] sm:rounded-[28px] sm:p-10 2xl:max-w-[380px]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f7f4] sm:h-16 sm:w-16">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#149C8B] border-t-transparent sm:h-8 sm:w-8" />
          </div>
          <p className="mt-5 text-sm font-semibold text-gray-700 2xl:text-base">
            Carregando suas configurações
          </p>
          <p className="mt-1 text-xs text-gray-400 2xl:text-sm">
            Aguarde um momento...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-full 2xl:max-w-[1600px]">
        {/* HEADER */}
        <header className="relative mb-5 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#149C8B] via-[#159F8E] to-[#0E8274] shadow-xl shadow-[#149C8B]/20 sm:mb-6 sm:rounded-[26px] lg:rounded-[30px]">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64" />
          <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-[#7DE0CF]/20 blur-3xl sm:h-52 sm:w-52" />

          <div className="relative flex flex-col gap-5 p-5 sm:gap-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:p-8 2xl:p-10">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm sm:h-16 sm:w-16 2xl:h-20 2xl:w-20">
                <UserRound className="h-7 w-7 text-white sm:h-8 sm:w-8 2xl:h-10 2xl:w-10" />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl 2xl:text-4xl">
                  Configurações
                </h1>

                <p className="mt-0 max-w-xl text-xs leading-5 text-white/75 sm:text-sm sm:leading-6 2xl:max-w-2xl 2xl:text-base 2xl:leading-7">
                  Personalize sua experiência e escolha como deseja
                  receber informações da Maylon.
                </p>
              </div>
            </div>

            <div className="flex w-full items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm sm:w-fit 2xl:px-5 2xl:py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Check className="h-5 w-5 text-white" />
              </div>

              <div>
                <p className="text-xs font-medium text-white/70 2xl:text-sm">
                  Preferências ativas
                </p>

                <p className="text-lg font-bold text-white 2xl:text-xl">
                  {totalAtivas} de 6
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* MENSAGEM */}
        {mensagem && (
          <div
            className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-sm sm:mb-6 sm:px-5 sm:py-4 sm:text-sm 2xl:text-base ${
              mensagem.tipo === "success"
                ? "border-[#A8DED5] bg-[#E8F7F4] text-[#0B7568]"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                mensagem.tipo === "success"
                  ? "bg-[#D2F0EA]"
                  : "bg-red-100"
              }`}
            >
              {mensagem.tipo === "success" ? (
                <Check className="h-4 w-4" />
              ) : (
                <CircleX className="h-4 w-4" />
              )}
            </div>

            <span className="min-w-0 break-words">{mensagem.texto}</span>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_300px] lg:gap-6 xl:grid-cols-[1fr_340px] 2xl:grid-cols-[1fr_400px] 2xl:gap-8">
          <main className="min-w-0 space-y-5 sm:space-y-6">
            {/* EXPERIÊNCIA DA CONTA */}
            <section className="overflow-hidden rounded-[22px] border border-[#DCEDEA] bg-white shadow-sm sm:rounded-[26px] lg:rounded-[28px]">
              <div className="border-b border-[#E7F1EF] px-4 py-5 sm:px-6 sm:py-6 lg:px-7 2xl:px-8">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#149C8B]/10 sm:h-12 sm:w-12">
                    <Bell className="h-5 w-5 text-[#149C8B] sm:h-6 sm:w-6" />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-[#173B3A] sm:text-lg 2xl:text-xl">
                      Experiência da conta
                    </h2>

                    <p className="mt-1 text-xs text-[#66807D] sm:text-sm 2xl:text-base">
                      Controle como a Maylon interage com você.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-3 sm:p-5 2xl:p-6">
                {preferenciasConta.map((item) => {
                  const Icon = item.icon;
                  const ativo = preferencias[item.campo];

                  return (
                    <label
                      key={item.campo}
                      className={`group flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all duration-200 sm:gap-4 sm:p-4 2xl:p-5 ${
                        ativo
                          ? "border-[#149C8B]/40 bg-[#149C8B]/[0.08] shadow-sm shadow-[#149C8B]/5"
                          : "border-[#DCEDEA] bg-[#F8FCFB] hover:border-[#149C8B]/30 hover:bg-[#F2FBF9]"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition sm:h-11 sm:w-11 ${
                          ativo
                            ? "bg-[#149C8B] text-white shadow-md shadow-[#149C8B]/20"
                            : "bg-white text-[#7D9995] ring-1 ring-[#DCEDEA]"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#254744] 2xl:text-base">
                          {item.titulo}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#718B88] 2xl:text-sm">
                          {item.descricao}
                        </p>
                      </div>

                      <div className="relative shrink-0">
                        <input
                          type="checkbox"
                          checked={ativo}
                          onChange={() =>
                            item.campo === "compartilhar_localizacao"
                              ? handleLocalizacaoChange()
                              : handleChange(item.campo)
                          }
                          className="peer sr-only"
                        />

                        <div
                          className={`h-7 w-12 rounded-full p-1 transition ${
                            ativo ? "bg-[#149C8B]" : "bg-[#DCE7E5]"
                          }`}
                        >
                          <div
                            className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                              ativo ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* CANAIS */}
            <section className="overflow-hidden rounded-[22px] border border-[#DCEDEA] bg-white shadow-sm sm:rounded-[26px] lg:rounded-[28px]">
              <div className="border-b border-[#E7F1EF] px-4 py-5 sm:px-6 sm:py-6 lg:px-7 2xl:px-8">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#149C8B]/10 sm:h-12 sm:w-12">
                    <Smartphone className="h-5 w-5 text-[#149C8B] sm:h-6 sm:w-6" />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-[#173B3A] sm:text-lg 2xl:text-xl">
                      Canais de comunicação
                    </h2>

                    <p className="mt-1 text-xs text-[#66807D] sm:text-sm 2xl:text-base">
                      Escolha onde deseja receber suas mensagens.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 p-3 sm:p-5 md:grid-cols-3 2xl:gap-4 2xl:p-6">
                {canais.map((item) => {
                  const Icon = item.icon;
                  const ativo = preferencias[item.campo];

                  return (
                    <label
                      key={item.campo}
                      className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-200 sm:p-5 2xl:p-6 ${
                        ativo
                          ? "border-[#149C8B]/40 bg-[#149C8B]/[0.08] shadow-sm shadow-[#149C8B]/5"
                          : "border-[#DCEDEA] bg-[#F8FCFB] hover:border-[#149C8B]/30 hover:bg-[#F2FBF9]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
                            ativo
                              ? "bg-[#149C8B] text-white shadow-md shadow-[#149C8B]/20"
                              : "bg-white text-[#7D9995] ring-1 ring-[#DCEDEA]"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={ativo}
                            onChange={() => handleChange(item.campo)}
                            className="peer sr-only"
                          />

                          <div
                            className={`h-7 w-12 rounded-full p-1 transition ${
                              ativo ? "bg-[#149C8B]" : "bg-[#DCE7E5]"
                            }`}
                          >
                            <div
                              className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                                ativo ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 sm:mt-5">
                        <p className="text-sm font-bold text-[#254744] 2xl:text-base">
                          {item.titulo}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#718B88] 2xl:text-sm">
                          {item.descricao}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* DISPOSITIVOS */}
            <section className="rounded-[22px] border border-[#DCEDEA] bg-white p-4 shadow-sm sm:rounded-[26px] sm:p-6 lg:rounded-[28px] 2xl:p-7">
              <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#149C8B]/10 sm:h-12 sm:w-12">
                    <Monitor className="h-5 w-5 text-[#149C8B] sm:h-6 sm:w-6" />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-[#173B3A] sm:text-lg 2xl:text-xl">
                      Dispositivos acessados
                    </h2>

                    <p className="mt-1 text-xs text-[#66807D] sm:text-sm 2xl:text-base">
                      Gerencie os dispositivos conectados à sua conta.
                    </p>
                  </div>
                </div>

                <a
                  href="/passageiro/sessoes"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#149C8B]/20 bg-[#149C8B]/10 px-5 py-3 text-sm font-bold text-[#11897D] transition hover:bg-[#149C8B] hover:text-white md:w-auto 2xl:text-base"
                >
                  Gerenciar dispositivos
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </section>
          </main>

          {/* PRIVACIDADE */}
          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <div className="overflow-hidden rounded-[22px] bg-gradient-to-br from-[#149C8B] via-[#128F7F] to-[#0B7568] shadow-xl shadow-[#149C8B]/20 sm:rounded-[26px] lg:rounded-[28px]">
              <div className="relative overflow-hidden p-5 sm:p-6 2xl:p-8">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 sm:h-12 sm:w-12">
                    <ShieldCheck className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-white sm:mt-5 sm:text-xl 2xl:text-2xl">
                    Sua privacidade
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-white/70 sm:text-sm sm:leading-6 2xl:text-base 2xl:leading-7">
                    Você tem controle sobre as comunicações e permissões
                    utilizadas pela sua conta Maylon.
                  </p>

                  <div className="mt-5 grid gap-3 sm:mt-6 md:grid-cols-3 lg:grid-cols-1">
                    <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                      <Check className="h-4 w-4 shrink-0 text-white" />
                      <span className="text-xs font-medium text-white/85 2xl:text-sm">
                        Controle das notificações
                      </span>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                      <Check className="h-4 w-4 shrink-0 text-white" />
                      <span className="text-xs font-medium text-white/85 2xl:text-sm">
                        Preferências personalizadas
                      </span>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                      <Check className="h-4 w-4 shrink-0 text-white" />
                      <span className="text-xs font-medium text-white/85 2xl:text-sm">
                        Segurança da conta
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 bg-black/5 p-4 sm:p-5 2xl:p-6">
                <p className="text-xs leading-5 text-white/60 2xl:text-sm">
                  As alterações serão aplicadas à sua conta após salvar as
                  configurações.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* AÇÕES */}
        <div className="mt-5 flex flex-col-reverse gap-3 rounded-[22px] border border-[#DCEDEA] bg-white p-4 shadow-sm sm:mt-6 sm:flex-row sm:justify-end sm:rounded-[26px] sm:p-5 lg:rounded-[28px] 2xl:p-6">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/passageiro";
            }}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#DCEDEA] bg-white px-7 py-3.5 text-sm font-bold text-[#607875] transition hover:bg-[#F4F9F8] hover:text-[#173B3A] sm:w-auto 2xl:text-base"
          >
            <CircleX className="h-[18px] w-[18px]" />
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => void salvarPreferencias()}
            disabled={salvando}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#149C8B] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#149C8B]/20 transition hover:bg-[#11897D] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto 2xl:text-base"
          >
            <Save className="h-[18px] w-[18px]" />
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>

      {/* MODAL LOCALIZAÇÃO */}
      {modalLocalizacao && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !solicitandoLocalizacao
            ) {
              setModalLocalizacao(false);
            }
          }}
        >
          <div
            className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-[24px] bg-white shadow-2xl sm:max-w-md sm:rounded-[30px] 2xl:max-w-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-localizacao-titulo"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-[#149C8B] via-[#128F7F] to-[#0B7568] px-5 pb-6 pt-6 sm:px-6 sm:pb-8 sm:pt-7">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

              <div className="relative flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-white/15 ring-1 ring-white/20 backdrop-blur-sm sm:h-20 sm:w-20 sm:rounded-[24px]">
                  <MapPin className="h-8 w-8 text-white sm:h-10 sm:w-10" />
                </div>
              </div>

              <div className="relative mt-4 text-center sm:mt-5">
                <h2
                  id="modal-localizacao-titulo"
                  className="text-lg font-bold text-white sm:text-xl 2xl:text-2xl"
                >
                  Compartilhar localização
                </h2>

                <p className="mt-2 text-xs leading-5 text-white/75 sm:text-sm sm:leading-6 2xl:text-base">
                  Você deseja permitir que a Maylon utilize sua localização
                  durante suas viagens?
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 2xl:p-8">
              <div className="rounded-2xl border border-[#DCEDEA] bg-[#F8FCFB] p-3 sm:p-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#149C8B]/10">
                    <ShieldCheck className="h-5 w-5 text-[#149C8B]" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-[#254744] 2xl:text-base">
                      Sua privacidade está protegida
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#718B88] 2xl:text-sm">
                      A localização será utilizada apenas para recursos
                      relacionados às suas viagens. Você poderá desativar
                      essa permissão a qualquer momento.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3 sm:mt-5">
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 shrink-0 text-[#149C8B]" />
                  <span className="text-xs text-[#536E6A] sm:text-sm 2xl:text-base">
                    Melhor acompanhamento da sua viagem
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 shrink-0 text-[#149C8B]" />
                  <span className="text-xs text-[#536E6A] sm:text-sm 2xl:text-base">
                    Mais segurança durante o trajeto
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 shrink-0 text-[#149C8B]" />
                  <span className="text-xs text-[#536E6A] sm:text-sm 2xl:text-base">
                    Você pode revogar a permissão quando quiser
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={permitirLocalizacao}
                  disabled={solicitandoLocalizacao}
                  className="flex-1 cursor-pointer rounded-xl bg-[#149C8B] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#149C8B]/20 transition hover:bg-[#11897D] disabled:cursor-not-allowed disabled:opacity-60 2xl:text-base"
                >
                  {solicitandoLocalizacao
                    ? "Obtendo localização..."
                    : "Permitir localização"}
                </button>

                <button
                  type="button"
                  onClick={() => setModalLocalizacao(false)}
                  disabled={solicitandoLocalizacao}
                  className="flex-1 cursor-pointer rounded-xl border border-[#DCEDEA] bg-white px-5 py-3.5 text-sm font-bold text-[#607875] transition hover:bg-[#F4F9F8] disabled:cursor-not-allowed disabled:opacity-60 2xl:text-base"
                >
                  Agora não
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}