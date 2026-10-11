"use client";
import Image from "next/image";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EyeOff, Eye } from "lucide-react";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [success, setSuccess] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState<"fraca" | "média" | "forte" | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const checkStrength = (value: string) => {
    let score = 0;
    if (value.length >= 6) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    if (score <= 1) return "fraca";
    if (score === 2 || score === 3) return "média";
    return "forte";
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setStrength(checkStrength(value));
    setError("");
  };

  const handleReset = async () => {
    if (loading || success) return;
    setError("");
    if (!token) {
      setError("Token inválido");
      return;
    }

    if (!password || !confirm) {
      setError("Preencha todos os campos");
      return;
    }

    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao redefinir senha");
        return;
      }
      setSuccess("Senha redefinida com sucesso!");

      setTimeout(() => {
        router.push("/login");
      }, 5000);

    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8">
      <Image
        src="/bg-login.png"
        alt="Background"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/70" />

      {success && (
        <div className="fixed top-3 right-3 left-3 sm:left-auto sm:top-5 sm:right-5 z-[99999]">
          <div className="flex items-center gap-2 sm:gap-3 bg-green-500 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl shadow-2xl animate-slideIn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-xs sm:text-sm font-semibold">
              {success}
            </span>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-md lg:max-w-lg xl:max-w-lg 2xl:max-w-xl p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
        <h1 className="text-lg sm:text-xl lg:text-2xl text-white font-bold mb-5 sm:mb-6 text-center">
          Redefinir senha
        </h1>
        {error && (
          <div className="mb-4 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-red-500 bg-red-500/10 text-red-400 text-xs sm:text-sm">
            {error}
          </div>
        )}
        <label className="text-white text-sm sm:text-base">Senha</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nova senha"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            className="w-full p-2.5 sm:p-3 text-sm mt-2 mb-3 rounded-xl bg-white/20 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-teal-400 mb-2 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {password && (
          <div className="mb-2">
            <p className="text-xs text-white">
              Força da senha:
              <span
                className={`ml-1 ${
                  strength === "fraca"
                    ? "text-red-400"
                    : strength === "média"
                    ? "text-yellow-400"
                    : "text-green-400"
                }`}
              >
                {strength}
              </span>
            </p>
          </div>
        )}
        <label className="text-white text-sm sm:text-base">Confirmar Senha</label>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirmar senha"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setError("");
          }}
          className="w-full p-2.5 sm:p-3 text-sm mt-2 rounded-xl bg-white/20 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-teal-400 mb-4"
        />
        <button
          onClick={handleReset}
          disabled={loading || !!success}
          className={`w-full p-2.5 sm:p-3 rounded-3xl mt-3 font-semibold text-white text-sm sm:text-base flex items-center justify-center transition ${
            loading || success
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-teal-500 hover:bg-teal-600"
          }`}
        >
          {loading ? "Salvando..." : "Redefinir Senha"}
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white">
          Carregando...
        </div>
      }
    >
      <ResetForm />
    </Suspense>
  );
}