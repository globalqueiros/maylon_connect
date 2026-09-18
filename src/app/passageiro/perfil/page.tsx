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
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Upload,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

type VerificationStatus =
  | "aprovado"
  | "pendente"
  | "rejeitado"
  | "falhou"
  | "nao_iniciado";

type VerificationData = {
  status?: VerificationStatus | string | null;
  updatedAt?: string | null;
  reason?: string | null;
  justification?: string | null;
  rejectionReason?: string | null;
};

type Usuario = {
  id?: number | string;
  user_id?: number | string;
  profile_image?: string | null;
  name?: string | null;
  nome?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  telefone?: string | null;
  identification_number?: string | null;
  profile_photo?: string | null;
  profilePhoto?: string | null;
  photo_url?: string | null;
  photoUrl?: string | null;
  user_type?: number | string | null;
  userType?: number | string | null;
  is_active?: number | boolean | null;
  ativo?: number | boolean | null;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  email_verified?: boolean | number | string | null;
  phone_verified?: boolean | number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  justification?: VerificationData | null;
  livesheet?: VerificationData | null;
  liveness?: VerificationData | null;
  verification?: {
    justification?: VerificationData | null;
    livesheet?: VerificationData | null;
    liveness?: VerificationData | null;
    pcd?: VerificationData | null;
    autista?: VerificationData | null;
  } | null;
  justification_status?: string | null;
  justification_updated_at?: string | null;
  justification_reason?: string | null;
  livesheet_status?: string | null;
  livesheet_updated_at?: string | null;
  livesheet_reason?: string | null;
  pcd?: boolean | number | string | null;
  autista?: boolean | number | string | null;
  pcd_status?: string | null;
  pcd_updated_at?: string | null;
  pcd_reason?: string | null;
  autista_status?: string | null;
  autista_updated_at?: string | null;
  autista_reason?: string | null;
};

type AlertState = {
  type: "success" | "error" | "warning" | "info";
  message: string;
};

type VerificationCardProps = {
  title: string;
  description: string;
  verification: VerificationData | null;
  icon: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
};

const normalizarStatus = (
  value?: VerificationStatus | string | null
): VerificationStatus => {
  if (!value) return "nao_iniciado";

  const status = String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");

  if (
    [
      "aprovado",
      "approved",
      "validado",
      "verified",
      "concluido",
      "concluído",
      "sucesso",
      "success",
    ].includes(status)
  ) {
    return "aprovado";
  }

  if (
    [
      "pendente",
      "pending",
      "em_analise",
      "em análise",
      "processing",
      "processando",
      "aguardando",
    ].includes(status)
  ) {
    return "pendente";
  }

  if (
    [
      "rejeitado",
      "rejected",
      "recusado",
      "negado",
      "denied",
      "invalid",
      "invalido",
      "inválido",
    ].includes(status)
  ) {
    return "rejeitado";
  }

  if (
    [
      "falhou",
      "failed",
      "erro",
      "error",
      "failure",
      "expirado",
      "expired",
    ].includes(status)
  ) {
    return "falhou";
  }

  return "nao_iniciado";
};

