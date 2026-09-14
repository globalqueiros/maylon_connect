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
  AlertCircle,
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  User,
  UserRoundCheck,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
  id: number | string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  profile_image?: string | null;
  identification_number?: string | null;
  identification_type?: string | null;
  phone_verified_at?: string | null;
  email_verified_at?: string | null;
  tipo?: "driver" | "customer" | string | null;
  is_temp_blocked?: boolean | number | null;
  is_active?: boolean | number | null;
  identification_verified_at?: string | null;
  justification_status?: string | null;
  livesheet_status?: string | null;
  verification?: {
    justification?: VerificationData | null;
    livesheet?: VerificationData | null;
    liveness?: VerificationData | null;
  } | null;
};

type AlertState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

type VerificationCardProps = {
  title: string;
  description: string;
  verification?: VerificationData | null;
};

function normalizarStatus(status?: string | null): VerificationStatus {
  if (!status) return "not_started";

  const value = status
    .toString()
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (
    [
      "approved",
      "aprovado",
      "aprovada",
      "verified",
      "verify",
      "success",
      "sucesso",
      "valid",
      "validated",
    ].includes(value)
  ) {
    return "approved";
  }

  if (
    [
      "pending",
      "pendente",
      "processing",
      "processando",
      "em_analise",
      "under_review",
      "review",
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
      "negado",
      "recusado",
    ].includes(value)
  ) {
    return "rejected";
  }

  if (
    [
      "failed",
      "falhou",
      "falha",
      "error",
      "erro",
      "invalid",
      "invalido",
      "inválido",
    ].includes(value)
  ) {
    return "failed";
  }

  return "not_started";
}

function getVerificationConfig(status: VerificationStatus) {
  switch (status) {
    case "approved":
      return {
        label: "Aprovado",
        description: "Verificação concluída com sucesso.",
        icon: CheckCircle2,
        iconClass: "text-[#35a989]",
        bgClass: "bg-[#35a989]/10",
        borderClass: "border-[#35a989]/20",
        badgeClass: "bg-[#35a989]/10 text-[#16785f]",
      };

    case "pending":
      return {
        label: "Em análise",
        description: "Estamos analisando suas informações.",
        icon: Clock3,
        iconClass: "text-amber-500",
        bgClass: "bg-amber-50",
        borderClass: "border-amber-100",
        badgeClass: "bg-amber-50 text-amber-700",
      };

    case "rejected":
      return {
        label: "Rejeitado",
        description: "A verificação precisa ser revisada.",
        icon: XCircle,
        iconClass: "text-red-500",
        bgClass: "bg-red-50",
        borderClass: "border-red-100",
        badgeClass: "bg-red-50 text-red-700",
      };

    case "failed":
      return {
        label: "Falha",
        description: "Não foi possível concluir a verificação.",
        icon: AlertCircle,
        iconClass: "text-red-500",
        bgClass: "bg-red-50",
        borderClass: "border-red-100",
        badgeClass: "bg-red-50 text-red-700",
      };

    default:
      return {
        label: "Não iniciado",
        description: "Esta verificação ainda não foi concluída.",
        icon: ShieldCheck,
        iconClass: "text-slate-400",
        bgClass: "bg-slate-100",
        borderClass: "border-slate-200",
        badgeClass: "bg-slate-100 text-slate-600",
      };
  }
}

function formatDate(value?: string | null) {
  if (!value) return "Não informado";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Não informado";
  }

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatPhoneBR(value?: string | null) {
  if (!value) return "Não informado";

  const digits = value.replace(/\D/g, "");

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return value;
}

