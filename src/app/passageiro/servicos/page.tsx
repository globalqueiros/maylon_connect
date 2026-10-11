"use client";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CircleAlert,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Gift,
  History,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
const services = [
  {
    title: "Recarga de celular",
    description: "Adicione créditos ao seu celular",
    href: "/passageiro/servicos/recarga-celular",
    icon: Smartphone,
    iconColor: "text-[#08a89d]",
    iconBg: "bg-[#e7f8f4]",
  },
  {
    title: "Gift Card",
    description: "Compre créditos e cartões digitais",
    href: "/passageiro/servicos/gift-card",
    icon: Gift,
    iconColor: "text-[#8b5cf6]",
    iconBg: "bg-[#f1ebff]",
  },
  {
    title: "Pagar contas",
    description: "Água, luz, internet e muito mais",
    href: "/passageiro/servicos/pagamentos-contas",
    icon: CreditCard,
    iconColor: "text-[#1676b7]",
    iconBg: "bg-[#eaf4fb]",
  },
  {
    title: "Pagar boleto",
    description: "Pague seus boletos rapidamente",
    href: "/passageiro/servicos/pagamento-boleto",
    icon: FileText,
    iconColor: "text-[#f08a24]",
    iconBg: "bg-[#fff3e7]",
  },
];
type TransactionType = "in" | "out";
type Transaction = {
  id: number | string;
  title: string;
  description: string;
  value: number;
  type: TransactionType;
  created_at: string;
};
type WalletData = {
  id: number | string;
  conta: string | null;
  balance: number;
  currency: string;
};
type ApiTransaction = {
  id?: number | string;
  title?: string;
  description?: string;
  value?: number | string;
  amount?: number | string;
  type?: string;
  created_at?: string;
};
type UserData = {
  name: string;
  cpf: string;
  phone: string;
};
type VerificationStep = "dados" | "didit";
<<<<<<< HEAD
type AlertType = "success" | "error" | "warning";
type AlertData = {
  type: AlertType;
  message: string;
};
function normalizeTransactionType(type: unknown): TransactionType {
  const normalized = String(type ?? "").trim().toLowerCase();
=======

function normalizeTransactionType(type: unknown): TransactionType {
  const normalized = String(type ?? "").trim().toLowerCase();

>>>>>>> 9c9d572 (Fist Commit)
  if (
    normalized === "in" ||
    normalized === "entrada" ||
    normalized === "credit" ||
    normalized === "credito" ||
    normalized === "received" ||
    normalized === "deposit"
  ) {
    return "in";
  }
  return "out";
}
function formatCpf(value: string) {
  const numbers = String(value ?? "").replace(/\D/g, "");
<<<<<<< HEAD
  if (!numbers) return "";
  const limited = numbers.slice(0, 11);
  if (limited.length <= 3) return limited;
=======

  if (!numbers) return "";

  const limited = numbers.slice(0, 11);

  if (limited.length <= 3) return limited;

>>>>>>> 9c9d572 (Fist Commit)
  if (limited.length <= 6) {
    return limited.replace(/(\d{3})(\d+)/, "$1.$2");
  }
  if (limited.length <= 9) {
    return limited.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  }
  return limited.replace(
    /(\d{3})(\d{3})(\d{3})(\d{1,2})/,
    "$1.$2.$3-$4"
  );
}
function formatPhone(value: string) {
  const numbers = String(value ?? "").replace(/\D/g, "");
<<<<<<< HEAD
  if (!numbers) return "";
  const limited = numbers.slice(0, 11);
  if (limited.length <= 2) return limited;
=======

  if (!numbers) return "";

  const limited = numbers.slice(0, 11);

  if (limited.length <= 2) return limited;

>>>>>>> 9c9d572 (Fist Commit)
  if (limited.length <= 6) {
    return limited.replace(/(\d{2})(\d+)/, "($1) $2");
  }
  if (limited.length <= 10) {
    return limited.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
<<<<<<< HEAD
  }
  return limited.replace(/(\d{2})(\d{5})(\d{1,4})/, "($1) $2-$3");
}
export default function MaylonServicosPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [walletNotFound, setWalletNotFound] = useState(false);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState<AlertData | null>(null);
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [verificationStep, setVerificationStep] =
    useState<VerificationStep>("dados");
  const [verificacaoUrl, setVerificacaoUrl] = useState<string | null>(null);
  const [verificacaoLoading, setVerificacaoLoading] = useState(false);
  const [verificacaoFalhou, setVerificacaoFalhou] = useState(false);
  const [verificacaoAviso, setVerificacaoAviso] = useState<string | null>(null);
  function showAlert(message: string, type: AlertType = "success") {
    setAlert({ message, type });
  }
  useEffect(() => {
    if (!alert) return;
    const timer = window.setTimeout(() => setAlert(null), 5000);
    return () => window.clearTimeout(timer);
  }, [alert]);
  function renderAlertToast() {
    if (!alert) return null;
    const alertClass =
      alert.type === "success"
        ? "alert-success border-emerald-300 bg-emerald-50 text-emerald-900"
        : alert.type === "error"
        ? "alert-danger border-red-300 bg-red-50 text-red-900"
        : "alert-warning border-amber-300 bg-amber-50 text-amber-900";
    return (
      <div className="fixed inset-x-0 top-4 z-[10000] flex justify-center px-4 sm:top-6">
        <div
          role="alert"
          aria-live="assertive"
          className={`alert flex w-full max-w-lg items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl ${alertClass}`}
          style={{ animation: "maylonAlertIn 180ms ease-out" }}
        >
          <CircleAlert size={20} className="mt-0.5 shrink-0" />
          <p className="min-w-0 flex-1 text-sm font-semibold">
            {alert.message}
          </p>
          <button
            type="button"
            onClick={() => setAlert(null)}
            className="shrink-0 cursor-pointer rounded-md px-2 py-1 text-sm font-bold opacity-70 transition hover:bg-black/10 hover:opacity-100"
            aria-label="Fechar alerta"
          >
            <X size={16} />
          </button>
        </div>
        <style jsx>{`
          @keyframes maylonAlertIn {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }
  const loadUserData = useCallback(async () => {
    try {
      setUserLoading(true);
=======
  }

  return limited.replace(
    /(\d{2})(\d{5})(\d{1,4})/,
    "($1) $2-$3"
  );
}

export default function MaylonServicosPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [walletNotFound, setWalletNotFound] = useState(false);
  const [error, setError] = useState("");
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [verificationStep, setVerificationStep] =
    useState<VerificationStep>("dados");
  const [verificacaoUrl, setVerificacaoUrl] = useState<string | null>(null);
  const [verificacaoLoading, setVerificacaoLoading] = useState(false);
  const [verificacaoFalhou, setVerificacaoFalhou] = useState(false);
  const [verificacaoAviso, setVerificacaoAviso] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    try {
      setUserLoading(true);

>>>>>>> 9c9d572 (Fist Commit)
      const response = await fetch("/api/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
<<<<<<< HEAD
        headers: { Accept: "application/json" },
      });
=======
        headers: {
          Accept: "application/json",
        },
      });

>>>>>>> 9c9d572 (Fist Commit)
      if (!response.ok) {
        setUserData(null);
        return;
      }
<<<<<<< HEAD
      const data = await response.json();
=======

      const data = await response.json();

>>>>>>> 9c9d572 (Fist Commit)
      const user =
        data?.user ??
        data?.passageiro ??
        data?.profile ??
        data?.data?.user ??
        data?.data?.passageiro ??
        data?.data?.profile ??
        data?.data ??
        data;
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
      const name =
        user?.name ??
        user?.nome ??
        user?.full_name ??
        user?.nome_completo ??
        "";
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
      const cpf =
        user?.cpf ??
        user?.document ??
        user?.documento ??
        user?.tax_id ??
        user?.identification_number ??
        "";
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
      const phone =
        user?.phone ??
        user?.telefone ??
        user?.cellphone ??
        user?.celular ??
        user?.phone_number ??
        "";
<<<<<<< HEAD
      setUserData({
        name: String(name ?? ""),
        cpf: String(cpf ?? "")
          .replace(/\D/g, "")
          .slice(0, 11),
        phone: String(phone ?? "")
          .replace(/\D/g, "")
          .slice(0, 11),
      });
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
=======

      setUserData({
        name: String(name ?? ""),
        cpf: String(cpf ?? "").replace(/\D/g, "").slice(0, 11),
        phone: String(phone ?? "").replace(/\D/g, "").slice(0, 11),
      });
    } catch {
>>>>>>> 9c9d572 (Fist Commit)
      setUserData(null);
    } finally {
      setUserLoading(false);
    }
  }, []);
<<<<<<< HEAD
  const loadWallet = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError("");
=======

  async function encerrarConta() {
    try {
      const response = await fetch("/api/encerrar-conta", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) return;

      if (data?.success) {
        window.location.href = "/";
      }
    } catch {
      return;
    }
  }

  const loadWallet = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

>>>>>>> 9c9d572 (Fist Commit)
      const response = await fetch("/api/wallet", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
<<<<<<< HEAD
        headers: { Accept: "application/json" },
      });
      const contentType = response.headers.get("content-type") || "";
      let data: any = null;
=======
        headers: {
          Accept: "application/json",
        },
      });

      const contentType = response.headers.get("content-type") || "";
      let data: any = null;

>>>>>>> 9c9d572 (Fist Commit)
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        await response.text();
      }
<<<<<<< HEAD
      if (response.status === 401) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
      }
=======

      if (response.status === 401) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
      }

>>>>>>> 9c9d572 (Fist Commit)
      if (response.status === 404) {
        setWallet(null);
        setTransactions([]);
        setWalletNotFound(true);
        return;
      }
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Não foi possível carregar sua carteira."
        );
      }
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
      if (!data?.wallet) {
        setWallet(null);
        setTransactions([]);
        setWalletNotFound(true);
        return;
      }
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
      setWallet({
        id: data.wallet.id,
        conta:
          data.wallet.conta ??
          data.wallet.account ??
          data.wallet.account_number ??
          null,
        balance: Number(data.wallet.balance ?? data.wallet.saldo ?? 0),
        currency: data.wallet.currency || data.wallet.moeda || "BRL",
      });
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
      const apiTransactions: ApiTransaction[] = Array.isArray(
        data.transactions
      )
        ? data.transactions
        : Array.isArray(data.movimentacoes)
<<<<<<< HEAD
        ? data.movimentacoes
        : [];
=======
          ? data.movimentacoes
          : [];

>>>>>>> 9c9d572 (Fist Commit)
      const normalizedTransactions = apiTransactions
        .map(
          (transaction): Transaction => ({
            id: transaction.id ?? crypto.randomUUID(),
            title: transaction.title || "Movimentação",
            description:
              transaction.description || "Movimentação da carteira",
            value: Number(transaction.value ?? transaction.amount ?? 0),
            type: normalizeTransactionType(transaction.type),
            created_at: transaction.created_at || "",
          })
        )
        .sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        })
        .slice(0, 10);
<<<<<<< HEAD
      setTransactions(normalizedTransactions);
      setWalletNotFound(false);
    } catch (err) {
      console.error("Erro ao carregar carteira:", err);
      setWallet(null);
      setTransactions([]);
      setWalletNotFound(false);
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar sua carteira.";
      setError(message);
      showAlert(message, "error");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);
=======

      setTransactions(normalizedTransactions);
      setWalletNotFound(false);
    } catch (err) {
      setWallet(null);
      setTransactions([]);
      setWalletNotFound(false);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar sua carteira."
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

>>>>>>> 9c9d572 (Fist Commit)
  useEffect(() => {
    void loadWallet();
    void loadUserData();
  }, [loadWallet, loadUserData]);
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
  const buscarStatusVerificacao = useCallback(async () => {
    try {
      const response = await fetch("/api/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
<<<<<<< HEAD
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return null;
      const data = await response.json();
=======
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) return null;

      const data = await response.json();

>>>>>>> 9c9d572 (Fist Commit)
      return (
        data?.verification?.documento?.status ??
        data?.data?.verification?.documento?.status ??
        data?.user?.verification?.documento?.status ??
        null
      );
    } catch {
      return null;
    }
  }, []);
<<<<<<< HEAD
  const createWallet = useCallback(async () => {
    if (creatingWallet) return;
=======

  const createWallet = useCallback(async () => {
    if (creatingWallet) return;

>>>>>>> 9c9d572 (Fist Commit)
    try {
      setCreatingWallet(true);
      setError("");
      setVerificacaoAviso(null);
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
      const response = await fetch("/api/wallet", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
<<<<<<< HEAD
      const contentType = response.headers.get("content-type") || "";
      let data: any = null;
=======

      const contentType = response.headers.get("content-type") || "";
      let data: any = null;

>>>>>>> 9c9d572 (Fist Commit)
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        await response.text();
<<<<<<< HEAD
      }
      if (response.status === 401) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
      }
      if (response.status === 405) {
        throw new Error(
          "A API /api/wallet não possui suporte ao método POST."
        );
      }
=======
      }

      if (response.status === 401) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
      }

      if (response.status === 405) {
        throw new Error(
          "A API /api/wallet não possui suporte ao método POST."
        );
      }

>>>>>>> 9c9d572 (Fist Commit)
      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Não foi possível criar sua carteira."
        );
      }
<<<<<<< HEAD
      setShowCreateWalletModal(false);
      showAlert("Carteira Maylon Pay criada com sucesso!", "success");
=======

      setShowCreateWalletModal(false);
>>>>>>> 9c9d572 (Fist Commit)
      setVerificationStep("dados");
      setVerificacaoUrl(null);
      setVerificacaoFalhou(false);
      setVerificacaoAviso(null);
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
      await loadWallet();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível criar sua carteira.";
<<<<<<< HEAD
      setError(message);
      setVerificacaoAviso(message);
      showAlert(message, "error");
=======

      setError(message);
      setVerificacaoAviso(message);
>>>>>>> 9c9d572 (Fist Commit)
    } finally {
      setCreatingWallet(false);
    }
  }, [creatingWallet, loadWallet]);
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
  useEffect(() => {
    if (
      !showCreateWalletModal ||
      verificationStep !== "didit" ||
      !verificacaoUrl
    ) {
      return;
    }
    let active = true;
<<<<<<< HEAD
    const interval = window.setInterval(async () => {
      const status = await buscarStatusVerificacao();
      if (!active) return;
=======

    const interval = window.setInterval(async () => {
      const status = await buscarStatusVerificacao();

      if (!active) return;

>>>>>>> 9c9d572 (Fist Commit)
      if (status === "aprovado" || status === "approved") {
        setVerificacaoUrl(null);
        await createWallet();
      }
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
      if (
        status === "reprovado" ||
        status === "rejected" ||
        status === "failed"
      ) {
        setVerificacaoFalhou(true);
      }
    }, 8000);
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [
    showCreateWalletModal,
    verificationStep,
    verificacaoUrl,
    buscarStatusVerificacao,
    createWallet,
  ]);
<<<<<<< HEAD
  async function iniciarVerificacao(forceNew = false) {
    if (verificacaoUrl && !forceNew) return;
=======

  async function iniciarVerificacao(forceNew = false) {
    if (verificacaoUrl && !forceNew) return;

>>>>>>> 9c9d572 (Fist Commit)
    setVerificacaoAviso(null);
    setVerificacaoFalhou(false);
    setVerificacaoLoading(true);
    try {
      const response = await fetch("/api/verificacao", {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
<<<<<<< HEAD
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.url) {
        const message =
          data?.message ||
          data?.error ||
          "Não foi possível iniciar a verificação.";
        setVerificacaoAviso(message);
        showAlert(message, "error");
        return;
      }
      setVerificacaoUrl(data.url);
    } catch (err) {
      console.error("Erro Didit:", err);
      setVerificacaoAviso("Erro ao iniciar a verificação.");
      showAlert("Erro ao iniciar a verificação.", "error");
=======

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.url) {
        setVerificacaoAviso(
          data?.message ||
            data?.error ||
            "Não foi possível iniciar a verificação."
        );
        return;
      }

      setVerificacaoUrl(data.url);
    } catch {
      setVerificacaoAviso("Erro ao iniciar a verificação.");
>>>>>>> 9c9d572 (Fist Commit)
    } finally {
      setVerificacaoLoading(false);
    }
  }
<<<<<<< HEAD
  async function openCreateWalletModal() {
    if (creatingWallet) return;
=======

  async function openCreateWalletModal() {
    if (creatingWallet) return;

>>>>>>> 9c9d572 (Fist Commit)
    setError("");
    setVerificacaoAviso(null);
    setVerificacaoFalhou(false);
    setVerificacaoUrl(null);
    setVerificationStep("dados");
<<<<<<< HEAD
    const status = await buscarStatusVerificacao();
=======

    const status = await buscarStatusVerificacao();

>>>>>>> 9c9d572 (Fist Commit)
    if (status === "aprovado" || status === "approved") {
      await createWallet();
      return;
    }
    await loadUserData();
    setShowCreateWalletModal(true);
  }
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
  async function continuarParaDidit() {
    setVerificationStep("didit");
    await iniciarVerificacao();
  }
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
  function tentarNovamenteVerificacao() {
    setVerificationStep("didit");
    void iniciarVerificacao(true);
  }
<<<<<<< HEAD
  function closeCreateWalletModal() {
    if (creatingWallet) return;
=======

  function closeCreateWalletModal() {
    if (creatingWallet) return;

>>>>>>> 9c9d572 (Fist Commit)
    setShowCreateWalletModal(false);
    setVerificationStep("dados");
    setVerificacaoUrl(null);
    setVerificacaoLoading(false);
    setVerificacaoFalhou(false);
    setVerificacaoAviso(null);
  }
<<<<<<< HEAD
  const balance = wallet?.balance ?? 0;
  const conta = wallet?.conta ?? "";
=======

  const balance = wallet?.balance ?? 0;
  const conta = wallet?.conta ?? "";

>>>>>>> 9c9d572 (Fist Commit)
  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: wallet?.currency || "BRL",
    });
  }
<<<<<<< HEAD
  function formatDate(date: string) {
    if (!date) return "";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
=======

  function formatDate(date: string) {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "";

>>>>>>> 9c9d572 (Fist Commit)
    return parsed.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
<<<<<<< HEAD
  function renderCreateWalletModal() {
    if (!showCreateWalletModal) return null;
=======

  function CreateWalletModal() {
    if (!showCreateWalletModal) return null;

>>>>>>> 9c9d572 (Fist Commit)
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#001b2f]/75 p-0 backdrop-blur-md sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verificacao-wallet-title"
      >
        <div
          className="relative flex h-[calc(100dvh-8px)] max-h-[900px] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:h-[min(850px,90dvh)] sm:rounded-[28px]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="shrink-0 border-b border-gray-100">
            <div className="flex items-start gap-3.5 p-5 sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF6F4] text-[#149C8B]">
                <ShieldCheck size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="verificacao-wallet-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  Criar carteira Maylon Pay
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Confirme seus dados e conclua a verificação de identidade.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateWalletModal}
                disabled={creatingWallet}
<<<<<<< HEAD
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
=======
                className="flex h-9 w-9 cursor-pointer shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
>>>>>>> 9c9d572 (Fist Commit)
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </div>
          </div>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="px-5 pb-6 pt-5 sm:px-6 sm:pb-6">
              {verificacaoAviso && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
                >
                  <CircleAlert size={16} className="mt-0.5 shrink-0" />
                  <span>{verificacaoAviso}</span>
                </div>
              )}
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
              <div className="mb-5 flex items-center gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#149C8B] text-sm font-black text-white">
                    {verificationStep === "didit" ? "✓" : "1"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-gray-900">
                      Seus dados
                    </p>
                    <p className="truncate text-[10px] text-gray-400">
                      Confirme seus dados
                    </p>
                  </div>
                </div>
                <div className="h-px flex-1 bg-gray-200" />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                      verificationStep === "didit"
                        ? "bg-[#149C8B] text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    2
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`truncate text-xs font-black ${
                        verificationStep === "didit"
                          ? "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      Identidade
                    </p>
                    <p className="truncate text-[10px] text-gray-400">
                      Verificação segura
                    </p>
                  </div>
                </div>
              </div>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
              {creatingWallet ? (
                <div className="flex min-h-[420px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f766e]">
                      <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#062b4f]">
                      Criando sua carteira...
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Aguarde enquanto finalizamos seu cadastro.
                    </p>
                  </div>
                </div>
              ) : verificationStep === "dados" ? (
                <div>
                  <div className="rounded-2xl border border-[#e7eeee] bg-[#f8fbfb] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF6F4] text-[#149C8B]">
                        <FileText size={21} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-gray-900">
                          Confirme seus dados
                        </h3>
                        <p className="mt-0.5 text-xs text-gray-500">
                          Confira as informações antes de continuar.
                        </p>
                      </div>
                    </div>
                    {userLoading ? (
                      <div className="mt-5 space-y-3">
                        {[1, 2, 3].map((item) => (
                          <div
                            key={item}
                            className="h-[72px] animate-pulse rounded-xl bg-white"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="mt-5 space-y-3">
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Nome completo
                          </p>
                          <p className="mt-1 break-words text-sm font-bold text-[#062b4f]">
                            {userData?.name || "Não informado"}
                          </p>
                        </div>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            CPF
                          </p>
                          <p className="mt-1 text-sm font-bold text-[#062b4f]">
                            {userData?.cpf
                              ? formatCpf(userData.cpf)
                              : "Não informado"}
                          </p>
                        </div>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Telefone
                          </p>
                          <p className="mt-1 text-sm font-bold text-[#062b4f]">
                            {userData?.phone
                              ? formatPhone(userData.phone)
                              : "Não informado"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                  <div className="mt-4 flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <ShieldCheck
                      size={19}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />
                    <div>
                      <p className="text-xs font-bold text-blue-900">
                        Seus dados estão protegidos
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-blue-700">
                        Na próxima etapa você fará uma verificação segura da
                        sua identidade.
                      </p>
                    </div>
                  </div>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                  <button
                    type="button"
                    onClick={continuarParaDidit}
                    disabled={
                      userLoading ||
                      !userData?.cpf ||
                      userData.cpf.length !== 11
                    }
<<<<<<< HEAD
                    className="mt-5 flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#149C8B] px-5 text-sm font-black text-white transition hover:bg-[#11897D] disabled:cursor-not-allowed disabled:opacity-50"
=======
                    className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#149C8B] px-5 text-sm font-black text-white transition hover:bg-[#11897D] disabled:cursor-not-allowed disabled:opacity-50"
>>>>>>> 9c9d572 (Fist Commit)
                  >
                    Confirmar e continuar
                    <ArrowRight size={18} />
                  </button>
                </div>
              ) : verificacaoFalhou ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/60 p-8 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <CircleAlert size={24} />
                  </span>
                  <div className="mt-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      Não foi possível verificar sua identidade
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Os dados não foram validados. Tente novamente.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={tentarNovamenteVerificacao}
<<<<<<< HEAD
                    className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#149C8B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#11897D]"
=======
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#149C8B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#11897D]"
>>>>>>> 9c9d572 (Fist Commit)
                  >
                    <RefreshCw size={18} />
                    Tentar novamente
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationStep("dados");
                      setVerificacaoFalhou(false);
                    }}
                    className="mt-3 cursor-pointer text-xs font-bold text-gray-500 hover:text-gray-800"
                  >
                    Voltar para meus dados
                  </button>
                </div>
              ) : verificacaoLoading ? (
                <div className="flex min-h-[420px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f766e] shadow-xl shadow-[#0f766e]/20">
                      <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#062b4f]">
                      Preparando verificação...
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Isso pode levar alguns segundos.
                    </p>
                  </div>
                </div>
              ) : verificacaoUrl ? (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-[#062b4f]">
                        Verificação de identidade
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        Siga as instruções apresentadas abaixo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationStep("dados");
                        setVerificacaoUrl(null);
                      }}
                      disabled={creatingWallet}
<<<<<<< HEAD
                      className="cursor-pointer text-xs font-bold text-[#149C8B] hover:text-[#11897D]"
=======
                      className="text-xs font-bold text-[#149C8B] hover:text-[#11897D]"
>>>>>>> 9c9d572 (Fist Commit)
                    >
                      Voltar
                    </button>
                  </div>
                  <iframe
                    src={verificacaoUrl}
                    title="Verificação de identidade"
                    className="h-[calc(100dvh-260px)] min-h-[480px] w-full rounded-2xl border border-gray-200 bg-white sm:h-[600px]"
                    allow="camera; microphone; fullscreen; autoplay; encrypted-media"
                  />
                </div>
              ) : (
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f8f4] text-[#149C8B]">
                    <ShieldCheck size={26} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#062b4f]">
                      Verificação não iniciada
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Clique abaixo para iniciar novamente.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={tentarNovamenteVerificacao}
<<<<<<< HEAD
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#149C8B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#11897D]"
=======
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#149C8B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#11897D]"
>>>>>>> 9c9d572 (Fist Commit)
                  >
                    <RefreshCw size={18} />
                    Iniciar verificação
                  </button>
                  <button
                    type="button"
<<<<<<< HEAD
                    onClick={() => {
                      setVerificationStep("dados");
                    }}
                    className="cursor-pointer text-xs font-bold text-gray-500"
=======
                    onClick={() => setVerificationStep("dados")}
                    className="text-xs font-bold text-gray-500"
>>>>>>> 9c9d572 (Fist Commit)
                  >
                    Voltar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
<<<<<<< HEAD
  if (loading) {
    return (
=======

  if (loading) {
    return (
      <main className="min-h-screen pb-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <header className="flex items-center pt-6 sm:pt-8">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Carteira digital
                </p>

                <h1 className="mt-0.5 text-xl font-black text-white sm:text-2xl">
                  Maylon Pay
                </h1>
              </div>
            </div>
          </header>

          <div className="mt-8 flex min-h-[420px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-white/10 text-[#83ead9]">
                <Wallet size={30} />
              </div>

              <p className="mt-5 text-sm font-bold text-white">
                Carregando sua carteira...
              </p>

              <p className="mt-1 text-xs text-white/40">
                Aguarde um momento.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (walletNotFound) {
    return (
>>>>>>> 9c9d572 (Fist Commit)
      <>
        {renderAlertToast()}
        <main className="min-h-screen pb-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
<<<<<<< HEAD
            <header className="flex items-center pt-6 sm:pt-8">
              <div className="flex items-center gap-3">
                <Link
                  href="/passageiro"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
                  aria-label="Voltar"
                >
                  <ArrowLeft size={18} />
                </Link>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Carteira digital
                  </p>
                  <h1 className="mt-0.5 text-xl font-black text-white sm:text-2xl">
                    Maylon Pay
                  </h1>
                </div>
              </div>
            </header>
            <div className="mt-8 flex min-h-[420px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-white/10 text-[#83ead9]">
                  <Wallet size={30} />
                </div>
                <p className="mt-5 text-sm font-bold text-white">
                  Carregando sua carteira...
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Aguarde um momento.
                </p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }
  if (walletNotFound) {
    return (
      <>
        {renderAlertToast()}
        <main className="min-h-screen pb-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <header className="flex items-center justify-between pt-6 sm:pt-8">
              <div className="flex items-center gap-3">
                <Link
                  href="/passageiro"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
                  aria-label="Voltar"
                >
                  <ArrowLeft size={18} />
                </Link>
=======
            <header className="flex items-center justify-between pt-6 sm:pt-8">
              <div className="flex items-center gap-3">
>>>>>>> 9c9d572 (Fist Commit)
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Carteira digital
                  </p>
                  <h1 className="mt-0.5 text-xl font-black text-white sm:text-2xl">
                    Maylon Pay
                  </h1>
                </div>
              </div>
            </header>
            <section className="mt-8">
              <div className="relative mx-auto max-w-2xl overflow-hidden rounded-[32px] bg-gradient-to-br from-[#062b4f] via-[#07566b] to-[#08a89d] p-7 shadow-[0_25px_70px_rgba(8,168,157,0.22)] sm:p-10">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#5be0c8]/20 blur-3xl" />
                <div className="absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-[#08a89d]/20 blur-3xl" />
                <div className="relative text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-white/10 text-[#83ead9]">
                    <Wallet size={38} />
                  </div>
                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#83ead9]">
                    Maylon Pay
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                    Crie sua carteira
                  </h2>
                  <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/65">
                    Você ainda não possui uma carteira digital. Crie sua
                    carteira Maylon Pay gratuitamente para começar a receber,
                    enviar e movimentar seu dinheiro.
                  </p>
                  {error && (
                    <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-left text-sm text-red-100">
                      {error}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={openCreateWalletModal}
                    disabled={creatingWallet}
<<<<<<< HEAD
                    className="mt-6 inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-white px-6 text-sm font-black text-[#062b4f] transition hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[280px]"
=======
                    className="mt-6 cursor-pointer inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 text-sm font-black text-[#062b4f] transition hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[280px]"
>>>>>>> 9c9d572 (Fist Commit)
                  >
                    <Wallet size={19} />
                    Criar minha carteira
                  </button>
                  <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <Wallet size={19} className="text-[#83ead9]" />
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                      <p className="mt-3 text-xs font-black text-white">
                        Conta digital
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-white/45">
                        Tenha sua própria conta Maylon.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <QrCode size={19} className="text-[#83ead9]" />
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                      <p className="mt-3 text-xs font-black text-white">
                        Pix
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-white/45">
                        Envie e receba dinheiro.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <History size={19} className="text-[#83ead9]" />
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                      <p className="mt-3 text-xs font-black text-white">
                        Extrato
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-white/45">
                        Acompanhe suas movimentações.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
        {renderCreateWalletModal()}
      </>
    );
  }
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
  return (
    <>
      {renderAlertToast()}
      <main className="min-h-screen pb-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <header className="flex items-center justify-between pt-6 sm:pt-8">
            <div className="flex items-center gap-3">
              <Link
                href="/passageiro"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
                aria-label="Voltar"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Carteira digital
                </p>
                <h1 className="mt-0.5 text-xl font-black text-white sm:text-2xl">
                  Maylon Pay
                </h1>
              </div>
            </div>
            <Link
              href="/passageiro/servicos/extrato"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
              aria-label="Ver extrato"
            >
              <History size={18} />
            </Link>
          </header>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
          {error && (
            <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
          <section className="mt-6">
            <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#062b4f] via-[#07566b] to-[#08a89d] p-6 shadow-[0_20px_55px_rgba(8,168,157,0.20)] sm:p-8">
              <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#5be0c8]/20 blur-3xl" />
              <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#08a89d]/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                      <Wallet size={18} />
                    </div>
                    <span className="text-xs font-bold text-white/70">
                      Saldo disponível
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBalance((value) => !value)}
<<<<<<< HEAD
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15"
                    aria-label={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
=======
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15"
>>>>>>> 9c9d572 (Fist Commit)
                  >
                    {showBalance ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <div className="mt-6">
                  <p className="mb-3 text-sm font-medium text-white">
                    N° da Conta:{" "}
                    <span className="font-black">
                      {conta || "Não disponível"}
                    </span>
                  </p>
                  <p className="text-sm font-medium text-white/60">
                    Seu saldo
                  </p>
                  <h2 className="mt-1 text-4xl font-black tracking-tight text-white">
<<<<<<< HEAD
                    {showBalance ? formatCurrency(balance) : "R$ ••••••"}
=======
                    {showBalance
                      ? formatCurrency(balance)
                      : "R$ ••••••"}
>>>>>>> 9c9d572 (Fist Commit)
                  </h2>
                </div>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  <Link
                    href="/passageiro/servicos/pix"
                    className="group flex items-center gap-3 rounded-2xl bg-white p-3.5 text-[#062b4f]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f8f4] text-[#08a89d]">
                      <QrCode size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black">Pix</p>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                      <p className="mt-0.5 text-[10px] text-[#8ca0b2]">
                        Enviar ou receber
                      </p>
                    </div>
                    <ArrowRight
                      size={15}
                      className="ml-auto text-[#9aabb8]"
                    />
                  </Link>
                  <Link
                    href="/passageiro/servicos/deposito"
                    className="group flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 text-white backdrop-blur-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#83ead9]">
                      <ArrowDownToLine size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black">Depositar</p>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                      <p className="mt-0.5 text-[10px] text-white/50">
                        Adicionar dinheiro
                      </p>
                    </div>
                    <ArrowRight
                      size={15}
                      className="ml-auto text-white/40"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </section>
<<<<<<< HEAD
          <section className="mt-7">
            <div className="mb-4">
              <h2 className="text-lg font-black text-white">Ações rápidas</h2>
=======

          <section className="mt-7">
            <div className="mb-4">
              <h2 className="text-lg font-black text-white">
                Ações rápidas
              </h2>

>>>>>>> 9c9d572 (Fist Commit)
              <p className="mt-0 text-xs text-white/45">
                Faça mais com seu dinheiro
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  href: "/passageiro/servicos/pix",
                  title: "Pix",
                  description: "Enviar e receber",
                  icon: QrCode,
                  bg: "bg-[#e7f8f4]",
                  color: "text-[#08a89d]",
                },
                {
                  href: "/passageiro/servicos/deposito",
                  title: "Depositar",
                  description: "Adicionar saldo",
                  icon: ArrowDownToLine,
                  bg: "bg-[#eaf4fb]",
                  color: "text-[#1676b7]",
                },
                {
                  href: "/passageiro/servicos/transferir",
                  title: "Transferir",
                  description: "Enviar dinheiro",
                  icon: ArrowUpRight,
                  bg: "bg-[#f1ebff]",
                  color: "text-[#8b5cf6]",
                },
                {
                  href: "/passageiro/servicos/extrato",
                  title: "Extrato",
                  description: "Ver movimentações",
                  icon: History,
                  bg: "bg-[#fff3e7]",
                  color: "text-[#f08a24]",
                },
              ].map((item) => {
                const Icon = item.icon;
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group rounded-[22px] border border-white/10 bg-white p-4 transition hover:-translate-y-1"
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.bg} ${item.color}`}
                    >
                      <Icon size={21} />
                    </div>
<<<<<<< HEAD
                    <p className="mt-4 text-sm font-black text-[#062b4f]">
                      {item.title}
                    </p>
=======

                    <p className="mt-4 text-sm font-black text-[#062b4f]">
                      {item.title}
                    </p>

>>>>>>> 9c9d572 (Fist Commit)
                    <p className="mt-1 text-[10px] text-[#8ca0b2]">
                      {item.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-black text-white">
                  Movimentações recentes
                </h2>
                <p className="mt-0 text-xs text-white/45">
                  Últimas 10 movimentações da sua carteira
                </p>
              </div>
              <Link
                href="/passageiro/servicos/extrato"
                className="text-sm font-bold text-white/60"
              >
                Ver extrato
              </Link>
            </div>
            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white">
              {transactions.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f8f9] text-[#9aabb8]">
                    <History size={20} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-[#062b4f]">
                    Nenhuma movimentação encontrada
                  </p>
                  <p className="mt-1 text-xs text-[#8ca0b2]">
                    Quando você realizar uma transação, ela aparecerá aqui.
                  </p>
                </div>
              ) : (
                transactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className={`flex items-center gap-3 p-4 sm:p-5 ${
                      index !== transactions.length - 1
                        ? "border-b border-[#edf1f3]"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        transaction.type === "in"
                          ? "bg-[#e7f8f4] text-[#08a89d]"
                          : "bg-[#fff3f1] text-[#ef5b5b]"
                      }`}
                    >
                      {transaction.type === "in" ? (
                        <ArrowDownToLine size={19} />
                      ) : (
                        <ArrowUpRight size={19} />
                      )}
                    </div>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[#062b4f]">
                        {transaction.title}
                      </p>
<<<<<<< HEAD
                      <p className="mt-1 truncate text-[10px] text-[#9aabb8]">
                        {transaction.description}
                      </p>
=======

                      <p className="mt-1 truncate text-[10px] text-[#9aabb8]">
                        {transaction.description}
                      </p>

>>>>>>> 9c9d572 (Fist Commit)
                      <p className="mt-1 text-[9px] text-[#b0bcc5]">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                    <p
                      className={`whitespace-nowrap text-sm font-black ${
                        transaction.type === "in"
                          ? "text-[#08a89d]"
                          : "text-[#062b4f]"
                      }`}
                    >
                      {transaction.type === "in" ? "+" : "-"}{" "}
                      {formatCurrency(Math.abs(transaction.value))}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
<<<<<<< HEAD
          <section className="mt-8">
            <div className="mb-5">
              <h2 className="text-lg font-black text-white">Outros serviços</h2>
=======

          <section className="mt-8">
            <div className="mb-5">
              <h2 className="text-lg font-black text-white">
                Outros serviços
              </h2>

>>>>>>> 9c9d572 (Fist Commit)
              <p className="mt-0 text-xs text-white/45">
                Use seu saldo para facilitar seu dia
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {services.map((service) => {
                const Icon = service.icon;
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                return (
                  <Link
                    key={service.title}
                    href={service.href}
                    className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white p-5 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#f7fafb] transition-transform duration-500 group-hover:scale-150" />
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                    <div className="relative flex items-center gap-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${service.iconBg} ${service.iconColor}`}
                      >
                        <Icon size={25} strokeWidth={1.8} />
                      </div>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black text-[#062b4f]">
                          {service.title}
                        </h3>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                        <p className="mt-1 text-[11px] leading-4 text-[#8ca0b2]">
                          {service.description}
                        </p>
                      </div>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f8f9] text-[#8194a4] group-hover:bg-[#08a89d] group-hover:text-white">
                        <ArrowRight size={15} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
<<<<<<< HEAD
=======

>>>>>>> 9c9d572 (Fist Commit)
          <section className="mt-5">
            <div className="flex items-center gap-4 rounded-[24px] border border-[#5be0c8]/20 bg-[#08a89d] p-4 shadow-[0_12px_30px_rgba(8,168,157,0.18)]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Seu dinheiro na Maylon
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-white/75">
                  Gerencie seu saldo, Pix e pagamentos em um só lugar.
                </p>
              </div>
            </div>
          </section>
<<<<<<< HEAD
=======

          <section className="mt-4">
            <div className="rounded-[24px] border border-red-500/20 bg-red-500 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Trash2 size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-white">
                      Encerrar conta
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/70">
                      Solicite o encerramento definitivo da sua conta Maylon.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={encerrarConta}
                  className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-xs font-black text-white transition hover:bg-white/20"
                >
                  <Trash2 size={16} />
                  Encerrar minha conta
                </button>
              </div>
            </div>
          </section>
>>>>>>> 9c9d572 (Fist Commit)
        </div>
      </main>
      {renderCreateWalletModal()}
    </>
  );
}