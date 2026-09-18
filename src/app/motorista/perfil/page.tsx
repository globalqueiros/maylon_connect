"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import {
  Car,
  User,
  Pencil,
  Lock,
  Eye,
  EyeOff,
  X,
  ShieldCheck,
  CircleAlert,
  IdCard,
  Phone,
  Mail,
  LockKeyhole,
  Camera,
  CheckCircle2,
  UserRound,
  BadgeCheck,
  UserRoundCheck,
  Headset,
} from "lucide-react";

type Gerente = {
  id?: number;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  profile_image?: string | null;
};

type Usuario = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  profile_image: string | null;
  identification_number: string | null;
  identification_type: string | null;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  tipo: "driver" | "customer";

  gerente?: Gerente | null;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const [imgSrc, setImgSrc] = useState("/favicon.ico");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");

  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  /* =========================================================
     CARREGAR USUÁRIO
  ========================================================= */

  useEffect(() => {
    async function carregarUsuario() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          window.location.href = "/";
          return;
        }

        const data = await res.json();

        if (!data?.id) {
          window.location.href = "/";
          return;
        }

        setUsuario(data);

        if (data.profile_image) {
          setImgSrc(data.profile_image);
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    }

    carregarUsuario();
  }, []);

  /* =========================================================
     ALERTA AUTOMÁTICO
  ========================================================= */

  useEffect(() => {
    if (!alert) return;

    const timer = setTimeout(() => {
      setAlert(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [alert]);

  /* =========================================================
     LIMPAR URL DA PRÉ-VISUALIZAÇÃO
  ========================================================= */

  useEffect(() => {
    return () => {
      if (previewSrc) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  /* =========================================================
     FORMATAR TELEFONE
  ========================================================= */

  const formatPhoneBR = (phone?: string | null) => {
    if (!phone) return "Não informado";

    let digits = phone.replace(/\D/g, "");

    if (digits.startsWith("55")) {
      digits = digits.slice(2);
    }

    if (digits.length === 11) {
      return digits.replace(
        /^(\d{2})(\d{5})(\d{4})$/,
        "($1) $2-$3"
      );
    }

    if (digits.length === 10) {
      return digits.replace(
        /^(\d{2})(\d{4})(\d{4})$/,
        "($1) $2-$3"
      );
    }

    return phone;
  };

  /* =========================================================
     ALTERAR SENHA
  ========================================================= */

  const handleSalvarSenha = async () => {
    setErro("");

    if (!senha || !confirmar) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (senha.length < 8) {
      setErro("A senha deve possuir no mínimo 8 caracteres.");
      return;
    }

    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: senha,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao alterar senha.");
        return;
      }

      setAlert({
        type: "success",
        message: "Senha alterada com sucesso.",
      });

      fecharModalSenha();
    } catch (error) {
      console.error(error);
      setErro("Erro interno do servidor.");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     UPLOAD DA FOTO
  ========================================================= */

  const handleUpload = async () => {
    if (!selectedFile) {
      setAlert({
        type: "error",
        message: "Selecione uma imagem.",
      });

      return;
    }

    const formData = new FormData();

    formData.append("file", selectedFile);

    try {
      setUploading(true);

      const res = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setAlert({
          type: "error",
          message: data.error || "Erro ao atualizar foto.",
        });

        return;
      }

      setImgSrc(data.url);

      setShowModal(false);
      setPreviewSrc(null);
      setSelectedFile(null);

      setAlert({
        type: "success",
        message: "Foto atualizada com sucesso.",
      });
    } catch (error) {
      console.error(error);

      setAlert({
        type: "error",
        message: "Erro inesperado ao atualizar foto.",
      });
    } finally {
      setUploading(false);
    }
  };

  /* =========================================================
     FECHAR MODAIS
  ========================================================= */

  const fecharModalSenha = () => {
    setOpen(false);
    setSenha("");
    setConfirmar("");
    setErro("");
    setShowSenha(false);
    setShowConfirmar(false);
  };

  const fecharModalFoto = () => {
    setShowModal(false);
    setPreviewSrc(null);
    setSelectedFile(null);
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#149C8B]/20 border-t-[#149C8B]" />

          <p className="mt-5 text-sm font-semibold text-gray-600">
            Carregando informações...
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Aguarde um momento
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">

          {/* =====================================================
              CABEÇALHO
          ===================================================== */}

          <div className="mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[#149C8B]">
                  Minha conta
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Meu Perfil
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Gerencie suas informações pessoais e segurança da conta.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />

                <span className="text-xs font-bold text-green-700">
                  Conta ativa
                </span>
              </div>
            </div>
          </div>

          {/* =====================================================
              BANNER
          ===================================================== */}

          <section className="relative mb-20 overflow-visible rounded-3xl bg-white shadow-sm ring-1 ring-gray-200">

            <div className="relative h-[220px] overflow-hidden rounded-t-3xl sm:h-[250px]">
              <Image
                src="/bg-login.png"
                alt="Banner do perfil"
                fill
                priority
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-[#063F3B]/95 via-[#0B6F68]/70 to-black/20" />

              <div className="absolute inset-0 flex items-center px-6 sm:px-10">
                <div className="max-w-2xl text-white">

                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                    {usuario?.tipo === "driver" ? (
                      <Car size={15} />
                    ) : (
                      <UserRound size={15} />
                    )}

                    <span className="text-xs font-bold">
                      {usuario?.tipo === "driver"
                        ? "Motorista"
                        : "Passageiro"}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold sm:text-3xl">
                    Olá, {usuario?.full_name || "Usuário"}!
                  </h2>

                  <p className="mt-2 text-sm text-white/75">
                    Mantenha seus dados sempre atualizados.
                  </p>
                </div>
              </div>
            </div>

            {/* FOTO DO PERFIL */}

            <div className="absolute -bottom-14 left-6 sm:left-10">
              <div className="relative">

                <div className="h-32 w-32 overflow-hidden rounded-full border-[5px] border-white bg-gray-100 shadow-xl sm:h-36 sm:w-36">
                  <Image
                    src={imgSrc}
                    alt="Foto do perfil"
                    width={144}
                    height={144}
                    onError={() => setImgSrc("/favicon.ico")}
                    className="h-full w-full object-cover"
                  />
                </div>

                <button
                  type="button"
                  title="Alterar foto"
                  onClick={() =>
                    document
                      .getElementById("uploadFoto")
                      ?.click()
                  }
                  className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-[#149C8B] text-white shadow-lg transition hover:scale-105 hover:bg-[#11897D]"
                >
                  <Pencil size={17} />
                </button>

                <input
                  id="uploadFoto"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (!file) return;

                    setSelectedFile(file);

                    const preview =
                      URL.createObjectURL(file);

                    setPreviewSrc(preview);
                    setShowModal(true);
                  }}
                />
              </div>
            </div>

            <div className="flex min-h-[82px] items-center justify-end px-6 sm:px-10">
              <div className="hidden items-center gap-2 text-sm font-medium text-gray-500 sm:flex">
                <ShieldCheck
                  size={18}
                  className="text-[#149C8B]"
                />

                Perfil protegido
              </div>
            </div>
          </section>

          {/* =====================================================
              ALERTA
          ===================================================== */}

          {alert && (
            <div
              className={`mb-6 flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm ${
                alert.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {alert.type === "success" ? (
                <CheckCircle2 size={20} />
              ) : (
                <CircleAlert size={20} />
              )}

              <span>{alert.message}</span>
            </div>
          )}

          {usuario && (
            <>
              {/* =================================================
                  DADOS PESSOAIS
              ================================================= */}

              <section className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-200">

                <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E9F8F5]">
                      {usuario.tipo === "driver" ? (
                        <Car
                          size={22}
                          className="text-[#149C8B]"
                        />
                      ) : (
                        <User
                          size={22}
                          className="text-[#149C8B]"
                        />
                      )}
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {usuario.tipo === "driver"
                          ? "Dados do Motorista"
                          : "Dados do Passageiro"}
                      </h2>

                      <p className="text-sm text-gray-500">
                        Informações cadastradas na sua conta.
                      </p>
                    </div>

                  </div>
                </div>

                <div className="grid grid-cols-1 gap-px bg-gray-100 md:grid-cols-2">

                  {/* NOME */}

                  <div className="bg-white p-6">
                    <div className="flex items-start gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                        <User
                          size={20}
                          className="text-[#149C8B]"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Nome completo
                        </p>

                        <p className="mt-1 break-words text-base font-bold text-gray-900">
                          {usuario.full_name}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* IDENTIFICAÇÃO */}

                  <div className="bg-white p-6">
                    <div className="flex items-start gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                        <IdCard
                          size={20}
                          className="text-[#149C8B]"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Identificação
                        </p>

                        <p className="mt-1 break-words text-base font-bold text-gray-900">
                          {usuario.identification_number ||
                            "Não informado"}

                          {usuario.identification_type && (
                            <span className="ml-2 text-sm font-medium text-gray-500">
                              / {usuario.identification_type}
                            </span>
                          )}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* TELEFONE */}

                  <div className="bg-white p-6">
                    <div className="flex items-start gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                        <Phone
                          size={20}
                          className="text-[#149C8B]"
                        />
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center justify-between gap-3">

                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              Telefone
                            </p>

                            <p className="mt-1 text-base font-bold text-gray-900">
                              {formatPhoneBR(usuario.phone)}
                            </p>
                          </div>

                          {usuario.phone_verified_at ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                              <ShieldCheck size={14} />
                              Verificado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-bold text-yellow-700">
                              <CircleAlert size={14} />
                              Pendente
                            </span>
                          )}

                        </div>
                      </div>

                    </div>
                  </div>

                  {/* EMAIL */}

                  <div className="bg-white p-6">
                    <div className="flex items-start gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                        <Mail
                          size={20}
                          className="text-[#149C8B]"
                        />
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center justify-between gap-3">

                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              E-mail
                            </p>

                            <p className="mt-1 break-all text-base font-bold text-gray-900">
                              {usuario.email}
                            </p>
                          </div>

                          {usuario.email_verified_at ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                              <ShieldCheck size={14} />
                              Verificado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-bold text-yellow-700">
                              <CircleAlert size={14} />
                              Pendente
                            </span>
                          )}

                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </section>

              {/* =================================================
                  GERENTE
              ================================================= */}

              <section className="mb-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E9F8F5]">
                      <UserRoundCheck
                        size={22}
                        className="text-[#149C8B]"
                      />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Responsável pelo atendimento
                      </h2>

                      <p className="text-sm text-gray-500">
                        Informações sobre o responsável pela sua conta.
                      </p>
                    </div>

                  </div>
                </div>

                <div className="p-6 sm:p-8">

                  {usuario.gerente &&
                  (usuario.gerente.full_name ||
                    usuario.gerente.email ||
                    usuario.gerente.phone) ? (

                    /* ===========================================
                       GERENTE REAL
                    =========================================== */

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                      <div className="flex min-w-0 items-center gap-4">

                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#E9F8F5]">

                          {usuario.gerente.profile_image ? (
                            <Image
                              src={usuario.gerente.profile_image}
                              alt={
                                usuario.gerente.full_name ||
                                "Gerente"
                              }
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserRoundCheck
                              size={28}
                              className="text-[#149C8B]"
                            />
                          )}

                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="break-words text-lg font-bold text-gray-900">
                              {usuario.gerente.full_name ||
                                "Gerente responsável"}
                            </h3>

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E9F8F5] px-3 py-1 text-xs font-bold text-[#149C8B]">
                              <ShieldCheck size={13} />
                              Gerente
                            </span>

                          </div>

                          {usuario.gerente.email && (
                            <p className="mt-2 flex items-center gap-2 break-all text-sm text-gray-500">
                              <Mail
                                size={15}
                                className="shrink-0"
                              />

                              {usuario.gerente.email}
                            </p>
                          )}

                          {usuario.gerente.phone && (
                            <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                              <Phone
                                size={15}
                                className="shrink-0"
                              />

                              {formatPhoneBR(
                                usuario.gerente.phone
                              )}
                            </p>
                          )}

                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-green-100 bg-green-50 px-5 py-4">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                          <BadgeCheck
                            size={21}
                            className="text-green-600"
                          />
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-green-600">
                            Atendimento
                          </p>

                          <p className="mt-1 text-sm font-bold text-green-700">
                            Gerente responsável
                          </p>
                        </div>

                      </div>

                    </div>
                  ) : (

                    /* ===========================================
                       GERENTE DIGITAL
                    =========================================== */

                    <div className="flex flex-col gap-5 rounded-2xl border border-[#D8F1EC] bg-gradient-to-r from-[#F2FBF9] to-white p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">

                      <div className="flex items-start gap-4">

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#E9F8F5]">
                          <Headset
                            size={27}
                            className="text-[#149C8B]"
                          />
                        </div>

                        <div>

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="text-lg font-bold text-gray-900">
                              Gerente Digital
                            </h3>

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                              <BadgeCheck size={13} />
                              Atendimento digital
                            </span>

                          </div>

                          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                            Sua conta ainda não possui um gerente
                            responsável. O Gerente Digital está
                            disponível para auxiliar você sempre
                            que necessário.
                          </p>

                        </div>

                      </div>

                      <div className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">

                        <ShieldCheck
                          size={18}
                          className="text-[#149C8B]"
                        />

                        <span className="text-sm font-semibold text-gray-700">
                          Atendimento disponível
                        </span>

                      </div>

                    </div>
                  )}

                </div>
              </section>

              {/* =================================================
                  STATUS
              ================================================= */}

              <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                      <BadgeCheck
                        size={22}
                        className="text-green-600"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Status
                      </p>

                      <p className="mt-1 font-bold text-gray-900">
                        Conta ativa
                      </p>
                    </div>

                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E9F8F5]">
                      <ShieldCheck
                        size={22}
                        className="text-[#149C8B]"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Segurança
                      </p>

                      <p className="mt-1 font-bold text-gray-900">
                        Protegida
                      </p>
                    </div>

                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                      {usuario.tipo === "driver" ? (
                        <Car
                          size={22}
                          className="text-blue-600"
                        />
                      ) : (
                        <User
                          size={22}
                          className="text-blue-600"
                        />
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Perfil
                      </p>

                      <p className="mt-1 font-bold text-gray-900">
                        {usuario.tipo === "driver"
                          ? "Motorista"
                          : "Passageiro"}
                      </p>
                    </div>

                  </div>
                </div>

              </section>
            </>
          )}

          {/* =====================================================
              SEGURANÇA
          ===================================================== */}

          <section className="mb-8 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E9F8F5]">
                  <Lock
                    size={23}
                    className="text-[#149C8B]"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Segurança da conta
                  </h2>

                  <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500">
                    Atualize sua senha regularmente para manter
                    sua conta protegida.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#149C8B] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#11897D] hover:shadow-md"
              >
                <LockKeyhole size={18} />
                Alterar senha
              </button>

            </div>
          </section>

          {children}
        </div>
      </main>

      {/* =======================================================
          MODAL FOTO
      ======================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="relative border-b border-gray-100 px-6 py-7 sm:px-8">

              <button
                type="button"
                onClick={fecharModalFoto}
                className="absolute right-5 top-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={19} />
              </button>

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E9F8F5]">
                <Camera
                  size={27}
                  className="text-[#149C8B]"
                />
              </div>

              <h2 className="text-center text-xl font-bold text-gray-900">
                Alterar foto
              </h2>

              <p className="mt-2 text-center text-sm text-gray-500">
                Escolha uma nova foto para seu perfil.
              </p>

            </div>

            <div className="p-6 sm:p-8">

              {previewSrc && (
                <div className="mb-7 flex justify-center">

                  <div className="rounded-full border-4 border-[#E9F8F5] p-1 shadow-md">

                    <Image
                      src={previewSrc}
                      alt="Pré-visualização"
                      width={180}
                      height={180}
                      className="h-44 w-44 rounded-full object-cover"
                    />

                  </div>

                </div>
              )}

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={fecharModalFoto}
                  className="flex-1 cursor-pointer rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleUpload}
                  className="flex-1 cursor-pointer rounded-xl bg-[#149C8B] py-3 text-sm font-bold text-white transition hover:bg-[#11897D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? "Enviando..." : "Salvar foto"}
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL SENHA
      ======================================================= */}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="relative border-b border-gray-100 px-6 py-7 sm:px-8">

              <button
                type="button"
                onClick={fecharModalSenha}
                className="absolute right-5 top-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={19} />
              </button>

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E9F8F5]">
                <LockKeyhole
                  size={27}
                  className="text-[#149C8B]"
                />
              </div>

              <h2 className="text-center text-xl font-bold text-gray-900">
                Alterar senha
              </h2>

              <p className="mt-2 text-center text-sm text-gray-500">
                Crie uma senha forte para proteger sua conta.
              </p>

            </div>

            <div className="space-y-5 p-6 sm:p-8">

              {/* NOVA SENHA */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Nova senha
                </label>

                <div className="relative">

                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={showSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#149C8B] focus:bg-white focus:ring-4 focus:ring-[#149C8B]/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition hover:text-gray-700"
                  >
                    {showSenha ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>
              </div>

              {/* CONFIRMAR */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Confirmar senha
                </label>

                <div className="relative">

                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={showConfirmar ? "text" : "password"}
                    value={confirmar}
                    onChange={(e) =>
                      setConfirmar(e.target.value)
                    }
                    placeholder="Digite novamente"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#149C8B] focus:bg-white focus:ring-4 focus:ring-[#149C8B]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmar(!showConfirmar)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition hover:text-gray-700"
                  >
                    {showConfirmar ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>
              </div>

              {/* ERRO */}

              {erro && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">

                  <CircleAlert
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{erro}</span>

                </div>
              )}

              {/* BOTÕES */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={fecharModalSenha}
                  className="flex-1 cursor-pointer rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSalvarSenha}
                  className="flex-1 cursor-pointer rounded-xl bg-[#149C8B] py-3 text-sm font-bold text-white transition hover:bg-[#11897D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Salvando..." : "Salvar senha"}
                </button>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}