function getInitials(name?: string | null) {
  if (!name) return "M";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function InfoCard({
  icon,
  label,
  value,
  verified,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  verified?: boolean;
}) {
  return (
    <div className="group rounded-[22px] border border-slate-200/80 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#35a989]/30 hover:shadow-lg hover:shadow-slate-200/40">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#35a989]/10 text-[#35a989]">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </p>

            {verified && (
              <CheckCircle2 size={14} className="text-[#35a989]" />
            )}
          </div>

          <p className="truncate text-sm font-bold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusMiniCard({
  icon,
  label,
  status,
  positive = false,
}: {
  icon: ReactNode;
  label: string;
  status: string;
  positive?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur-md">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
          {label}
        </p>

        <p
          className={`truncate text-xs font-bold ${
            positive ? "text-emerald-300" : "text-white"
          }`}
        >
          {status}
        </p>
      </div>
    </div>
  );
}

function VerificationCard({
  title,
  description,
  verification,
}: VerificationCardProps) {
  const status = normalizarStatus(verification?.status);
  const config = getVerificationConfig(status);
  const Icon = config.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${config.borderClass}`}
    >
      <div className="absolute right-0 top-0 h-28 w-28 translate-x-10 -translate-y-10 rounded-full bg-[#35a989]/5 blur-2xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.bgClass}`}
          >
            <Icon size={23} className={config.iconClass} />
          </div>

          <span
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${config.badgeClass}`}
          >
            {config.label}
          </span>
        </div>

        <div className="mt-5">
          <h3 className="text-base font-extrabold text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>

        {verification?.message && (
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            {verification.message}
          </div>
        )}

        {verification?.reason && (
          <div className="mt-3 rounded-2xl bg-red-50 p-3 text-xs leading-5 text-red-700">
            <strong>Motivo:</strong> {verification.reason}
          </div>
        )}

        {status === "approved" && verification?.verified_at && (
          <p className="mt-4 text-[11px] font-medium text-slate-400">
            Verificado em {formatDate(verification.verified_at)}
          </p>
        )}
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-medium text-slate-800 outline-none transition focus:border-[#35a989] focus:bg-white focus:ring-4 focus:ring-[#35a989]/10"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative z-10 w-full max-w-lg">{children}</div>
    </div>
  );
}

export default function PerfilPage() {
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingVerification, setRefreshingVerification] = useState(false);

  const [imgSrc, setImgSrc] = useState<string | null>(null);
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

  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [enviandoTelefone, setEnviandoTelefone] = useState(false);
  const [tipoConfirmacao, setTipoConfirmacao] = useState<
    "email" | "telefone" | null
  >(null);
  const [codigoConfirmacao, setCodigoConfirmacao] = useState("");
  const [confirmandoCodigo, setConfirmandoCodigo] = useState(false);

  const carregarUsuario = useCallback(
    async (showLoader = true, showRefresh = false) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        if (showRefresh) {
          setRefreshingVerification(true);
        }

        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401 || response.status === 403) {
          router.replace("/");
          return;
        }

        if (!response.ok) {
          throw new Error("Não foi possível carregar seu perfil.");
        }

        const data = await response.json();

        const raw = data?.usuario ?? data?.user ?? data?.data ?? data;

        if (!raw?.id) {
          router.replace("/");
          return;
        }

        const verification = raw?.verification ?? {};

        const justification =
          verification?.justification ??
          raw?.justification ?? {
            status:
              raw?.justification_status ??
              raw?.justificationStatus,
            reason:
              raw?.justification_reason ??
              raw?.justificationReason,
            message:
              raw?.justification_message ??
              raw?.justificationMessage,
            verified_at:
              raw?.justification_verified_at ??
              raw?.justificationVerifiedAt,
          };

        const livesheet =
          verification?.livesheet ??
          verification?.liveness ??
          raw?.livesheet ??
          raw?.liveness ?? {
            status:
              raw?.livesheet_status ??
              raw?.liveness_status ??
              raw?.livesheetStatus,
            reason:
              raw?.livesheet_reason ??
              raw?.liveness_reason,
            message:
              raw?.livesheet_message ??
              raw?.liveness_message,
            verified_at:
              raw?.livesheet_verified_at ??
              raw?.liveness_verified_at,
          };

        const normalized: Usuario = {
          ...raw,
          verification: {
            justification,
            livesheet,
            liveness: livesheet,
          },
        };

        setUsuario(normalized);
        setImgSrc(normalized.profile_image || null);
      } catch (error) {
        console.error(error);

        if (showLoader) {
          setAlert({
            type: "error",
            message: "Não foi possível carregar seus dados.",
          });
        }
      } finally {
        if (showLoader) {
          setLoading(false);
        }

        if (showRefresh) {
          setRefreshingVerification(false);
        }
      }
    },
    [router]
  );

  useEffect(() => {
    carregarUsuario(true);
  }, [carregarUsuario]);

  const atualizarVerificacoes = async () => {
    try {
      setRefreshingVerification(true);
      await carregarUsuario(false, false);

      setAlert({
        type: "success",
        message: "Status atualizado com sucesso.",
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
    return (
      usuario?.verification?.justification ?? {
        status: usuario?.justification_status,
      }
    );
  }, [usuario]);

  const livesheet = useMemo(() => {
    return (
      usuario?.verification?.livesheet ??
      usuario?.verification?.liveness ?? {
        status: usuario?.livesheet_status,
      }
    );
  }, [usuario]);

  const possuiVerificacaoPendente = useMemo(() => {
    return (
      normalizarStatus(justificativa?.status) === "pending" ||
      normalizarStatus(livesheet?.status) === "pending"
    );
  }, [justificativa, livesheet]);

  useEffect(() => {
    if (!possuiVerificacaoPendente) {
      return;
    }

    const interval = setInterval(() => {
      carregarUsuario(false, false);
    }, 15000);

    return () => clearInterval(interval);
  }, [possuiVerificacaoPendente, carregarUsuario]);

  useEffect(() => {
    if (!alert) return;

    const timeout = setTimeout(() => {
      setAlert(null);
    }, 3500);

    return () => clearTimeout(timeout);
  }, [alert]);

  useEffect(() => {
    const sidebar = window.localStorage.getItem("sidebar");

    if (sidebar === "collapsed") {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "sidebar",
      collapsed ? "collapsed" : "expanded"
    );
  }, [collapsed]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (!uploading) {
        setShowPhotoModal(false);
      }

      if (!savingPassword) {
        setShowPasswordModal(false);
      }

      if (!confirmandoCodigo) {
        setTipoConfirmacao(null);
        setCodigoConfirmacao("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [uploading, savingPassword, confirmandoCodigo]);

  const contaBloqueada =
    usuario?.is_active === 0 ||
    usuario?.is_active === false ||
    usuario?.is_temp_blocked === 1 ||
    usuario?.is_temp_blocked === true;

  const tipoUsuario =
    usuario?.tipo === "driver" ? "Motorista" : "Passageiro";

  const emailVerificado = !!usuario?.email_verified_at;
  const telefoneVerificado = !!usuario?.phone_verified_at;

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
    setShowPasswordModal(true);
  };

  const enviarConfirmacao = async (
    tipo: "email" | "telefone"
  ) => {
    if (!usuario) return;

    if (tipo === "email" && emailVerificado) {
      setAlert({
        type: "success",
        message: "Seu e-mail já está verificado.",
      });
      return;
    }

    if (tipo === "telefone" && telefoneVerificado) {
      setAlert({
        type: "success",
        message: "Seu telefone já está verificado.",
      });
      return;
    }

    if (tipo === "email" && !usuario.email) {
      setAlert({
        type: "error",
        message: "Não existe um e-mail cadastrado.",
      });
      return;
    }

    if (tipo === "telefone" && !usuario.phone) {
      setAlert({
        type: "error",
        message: "Não existe um telefone cadastrado.",
      });
      return;
    }

    if (contaBloqueada) {
      setAlert({
        type: "error",
        message: "Sua conta está bloqueada no momento.",
      });
      return;
    }

    if (tipo === "email") {
      setEnviandoEmail(true);
    } else {
      setEnviandoTelefone(true);
    }

    try {
      const response = await fetch("/api/send-verification", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "send",
          type: tipo === "email" ? "email" : "phone",
          email: usuario.email || undefined,
          phone: usuario.phone || undefined,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Não foi possível enviar a confirmação por ${
              tipo === "email" ? "e-mail" : "telefone"
            }.`
        );
      }

      setTipoConfirmacao(tipo);
      setCodigoConfirmacao("");

      setAlert({
        type: "success",
        message:
          tipo === "email"
            ? "Código de confirmação enviado para seu e-mail."
            : "Código de confirmação enviado para seu telefone.",
      });
    } catch (error) {
      console.error("Erro ao enviar confirmação:", error);

      setAlert({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar a confirmação.",
      });
    } finally {
      setEnviandoEmail(false);
      setEnviandoTelefone(false);
    }
  };

  const confirmarContato = async () => {
    if (!tipoConfirmacao || !usuario) return;

    const codigo = codigoConfirmacao.replace(/\D/g, "").trim();

    if (codigo.length !== 6) {
      setAlert({
        type: "error",
        message: "Digite o código de confirmação de 6 dígitos.",
      });
      return;
    }

    try {
      setConfirmandoCodigo(true);

      const response = await fetch("/api/send-verification", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "verify",
          type:
            tipoConfirmacao === "email"
              ? "email"
              : "phone",
          email: usuario.email || undefined,
          phone: usuario.phone || undefined,
          code: codigo,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Código de confirmação inválido."
        );
      }

      const tipoConfirmado = tipoConfirmacao;

      setTipoConfirmacao(null);
      setCodigoConfirmacao("");

      await carregarUsuario(false, false);

      setAlert({
        type: "success",
        message:
          tipoConfirmado === "email"
            ? "E-mail confirmado com sucesso."
            : "Telefone confirmado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao confirmar contato:", error);

      setAlert({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível confirmar o código.",
      });
    } finally {
      setConfirmandoCodigo(false);
    }
  };

  const handleSalvarSenha = async () => {
    setErro("");

    if (!senha.trim()) {
      setErro("Digite uma nova senha.");
      return;
    }

    if (senha.length < 8) {
      setErro("A senha deve possuir pelo menos 8 caracteres.");
      return;
    }

    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setSavingPassword(true);

      const response = await fetch("/api/change-password", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: senha,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Não foi possível alterar sua senha."
        );
      }

      setShowPasswordModal(false);

      setAlert({
        type: "success",
        message: "Senha alterada com sucesso.",
      });

      setSenha("");
      setConfirmar("");
      setShowSenha(false);
      setShowConfirmar(false);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao alterar a senha."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSelecionarFoto = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

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
        message: "A imagem deve ter no máximo 5 MB.",
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

    event.target.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("photo", selectedFile);

      const response = await fetch("/api/upload-photo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Não foi possível atualizar sua foto."
        );
      }

      if (data?.url) {
        setImgSrc(data.url);

        setUsuario((current) =>
          current
            ? {
                ...current,
                profile_image: data.url,
              }
            : current
        );
      }

      setShowPhotoModal(false);
      setSelectedFile(null);

      if (previewSrc) {
        URL.revokeObjectURL(previewSrc);
      }

      setPreviewSrc(null);

      await carregarUsuario(false, false);

      setAlert({
        type: "success",
        message: "Foto de perfil atualizada com sucesso.",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar a foto.",
      });
    } finally {
      setUploading(false);
    }
  };

  const fecharFotoModal = () => {
    if (uploading) return;

    setShowPhotoModal(false);

    if (previewSrc) {
      URL.revokeObjectURL(previewSrc);
    }

    setPreviewSrc(null);
    setSelectedFile(null);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex w-full max-w-sm flex-col items-center rounded-[30px] border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#35a989]/10">
            <Loader2
              className="animate-spin text-[#35a989]"
              size={28}
            />
          </div>

          <h2 className="mt-5 text-lg font-extrabold text-slate-900">
            Carregando seu perfil
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Aguarde enquanto buscamos seus dados.
          </p>
        </div>
      </main>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <main className="min-h-screen overflow-hidden text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#35a989]/10 blur-3xl" />
        <div className="absolute -right-32 top-[40%] h-96 w-96 rounded-full bg-emerald-200/20 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-[1600px] p-3 transition-all duration-300">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              Meu perfil
            </h1>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[32px] bg-[#0b6e4f] shadow-2xl shadow-[#0b6e4f]/15">
          <div className="absolute inset-0">
            <Image
              src="/bg-carro.png"
              alt=""
              fill
              priority
              className="object-cover object-center opacity-25"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#063d2f] via-[#0b6e4f]/95 to-[#35a989]/60" />
          </div>

          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#58d68d]/20 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative p-5 sm:p-7 lg:p-9">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                <div className="relative shrink-0">
                  <div className="relative h-20 w-20 overflow-hidden rounded-[26px] border-4 border-white/20 bg-white/10 shadow-2xl sm:h-24 sm:w-24">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={usuario.full_name || "Foto de perfil"}
                        fill
                        sizes="96px"
                        className="object-cover"
                        onError={() => setImgSrc(null)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/20 to-white/5 text-2xl font-black text-white">
                        {getInitials(usuario.full_name)}
                      </div>
                    )}
                  </div>

                  <label className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-2 border-[#0b6e4f] bg-white text-[#35a989] shadow-lg transition hover:scale-105">
                    <Camera size={16} />

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSelecionarFoto}
                    />
                  </label>
                </div>

                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/80 backdrop-blur-md">
                      {tipoUsuario}
                    </span>

                    {contaBloqueada ? (
                      <span className="rounded-full bg-red-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-red-100">
                        Conta bloqueada
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-100">
                        Conta ativa
                      </span>
                    )}
                  </div>

                  <h2 className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {usuario.full_name || "Usuário Maylon"}
                  </h2>

                  <p className="mt-1 truncate text-sm text-white/60">
                    {usuario.email || "E-mail não informado"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:min-w-[390px]">
                <StatusMiniCard
                  icon={<Mail size={16} className="text-white" />}
                  label="E-mail"
                  status={emailVerificado ? "Verificado" : "Pendente"}
                  positive={emailVerificado}
                />

                <StatusMiniCard
                  icon={<Phone size={16} className="text-white" />}
                  label="Telefone"
                  status={
                    telefoneVerificado ? "Verificado" : "Pendente"
                  }
                  positive={telefoneVerificado}
                />

                <StatusMiniCard
                  icon={<ShieldCheck size={16} className="text-white" />}
                  label="Conta"
                  status={contaBloqueada ? "Bloqueada" : "Ativa"}
                  positive={!contaBloqueada}
                />
              </div>
            </div>
          </div>
        </section>

        {alert && (
          <div
            className={`mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-md ${
              alert.type === "success"
                ? "border-[#35a989] bg-[#35a989] text-white shadow-[#35a989]/20"
                : "border-red-300 bg-red-500 text-white shadow-red-500/20"
            }`}
          >
            {alert.type === "success" ? (
              <CheckCircle2 size={19} className="shrink-0" />
            ) : (
              <AlertCircle size={19} className="shrink-0" />
            )}

            <p className="flex-1 text-sm font-semibold">
              {alert.message}
            </p>
          </div>
        )}

        {(!emailVerificado || !telefoneVerificado) && (
          <section className="mt-5 overflow-hidden rounded-[28px] border border-[#35a989]/30 bg-gradient-to-br from-[#35a989]/10 via-white to-[#08a89d]/5 shadow-md shadow-[#35a989]/10">
            <div className="p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#35a989] text-white shadow-lg shadow-[#35a989]/20">
                    <ShieldCheck size={20} />
                  </div>

                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      Confirme seus contatos
                    </h2>

                    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
                      Confirme seu e-mail e telefone para aumentar a
                      segurança da sua conta e liberar todos os recursos
                      da Maylon.
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 lg:w-[300px]">
                  {!emailVerificado && (
                    <button
                      type="button"
                      onClick={() => enviarConfirmacao("email")}
                      disabled={
                        enviandoEmail ||
                        enviandoTelefone ||
                        contaBloqueada
                      }
                      className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#35a989] px-4 text-xs font-extrabold text-white shadow-lg shadow-[#35a989]/20 transition-all duration-200 hover:bg-[#2f9d80] hover:shadow-xl hover:shadow-[#35a989]/25 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {enviandoEmail ? (
                        <>
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                          Enviando e-mail...
                        </>
                      ) : (
                        <>
                          <Mail size={16} />
                          Enviar confirmação por e-mail
                        </>
                      )}
                    </button>
                  )}

                  {!telefoneVerificado && (
                    <button
                      type="button"
                      onClick={() => enviarConfirmacao("telefone")}
                      disabled={
                        enviandoTelefone ||
                        enviandoEmail ||
                        contaBloqueada
                      }
                      className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#35a989]/40 bg-white px-4 text-xs font-extrabold text-[#16785f] shadow-sm transition-all duration-200 hover:border-[#35a989] hover:bg-[#35a989]/10 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {enviandoTelefone ? (
                        <>
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                          Enviando código...
                        </>
                      ) : (
                        <>
                          <Phone size={16} />
                          Enviar confirmação por telefone
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div
                  className={`rounded-2xl border p-4 ${
                    emailVerificado
                      ? "border-[#35a989]/30 bg-[#35a989]/10"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        emailVerificado
                          ? "bg-[#35a989] text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Mail size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white">
                        E-mail
                      </p>

                      <p className="truncate text-sm font-bold text-slate-700">
                        {usuario.email || "Não informado"}
                      </p>
                    </div>

                    {emailVerificado ? (
                      <CheckCircle2
                        size={19}
                        className="shrink-0 text-[#35a989]"
                      />
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-4 ${
                    telefoneVerificado
                      ? "border-[#35a989]/30 bg-[#35a989]/10"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        telefoneVerificado
                          ? "bg-[#35a989] text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Phone size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Telefone
                      </p>

                      <p className="truncate text-sm font-bold text-slate-700">
                        {formatPhoneBR(usuario.phone)}
                      </p>
                    </div>

                    {telefoneVerificado ? (
                      <CheckCircle2
                        size={19}
                        className="shrink-0 text-[#35a989]"
                      />
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mt-7">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">
                Verificações da conta
              </h2>

              <p className="mt-0 max-w-2xl text-sm leading-6 text-white/80">
                Acompanhe o status das verificações necessárias para
                utilizar todos os recursos da Maylon.
              </p>
            </div>

            <button
              type="button"
              onClick={atualizarVerificacoes}
              disabled={refreshingVerification}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:border-[#35a989]/30 hover:text-[#35a989] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  refreshingVerification ? "animate-spin" : ""
                }
              />
              Atualizar
            </button>
          </div>

          {possuiVerificacaoPendente && (
            <div className="mb-4 flex items-start gap-3 rounded-[22px] border border-amber-200 bg-amber-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Clock3 size={19} />
              </div>

              <div>
                <p className="text-sm font-extrabold text-amber-900">
                  Verificação em andamento
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-800/80">
                  Seus dados estão sendo analisados. O status será
                  atualizado automaticamente.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <VerificationCard
              title="Justificativa"
              description="Acompanhe a validação das informações fornecidas no processo de cadastro."
              verification={justificativa}
            />

            <VerificationCard
              title="LiveSheet / Liveness"
              description="Verificação de presença e autenticidade para aumentar a segurança da sua conta."
              verification={livesheet}
            />
          </div>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#35a989]/10 text-[#35a989]">
                <UserRoundCheck size={22} />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Informações pessoais
                </h2>

                <p className="text-sm text-slate-500">
                  Dados vinculados à sua conta Maylon.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard
                icon={<User size={19} />}
                label="Nome completo"
                value={usuario.full_name || "Não informado"}
              />

              <InfoCard
                icon={<Phone size={19} />}
                label="Telefone"
                value={formatPhoneBR(usuario.phone)}
                verified={telefoneVerificado}
              />

              <InfoCard
                icon={<Mail size={19} />}
                label="E-mail"
                value={usuario.email || "Não informado"}
                verified={emailVerificado}
              />

              <InfoCard
                icon={<BadgeCheck size={19} />}
                label={usuario.identification_type || "Identificação"}
                value={
                  usuario.identification_number || "Não informado"
                }
                verified={!!usuario.identification_verified_at}
              />
            </div>

            <div className="mt-3 flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#35a989] shadow-sm">
                  <Smartphone size={19} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Tipo de conta
                  </p>

                  <p className="mt-1 text-sm font-extrabold text-slate-800">
                    {tipoUsuario}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-[#35a989]/10 px-3 py-1.5 text-xs font-bold text-[#16785f]">
                Maylon
              </span>
            </div>

            {usuario.identification_verified_at && (
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#35a989]">
                <Check size={15} />
                Identificação verificada em{" "}
                {formatDate(usuario.identification_verified_at)}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-[#0b6e4f] to-[#35a989] p-5 text-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                  <LockKeyhole size={21} />
                </div>

                <h2 className="mt-4 text-lg font-black">
                  Segurança
                </h2>

                <p className="mt-1 text-sm leading-6 text-white/65">
                  Mantenha sua conta protegida utilizando uma senha forte.
                </p>
              </div>

              <div className="p-5">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#35a989]/10 text-[#35a989]">
                    <KeyRound size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-extrabold text-slate-800">
                      Senha da conta
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Recomendamos atualizar sua senha regularmente.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={abrirModalSenha}
                  disabled={contaBloqueada}
                  className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#35a989] px-4 text-sm font-extrabold text-white shadow-lg shadow-[#35a989]/20 transition hover:-translate-y-0.5 hover:bg-[#2f9d80] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  <LockKeyhole size={17} />
                  Alterar senha
                </button>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    contaBloqueada
                      ? "bg-red-50 text-red-500"
                      : "bg-[#35a989]/10 text-[#35a989]"
                  }`}
                >
                  {contaBloqueada ? (
                    <XCircle size={21} />
                  ) : (
                    <ShieldCheck size={21} />
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Status da conta
                  </p>

                  <h3 className="mt-1 text-base font-black text-slate-900">
                    {contaBloqueada
                      ? "Conta bloqueada"
                      : "Conta ativa"}
                  </h3>
                </div>
              </div>

              <div
                className={`mt-5 rounded-2xl p-4 ${
                  contaBloqueada
                    ? "bg-red-50"
                    : "bg-[#35a989]/5"
                }`}
              >
                <p
                  className={`text-xs leading-5 ${
                    contaBloqueada
                      ? "text-red-700"
                      : "text-slate-600"
                  }`}
                >
                  {contaBloqueada
                    ? "Alguns recursos da sua conta podem estar temporariamente indisponíveis."
                    : "Sua conta está ativa e pronta para utilizar os recursos disponíveis da Maylon."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {tipoConfirmacao && (
        <ModalOverlay
          onClose={() => {
            if (!confirmandoCodigo) {
              setTipoConfirmacao(null);
              setCodigoConfirmacao("");
            }
          }}
        >
          <div className="overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-[#0b6e4f] to-[#35a989] p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                    {tipoConfirmacao === "email" ? (
                      <Mail size={22} />
                    ) : (
                      <Phone size={22} />
                    )}
                  </div>

                  <h2 className="mt-4 text-xl font-black">
                    Confirmar{" "}
                    {tipoConfirmacao === "email"
                      ? "e-mail"
                      : "telefone"}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-white/70">
                    Enviamos um código de confirmação para{" "}
                    {tipoConfirmacao === "email"
                      ? usuario.email?.replace(
                          /^(.{2}).*(@.*)$/,
                          "$1***$2"
                        )
                      : formatPhoneBR(usuario.phone)}
                    .
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!confirmandoCodigo) {
                      setTipoConfirmacao(null);
                      setCodigoConfirmacao("");
                    }
                  }}
                  disabled={confirmandoCodigo}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Código de confirmação
              </label>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={codigoConfirmacao}
                onChange={(event) =>
                  setCodigoConfirmacao(
                    event.target.value.replace(/\D/g, "")
                  )
                }
                placeholder="000000"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-xl font-black tracking-[0.4em] text-slate-800 outline-none transition focus:border-[#35a989] focus:bg-white focus:ring-4 focus:ring-[#35a989]/10"
              />

              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex gap-3">
                  <ShieldCheck
                    size={18}
                    className="mt-0.5 shrink-0 text-[#35a989]"
                  />

                  <p className="text-xs leading-5 text-slate-500">
                    Digite o código de 6 dígitos recebido para confirmar
                    seu{" "}
                    {tipoConfirmacao === "email"
                      ? "endereço de e-mail"
                      : "número de telefone"}
                    .
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTipoConfirmacao(null);
                    setCodigoConfirmacao("");
                  }}
                  disabled={confirmandoCodigo}
                  className="flex h-12 flex-1 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={confirmarContato}
                  disabled={
                    confirmandoCodigo ||
                    codigoConfirmacao.length !== 6
                  }
                  className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#35a989] text-sm font-extrabold text-white shadow-lg shadow-[#35a989]/20 transition hover:bg-[#2f9d80] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {confirmandoCodigo ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      Confirmar
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => enviarConfirmacao(tipoConfirmacao)}
                disabled={
                  confirmandoCodigo ||
                  enviandoEmail ||
                  enviandoTelefone
                }
                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 text-xs font-bold text-[#35a989] transition hover:text-[#16785f] disabled:opacity-50"
              >
                <RefreshCw size={14} />
                Enviar código novamente
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {showPhotoModal && previewSrc && (
        <ModalOverlay onClose={fecharFotoModal}>
          <div className="overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Atualizar foto
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Confira sua nova foto antes de salvar.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharFotoModal}
                disabled={uploading}
                className="flex cursor-pointer h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="relative mx-auto aspect-square max-w-[280px] overflow-hidden rounded-[30px] bg-slate-100">
                <Image
                  src={previewSrc}
                  alt="Pré-visualização da foto"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={fecharFotoModal}
                  disabled={uploading}
                  className="flex cursor-pointer h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex cursor-pointer h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#35a989] text-sm font-extrabold text-white shadow-lg shadow-[#35a989]/20 transition hover:bg-[#2f9d80] disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Camera size={17} />
                      Salvar foto
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {showPasswordModal && (
        <ModalOverlay
          onClose={() => {
            if (!savingPassword) {
              setShowPasswordModal(false);
            }
          }}
        >
          <div className="overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-[#0b6e4f] to-[#35a989] p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                    <LockKeyhole size={21} />
                  </div>

                  <h2 className="mt-4 text-xl font-black">
                    Alterar senha
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-white/65">
                    Crie uma senha forte para manter sua conta segura.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={savingPassword}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="space-y-4">
                <PasswordInput
                  label="Nova senha"
                  value={senha}
                  onChange={setSenha}
                  show={showSenha}
                  onToggle={() =>
                    setShowSenha((value) => !value)
                  }
                  placeholder="Digite sua nova senha"
                />

                <PasswordInput
                  label="Confirmar nova senha"
                  value={confirmar}
                  onChange={setConfirmar}
                  show={showConfirmar}
                  onToggle={() =>
                    setShowConfirmar((value) => !value)
                  }
                  placeholder="Digite novamente"
                />
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex gap-3">
                  <ShieldCheck
                    size={18}
                    className="mt-0.5 shrink-0 text-[#35a989]"
                  />

                  <div>
                    <p className="text-xs font-extrabold text-slate-700">
                      Dica de segurança
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      Use pelo menos 8 caracteres, combinando letras,
                      números e símbolos.
                    </p>
                  </div>
                </div>
              </div>

              {erro && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  <AlertCircle
                    size={16}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{erro}</span>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={savingPassword}
                  className="h-12 flex-1 cursor-pointer rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSalvarSenha}
                  disabled={savingPassword}
                  className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#35a989] text-sm font-extrabold text-white shadow-lg shadow-[#35a989]/20 transition hover:bg-[#2f9d80] disabled:opacity-60"
                >
                  {savingPassword ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Alterando senha...
                    </>
                  ) : (
                    <>
                      <Check size={17} />
                      Salvar senha
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}
    </main>
  );
}