const getVerificationConfig = (
  value?: VerificationStatus | string | null
) => {
  const status = normalizarStatus(value);

  const configs: Record<
    VerificationStatus,
    {
      label: string;
      description: string;
      className: string;
      icon: ReactNode;
    }
  > = {
    aprovado: {
      label: "Aprovado",
      description: "Verificação concluída com sucesso.",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    pendente: {
      label: "Em análise",
      description: "Estamos analisando suas informações.",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
      icon: <Clock3 className="h-4 w-4" />,
    },
    rejeitado: {
      label: "Rejeitado",
      description:
        "É necessário revisar as informações enviadas.",
      className:
        "border-red-200 bg-red-50 text-red-700",
      icon: <AlertCircle className="h-4 w-4" />,
    },
    falhou: {
      label: "Falhou",
      description:
        "Não foi possível concluir a verificação.",
      className:
        "border-red-200 bg-red-50 text-red-700",
      icon: <AlertCircle className="h-4 w-4" />,
    },
    nao_iniciado: {
      label: "Não iniciado",
      description:
        "Essa verificação ainda não foi realizada.",
      className:
        "border-slate-200 bg-slate-50 text-slate-600",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
  };

  return configs[status];
};

/**
 * Faz o parse de uma data vinda da API de forma tolerante a formatos comuns:
 * - ISO 8601: "2024-01-15T10:30:00Z" ou "2024-01-15T10:30:00.000Z"
 * - MySQL/Postgres: "2024-01-15 10:30:00" (sem "T" e sem timezone)
 * - Apenas data: "2024-01-15"
 * - Timestamp numérico (em string ou number)
 */
const parseDataFlexivel = (
  value?: string | number | null
): Date | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // Timestamp numérico (segundos ou milissegundos)
  if (typeof value === "number") {
    const ms = value < 10_000_000_000 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const raw = value.trim();

  if (!raw) return null;

  // Tenta primeiro o parse nativo (cobre ISO 8601 corretamente formatado)
  let date = new Date(raw);

  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  // Formato "YYYY-MM-DD HH:mm:ss" (comum em respostas de backends
  // Laravel/MySQL) — troca o espaço por "T" para o parser nativo entender.
  const comT = raw.includes(" ") && !raw.includes("T")
    ? raw.replace(" ", "T")
    : raw;

  date = new Date(comT);

  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  // Formato "DD/MM/YYYY" ou "DD/MM/YYYY HH:mm:ss"
  const matchBr = raw.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (matchBr) {
    const [, day, month, year, hour = "0", minute = "0", second = "0"] =
      matchBr;

    date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
};

const formatDate = (value?: string | null) => {
  const date = parseDataFlexivel(value);

  if (!date) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatDateBR = (value?: string | null) => {
  const date = parseDataFlexivel(value);

  if (!date) {
    return "Não informado";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatCPF = (value?: string | null) => {
  if (!value) return "Não informado";

  const digits = value.replace(/\D/g, "");

  if (digits.length !== 11) {
    return value;
  }

  return digits.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    "$1.$2.$3-$4"
  );
};

const formatPhoneBR = (value?: string | null) => {
  if (!value) return "Não informado";

  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);

  if (digits.length === 11) {
    return digits.replace(
      /(\d{2})(\d{5})(\d{4})/,
      "($1) $2-$3"
    );
  }

  if (digits.length === 10) {
    return digits.replace(
      /(\d{2})(\d{4})(\d{4})/,
      "($1) $2-$3"
    );
  }

  return value;
};

const getInitials = (name?: string | null) => {
  if (!name) return "U";

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "U";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const isTrue = (
  value?: boolean | number | string | null
) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "yes"
  );
};

const getPassengerAccessibilityStatus = (
  enabled?: boolean | number | string | null,
  status?: string | null
): VerificationData => {
  if (!isTrue(enabled)) {
    return {
      status: "nao_iniciado",
    };
  }

  return {
    status: normalizarStatus(status ?? "pendente"),
  };
};

function AccessibilityOption({
  title,
  description,
  selected,
  onClick,
  disabled,
  icon,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${selected
        ? "border-[#35a989] bg-[#35a989]/5 shadow-sm"
        : "border-slate-200 bg-white hover:border-[#35a989]/40 hover:bg-slate-50"
        } ${disabled
          ? "cursor-not-allowed opacity-60"
          : ""
        }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${selected
          ? "bg-[#35a989] text-white"
          : "bg-slate-100 text-slate-500 group-hover:bg-[#35a989]/10 group-hover:text-[#35a989]"
          }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-0.5 text-sm leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${selected
          ? "border-[#35a989] bg-[#35a989] text-white"
          : "border-slate-300 bg-white"
          }`}
      >
        {selected && (
          <Check className="h-3.5 w-3.5" />
        )}
      </div>
    </button>
  );
}

function AccessibilityStatusCard({
  title,
  verification,
  icon,
}: {
  title: string;
  verification: VerificationData | null;
  icon: ReactNode;
}) {
  const config = getVerificationConfig(
    verification?.status
  );

  const reason =
    verification?.reason ||
    verification?.justification ||
    verification?.rejectionReason;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            {icon}
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-slate-900">
              {title}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {verification?.updatedAt
                ? `Atualizado em ${formatDate(
                  verification.updatedAt
                )}`
                : "Status da solicitação"}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
        >
          {config.icon}
          {config.label}
        </span>
      </div>

      {reason && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-5 text-slate-600">
          {reason}
        </div>
      )}
    </div>
  );
}

function LaudoUploadForm({
  disabled,
  onSubmit,
  uploading,
}: {
  disabled?: boolean;
  onSubmit: (file: File) => Promise<void>;
  uploading: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selected = event.target.files?.[0];

    if (!selected) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(selected.type)) {
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async () => {
    if (!file || uploading || disabled) return;

    await onSubmit(file);
    setFile(null);
  };

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#35a989] shadow-sm">
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <p className="font-semibold text-slate-900">
              Enviar laudo
            </p>

            <p className="mt-1 text-sm text-slate-500">
              PDF, JPG ou PNG. Máximo de 10 MB.
            </p>
          </div>
        </div>

        <label
          className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#35a989]/40 hover:text-[#35a989] ${disabled || uploading
            ? "pointer-events-none opacity-50"
            : ""
            }`}
        >
          <Upload className="h-4 w-4" />
          Escolher arquivo

          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleChange}
            disabled={disabled || uploading}
          />
        </label>
      </div>

      {file && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <FileCheck2 className="h-5 w-5 shrink-0 text-[#35a989]" />

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {file.name}
              </p>

              <p className="text-xs text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading || disabled}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#35a989] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2d9478] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Enviar laudo
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <div className="mt-1 flex items-center gap-2">
            <p className="truncate font-semibold text-slate-800">
              {value}
            </p>

            {verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#35a989]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusMiniCard({
  icon,
  label,
  value,
  status,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  status?: "success" | "warning" | "neutral";
}) {
  const styles = {
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    neutral: "bg-slate-300",
  };

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-white/60">
            {label}
          </p>

          <p className="mt-0.5 truncate text-sm font-semibold text-white">
            {value}
          </p>
        </div>

        <span
          className={`ml-auto h-2.5 w-2.5 shrink-0 rounded-full ${styles[status ?? "neutral"]
            }`}
        />
      </div>
    </div>
  );
}

function VerificationCard({
  title,
  description,
  verification,
  icon,
  onRefresh,
  refreshing,
}: VerificationCardProps) {
  const config = getVerificationConfig(
    verification?.status
  );

  const status = normalizarStatus(
    verification?.status
  );

  const reason =
    verification?.reason ||
    verification?.justification ||
    verification?.rejectionReason;

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#35a989]/10 text-[#35a989]">
              {icon}
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-slate-900">
                {title}
              </h3>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                {description}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${config.className}`}
          >
            {config.icon}
            {config.label}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Situação
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {config.description}
              </p>
            </div>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-[#35a989]/40 hover:text-[#35a989] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Atualizar verificação"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""
                    }`}
                />
              </button>
            )}
          </div>

          {verification?.updatedAt && (
            <p className="mt-3 text-xs text-slate-400">
              Última atualização:{" "}
              <span className="font-medium text-slate-500">
                {formatDate(
                  verification.updatedAt
                )}
              </span>
            </p>
          )}

          {reason && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-700">
              <span className="font-semibold">
                Observação:
              </span>{" "}
              {reason}
            </div>
          )}

          {status === "pendente" && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-700">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
              A análise pode levar alguns minutos. A página será
              atualizada automaticamente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  show,
  onToggle,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#35a989] focus:bg-white focus:ring-4 focus:ring-[#35a989]/10"
      />

      <button
        type="button"
        onClick={onToggle}
        className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-slate-400 transition hover:text-slate-700"
        aria-label={
          show ? "Ocultar senha" : "Mostrar senha"
        }
      >
        {show ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

function ModalOverlay({
  children,
  onClose,
  closeDisabled,
}: {
  children: ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={() => {
          if (!closeDisabled) {
            onClose();
          }
        }}
        className="fixed inset-0 cursor-default bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="relative z-10 my-auto w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const router = useRouter();

  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshingVerification, setRefreshingVerification] =
    useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const [alert, setAlert] =
    useState<AlertState | null>(null);

  const [photoModalOpen, setPhotoModalOpen] =
    useState(false);

  const [selectedPhoto, setSelectedPhoto] =
    useState<File | null>(null);

  const [previewSrc, setPreviewSrc] =
    useState<string | null>(null);

  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

  const [passwordModalOpen, setPasswordModalOpen] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [verificationModalOpen, setVerificationModalOpen] =
    useState(false);

  const [verificationType, setVerificationType] =
    useState<"email" | "phone" | null>(null);

  const [verificationCode, setVerificationCode] =
    useState("");

  const [sendingVerification, setSendingVerification] =
    useState(false);

  const [verifyingCode, setVerifyingCode] =
    useState(false);

  const [pcdSelected, setPcdSelected] =
    useState(false);

  const [autistaSelected, setAutistaSelected] =
    useState(false);

  const [salvandoAcessibilidade, setSalvandoAcessibilidade] =
    useState(false);

  const [uploadingLaudo, setUploadingLaudo] =
    useState(false);

  const showAlert = useCallback(
    (
      type: AlertState["type"],
      message: string
    ) => {
      setAlert({
        type,
        message,
      });
    },
    []
  );

  const carregarUsuario = useCallback(
    async (
      showLoader = true
    ): Promise<boolean> => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          router.replace("/");
          return false;
        }

        const data =
          await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
            data?.error ||
            "Não foi possível carregar os dados da conta."
          );
        }

        const raw: Usuario =
          data?.user ??
          data?.usuario ??
          data?.data ??
          data;

        const verification = raw?.verification;

        const justification =
          verification?.justification ??
          raw?.justification ?? {
            status: raw?.justification_status,
            updatedAt:
              raw?.justification_updated_at,
            reason:
              raw?.justification_reason,
          };

        const livesheet =
          verification?.livesheet ??
          verification?.liveness ??
          raw?.livesheet ??
          raw?.liveness ?? {
            status: raw?.livesheet_status,
            updatedAt:
              raw?.livesheet_updated_at,
            reason:
              raw?.livesheet_reason,
          };

        const normalizedUser: Usuario = {
          ...raw,
          verification: {
            justification,
            livesheet,
            liveness: livesheet,
            pcd:
              verification?.pcd ??
              getPassengerAccessibilityStatus(
                raw?.pcd,
                raw?.pcd_status
              ),
            autista:
              verification?.autista ??
              getPassengerAccessibilityStatus(
                raw?.autista,
                raw?.autista_status
              ),
          },
        };

        setUsuario(normalizedUser);

        setPcdSelected(isTrue(raw?.pcd));
        setAutistaSelected(isTrue(raw?.autista));

        try {
          const accessibilityResponse =
            await fetch(
              "/api/passageiro/acessibilidade",
              {
                method: "GET",
                credentials: "include",
                cache: "no-store",
              }
            );

          if (accessibilityResponse.ok) {
            const accessibilityData =
              await accessibilityResponse
                .json()
                .catch(() => null);

            const accessibility =
              accessibilityData?.data ??
              accessibilityData?.accessibility ??
              accessibilityData;

            if (accessibility) {
              const pcd =
                accessibility?.pcd ??
                accessibility?.pcd_enabled ??
                accessibility?.is_pcd;

              const autista =
                accessibility?.autista ??
                accessibility?.autista_enabled ??
                accessibility?.is_autista;

              setPcdSelected(isTrue(pcd));
              setAutistaSelected(isTrue(autista));

              setUsuario((previous) => {
                if (!previous) return previous;

                return {
                  ...previous,
                  pcd,
                  autista,
                  pcd_status:
                    accessibility?.pcd_status ??
                    previous.pcd_status,
                  pcd_updated_at:
                    accessibility?.pcd_updated_at ??
                    previous.pcd_updated_at,
                  pcd_reason:
                    accessibility?.pcd_reason ??
                    previous.pcd_reason,
                  autista_status:
                    accessibility?.autista_status ??
                    previous.autista_status,
                  autista_updated_at:
                    accessibility?.autista_updated_at ??
                    previous.autista_updated_at,
                  autista_reason:
                    accessibility?.autista_reason ??
                    previous.autista_reason,
                  verification: {
                    ...previous.verification,
                    pcd:
                      accessibility?.pcd_verification ??
                      previous.verification?.pcd,
                    autista:
                      accessibility?.autista_verification ??
                      previous.verification?.autista,
                  },
                };
              });
            }
          }
        } catch { }

        return true;
      } catch (error) {
        if (showLoader) {
          showAlert(
            "error",
            error instanceof Error
              ? error.message
              : "Não foi possível carregar seu perfil."
          );
        }

        return false;
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [router, showAlert]
  );

  useEffect(() => {
    void carregarUsuario();
  }, [carregarUsuario]);

  useEffect(() => {
    const savedSidebar =
      localStorage.getItem("sidebar");

    if (savedSidebar === "true") {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "sidebar",
      String(sidebarCollapsed)
    );
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!alert) return;

    const timeout = window.setTimeout(() => {
      setAlert(null);
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [alert]);

  useEffect(() => {
    return () => {
      if (previewSrc) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  const possuiVerificacaoPendente = useMemo(() => {
    const justificationStatus =
      normalizarStatus(
        usuario?.verification?.justification?.status ??
        usuario?.justification_status
      );

    const livesheetStatus =
      normalizarStatus(
        usuario?.verification?.livesheet?.status ??
        usuario?.livesheet_status
      );

    const pcdStatus =
      normalizarStatus(
        usuario?.verification?.pcd?.status ??
        usuario?.pcd_status
      );

    const autistaStatus =
      normalizarStatus(
        usuario?.verification?.autista?.status ??
        usuario?.autista_status
      );

    return (
      justificationStatus === "pendente" ||
      livesheetStatus === "pendente" ||
      (pcdSelected &&
        pcdStatus === "pendente") ||
      (autistaSelected &&
        autistaStatus === "pendente")
    );
  }, [
    usuario,
    pcdSelected,
    autistaSelected,
  ]);

  useEffect(() => {
    if (!possuiVerificacaoPendente) {
      return;
    }

    const interval = window.setInterval(() => {
      void carregarUsuario(false);
    }, 15000);

    return () =>
      window.clearInterval(interval);
  }, [
    possuiVerificacaoPendente,
    carregarUsuario,
  ]);

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key !== "Escape") return;

      if (
        photoModalOpen &&
        !uploadingPhoto
      ) {
        setPhotoModalOpen(false);
        return;
      }

      if (
        passwordModalOpen &&
        !changingPassword
      ) {
        setPasswordModalOpen(false);
        return;
      }

      if (
        verificationModalOpen &&
        !sendingVerification &&
        !verifyingCode
      ) {
        setVerificationModalOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    photoModalOpen,
    uploadingPhoto,
    passwordModalOpen,
    changingPassword,
    verificationModalOpen,
    sendingVerification,
    verifyingCode,
  ]);

  const nomeUsuario = useMemo(
    () =>
      usuario?.name ||
      usuario?.nome ||
      usuario?.full_name ||
      "Usuário Maylon",
    [usuario]
  );

  const emailUsuario =
    usuario?.email || "Não informado";

  const telefoneUsuario =
    usuario?.phone ||
    usuario?.telefone ||
    "Não informado";

  const contaCriadaEm = formatDateBR(usuario?.created_at);

  const identificationNumberUsuario =
    formatCPF(
      usuario?.identification_number
    );

  const photoUrl =
    usuario?.profile_photo ||
    usuario?.profilePhoto ||
    usuario?.photo_url ||
    usuario?.photoUrl ||
    usuario?.profile_image ||
    null;

  const userType = String(
    usuario?.user_type ??
    usuario?.userType ??
    ""
  );

  const isMotorista =
    userType === "1" ||
    userType.toLowerCase() === "motorista" ||
    userType.toLowerCase() === "driver";

  const isPassageiro = !isMotorista;

  const contaBloqueada =
    usuario?.is_active === false ||
    usuario?.is_active === 0 ||
    usuario?.ativo === false ||
    usuario?.ativo === 0;

  const emailVerificado =
    isTrue(usuario?.email_verified) ||
    Boolean(usuario?.email_verified_at);

  const telefoneVerificado =
    isTrue(usuario?.phone_verified) ||
    Boolean(usuario?.phone_verified_at);

  const verificationJustification =
    usuario?.verification?.justification ??
    usuario?.justification ?? {
      status:
        usuario?.justification_status,
      updatedAt:
        usuario?.justification_updated_at,
      reason:
        usuario?.justification_reason,
    };

  const verificationLivesheet =
    usuario?.verification?.livesheet ??
    usuario?.verification?.liveness ??
    usuario?.livesheet ??
    usuario?.liveness ?? {
      status:
        usuario?.livesheet_status,
      updatedAt:
        usuario?.livesheet_updated_at,
      reason:
        usuario?.livesheet_reason,
    };

  const verificationPcd =
    usuario?.verification?.pcd ??
    getPassengerAccessibilityStatus(
      usuario?.pcd,
      usuario?.pcd_status
    );

  const verificationAutista =
    usuario?.verification?.autista ??
    getPassengerAccessibilityStatus(
      usuario?.autista,
      usuario?.autista_status
    );

  const atualizarVerificacoes =
    async () => {
      setRefreshingVerification(true);

      try {
        const success =
          await carregarUsuario(false);

        if (success) {
          showAlert(
            "success",
            "Informações atualizadas com sucesso."
          );
        }
      } finally {
        setRefreshingVerification(false);
      }
    };

  const handlePhotoChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showAlert(
        "error",
        "Selecione uma imagem válida."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      showAlert(
        "error",
        "A imagem deve ter no máximo 5 MB."
      );

      event.target.value = "";
      return;
    }

    if (previewSrc) {
      URL.revokeObjectURL(previewSrc);
    }

    const preview =
      URL.createObjectURL(file);

    setSelectedPhoto(file);
    setPreviewSrc(preview);
  };

  const fecharFotoModal = () => {
    if (uploadingPhoto) return;

    if (previewSrc) {
      URL.revokeObjectURL(previewSrc);
    }

    setPhotoModalOpen(false);
    setSelectedPhoto(null);
    setPreviewSrc(null);
  };

  const enviarFoto = async () => {
    if (
      !selectedPhoto ||
      uploadingPhoto
    ) {
      return;
    }

    try {
      setUploadingPhoto(true);

      const formData =
        new FormData();

      formData.append(
        "photo",
        selectedPhoto
      );

      if (usuario?.id != null) {
        formData.append(
          "userId",
          String(usuario.id)
        );
      }

      const response =
        await fetch(
          "/api/upload-photo",
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          "Não foi possível atualizar a foto."
        );
      }

      const newPhoto =
        data?.photo_url ||
        data?.photoUrl ||
        data?.profile_photo ||
        data?.profile_image ||
        data?.url;

      if (newPhoto) {
        setUsuario(
          (previous) =>
            previous
              ? {
                ...previous,
                profile_photo:
                  newPhoto,
                profilePhoto:
                  newPhoto,
                photo_url:
                  newPhoto,
                photoUrl:
                  newPhoto,
                profile_image:
                  newPhoto,
              }
              : previous
        );
      }

      showAlert(
        "success",
        "Foto de perfil atualizada com sucesso."
      );

      fecharFotoModal();
    } catch (error) {
      showAlert(
        "error",
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a foto."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const abrirVerificacao = (
    type: "email" | "phone"
  ) => {
    setVerificationType(type);
    setVerificationCode("");
    setVerificationModalOpen(true);
  };

  const enviarCodigoVerificacao =
    async () => {
      if (
        !verificationType ||
        sendingVerification
      ) {
        return;
      }

      try {
        setSendingVerification(true);

        const response =
          await fetch(
            "/api/send-verification",
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                action: "send",
                type: verificationType,
              }),
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
            data?.error ||
            "Não foi possível enviar o código."
          );
        }

        showAlert(
          "success",
          `Código enviado para seu ${verificationType === "email"
            ? "e-mail"
            : "telefone"
          }.`
        );
      } catch (error) {
        showAlert(
          "error",
          error instanceof Error
            ? error.message
            : "Não foi possível enviar o código."
        );
      } finally {
        setSendingVerification(false);
      }
    };

  const verificarCodigo =
    async () => {
      if (
        !verificationType ||
        verifyingCode ||
        verificationCode.trim().length < 4
      ) {
        showAlert(
          "warning",
          "Digite o código de verificação."
        );
        return;
      }

      try {
        setVerifyingCode(true);

        const response =
          await fetch(
            "/api/send-verification",
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                action: "verify",
                type: verificationType,
                code: verificationCode.trim(),
              }),
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
            data?.error ||
            "Código inválido ou expirado."
          );
        }

        showAlert(
          "success",
          `${verificationType === "email"
            ? "E-mail"
            : "Telefone"
          } verificado com sucesso.`
        );

        setVerificationModalOpen(false);
        setVerificationCode("");

        await carregarUsuario(false);
      } catch (error) {
        showAlert(
          "error",
          error instanceof Error
            ? error.message
            : "Código inválido ou expirado."
        );
      } finally {
        setVerifyingCode(false);
      }
    };

  const alterarSenha = async () => {
    if (changingPassword) return;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      showAlert(
        "warning",
        "Preencha todos os campos de senha."
      );
      return;
    }

    if (newPassword.length < 8) {
      showAlert(
        "warning",
        "A nova senha deve ter pelo menos 8 caracteres."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      showAlert(
        "warning",
        "A confirmação da senha não corresponde."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response =
        await fetch(
          "/api/change-password",
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              currentPassword,
              newPassword,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          "Não foi possível alterar sua senha."
        );
      }

      showAlert(
        "success",
        "Senha alterada com sucesso."
      );

      setPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      showAlert(
        "error",
        error instanceof Error
          ? error.message
          : "Não foi possível alterar sua senha."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const salvarAcessibilidade =
    async () => {
      if (
        !isPassageiro ||
        salvandoAcessibilidade
      ) {
        return;
      }

      try {
        setSalvandoAcessibilidade(true);

        const response =
          await fetch(
            "/api/passageiro/acessibilidade",
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                pcd: pcdSelected,
                autista: autistaSelected,
              }),
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
            data?.error ||
            "Não foi possível salvar suas preferências."
          );
        }

        setUsuario(
          (previous) =>
            previous
              ? {
                ...previous,
                pcd: pcdSelected,
                autista: autistaSelected,
                pcd_status:
                  pcdSelected
                    ? "pendente"
                    : "nao_iniciado",
                autista_status:
                  autistaSelected
                    ? "pendente"
                    : "nao_iniciado",
              }
              : previous
        );

        showAlert(
          "success",
          "Preferências de acessibilidade atualizadas."
        );

        await carregarUsuario(false);
      } catch (error) {
        showAlert(
          "error",
          error instanceof Error
            ? error.message
            : "Não foi possível salvar suas preferências."
        );
      } finally {
        setSalvandoAcessibilidade(false);
      }
    };

  const enviarLaudo = async (
    file: File
  ) => {
    if (
      !isPassageiro ||
      uploadingLaudo
    ) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      showAlert(
        "error",
        "Envie um arquivo PDF, JPG ou PNG."
      );
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      showAlert(
        "error",
        "O laudo deve ter no máximo 10 MB."
      );
      return;
    }

    if (
      !pcdSelected &&
      !autistaSelected
    ) {
      showAlert(
        "warning",
        "Selecione uma opção de acessibilidade antes de enviar o laudo."
      );
      return;
    }

    try {
      setUploadingLaudo(true);

      const formData =
        new FormData();

      formData.append(
        "document",
        file
      );

      formData.append(
        "type",
        pcdSelected
          ? "pcd"
          : "autista"
      );

      const response =
        await fetch(
          "/api/passageiro/acessibilidade/documento",
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          "Não foi possível enviar o laudo."
        );
      }

      setUsuario(
        (previous) =>
          previous
            ? {
              ...previous,
              pcd_status:
                pcdSelected
                  ? "pendente"
                  : previous.pcd_status,
              autista_status:
                autistaSelected
                  ? "pendente"
                  : previous.autista_status,
              verification: {
                ...previous.verification,
                pcd: pcdSelected
                  ? {
                    ...previous
                      .verification
                      ?.pcd,
                    status: "pendente",
                  }
                  : previous
                    .verification
                    ?.pcd,
                autista:
                  autistaSelected
                    ? {
                      ...previous
                        .verification
                        ?.autista,
                      status: "pendente",
                    }
                    : previous
                      .verification
                      ?.autista,
              },
            }
            : previous
      );

      showAlert(
        "success",
        "Laudo enviado. Agora ele será analisado."
      );

      await carregarUsuario(false);
    } catch (error) {
      showAlert(
        "error",
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o laudo."
      );
    } finally {
      setUploadingLaudo(false);
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
            Aguarde um momento...
          </p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Não foi possível carregar seu perfil
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Tente atualizar a página para carregar suas informações novamente.
          </p>

          <button
            type="button"
            onClick={() =>
              void carregarUsuario()
            }
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#35a989] px-5 text-sm font-semibold text-white transition hover:bg-[#2d9478]"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-slate-900">
      <div className="mx-auto w-full max-w-[1536px]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white/90 sm:text-3xl">
              Meu perfil
            </h1>

            <p className="mt-1 text-sm text-white/50">
              Gerencie seus dados pessoais, segurança e verificações.
            </p>
          </div>

          <button
            type="button"
            onClick={atualizarVerificacoes}
            disabled={refreshingVerification}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#35a989]/40 hover:text-[#35a989] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshingVerification
                ? "animate-spin"
                : ""
                }`}
            />

            Atualizar informações
          </button>
        </div>

        {alert && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-sm ${alert.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : alert.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : alert.type === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-sky-200 bg-sky-50 text-sky-800"
              }`}
          >
            {alert.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : alert.type === "warning" ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            ) : alert.type === "info" ? (
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <p className="flex-1 text-sm font-medium leading-5">
              {alert.message}
            </p>

            <button
              type="button"
              onClick={() =>
                setAlert(null)
              }
              className="shrink-0 opacity-60 transition hover:opacity-100"
              aria-label="Fechar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="relative mb-7 overflow-hidden rounded-[30px] bg-[#0b6e4f] shadow-xl">
          <div className="absolute inset-0">
            <Image
              src="/bg-carro.png"
              alt=""
              fill
              priority
              className="object-cover object-center opacity-25"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#063f2d] via-[#0b6e4f]/95 to-[#0b6e4f]/65" />
          </div>

          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#35a989]/20 blur-3xl" />

          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:p-10">
            <div className="flex flex-col justify-center">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                  <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white/20 bg-white/10 shadow-2xl sm:h-32 sm:w-32">
                    {photoUrl ? (
                      <Image
                        src={photoUrl}
                        alt={`Foto de ${nomeUsuario}`}
                        fill
                        sizes="128px"
                        className="object-cover rounder-full"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/10 text-3xl font-bold text-white">
                        {getInitials(nomeUsuario)}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPhotoModalOpen(true)
                    }
                    className="absolute -bottom-2 -right-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border-4 border-[#0b6e4f] bg-white text-[#0b6e4f] shadow-lg transition hover:scale-105 hover:bg-slate-50"
                    aria-label="Alterar foto de perfil"
                  >
                    <Camera className="h-[18px] w-[18px]" />
                  </button>
                </div>

                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      <User className="h-3.5 w-3.5" />
                      {isMotorista
                        ? "Motorista"
                        : "Passageiro"}
                    </span>

                    {contaBloqueada ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300/20 bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-100">
                        <LockKeyhole className="h-3.5 w-3.5" />
                        Conta bloqueada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Conta ativa
                      </span>
                    )}
                  </div>

                  <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Olá, {nomeUsuario.split(" ")[0]}!
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                    Mantenha seus dados atualizados para ter uma experiência mais segura dentro da Maylon.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <StatusMiniCard
                icon={<Mail className="h-4 w-4" />}
                label="E-mail"
                value={
                  emailVerificado
                    ? "Verificado"
                    : "Pendente"
                }
                status={
                  emailVerificado
                    ? "success"
                    : "warning"
                }
              />

              <StatusMiniCard
                icon={<Phone className="h-4 w-4" />}
                label="Telefone"
                value={
                  telefoneVerificado
                    ? "Verificado"
                    : "Pendente"
                }
                status={
                  telefoneVerificado
                    ? "success"
                    : "warning"
                }
              />

              <StatusMiniCard
                icon={
                  <ShieldCheck className="h-4 w-4" />
                }
                label="Conta"
                value={
                  contaBloqueada
                    ? "Bloqueada"
                    : "Protegida"
                }
                status={
                  contaBloqueada
                    ? "warning"
                    : "success"
                }
              />
            </div>
          </div>
        </section>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-7">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#35a989]/10 text-[#35a989]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Verificação da conta
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                      Acompanhe o status das suas verificações.
                    </p>
                  </div>
                </div>

                {possuiVerificacaoPendente && (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    Existem verificações em análise
                  </span>
                )}
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <VerificationCard
                  title="Justificativa"
                  description="Validação das informações e documentos necessários para sua conta."
                  verification={
                    verificationJustification
                  }
                  icon={
                    <FileCheck2 className="h-5 w-5" />
                  }
                  onRefresh={
                    atualizarVerificacoes
                  }
                  refreshing={
                    refreshingVerification
                  }
                />

                <VerificationCard
                  title="LiveSheet / Liveness"
                  description="Verificação de identidade e prova de vida."
                  verification={
                    verificationLivesheet
                  }
                  icon={
                    <Eye className="h-5 w-5" />
                  }
                  onRefresh={
                    atualizarVerificacoes
                  }
                  refreshing={
                    refreshingVerification
                  }
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#35a989]/10 text-[#35a989]">
                  <User className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Informações pessoais
                  </h2>

                  <p className="mt-0.5 text-sm text-slate-500">
                    Confira os dados cadastrados na sua conta.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoCard
                  icon={
                    <User className="h-4 w-4" />
                  }
                  label="Nome completo"
                  value={nomeUsuario}
                />

                <InfoCard
                  icon={
                    <FileText className="h-4 w-4" />
                  }
                  label="CPF"
                  value={
                    identificationNumberUsuario
                  }
                />

                <InfoCard
                  icon={
                    <Mail className="h-4 w-4" />
                  }
                  label="E-mail"
                  value={emailUsuario}
                  verified={emailVerificado}
                />

                <InfoCard
                  icon={
                    <Phone className="h-4 w-4" />
                  }
                  label="Telefone"
                  value={formatPhoneBR(
                    telefoneUsuario
                  )}
                  verified={
                    telefoneVerificado
                  }
                />

                <InfoCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Conta criada em"
                  value={contaCriadaEm}
                />

                <InfoCard
                  icon={
                    <ShieldCheck className="h-4 w-4" />
                  }
                  label="Tipo de conta"
                  value={
                    isMotorista
                      ? "Motorista"
                      : "Passageiro"
                  }
                />
              </div>
            </section>

            {isPassageiro && (
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#35a989]/10 text-[#35a989]">
                      <AccessibilityIcon />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Acessibilidade
                      </h2>

                      <p className="mt-0.5 max-w-2xl text-sm leading-5 text-slate-500">
                        Informe se você possui alguma condição que exige recursos de acessibilidade durante suas viagens.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <AccessibilityOption
                    title="Pessoa com deficiência"
                    description="Solicite recursos de acessibilidade para suas viagens."
                    selected={pcdSelected}
                    disabled={
                      salvandoAcessibilidade ||
                      contaBloqueada
                    }
                    onClick={() =>
                      setPcdSelected(
                        (value) => !value
                      )
                    }
                    icon={
                      <AccessibilityIcon />
                    }
                  />

                  <AccessibilityOption
                    title="Pessoa com autismo"
                    description="Informe esta condição para receber suporte adequado."
                    selected={
                      autistaSelected
                    }
                    disabled={
                      salvandoAcessibilidade ||
                      contaBloqueada
                    }
                    onClick={() =>
                      setAutistaSelected(
                        (value) => !value
                      )
                    }
                    icon={<BrainIcon />}
                  />
                </div>

                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#35a989]/15 bg-[#35a989]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Atualizar informações
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Após salvar, algumas alterações podem exigir análise e envio de documentação.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      salvarAcessibilidade
                    }
                    disabled={
                      salvandoAcessibilidade ||
                      contaBloqueada
                    }
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#35a989] px-5 text-sm font-semibold text-white transition hover:bg-[#2d9478] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {salvandoAcessibilidade ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
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

                {(pcdSelected ||
                  autistaSelected) && (
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
                            verification={
                              verificationPcd
                            }
                            icon={
                              <AccessibilityIcon />
                            }
                          />
                        )}

                        {autistaSelected && (
                          <AccessibilityStatusCard
                            title="Pessoa com autismo"
                            verification={
                              verificationAutista
                            }
                            icon={
                              <BrainIcon />
                            }
                          />
                        )}
                      </div>
                    </div>
                  )}

                {(pcdSelected ||
                  autistaSelected) && (
                    <div className="mt-6">
                      <LaudoUploadForm
                        disabled={
                          contaBloqueada
                        }
                        uploading={
                          uploadingLaudo
                        }
                        onSubmit={
                          enviarLaudo
                        }
                      />
                    </div>
                  )}
              </section>
            )}
          </div>

          <aside className="space-y-5">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#35a989]/10 text-[#35a989]">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Segurança
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Proteja sua conta
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    abrirVerificacao(
                      "email"
                    )
                  }
                  disabled={
                    emailVerificado ||
                    contaBloqueada
                  }
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-[#35a989]/30 hover:bg-slate-50 disabled:cursor-default disabled:hover:border-slate-200 disabled:hover:bg-white"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${emailVerificado
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-600"
                      }`}
                  >
                    {emailVerificado ? (
                      <BadgeCheck className="h-5 w-5" />
                    ) : (
                      <Mail className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Verificar e-mail
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {emailVerificado
                        ? "E-mail verificado"
                        : emailUsuario}
                    </p>
                  </div>

                  {!emailVerificado && (
                    <ChevronDown className="h-4 w-4 -rotate-90 text-slate-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    abrirVerificacao(
                      "phone"
                    )
                  }
                  disabled={
                    telefoneVerificado ||
                    contaBloqueada
                  }
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-[#35a989]/30 hover:bg-slate-50 disabled:cursor-default disabled:hover:border-slate-200 disabled:hover:bg-white"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${telefoneVerificado
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-600"
                      }`}
                  >
                    {telefoneVerificado ? (
                      <BadgeCheck className="h-5 w-5" />
                    ) : (
                      <Phone className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Verificar telefone
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {telefoneVerificado
                        ? "Telefone verificado"
                        : formatPhoneBR(
                          telefoneUsuario
                        )}
                    </p>
                  </div>

                  {!telefoneVerificado && (
                    <ChevronDown className="h-4 w-4 -rotate-90 text-slate-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPasswordModalOpen(
                      true
                    )
                  }
                  disabled={contaBloqueada}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-[#35a989]/30 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <KeyRound className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Alterar senha
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Atualize sua senha de acesso
                    </p>
                  </div>

                  <ChevronDown className="h-4 w-4 -rotate-90 text-slate-400" />
                </button>
              </div>
            </section>

            <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0b6e4f] to-[#35a989] p-6 text-white shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <h3 className="mt-5 text-lg font-bold">
                Sua segurança importa
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/75">
                Mantenha seu telefone, e-mail e senha atualizados para proteger sua conta Maylon.
              </p>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Dados protegidos
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Verificações de segurança
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Atualizações automáticas
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Smartphone className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Status da conta
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Informações rápidas
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm text-slate-500">
                    Tipo
                  </span>

                  <span className="text-sm font-semibold text-slate-800">
                    {isMotorista
                      ? "Motorista"
                      : "Passageiro"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm text-slate-500">
                    Status
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${contaBloqueada
                      ? "bg-red-50 text-red-700"
                      : "bg-emerald-50 text-emerald-700"
                      }`}
                  >
                    {contaBloqueada
                      ? "Bloqueada"
                      : "Ativa"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Verificações
                  </span>

                  <span className="text-sm font-semibold text-slate-800">
                    {possuiVerificacaoPendente
                      ? "Em análise"
                      : "Atualizadas"}
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {photoModalOpen && (
        <ModalOverlay
          onClose={fecharFotoModal}
          closeDisabled={uploadingPhoto}
        >
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-bold text-slate-900">
                  Foto de perfil
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Escolha uma imagem para sua conta
                </p>
              </div>

              <button
                type="button"
                onClick={fecharFotoModal}
                disabled={uploadingPhoto}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex justify-center">
                <div className="relative h-52 w-52 overflow-hidden rounded-[32px] bg-slate-100 shadow-inner">
                  {previewSrc || photoUrl ? (
                    <Image
                      src={
                        previewSrc ||
                        photoUrl ||
                        ""
                      }
                      alt="Prévia da foto de perfil"
                      fill
                      sizes="208px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-slate-300">
                      {getInitials(nomeUsuario)}
                    </div>
                  )}
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#35a989]/50 hover:bg-[#35a989]/5 hover:text-[#35a989]">
                <Upload className="h-4 w-4" />
                Escolher nova foto

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                  disabled={uploadingPhoto}
                />
              </label>

              <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                JPG, PNG ou WEBP · máximo de 5 MB
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={fecharFotoModal}
                  disabled={uploadingPhoto}
                  className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={enviarFoto}
                  disabled={
                    !selectedPhoto ||
                    uploadingPhoto
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#35a989] text-sm font-semibold text-white transition hover:bg-[#2d9478] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Salvar foto
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {passwordModalOpen && (
        <ModalOverlay
          onClose={() =>
            setPasswordModalOpen(false)
          }
          closeDisabled={changingPassword}
        >
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#35a989]/10 text-[#35a989]">
                  <KeyRound className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Alterar senha
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Crie uma senha forte e segura
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPasswordModalOpen(false)
                }
                disabled={changingPassword}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Senha atual
                </label>

                <PasswordInput
                  value={currentPassword}
                  onChange={
                    setCurrentPassword
                  }
                  placeholder="Digite sua senha atual"
                  show={
                    showCurrentPassword
                  }
                  onToggle={() =>
                    setShowCurrentPassword(
                      (value) => !value
                    )
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nova senha
                </label>

                <PasswordInput
                  value={newPassword}
                  onChange={
                    setNewPassword
                  }
                  placeholder="Mínimo de 8 caracteres"
                  show={showNewPassword}
                  onToggle={() =>
                    setShowNewPassword(
                      (value) => !value
                    )
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirmar nova senha
                </label>

                <PasswordInput
                  value={confirmPassword}
                  onChange={
                    setConfirmPassword
                  }
                  placeholder="Digite novamente sua senha"
                  show={
                    showConfirmPassword
                  }
                  onToggle={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                Use pelo menos 8 caracteres. Para maior segurança, combine letras, números e caracteres especiais.
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setPasswordModalOpen(
                      false
                    )
                  }
                  disabled={
                    changingPassword
                  }
                  className="h-11 cursor-pointer rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={alterarSenha}
                  disabled={
                    changingPassword
                  }
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#35a989] text-sm font-semibold text-white transition hover:bg-[#2d9478] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="h-4 w-4" />
                      Alterar senha
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {verificationModalOpen &&
        verificationType && (
          <ModalOverlay
            onClose={() =>
              setVerificationModalOpen(
                false
              )
            }
            closeDisabled={
              sendingVerification ||
              verifyingCode
            }
          >
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#35a989]/10 text-[#35a989]">
                    {verificationType ===
                      "email" ? (
                      <Mail className="h-5 w-5" />
                    ) : (
                      <Phone className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Verificar{" "}
                      {verificationType ===
                        "email"
                        ? "e-mail"
                        : "telefone"}
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Confirme sua informação de contato
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setVerificationModalOpen(
                      false
                    )
                  }
                  disabled={
                    sendingVerification ||
                    verifyingCode
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm leading-6 text-slate-600">
                    Enviaremos um código de confirmação para:
                  </p>

                  <p className="mt-2 break-all font-semibold text-slate-900">
                    {verificationType ===
                      "email"
                      ? emailUsuario
                      : formatPhoneBR(
                        telefoneUsuario
                      )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    enviarCodigoVerificacao
                  }
                  disabled={
                    sendingVerification
                  }
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#35a989]/30 bg-[#35a989]/5 text-sm font-semibold text-[#287f68] transition hover:bg-[#35a989]/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingVerification ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando código...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Enviar código
                    </>
                  )}
                </button>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Código de verificação
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    value={
                      verificationCode
                    }
                    onChange={(event) =>
                      setVerificationCode(
                        event.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    placeholder="Digite o código"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-center text-lg font-bold tracking-[0.3em] text-slate-900 outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#35a989] focus:bg-white focus:ring-4 focus:ring-[#35a989]/10"
                  />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setVerificationModalOpen(
                        false
                      )
                    }
                    disabled={
                      sendingVerification ||
                      verifyingCode
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={
                      verificarCodigo
                    }
                    disabled={
                      verifyingCode ||
                      verificationCode.trim()
                        .length < 4
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#35a989] text-sm font-semibold text-white transition hover:bg-[#2d9478] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {verifyingCode ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Confirmar
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

function AccessibilityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle
        cx="16"
        cy="4"
        r="2"
      />
      <path d="M10 8h7l-1 4-3 2" />
      <path d="M7 9l3 1" />
      <path d="M12 14l-2 6" />
      <path d="M15 14l3 6" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M9.5 2a3.5 3.5 0 0 0-3.4 4.3A3.5 3.5 0 0 0 4 9.5a3.5 3.5 0 0 0 1.4 2.8A3.5 3.5 0 0 0 8 18.5a3.5 3.5 0 0 0 6.1 1.8 3.5 3.5 0 0 0 5.4-2.9 3.5 3.5 0 0 0-.8-2.2A3.5 3.5 0 0 0 20 12a3.5 3.5 0 0 0-1.3-2.7A3.5 3.5 0 0 0 17 4.5a3.5 3.5 0 0 0-4.4-1.8A3.5 3.5 0 0 0 9.5 2Z" />
      <path d="M9 7.5a2 2 0 0 1 2 2V12" />
      <path d="M15 7a2 2 0 0 0-2 2v6" />
      <path d="M8 12h3" />
      <path d="M13 15h3" />
    </svg>
  );
}