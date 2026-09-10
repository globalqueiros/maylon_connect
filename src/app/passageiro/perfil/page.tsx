"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
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
  ChevronRight,
  UserRound,
  KeyRound,
  RefreshCw,
  FileCheck2,
  ScanFace,
  Clock3,
} from "lucide-react";

type VerificationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "failed"
  | "not_started";

type VerificationData = {
  status?: VerificationStatus | string | null;
  reason?: string | null;
  message?: string | null;
  verified_at?: string | null;
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
  is_temp_blocked: boolean | number;
  is_active: boolean | number;
  identification_verified_at?: string | null;
  justification_status?: VerificationStatus | string | null;
  livesheet_status?: VerificationStatus | string | null;
  verification?: {
    justification?: VerificationData | null;
    livesheet?: VerificationData | null;
    liveness?: VerificationData | null;
  } | null;
};

type AlertState = {
  type: "success" | "error";
  message: string;
} | null;

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingVerification, setRefreshingVerification] =
    useState(false);
  const [imgSrc, setImgSrc] = useState("/favicon.ico");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar", String(collapsed));
  }, [collapsed]);

  const carregarUsuario = useCallback(
    async (mostrarLoading = true, mostrarErro = true) => {
      try {
        if (mostrarLoading) {
          setLoading(true);
        }

        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        });

        let data: any = null;

        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (res.status === 401 || res.status === 403 || !res.ok) {
          window.location.replace("/");
          return;
        }

        const apiUser = data?.usuario ?? data?.user ?? data?.data ?? data;

        if (!apiUser?.id) {
          window.location.replace("/");
          return;
        }

        const justification =
          apiUser.verification?.justification ??
          apiUser.justification ??
          apiUser.justificacao ??
          null;

        const livesheet =
          apiUser.verification?.livesheet ??
          apiUser.verification?.liveness ??
          apiUser.livesheet ??
          apiUser.liveness ??
          null;

        const usuarioAtual: Usuario = {
          id: Number(apiUser.id),
          full_name:
            apiUser.full_name ??
            apiUser.name ??
            apiUser.nome ??
            "",
          email: apiUser.email ?? "",
          phone:
            apiUser.phone ??
            apiUser.telefone ??
            "",
          profile_image:
            apiUser.profile_image ??
            apiUser.foto ??
            apiUser.avatar ??
            apiUser.photo_url ??
            null,
          identification_number:
            apiUser.identification_number ??
            apiUser.document_number ??
            apiUser.documento ??
            null,
          identification_type:
            apiUser.identification_type ??
            apiUser.document_type ??
            apiUser.tipo_documento ??
            null,
          phone_verified_at:
            apiUser.phone_verified_at ??
            apiUser.telefone_verificado_em ??
            null,
          email_verified_at:
            apiUser.email_verified_at ??
            apiUser.email_verificado_em ??
            null,
          tipo:
            apiUser.tipo === "driver" ||
              apiUser.type === "driver" ||
              apiUser.type === "motorista" ||
              apiUser.tipo === "motorista"
              ? "driver"
              : "customer",
          is_temp_blocked:
            apiUser.is_temp_blocked ??
            apiUser.temp_blocked ??
            apiUser.temporary_blocked ??
            false,
          is_active:
            apiUser.is_active ??
            apiUser.active ??
            true,
          identification_verified_at:
            apiUser.identification_verified_at ??
            apiUser.document_verified_at ??
            apiUser.document_verified_at ??
            null,
          justification_status:
            apiUser.justification_status ??
            apiUser.justificacao_status ??
            justification?.status ??
            null,
          livesheet_status:
            apiUser.livesheet_status ??
            apiUser.liveness_status ??
            livesheet?.status ??
            null,
          verification: {
            justification,
            livesheet,
            liveness: livesheet,
          },
        };

        setUsuario(usuarioAtual);
        setImgSrc(usuarioAtual.profile_image || "/favicon.ico");
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);

        if (mostrarErro) {
          setAlert({
            type: "error",
            message:
              "Não foi possível carregar os dados da sua conta.",
          });
        }
      } finally {
        if (mostrarLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    carregarUsuario(true);
  }, [carregarUsuario]);

  const atualizarVerificacoes = async () => {
    if (refreshingVerification) return;

    try {
      setRefreshingVerification(true);
      await carregarUsuario(false, false);

      setAlert({
        type: "success",
        message: "Status das verificações atualizado.",
      });
    } catch {
      setAlert({
        type: "error",
        message: "Não foi possível atualizar as verificações.",
      });
    } finally {
      setRefreshingVerification(false);
    }
  };

  const justificativa = useMemo(() => {
    const data = usuario?.verification?.justification;

    return {
      status: normalizarStatus(
        data?.status ?? usuario?.justification_status
      ),
      reason:
        data?.reason ??
        data?.message ??
        null,
      verifiedAt: data?.verified_at ?? null,
    };
  }, [usuario]);

  const livesheet = useMemo(() => {
    const data =
      usuario?.verification?.livesheet ??
      usuario?.verification?.liveness;

    return {
      status: normalizarStatus(
        data?.status ?? usuario?.livesheet_status
      ),
      reason:
        data?.reason ??
        data?.message ??
        null,
      verifiedAt: data?.verified_at ?? null,
    };
  }, [usuario]);

  const possuiVerificacaoPendente = useMemo(
    () =>
      justificativa.status === "pending" ||
      livesheet.status === "pending",
    [justificativa.status, livesheet.status]
  );

  useEffect(() => {
    if (!usuario?.id || !possuiVerificacaoPendente) {
      return;
    }

    const interval = window.setInterval(() => {
      carregarUsuario(false, false);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [
    usuario?.id,
    possuiVerificacaoPendente,
    carregarUsuario,
  ]);

  useEffect(() => {
    if (!alert) return;

    const timer = window.setTimeout(() => {
      setAlert(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [alert]);

  const fecharModalSenha = useCallback(() => {
    if (savingPassword) return;

    setShowPasswordModal(false);
    setSenha("");
    setConfirmar("");
    setErro("");
    setShowSenha(false);
    setShowConfirmar(false);
  }, [savingPassword]);

  const fecharModalFoto = useCallback(() => {
    if (uploading) return;

    setShowPhotoModal(false);

    if (previewSrc) {
      URL.revokeObjectURL(previewSrc);
    }

    setPreviewSrc(null);
    setSelectedFile(null);
  }, [uploading, previewSrc]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (showPhotoModal && !uploading) {
        fecharModalFoto();
      }

      if (showPasswordModal && !savingPassword) {
        fecharModalSenha();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    showPhotoModal,
    showPasswordModal,
    uploading,
    savingPassword,
    fecharModalFoto,
    fecharModalSenha,
  ]);

  useEffect(() => {
    return () => {
      if (previewSrc) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  const formatPhoneBR = (phone: string) => {
    if (!phone) return "";

    let digits = phone.replace(/\D/g, "");

    if (digits.startsWith("55") && digits.length >= 12) {
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

    return digits;
  };

  const contaBloqueada =
    Number(usuario?.is_active) === 0 ||
    Number(usuario?.is_temp_blocked) === 1 ||
    usuario?.is_temp_blocked === true;

  const abrirModalSenha = () => {
    if (contaBloqueada) {
      setAlert({
        type: "error",
        message: "Sua conta está bloqueada no momento.",
      });
      return;
    }

    setErro("");
    setSenha("");
    setConfirmar("");
    setShowSenha(false);
    setShowConfirmar(false);
    setShowPasswordModal(true);
  };

  const handleSalvarSenha = async () => {
    setErro("");

    if (savingPassword) return;

    if (contaBloqueada) {
      setErro(
        "Não é possível alterar a senha enquanto a conta estiver bloqueada."
      );
      return;
    }

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
      setSavingPassword(true);

      const res = await fetch("/api/change-password", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          password: senha,
        }),
      });

      let data: any = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        setErro(
          data?.error ??
          data?.message ??
          "Erro ao alterar senha."
        );
        return;
      }

      setShowPasswordModal(false);
      setSenha("");
      setConfirmar("");
      setErro("");
      setShowSenha(false);
      setShowConfirmar(false);

      await carregarUsuario(false, false);

      setAlert({
        type: "success",
        message:
          data?.message ??
          "Sua senha foi alterada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      setErro("Não foi possível alterar sua senha.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSelecionarFoto = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAlert({
        type: "error",
        message: "Selecione um arquivo de imagem válido.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAlert({
        type: "error",
        message: "A imagem deve possuir no máximo 5 MB.",
      });
      return;
    }

    if (previewSrc) {
      URL.revokeObjectURL(previewSrc);
    }

    const objectUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewSrc(objectUrl);
    setShowPhotoModal(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setAlert({
        type: "error",
        message: "Selecione uma imagem.",
      });
      return;
    }

    if (uploading) return;

    if (contaBloqueada) {
      setAlert({
        type: "error",
        message: "Sua conta está bloqueada no momento.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setUploading(true);

      const res = await fetch("/api/upload-photo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      let data: any = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        setAlert({
          type: "error",
          message:
            data?.error ??
            data?.message ??
            "Erro ao atualizar sua foto.",
        });
        return;
      }

      if (data?.url) {
        setImgSrc(data.url);

        setUsuario((prev) =>
          prev
            ? {
              ...prev,
              profile_image: data.url,
            }
            : prev
        );
      }

      if (previewSrc) {
        URL.revokeObjectURL(previewSrc);
      }

      setPreviewSrc(null);
      setSelectedFile(null);
      setShowPhotoModal(false);

      await carregarUsuario(false, false);

      setAlert({
        type: "success",
        message:
          data?.message ??
          "Foto atualizada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar foto:", error);

      setAlert({
        type: "error",
        message: "Não foi possível atualizar sua foto.",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex w-full max-w-[320px] flex-col items-center rounded-[28px] bg-white p-10 shadow-xl ring-1 ring-black/5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f7f4]">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#149C8B] border-t-transparent" />
          </div>
          <p className="mt-5 text-sm font-semibold text-gray-700">
            Carregando seu perfil
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Verificando informações da conta...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main
        className={`mx-auto w-full max-w-[1600px] transition-all duration-300 ${collapsed ? "xl:px-12" : ""
          }`}
      >
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[30px] bg-white shadow-sm ring-1 ring-gray-100">
            <div className="relative h-[230px] overflow-hidden sm:h-[280px]">
              <Image
                src="/bg-carro.png"
                alt="Maylon"
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#33a889]/95 via-[#0a523f]/70 to-[#073b70]/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-2xl px-6 sm:px-10">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-xl">
                    <UserRound size={15} />
                    Área pessoal
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Meu perfil
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
                    Gerencie suas informações, segurança e verificações da sua
                    conta Maylon.
                  </p>
                </div>
              </div>
            </div>

            {usuario && (
              <div className="px-6 pb-7 sm:px-10">
                <div className="-mt-16 flex flex-col gap-6 lg:-mt-20 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                    <div className="relative shrink-0">
                      <div className="rounded-full border-[5px] border-white bg-white p-1 shadow-2xl">
                        <div className="h-28 w-28 overflow-hidden rounded-full bg-gray-100 sm:h-36 sm:w-36">
                          <Image
                            src={imgSrc}
                            alt="Foto de perfil"
                            width={144}
                            height={144}
                            unoptimized
                            onError={() => setImgSrc("/favicon.ico")}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          document.getElementById("uploadFoto")?.click()
                        }
                        disabled={contaBloqueada}
                        aria-label="Alterar foto de perfil"
                        className="absolute bottom-1 right-0 flex h-11 w-11 items-center justify-center rounded-full border-[4px] border-white bg-[#149C8B] text-white shadow-lg transition hover:scale-105 hover:bg-[#11897D] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Pencil size={17} />
                      </button>
                      <input
                        id="uploadFoto"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleSelecionarFoto}
                      />
                    </div>

                    <div className="pb-1">
                      <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                        {usuario.full_name || "Usuário"}
                      </h2>
                      <p className="mt-0 text-sm text-gray-500">
                        {usuario.email || "E-mail não informado"}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-600">
                    {usuario.tipo === "driver" ? (
                      <Car size={15} className="text-[#149C8B]" />
                    ) : (
                      <User size={15} className="text-[#149C8B]" />
                    )}
                    {usuario.tipo === "driver"
                      ? "Motorista Maylon"
                      : "Passageiro Maylon"}
                  </div>
                </div>
              </div>
            )}
          </section>

          {alert && (
            <div
              role="alert"
              className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 shadow-sm ${alert.type === "success"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
                }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${alert.type === "success"
                      ? "bg-emerald-100"
                      : "bg-red-100"
                    }`}
                >
                  {alert.type === "success" ? (
                    <CheckCircle2
                      size={18}
                      className="text-emerald-600"
                    />
                  ) : (
                    <CircleAlert size={18} className="text-red-600" />
                  )}
                </div>
                <p
                  className={`text-sm font-semibold ${alert.type === "success"
                      ? "text-emerald-700"
                      : "text-red-700"
                    }`}
                >
                  {alert.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAlert(null)}
                aria-label="Fechar alerta"
                className="rounded-lg p-1 text-gray-400 transition hover:bg-white hover:text-gray-700"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {usuario && (
            <section className="overflow-hidden rounded-[26px] bg-white shadow-sm ring-1 ring-gray-100">
              <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-6 sm:px-8 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f7f4]">
                    <ShieldCheck size={23} className="text-[#149C8B]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Verificação da conta
                    </h2>
                    <p className="mt-0 text-sm text-gray-500">
                      Acompanhe o resultado das validações realizadas pela
                      Maylon.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={atualizarVerificacoes}
                  disabled={refreshingVerification}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#149C8B] hover:text-[#149C8B] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={refreshingVerification ? "animate-spin" : ""}
                  />
                  {refreshingVerification
                    ? "Atualizando..."
                    : "Atualizar verificações"}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 p-6 sm:p-8 lg:grid-cols-2">
                <VerificationCard
                  icon={<FileCheck2 size={21} />}
                  title="Justificativa"
                  description="Validação das informações e justificativas enviadas."
                  status={justificativa.status}
                  reason={justificativa.reason}
                  verifiedAt={justificativa.verifiedAt}
                />

                <VerificationCard
                  icon={<ScanFace size={21} />}
                  title="LiveSheet / Liveness"
                  description="Verificação de presença e autenticidade facial."
                  status={livesheet.status}
                  reason={livesheet.reason}
                  verifiedAt={livesheet.verifiedAt}
                />
              </div>

              {possuiVerificacaoPendente && (
                <div className="mx-6 mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:mx-8">
                  <Clock3
                    size={19}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />
                  <div>
                    <p className="text-sm font-bold text-amber-700">
                      Verificação em andamento
                    </p>
                    <p className="mt-1 text-xs leading-5 text-amber-600">
                      A Maylon ainda está processando uma ou mais verificações.
                      O status será atualizado automaticamente.
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {usuario && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <section className="overflow-hidden rounded-[26px] bg-white shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-6 sm:px-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f7f4]">
                      {usuario.tipo === "driver" ? (
                        <Car size={23} className="text-[#149C8B]" />
                      ) : (
                        <User size={23} className="text-[#149C8B]" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Informações pessoais
                      </h2>
                      <p className="mt-0 text-sm text-gray-500">
                        Dados cadastrados na sua conta
                      </p>
                    </div>
                  </div>
                  <div className="hidden rounded-full bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 sm:block">
                    Perfil
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoCard
                      icon={<User size={20} />}
                      title="Nome completo"
                      value={usuario.full_name || "Não informado"}
                    />
                    <InfoCard
                      icon={<Phone size={20} />}
                      title="Telefone"
                      value={formatPhoneBR(usuario.phone) || "Não informado"}
                      badge={
                        usuario.phone_verified_at
                          ? "Verificado"
                          : "Pendente"
                      }
                      verified={!!usuario.phone_verified_at}
                    />
                    <InfoCard
                      icon={<Mail size={20} />}
                      title="E-mail"
                      value={usuario.email || "Não informado"}
                      badge={
                        usuario.email_verified_at
                          ? "Verificado"
                          : "Pendente"
                      }
                      verified={!!usuario.email_verified_at}
                    />
                    <InfoCard
                      icon={<IdCard size={20} />}
                      title="Identificação"
                      value={
                        usuario.identification_number || "Não informado"
                      }
                      secondary={
                        usuario.identification_type || undefined
                      }
                      badge={
                        usuario.identification_verified_at
                          ? "Verificado"
                          : undefined
                      }
                      verified={!!usuario.identification_verified_at}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-gray-100 bg-[#f8fafb] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                        {usuario.tipo === "driver" ? (
                          <Car size={18} className="text-[#149C8B]" />
                        ) : (
                          <User size={18} className="text-[#149C8B]" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Tipo de conta
                        </p>
                        <p className="mt-1 text-sm font-bold text-gray-900">
                          {usuario.tipo === "driver"
                            ? "Motorista Maylon"
                            : "Passageiro Maylon"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </div>
                </div>
              </section>

              <div className="space-y-6">
                <section className="overflow-hidden rounded-[26px] bg-white shadow-sm ring-1 ring-gray-100">
                  <div className="border-b border-gray-100 px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f7f4]">
                        <ShieldCheck size={23} className="text-[#149C8B]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          Segurança
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Proteção da sua conta
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="rounded-2xl border border-gray-100 bg-[#f8fafb] p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                          <KeyRound
                            size={19}
                            className="text-[#149C8B]"
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">
                            Senha de acesso
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            Atualize sua senha regularmente para manter sua
                            conta protegida.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={abrirModalSenha}
                        disabled={contaBloqueada}
                        className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#149C8B] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#11897D] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#149C8B]/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <LockKeyhole size={17} />
                        {contaBloqueada
                          ? "Conta bloqueada"
                          : "Alterar senha"}
                      </button>
                    </div>
                  </div>
                </section>

                <section className="rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-gray-100">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f7f4]">
                      <Lock size={18} className="text-[#149C8B]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Status da conta
                      </h3>
                      <p className="text-xs text-gray-500">
                        Situação atual do seu acesso
                      </p>
                    </div>
                  </div>

                  {contaBloqueada ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
                          <CircleAlert
                            size={18}
                            className="text-red-600"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-700">
                            Conta bloqueada
                          </p>
                          <p className="mt-0.5 text-xs text-red-500">
                            Entre em contato com o suporte.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                          <CheckCircle2
                            size={18}
                            className="text-emerald-600"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-700">
                            Conta ativa
                          </p>
                          <p className="mt-0.5 text-xs text-emerald-500">
                            Tudo funcionando normalmente.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {children}
        </div>
      </main>

      {showPhotoModal && (
        <ModalOverlay onClose={fecharModalFoto}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-foto-title"
            className="w-full max-w-md overflow-hidden rounded-[30px] bg-white shadow-2xl"
          >
            <div className="relative border-b border-gray-100 px-6 py-7 sm:px-8">
              <button
                type="button"
                onClick={fecharModalFoto}
                disabled={uploading}
                aria-label="Fechar"
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={19} />
              </button>

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f7f4]">
                <Camera size={29} className="text-[#149C8B]" />
              </div>

              <h2
                id="modal-foto-title"
                className="text-center text-2xl font-bold text-gray-900"
              >
                Alterar foto
              </h2>

              <p className="mt-2 text-center text-sm text-gray-500">
                Escolha uma nova imagem para o seu perfil.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              {previewSrc && (
                <div className="mb-8 flex justify-center">
                  <div className="rounded-full border-[5px] border-[#e8f7f4] p-1 shadow-lg">
                    <Image
                      src={previewSrc}
                      alt="Pré-visualização da nova foto"
                      width={190}
                      height={190}
                      unoptimized
                      className="h-44 w-44 rounded-full object-cover sm:h-48 sm:w-48"
                    />
                  </div>
                </div>
              )}

              <div className="mb-6 rounded-2xl bg-gray-50 px-4 py-3 text-center text-xs leading-5 text-gray-500">
                Formatos recomendados: JPG, PNG ou WEBP.
                <br />
                Tamanho máximo: 5 MB.
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={fecharModalFoto}
                  disabled={uploading}
                  className="flex-1 cursor-pointer rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={uploading || !selectedFile}
                  onClick={handleUpload}
                  className="flex-1 cursor-pointer rounded-xl bg-[#149C8B] py-3 text-sm font-semibold text-white transition hover:bg-[#11897D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? "Enviando..." : "Salvar foto"}
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {showPasswordModal && (
        <ModalOverlay onClose={fecharModalSenha}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-senha-title"
            className="w-full max-w-md overflow-hidden rounded-[30px] bg-white shadow-2xl"
          >
            <div className="relative border-b border-gray-100 px-6 py-7 sm:px-8">
              <button
                type="button"
                onClick={fecharModalSenha}
                disabled={savingPassword}
                aria-label="Fechar"
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={19} />
              </button>

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f7f4]">
                <LockKeyhole size={29} className="text-[#149C8B]" />
              </div>

              <h2
                id="modal-senha-title"
                className="text-center text-2xl font-bold text-gray-900"
              >
                Alterar senha
              </h2>

              <p className="mt-2 text-center text-sm text-gray-500">
                Crie uma senha forte para manter sua conta segura.
              </p>
            </div>

            <div className="space-y-5 p-6 sm:p-8">
              <PasswordInput
                label="Nova senha"
                value={senha}
                onChange={setSenha}
                visible={showSenha}
                onToggle={() => setShowSenha((value) => !value)}
              />

              <PasswordInput
                label="Confirmar nova senha"
                value={confirmar}
                onChange={setConfirmar}
                visible={showConfirmar}
                onToggle={() => setShowConfirmar((value) => !value)}
              />

              <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs leading-5 text-gray-500">
                Sua senha deve possuir pelo menos 8 caracteres.
              </div>

              {erro && (
                <div
                  role="alert"
                  className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
                >
                  <CircleAlert size={18} className="shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={fecharModalSenha}
                  disabled={savingPassword}
                  className="flex-1 cursor-pointer rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={savingPassword}
                  onClick={handleSalvarSenha}
                  className="flex-1 cursor-pointer rounded-xl bg-[#149C8B] py-3 text-sm font-semibold text-white transition hover:bg-[#11897D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPassword ? "Salvando..." : "Salvar senha"}
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function normalizarStatus(
  status?: string | null
): VerificationStatus {
  if (!status) return "not_started";

  const value = status
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-\s]+/g, "_");

  if (
    [
      "approved",
      "aprovado",
      "aprovada",
      "verified",
      "verificado",
      "verificada",
      "success",
      "successful",
      "completed",
      "complete",
      "concluido",
      "concluida",
    ].includes(value)
  ) {
    return "approved";
  }

  if (
    [
      "pending",
      "pendente",
      "em_analise",
      "processing",
      "in_review",
      "review",
      "under_review",
      "waiting",
      "in_progress",
    ].includes(value)
  ) {
    return "pending";
  }

  if (
    [
      "rejected",
      "rejeitado",
      "rejeitada",
      "denied",
      "deny",
      "recusado",
      "recusada",
    ].includes(value)
  ) {
    return "rejected";
  }

  if (
    [
      "failed",
      "failure",
      "falhou",
      "erro",
      "error",
    ].includes(value)
  ) {
    return "failed";
  }

  if (
    [
      "not_started",
      "not_started_yet",
      "nao_iniciado",
      "none",
      "null",
    ].includes(value)
  ) {
    return "not_started";
  }

  return "pending";
}

function VerificationCard({
  icon,
  title,
  description,
  status,
  reason,
  verifiedAt,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  status: VerificationStatus;
  reason?: string | null;
  verifiedAt?: string | null;
}) {
  const config = getVerificationConfig(status);

  return (
    <div
      className={`rounded-2xl border p-5 transition ${config.container}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900">
              {title}
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              {description}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold ${config.badge}`}
        >
          {config.label}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-2">
        {config.icon}
        <span className={`text-xs font-semibold ${config.text}`}>
          {config.description}
        </span>
      </div>

      {reason && (
        <div className="mt-4 rounded-xl bg-white/70 px-3 py-3 text-xs leading-5 text-gray-600 ring-1 ring-black/5">
          <span className="font-bold">Retorno da API:</span> {reason}
        </div>
      )}

      {verifiedAt && (
        <p className="mt-3 text-[11px] text-gray-400">
          Atualizado em {formatDate(verifiedAt)}
        </p>
      )}
    </div>
  );
}

function getVerificationConfig(status: VerificationStatus) {
  switch (status) {
    case "approved":
      return {
        label: "Aprovada",
        description: "Verificação concluída com sucesso.",
        container: "border-emerald-200 bg-emerald-50/70",
        iconBg: "bg-emerald-100 text-emerald-600",
        badge: "bg-emerald-100 text-emerald-700",
        text: "text-emerald-700",
        icon: (
          <CheckCircle2
            size={16}
            className="text-emerald-600"
          />
        ),
      };

    case "pending":
      return {
        label: "Em análise",
        description: "A verificação está sendo processada.",
        container: "border-amber-200 bg-amber-50/70",
        iconBg: "bg-amber-100 text-amber-600",
        badge: "bg-amber-100 text-amber-700",
        text: "text-amber-700",
        icon: (
          <Clock3
            size={16}
            className="text-amber-600"
          />
        ),
      };

    case "rejected":
      return {
        label: "Reprovada",
        description: "A verificação não foi aprovada.",
        container: "border-red-200 bg-red-50/70",
        iconBg: "bg-red-100 text-red-600",
        badge: "bg-red-100 text-red-700",
        text: "text-red-700",
        icon: (
          <CircleAlert
            size={16}
            className="text-red-600"
          />
        ),
      };

    case "failed":
      return {
        label: "Falhou",
        description: "Não foi possível concluir a verificação.",
        container: "border-red-200 bg-red-50/70",
        iconBg: "bg-red-100 text-red-600",
        badge: "bg-red-100 text-red-700",
        text: "text-red-700",
        icon: (
          <CircleAlert
            size={16}
            className="text-red-600"
          />
        ),
      };

    default:
      return {
        label: "Não iniciada",
        description: "Nenhuma verificação foi registrada.",
        container: "border-gray-200 bg-gray-50",
        iconBg: "bg-gray-100 text-gray-500",
        badge: "bg-gray-100 text-gray-600",
        text: "text-gray-600",
        icon: (
          <CircleAlert
            size={16}
            className="text-gray-400"
          />
        ),
      };
  }
}

function formatDate(value: string) {
  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function InfoCard({
  icon,
  title,
  value,
  secondary,
  badge,
  verified,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  secondary?: string;
  badge?: string;
  verified?: boolean;
}) {
  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-5 transition hover:border-[#cceee8] hover:bg-[#fbfefd]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf8f5] text-[#149C8B] transition group-hover:bg-[#dff5ef]">
            {icon}
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
              {title}
            </p>

            <p
              title={value}
              className="mt-1 truncate text-sm font-bold text-gray-900"
            >
              {value}
            </p>

            {secondary && (
              <p className="mt-1 text-xs font-medium text-gray-400">
                {secondary}
              </p>
            )}
          </div>
        </div>

        {badge && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${verified
                ? "bg-emerald-50 text-emerald-600"
                : "bg-yellow-50 text-yellow-600"
              }`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <div className="relative">
        <LockKeyhole
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Digite sua senha"
          autoComplete="new-password"
          minLength={8}
          className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-12 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#149C8B] focus:bg-white focus:ring-4 focus:ring-[#149C8B]/10"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#061b2b]/70 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
}