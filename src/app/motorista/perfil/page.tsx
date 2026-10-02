"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  BadgeCheck,
  Brain,
  Camera,
  Car,
  Check,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  FileCheck2,
  Headset,
  IdCard,
  Lock,
  LockKeyhole,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Scale,
  ShieldCheck,
  User,
  UserRound,
  UserRoundCheck,
  X,
} from "lucide-react";
import { documentacaoBloqueia, verifDocPendente } from "../../lib/didit";

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
  user_type: "driver" | "customer";
  data_aquisicao?: string | null;
  nome_plano?: string | null;
  plano_nome?: string | null;
  plano?: string | null;
  gerente?: Gerente | null;
  pcd?: boolean | null;
  autista?: boolean | null;
  verification?: {
    documento?: VerificacaoDocumento | null;
  };
};

type VerificacaoStatus =
  | "nao_iniciado"
  | "pendente"
  | "em_analise"
  | "aprovado"
  | "reprovado";

type Verificacao = {
  status: VerificacaoStatus;
  mensagem?: string;
};

type VerificacaoDocumento = {
  status: VerificacaoStatus;
  didit_status?: string | null;
  is_verified?: boolean;
  identity_match?: unknown;
};

type AccessibilityStatus = {
  status: VerificacaoStatus;
  mensagem?: string;
};

const foco = `focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#149C8B]/30`;

const botaoPrimario = `inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#149C8B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#11897D] disabled:cursor-not-allowed disabled:opacity-60 ${foco}`;

const botaoSecundario = `inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 ${foco}`;

const botaoFechar = `flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 ${foco}`;

const cartao =
  "rounded-2xl bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-3xl";

const inputSenha = `h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#149C8B] focus:bg-white focus:ring-4 focus:ring-[#149C8B]/10`;

function formatarCPF(valor?: string | null) {
  if (!valor) return "Não informado";
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length === 11) {
    return digitos.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  return valor;
}

function formatarStatus(status: VerificacaoStatus) {
  switch (status) {
    case "aprovado":
      return "Aprovado";
    case "reprovado":
      return "Reprovado";
    case "pendente":
      return "Pendente";
    case "em_analise":
      return "Em análise";
    default:
      return "Não iniciado";
  }
}

function mensagemVerificacaoDocumento(status: VerificacaoStatus) {
  switch (status) {
    case "aprovado":
      return "Documentação validada com sucesso.";
    case "reprovado":
      return "Não foi possível validar a documentação. Tente novamente.";
    case "em_analise":
      return "Sua documentação está em análise.";
    case "pendente":
      return "Sua documentação está pendente de verificação.";
    default:
      return "Essa verificação ainda não foi realizada.";
  }
}

function statusClasses(status: VerificacaoStatus) {
  switch (status) {
    case "aprovado":
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        box: "border-emerald-100 bg-emerald-50/60",
        icon: "bg-emerald-100 text-emerald-600",
      };
    case "reprovado":
      return {
        badge: "border-red-200 bg-red-50 text-red-700",
        box: "border-red-100 bg-red-50/60",
        icon: "bg-red-100 text-red-600",
      };
    case "pendente":
    case "em_analise":
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        box: "border-amber-100 bg-amber-50/60",
        icon: "bg-amber-100 text-amber-600",
      };
    default:
      return {
        badge: "border-slate-200 bg-slate-50 text-slate-600",
        box: "border-slate-100 bg-slate-50",
        icon: "bg-white text-slate-500",
      };
  }
}

function CabecalhoSecao({
  icon: Icon,
  titulo,
  descricao,
}: {
  icon: LucideIcon;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:gap-4 sm:px-6 sm:py-5 lg:px-7">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF6F4] text-[#149C8B] sm:h-11 sm:w-11">
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
          {titulo}
        </h2>
        <p className="text-xs text-gray-500 sm:text-sm">{descricao}</p>
      </div>
    </div>
  );
}

function SeloVerificacao({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      <ShieldCheck size={12} />
      Verificado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      <CircleAlert size={12} />
      Pendente
    </span>
  );
}

function Campo({
  icon: Icon,
  label,
  children,
  selo,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  selo?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3.5 border-b border-gray-100 py-4 last:border-b-0 sm:[&:nth-child(n+3)]:border-b-0">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF6F4] text-[#149C8B] sm:h-10 sm:w-10">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <dt className="text-xs font-medium text-gray-500 sm:text-sm">
            {label}
          </dt>
          {selo}
        </div>
        <dd className="mt-0.5 text-sm font-semibold text-gray-900 [overflow-wrap:anywhere] sm:text-base">
          {children}
        </dd>
      </div>
    </div>
  );
}

function CampoSenha({
  id,
  label,
  value,
  onChange,
  placeholder,
  visivel,
  onToggle,
  dica,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder: string;
  visivel: boolean;
  onToggle: () => void;
  dica?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <div className="relative">
        <LockKeyhole
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          id={id}
          type={visivel ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className={inputSenha}
        />
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggle();
          }}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          title={visivel ? "Ocultar senha" : "Mostrar senha"}
          className={`absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:text-gray-700 ${foco}`}
        >
          {visivel ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
      {dica && <p className="mt-1.5 text-xs text-gray-500">{dica}</p>}
    </div>
  );
}

function VerificacaoCard({
  icon: Icon,
  titulo,
  descricao,
  verification,
  onRefresh,
  refreshing,
}: {
  icon: LucideIcon;
  titulo: string;
  descricao: string;
  verification: Verificacao;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const classes = statusClasses(verification.status);
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF6F4] text-[#149C8B]">
              <Icon size={23} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                {titulo}
              </h3>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {descricao}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${classes.badge}`}
          >
            <ShieldCheck size={14} />
            {formatarStatus(verification.status)}
          </span>
        </div>
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${classes.box}`}
        >
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Situação
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {verification.mensagem ||
                (verification.status === "nao_iniciado"
                  ? "Essa verificação ainda não foi realizada."
                  : formatarStatus(verification.status))}
            </p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRefresh();
            }}
            disabled={refreshing}
            aria-label={`Atualizar ${titulo}`}
            title={`Atualizar ${titulo}`}
            className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-[#149C8B] disabled:cursor-not-allowed disabled:opacity-50 ${foco}`}
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AccessibilityOption({
  title,
  description,
  selected,
  disabled,
  onClick,
  icon: Icon,
}: {
  title: string;
  description: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: LucideIcon;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={`flex w-full cursor-pointer items-start gap-4 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? "border-[#35a989] bg-[#35a989]/5 ring-2 ring-[#35a989]/10"
          : "border-slate-200 bg-white hover:border-[#35a989]/40 hover:bg-slate-50"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-[#35a989] text-white" : "bg-[#EAF6F4] text-[#35a989]"}`}
      >
        <Icon size={21} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {selected && (
            <CheckCircle2 size={19} className="shrink-0 text-[#35a989]" />
          )}
        </div>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
    </button>
  );
}

function AccessibilityStatusCard({
  title,
  verification,
  icon: Icon,
}: {
  title: string;
  verification: AccessibilityStatus;
  icon: LucideIcon;
}) {
  const classes = statusClasses(verification.status);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6F4] text-[#35a989]">
          <Icon size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          <p className="mt-1 text-xs text-slate-500">
            {verification.mensagem || formatarStatus(verification.status)}
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classes.badge}`}
        >
          {formatarStatus(verification.status)}
        </span>
      </div>
    </div>
  );
}

function LaudoUploadForm({
  disabled,
  uploading,
  onSubmit,
}: {
  disabled: boolean;
  uploading: boolean;
  onSubmit: (file: File) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div className="rounded-2xl border border-dashed border-[#35a989]/30 bg-[#35a989]/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-semibold text-slate-900">Enviar documentação</h4>
          <p className="mt-1 text-sm text-slate-500">
            Envie o laudo ou documento necessário para análise.
          </p>
        </div>
        <label
          className={`inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 ${disabled ? "pointer-events-none opacity-50" : ""}`}
        >
          {file ? file.name : "Selecionar arquivo"}
          <input
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            disabled={disabled}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) setFile(selected);
            }}
          />
        </label>
      </div>
      {file && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Arquivo selecionado: <strong>{file.name}</strong>
          </p>
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={async (event) => {
              event.preventDefault();
              event.stopPropagation();
              await onSubmit(file);
              setFile(null);
            }}
            className={botaoPrimario}
          >
            {uploading ? "Enviando..." : "Enviar documentação"}
          </button>
        </div>
      )}
    </div>
  );
}

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
  const [pcdSelected, setPcdSelected] = useState(false);
  const [autistaSelected, setAutistaSelected] = useState(false);
  const [salvandoAcessibilidade, setSalvandoAcessibilidade] = useState(false);
  const [contaBloqueada] = useState(false);
  const [uploadingLaudo, setUploadingLaudo] = useState(false);
  const [verificationPcd, setVerificationPcd] = useState<AccessibilityStatus>({
    status: "nao_iniciado",
    mensagem: "Essa verificação ainda não foi realizada.",
  });
  const [verificationAutista, setVerificationAutista] =
    useState<AccessibilityStatus>({
      status: "nao_iniciado",
      mensagem: "Essa verificação ainda não foi realizada.",
    });
  const [justificativa, setJustificativa] = useState<Verificacao>({
    status: "nao_iniciado",
    mensagem: "Essa verificação ainda não foi realizada.",
  });
  const [liveness, setLiveness] = useState<Verificacao>({
    status: "nao_iniciado",
    mensagem: "Essa verificação ainda não foi realizada.",
  });
  const [processosJudiciais, setProcessosJudiciais] = useState<Verificacao>({
    status: "nao_iniciado",
    mensagem: "Essa consulta ainda não foi realizada.",
  });
  const [refreshJustificativa, setRefreshJustificativa] = useState(false);
  const [refreshLiveness, setRefreshLiveness] = useState(false);
  const [refreshProcessosJudiciais, setRefreshProcessosJudiciais] =
    useState(false);
  const [verificacaoUrl, setVerificacaoUrl] = useState<string | null>(null);
  const [iniciandoVerificacao, setIniciandoVerificacao] = useState(false);

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
        if (data.profile_image) setImgSrc(data.profile_image);
        setPcdSelected(Boolean(data.pcd));
        setAutistaSelected(Boolean(data.autista));
        const statusDoc: VerificacaoStatus =
          data.verification?.documento?.status ?? "nao_iniciado";
        setJustificativa({
          status: statusDoc,
          mensagem: mensagemVerificacaoDocumento(statusDoc),
        });
        setLiveness({
          status: statusDoc,
          mensagem: mensagemVerificacaoDocumento(statusDoc),
        });
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    }
    carregarUsuario();
  }, []);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 3500);
    return () => clearTimeout(timer);
  }, [alert]);

  useEffect(() => {
    return () => {
      if (previewSrc) URL.revokeObjectURL(previewSrc);
    };
  }, [previewSrc]);

  const formatPhoneBR = (phone?: string | null) => {
    if (!phone) return "Não informado";
    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("55")) digits = digits.slice(2);
    if (digits.length === 11)
      return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    if (digits.length === 10)
      return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    return phone;
  };

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Erro ao alterar senha.");
        return;
      }
      setAlert({ type: "success", message: "Senha alterada com sucesso." });
      fecharModalSenha();
    } catch (error) {
      console.error(error);
      setErro("Erro interno do servidor.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setAlert({ type: "error", message: "Selecione uma imagem." });
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
      setUsuario((prev) =>
        prev ? { ...prev, profile_image: data.url } : prev,
      );
      setShowModal(false);
      setPreviewSrc(null);
      setSelectedFile(null);
      setAlert({ type: "success", message: "Foto atualizada com sucesso." });
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

  const atualizarStatusDocumento = async (
    setRefresh: (value: boolean) => void,
  ) => {
    try {
      setRefresh(true);
      const res = await fetch("/api/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.id) return;
      setUsuario(data);
      const statusDoc: VerificacaoStatus =
        data.verification?.documento?.status ?? "nao_iniciado";
      setJustificativa({
        status: statusDoc,
        mensagem: mensagemVerificacaoDocumento(statusDoc),
      });
      setLiveness({
        status: statusDoc,
        mensagem: mensagemVerificacaoDocumento(statusDoc),
      });
    } catch (error) {
      console.error("Erro ao atualizar status da verificação:", error);
    } finally {
      setRefresh(false);
    }
  };

  const atualizarJustificativa = () =>
    atualizarStatusDocumento(setRefreshJustificativa);

  const atualizarLiveness = () => atualizarStatusDocumento(setRefreshLiveness);

  const atualizarProcessosJudiciais = async () => {
    try {
      setRefreshProcessosJudiciais(true);
      await new Promise((resolve) => setTimeout(resolve, 700));
      setProcessosJudiciais({
        status: "em_analise",
        mensagem: "A consulta de processos judiciais está em análise.",
      });
    } catch (error) {
      console.error("Erro ao atualizar processos judiciais:", error);
      setProcessosJudiciais({
        status: "reprovado",
        mensagem: "Não foi possível consultar os processos judiciais.",
      });
    } finally {
      setRefreshProcessosJudiciais(false);
    }
  };

  const salvarAcessibilidade = async () => {
    try {
      setSalvandoAcessibilidade(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      setAlert({
        type: "success",
        message: "Informações de acessibilidade atualizadas.",
      });
    } catch (error) {
      console.error(error);
      setAlert({
        type: "error",
        message: "Erro ao salvar acessibilidade.",
      });
    } finally {
      setSalvandoAcessibilidade(false);
    }
  };

  const enviarLaudo = async (file: File) => {
    try {
      setUploadingLaudo(true);
      const formData = new FormData();
      formData.append("file", file);
      await new Promise((resolve) => setTimeout(resolve, 700));
      setAlert({
        type: "success",
        message: "Documentação enviada com sucesso.",
      });
    } catch (error) {
      console.error(error);
      setAlert({
        type: "error",
        message: "Erro ao enviar documentação.",
      });
    } finally {
      setUploadingLaudo(false);
    }
  };

  const iniciarVerificacao = async () => {
    try {
      setIniciandoVerificacao(true);
      const res = await fetch("/api/motorista/verificacao", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({
          type: "error",
          message: data.message || "Erro ao iniciar a verificação.",
        });
        return;
      }
      if (data.url) setVerificacaoUrl(data.url);
    } catch (error) {
      console.error("Erro ao iniciar verificação:", error);
      setAlert({
        type: "error",
        message: "Erro ao iniciar a verificação.",
      });
    } finally {
      setIniciandoVerificacao(false);
    }
  };

  const fecharVerificacao = async () => {
    setVerificacaoUrl(null);
    try {
      const res = await fetch("/api/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.id) setUsuario(data);
      }
    } catch (error) {
      console.error("Erro ao atualizar status da verificação:", error);
    }
  };

  if (loading || !usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-[300px] rounded-2xl border border-gray-200/80 bg-white p-6 text-center shadow-[0_25px_80px_rgba(15,118,110,0.10)] sm:max-w-[340px] sm:rounded-[28px] sm:p-8 md:max-w-[380px] md:rounded-[32px] md:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f766e] shadow-xl shadow-[#0f766e]/20 sm:h-16 sm:w-16 sm:rounded-[20px]">
            <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/30 border-t-white sm:h-7 sm:w-7" />
          </div>
          <h2 className="mt-5 text-base font-black tracking-tight text-[#0f766e] sm:mt-6 sm:text-lg">
            Preparando área do perfil
          </h2>
          <p className="mt-2 text-xs text-gray-400 sm:text-sm">
            Estamos carregando suas informações.
          </p>
        </div>
      </div>
    );
  }

  const ehMotorista = usuario.user_type === "driver";
  const isPassageiro = usuario.user_type === "customer";
  const gerente = usuario.gerente;
  const verificacoes: {
    label: string;
    ok: boolean;
    textoOk: string;
    icon: LucideIcon;
  }[] = [
    {
      label: "E-mail",
      ok: Boolean(usuario.email_verified_at),
      textoOk: "Verificado",
      icon: Mail,
    },
    {
      label: "Telefone",
      ok: Boolean(usuario.phone_verified_at),
      textoOk: "Verificado",
      icon: Phone,
    },
    {
      label: "CPF",
      ok: Boolean(usuario.identification_number),
      textoOk: "Verificado",
      icon: IdCard,
    },
  ];
  const verificados = verificacoes.filter((item) => item.ok).length;
  const progresso = Math.round((verificados / verificacoes.length) * 100);
  const possuiMaylonPassAtivo = Boolean(
    usuario.nome_plano || usuario.plano_nome || usuario.plano,
  );
  const statusDocumento =
    usuario.verification?.documento?.status ?? "nao_iniciado";
  const documentacaoPendente = verifDocPendente(statusDocumento);
  const documentacaoAprovada = statusDocumento === "aprovado";

  return (
    <div className="min-h-screen min-w-0">
      {alert && (
        <div
          role="status"
          className={`fixed left-1/2 top-4 z-[60] flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg sm:top-6 ${
            alert.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {alert.type === "success" ? (
            <CheckCircle2 size={20} className="shrink-0" />
          ) : (
            <CircleAlert size={20} className="shrink-0" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      <main>
        <div className="mx-auto w-full min-w-0 max-w-8xl 2xl:max-w-[1500px]">
          <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
            <div className="relative">
              <Image
                src="/bg-login.png"
                alt=""
                fill
                priority
                sizes="(max-width: 1536px) 100vw, 1500px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#063F3B]/95 via-[#0B6F68]/75 to-[#0B6F68]/30" />
              <div className="relative flex items-start justify-between gap-4 px-5 py-5 sm:px-8 sm:py-7 lg:pl-[324px] lg:pr-8 xl:pl-[344px] 2xl:pl-[364px]">
                <div className="min-w-0 text-white">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Meu perfil
                  </h1>
                  <p className="mt-1.5 hidden max-w-md text-sm text-white/75 sm:block">
                    Gerencie seus dados e a segurança da conta.
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/25 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Conta ativa
                </span>
              </div>
            </div>
          </section>

          <div className="grid items-start gap-5 sm:gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="relative z-10 -mt-2 sm:-mt-4 lg:sticky lg:top-6 lg:mt-6">
              <div
                className={`${cartao} p-5 shadow-xl shadow-teal-950/10 sm:p-6`}
              >
                <div className="flex flex-col items-center md:flex-row md:gap-8 lg:flex-col lg:gap-0">
                  <div className="flex flex-col items-center text-center md:max-w-[45%] md:shrink-0 md:flex-row md:gap-6 md:text-left lg:max-w-none lg:flex-col lg:gap-0 lg:text-center">
                    <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36 xl:h-40 xl:w-40">
                      <svg
                        viewBox="0 0 100 100"
                        className="absolute inset-0 h-full w-full -rotate-90"
                        aria-hidden="true"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="46"
                          fill="none"
                          strokeWidth="4"
                          className="stroke-gray-200"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="46"
                          fill="none"
                          strokeWidth="4"
                          strokeLinecap="round"
                          pathLength={100}
                          strokeDasharray={`${progresso} 100`}
                          className={`stroke-[#149C8B] transition-[stroke-dasharray] duration-700 motion-reduce:transition-none ${progresso === 0 ? "opacity-0" : ""}`}
                        />
                      </svg>
                      <div className="absolute inset-[9px] overflow-hidden rounded-full bg-gray-100 sm:inset-[10px]">
                        <Image
                          src={imgSrc}
                          alt="Foto do perfil"
                          fill
                          sizes="160px"
                          onError={() => setImgSrc("/favicon.ico")}
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        aria-label="Alterar foto do perfil"
                        title="Alterar foto"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          document.getElementById("uploadFoto")?.click();
                        }}
                        className={`absolute bottom-0.5 right-0.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#149C8B] text-white shadow-lg ring-4 ring-white transition hover:bg-[#11897D] sm:h-10 sm:w-10 ${foco}`}
                      >
                        <Pencil size={16} />
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
                          const preview = URL.createObjectURL(file);
                          setPreviewSrc(preview);
                          setShowModal(true);
                          e.target.value = "";
                        }}
                      />
                    </div>

                    <div className="mt-4 min-w-0 md:mt-0 lg:mt-4">
                      <h2 className="text-lg font-semibold text-gray-900 [overflow-wrap:anywhere] sm:text-xl">
                        {usuario.full_name}
                      </h2>
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#EAF6F4] px-3 py-1 text-xs font-medium text-[#0B6F68]">
                        {ehMotorista ? (
                          <Car size={14} />
                        ) : (
                          <UserRound size={14} />
                        )}
                        {ehMotorista ? "Motorista" : "Passageiro"}
                      </span>
                      <p className="mt-2 text-sm text-gray-500 [overflow-wrap:anywhere]">
                        {usuario.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 w-full border-t border-gray-100 pt-5 md:mt-0 md:flex-1 md:border-l md:border-t-0 md:pl-8 md:pt-0 lg:mt-5 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-semibold text-gray-900">
                        Verificação da conta
                      </h2>
                      <span className="text-xs font-medium text-gray-500">
                        {verificados} de {verificacoes.length}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-2.5">
                      {verificacoes.map(
                        ({ label, ok, textoOk, icon: Icone }) => (
                          <li
                            key={label}
                            className="flex items-center gap-3 text-sm"
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                            >
                              <Icone size={16} />
                            </span>
                            <span className="flex-1 font-medium text-gray-700">
                              {label}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium ${ok ? "text-emerald-700" : "text-amber-700"}`}
                            >
                              {ok ? (
                                <CheckCircle2 size={14} />
                              ) : (
                                <CircleAlert size={14} />
                              )}
                              {ok ? textoOk : "Pendente"}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </aside>

            <div className="min-w-0 space-y-5 sm:space-y-6 lg:mt-6">
              {(documentacaoPendente || documentacaoAprovada) && (
                <section
                  role="alert"
                  className={`overflow-hidden rounded-2xl border p-4 sm:p-5 ${
                    documentacaoAprovada
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          documentacaoAprovada
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {documentacaoAprovada ? (
                          <CheckCircle2 size={22} />
                        ) : (
                          <CircleAlert size={22} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
                          {documentacaoAprovada
                            ? "Conta aprovada"
                            : "Documentação pendente de verificação"}
                        </h2>
                        <p className="mt-0.5 text-xs leading-5 text-gray-600 sm:text-sm">
                          {documentacaoAprovada
                            ? "Sua documentação foi aprovada e sua conta está ativa."
                            : "Para usar todos os recursos da conta, é preciso verificar seus documentos de forma segura pela Didit."}
                        </p>
                      </div>
                    </div>
                    {!documentacaoAprovada &&
                      documentacaoBloqueia(statusDocumento) && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            iniciarVerificacao();
                          }}
                          disabled={iniciandoVerificacao}
                          className={`${botaoPrimario} w-full sm:w-auto`}
                        >
                          {iniciandoVerificacao ? (
                            <>
                              <RefreshCw size={18} className="animate-spin" />
                              Iniciando...
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={18} />
                              Iniciar verificação
                            </>
                          )}
                        </button>
                      )}
                  </div>
                </section>
              )}

              <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-start gap-3 border-b border-slate-100 pb-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#35a989]/10 text-[#35a989]">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-900">
                      Verificação da conta
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Acompanhe o status das suas verificações e consultas.
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <VerificacaoCard
                    icon={FileCheck2}
                    titulo="RG, CNH ou Passaport"
                    descricao="Validação das informações e documentos necessários para sua conta."
                    verification={justificativa}
                    onRefresh={atualizarJustificativa}
                    refreshing={refreshJustificativa}
                  />

                  <VerificacaoCard
                    icon={Scale}
                    titulo="Processos Judiciais"
                    descricao="Consulta e acompanhamento de informações relacionadas a processos judiciais."
                    verification={processosJudiciais}
                    onRefresh={atualizarProcessosJudiciais}
                    refreshing={refreshProcessosJudiciais}
                  />

                  {justificativa.status === "aprovado" &&
                    processosJudiciais.status === "aprovado" && (
                      <div className="xl:col-span-2">
                        <VerificacaoCard
                          icon={Eye}
                          titulo="Prova de vida"
                          descricao="Verificação de identidade e confirmação de presença por meio da prova de vida."
                          verification={liveness}
                          onRefresh={atualizarLiveness}
                          refreshing={refreshLiveness}
                        />
                      </div>
                    )}
                </div>
              </section>

              <section className={`${cartao} overflow-hidden`}>
                <CabecalhoSecao
                  icon={ehMotorista ? Car : User}
                  titulo={
                    ehMotorista ? "Dados do motorista" : "Dados do passageiro"
                  }
                  descricao="Informações cadastradas na sua conta."
                />
                <dl className="grid px-5 text-sm sm:grid-cols-2 sm:gap-x-10 sm:px-6 lg:px-7">
                  <Campo icon={User} label="Nome completo">
                    <span className="text-xs font-semibold text-gray-900 [overflow-wrap:anywhere] sm:text-sm">
                      {usuario.full_name}
                    </span>
                  </Campo>
                  <Campo
                    icon={IdCard}
                    label="CPF"
                    selo={
                      <SeloVerificacao
                        ok={Boolean(usuario.identification_number)}
                      />
                    }
                  >
                    <span className="text-xs font-semibold text-gray-900 [overflow-wrap:anywhere] sm:text-sm">
                      {formatarCPF(usuario.identification_number)}
                    </span>
                  </Campo>
                  <Campo
                    icon={Phone}
                    label="Telefone"
                    selo={
                      <SeloVerificacao
                        ok={Boolean(usuario.phone_verified_at)}
                      />
                    }
                  >
                    <span className="text-xs font-semibold text-gray-900 [overflow-wrap:anywhere] sm:text-sm">
                      {formatPhoneBR(usuario.phone)}
                    </span>
                  </Campo>
                  <Campo
                    icon={Mail}
                    label="E-mail"
                    selo={
                      <SeloVerificacao
                        ok={Boolean(usuario.email_verified_at)}
                      />
                    }
                  >
                    <span className="text-xs font-semibold text-gray-900 [overflow-wrap:anywhere] sm:text-sm">
                      {usuario.email}
                    </span>
                  </Campo>
                </dl>
              </section>

              <section className={`${cartao} overflow-hidden`}>
                <CabecalhoSecao
                  icon={UserRoundCheck}
                  titulo="Responsável pelo atendimento"
                  descricao="Quem cuida da sua conta na Maylon."
                />
                <div className="p-5 sm:p-6 lg:p-7">
                  {gerente &&
                  (gerente.full_name || gerente.email || gerente.phone) ? (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#EAF6F4] sm:h-[72px] sm:w-[72px]">
                        {gerente.profile_image ? (
                          <Image
                            src={gerente.profile_image}
                            alt={gerente.full_name || "Gerente"}
                            fill
                            sizes="72px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[#149C8B]">
                            <UserRoundCheck size={28} />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900 [overflow-wrap:anywhere] sm:text-lg">
                            {gerente.full_name || "Gerente responsável"}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF6F4] px-2.5 py-1 text-xs font-medium text-[#0B6F68]">
                            <ShieldCheck size={13} />
                            Gerente
                          </span>
                        </div>
                        <div className="mt-2 flex flex-col gap-1.5 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:gap-x-6">
                          {gerente.email && (
                            <a
                              href={`mailto:${gerente.email}`}
                              className={`inline-flex items-center gap-2 rounded-md transition hover:text-[#0B6F68] ${foco}`}
                            >
                              <Mail
                                size={15}
                                className="shrink-0 text-gray-400"
                              />
                              <span className="[overflow-wrap:anywhere]">
                                {gerente.email}
                              </span>
                            </a>
                          )}
                          {gerente.phone && (
                            <a
                              href={`tel:${gerente.phone.replace(/\s+/g, "")}`}
                              className={`inline-flex items-center gap-2 rounded-md transition hover:text-[#0B6F68] ${foco}`}
                            >
                              <Phone
                                size={15}
                                className="shrink-0 text-gray-400"
                              />
                              {formatPhoneBR(gerente.phone)}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4 rounded-2xl bg-[#F1F9F8] p-4 sm:items-center sm:p-5">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#149C8B] shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl">
                        <Headset size={24} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                            Gerente Digital
                          </h3>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#0B6F68] ring-1 ring-[#149C8B]/20">
                            <BadgeCheck size={13} />
                            Atendimento digital
                          </span>
                        </div>
                        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-gray-600">
                          Sua conta ainda não tem um gerente responsável. O
                          Gerente Digital ajuda você sempre que precisar.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {isPassageiro && (
                <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                  <div className="flex flex-col gap-4 border-b border-slate-100 pb-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#35a989]/10 text-[#35a989]">
                        <Accessibility size={22} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          Acessibilidade
                        </h2>
                        <p className="mt-0.5 max-w-2xl text-sm leading-5 text-slate-500">
                          Informe se você possui alguma condição que exige
                          recursos de acessibilidade durante suas viagens.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    <AccessibilityOption
                      title="Pessoa com deficiência"
                      description="Solicite recursos de acessibilidade para suas viagens."
                      selected={pcdSelected}
                      disabled={salvandoAcessibilidade || contaBloqueada}
                      onClick={() => setPcdSelected((value) => !value)}
                      icon={Accessibility}
                    />
                    <AccessibilityOption
                      title="Pessoa com autismo"
                      description="Informe esta condição para receber suporte adequado."
                      selected={autistaSelected}
                      disabled={salvandoAcessibilidade || contaBloqueada}
                      onClick={() => setAutistaSelected((value) => !value)}
                      icon={Brain}
                    />
                  </div>
                  <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#35a989]/15 bg-[#35a989]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Atualizar informações
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Após salvar, algumas alterações podem exigir análise e
                        envio de documentação.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        salvarAcessibilidade();
                      }}
                      disabled={salvandoAcessibilidade || contaBloqueada}
                      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#35a989] px-5 text-sm font-semibold text-white transition hover:bg-[#2d9478] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {salvandoAcessibilidade ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Salvar alterações
                        </>
                      )}
                    </button>
                  </div>
                  {(pcdSelected || autistaSelected) && (
                    <div className="mt-6 space-y-3">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          Status das solicitações
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Acompanhe a análise das informações de acessibilidade.
                        </p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {pcdSelected && (
                          <AccessibilityStatusCard
                            title="Pessoa com deficiência"
                            verification={verificationPcd}
                            icon={Accessibility}
                          />
                        )}
                        {autistaSelected && (
                          <AccessibilityStatusCard
                            title="Pessoa com autismo"
                            verification={verificationAutista}
                            icon={Brain}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  {(pcdSelected || autistaSelected) && (
                    <div className="mt-6">
                      <LaudoUploadForm
                        disabled={contaBloqueada}
                        uploading={uploadingLaudo}
                        onSubmit={enviarLaudo}
                      />
                    </div>
                  )}
                </section>
              )}

              {possuiMaylonPassAtivo && (
                <section className="overflow-hidden rounded-[30px]">
                  <div className="mx-auto w-full max-w-5xl">
                    <div className="relative aspect-[1585/992] w-full overflow-hidden rounded-[24px] shadow-lg ring-1 ring-black/5">
                      <Image
                        src="/cartao_maylon_pass.png"
                        alt="Cartão virtual Maylon Pass"
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 1024px"
                        className="object-cover"
                      />
                      <div className="absolute left-[4%] top-[56%] flex w-[100%] items-end gap-[8%]">
                        <div className="min-w-0 flex-1">
                          <p className="text-[clamp(6px,0.65vw,9px)] font-medium uppercase tracking-[0.12em] text-white/70">
                            Titular
                          </p>
                          <p className="mt-1 truncate text-[clamp(9px,1.05vw,15px)] font-bold uppercase leading-none text-white">
                            {usuario.full_name || "NOME COMPLETO"}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <p className="text-[clamp(6px,0.65vw,9px)] font-medium uppercase tracking-[0.12em] text-white/70">
                            Data da aquisição
                          </p>
                          <p className="mt-1 text-[clamp(9px,1vw,14px)] font-semibold leading-none text-white">
                            {usuario.data_aquisicao
                              ? new Date(
                                  usuario.data_aquisicao,
                                ).toLocaleDateString("pt-BR")
                              : "--/--/----"}
                          </p>
                        </div>
                      </div>
                      <div className="absolute left-[4%] top-[75%]">
                        <p className="text-[clamp(6px,0.65vw,9px)] font-medium uppercase tracking-[0.12em] text-white/70">
                          Plano
                        </p>
                        <p className="mt-1 text-[clamp(10px,1.1vw,16px)] font-bold leading-none text-white">
                          {usuario.nome_plano ||
                            usuario.plano_nome ||
                            usuario.plano ||
                            "Maylon Pass"}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <section className={`${cartao} overflow-hidden`}>
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6 lg:p-7">
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF6F4] text-[#149C8B] sm:h-11 sm:w-11">
                      <Lock size={20} />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                        Senha e segurança
                      </h2>
                      <p className="mt-0.5 max-w-xl text-sm leading-6 text-gray-500">
                        Troque a senha com frequência para manter sua conta
                        protegida.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setOpen(true);
                    }}
                    className={`${botaoPrimario} w-full sm:w-auto`}
                  >
                    <LockKeyhole size={18} />
                    Alterar senha
                  </button>
                </div>
              </section>
            </div>
          </div>

          <div className="mt-6">{children}</div>
        </div>
      </main>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={fecharModalFoto}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-foto"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl"
          >
            <div className="flex items-start gap-3.5 p-5 sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF6F4] text-[#149C8B]">
                <Camera size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="titulo-modal-foto"
                  className="text-lg font-semibold text-gray-900"
                >
                  Alterar foto
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Confira a prévia antes de salvar.
                </p>
              </div>
              <button
                type="button"
                onClick={fecharModalFoto}
                aria-label="Fechar"
                className={botaoFechar}
              >
                <X size={19} />
              </button>
            </div>
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              {previewSrc && (
                <div className="mb-6 flex justify-center">
                  <div className="rounded-full p-1 ring-4 ring-[#EAF6F4]">
                    <Image
                      src={previewSrc}
                      alt="Pré-visualização da nova foto"
                      width={176}
                      height={176}
                      unoptimized
                      className="h-36 w-36 rounded-full object-cover sm:h-44 sm:w-44"
                    />
                  </div>
                </div>
              )}
              <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={fecharModalFoto}
                  className={`${botaoSecundario} sm:flex-1`}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleUpload();
                  }}
                  className={`${botaoPrimario} sm:flex-1`}
                >
                  {uploading ? "Enviando..." : "Salvar foto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={fecharModalSenha}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-senha"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl"
          >
            <div className="flex items-start gap-3.5 p-5 sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF6F4] text-[#149C8B]">
                <LockKeyhole size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="titulo-modal-senha"
                  className="text-lg font-semibold text-gray-900"
                >
                  Alterar senha
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Crie uma senha forte para proteger sua conta.
                </p>
              </div>
              <button
                type="button"
                onClick={fecharModalSenha}
                aria-label="Fechar"
                className={botaoFechar}
              >
                <X size={19} />
              </button>
            </div>
            <div className="space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
              <CampoSenha
                id="nova-senha"
                label="Nova senha"
                value={senha}
                onChange={setSenha}
                placeholder="Digite sua nova senha"
                visivel={showSenha}
                onToggle={() => setShowSenha((value) => !value)}
                dica="Use pelo menos 8 caracteres."
              />
              <CampoSenha
                id="confirmar-senha"
                label="Confirmar senha"
                value={confirmar}
                onChange={setConfirmar}
                placeholder="Digite novamente"
                visivel={showConfirmar}
                onToggle={() => setShowConfirmar((value) => !value)}
              />
              {erro && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
                >
                  <CircleAlert size={18} className="mt-0.5 shrink-0" />
                  <span>{erro}</span>
                </div>
              )}
              <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row">
                <button
                  type="button"
                  onClick={fecharModalSenha}
                  className={`${botaoSecundario} sm:flex-1`}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleSalvarSenha();
                  }}
                  className={`${botaoPrimario} sm:flex-1`}
                >
                  {saving ? "Salvando..." : "Salvar senha"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {verificacaoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={fecharVerificacao}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-verificacao"
            onClick={(e) => e.stopPropagation()}
            className="flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[85vh] sm:rounded-3xl"
          >
            <div className="flex items-start gap-3.5 p-5 sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF6F4] text-[#149C8B]">
                <ShieldCheck size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="titulo-modal-verificacao"
                  className="text-lg font-semibold text-gray-900"
                >
                  Verificação de documentos
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Conclua a verificação para ativar sua conta.
                </p>
              </div>
              <button
                type="button"
                onClick={fecharVerificacao}
                aria-label="Fechar"
                className={botaoFechar}
              >
                <X size={19} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden px-5 pb-5 sm:px-6 sm:pb-6">
              <iframe
                src={verificacaoUrl}
                title="Verificação de documentos"
                className="h-full w-full rounded-2xl border border-gray-200 bg-white"
                allow="camera; microphone; fullscreen; autoplay; encrypted-media; payment"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
