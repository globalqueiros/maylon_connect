"use client";
import Image from "next/image";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Mail } from "lucide-react";

function LoginPage() {
  const [open, setOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const logout = searchParams.get("logout");
    if (logout === "success") {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    }
  }, [searchParams]);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao logar");
        setLoading(false);
        return;
      }
      const userType = String(data.user.user_type || "").toLowerCase();
      if (userType === "driver" || userType === "motorista") {
        window.location.href = "/motorista";
      } else if (
        userType === "customer" ||
        userType === "passageiro" ||
        userType === "passenger"
      ) {
        window.location.href = "/passageiro";
      } else {
        window.location.href = "/passageiro";
      }
    } catch {
      setError("Erro de conexão");
    }
    setLoading(false);
  };
  const handleSendReset = async () => {
    if (!resetEmail) {
      setResetError("Digite seu email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setResetError("Email inválido");
      return;
    }
    try {
      setResetLoading(true);
      setResetError("");
      setResetSuccess("");
      const res = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: resetEmail,
          type: "reset",
        }),
      });
      if (!res.ok) throw new Error("Erro ao enviar link");
      setResetSuccess("Link enviado para seu email!");
      setTimeout(() => {
        setOpen(false);
        setResetSuccess("");
        setResetEmail("");
      }, 3000);
    } catch (err: any) {
      setResetError(err.message || "Erro ao enviar");
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (!errorParam) return;
    if (errorParam === "invalid") {
      setError("Não foi possível acessar sua conta. Link inválido ou já usado.");
    }
    if (errorParam === "expired") {
      setError("Seu link expirou. Solicite um novo acesso.");
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url.toString());
  }, [searchParams]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      setError("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [error]);

  return (
    <>
      <div className="relative min-h-screen w-full flex items-center justify-center">
        <Image
          src="/bg-login.png"
          alt="Background"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>
        {showAlert && (
          <div className="fixed top-4 right-4 z-[99999] pointer-events-none">
            <div className="flex items-center gap-3 bg-green-500 text-white px-5 py-3 rounded-xl shadow-2xl animate-slideIn pointer-events-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm tracking-5 font-semibold">
                Deslogado com sucesso!
              </span>
            </div>
          </div>
        )}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="fixed top-5 right-5 z-[99999]"
            >
              <div className="flex items-center gap-3 bg-red-500 text-white px-5 py-3 rounded-xl shadow-2xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3l9 16H3L12 3z" />
                </svg>
                <span className="text-sm font-semibold">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="relative z-10 w-full max-w-md p-8 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl">
          <h1 className="text-3xl font-bold text-white text-center mb-4">
            Portal Connect
          </h1>
          {resetSuccess && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-green-100 border border-green-400 text-green-700 text-sm animate-fadeIn">
              {resetSuccess}
            </div>
          )}
          {resetError && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-100 border border-red-400 text-red-700 text-sm animate-fadeIn">
              {resetError}
            </div>
          )}
          <form onSubmit={handleLogin} className="flex flex-col gap-2">
            <label className="text-white">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full p-3 text-sm rounded-xl bg-white/20 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-teal-400"
            />
            <label className="text-white mt-3">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
              className="w-full p-3 text-sm rounded-xl bg-white/20 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-teal-400"
            />
            <div className="flex justify-end text-sm text-white mt-2 mb-4">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="cursor-pointer hover:text-white"
              >
                Esqueceu a senha?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full p-3 rounded-3xl cursor-pointer font-semibold text-white transition ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-teal-500 hover:bg-teal-600"
                }`}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-xs text-gray-300 font-semibold">OU</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>
            <Link
              href="/magic_link"
              className="w-full flex items-center justify-center gap-2 p-3 rounded-3xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition"
            >
              <Mail size={16} />
              Entrar com Email
            </Link>
          </form>
          <div className="flex mt-6 flex-col items-center gap-4 text-center">
            <p className="text-white text-base font-semibold tracking-[1]">
              Baixe nosso app
            </p>
            <div className="flex gap-6 flex-col md:flex-row items-center justify-center">
              <div className="flex flex-col items-center">
                <p className="text-white text-sm mb-2 font-normal tracking-[1]">
                  Passageiro - Maylon
                </p>
                <Link
                  href="https://play.google.com/store/apps/details?id=com.maylon.rider&hl=pt_BR"
                  target="_blank"
                >
                  <Image
                    src="/google-play.png"
                    alt="Google Play"
                    width={176}
                    height={60}
                    className="w-40 hover:scale-105 transition"
                  />
                </Link>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-white text-sm mb-2 font-normal tracking-[1]">
                  Motorista - Maylon Drive
                </p>
                <Link
                  href="https://play.google.com/store/apps/details?id=com.maylon.driverr&hl=pt_BR"
                  target="_blank"
                >
                  <Image
                    src="/google-play.png"
                    alt="Google Play"
                    width={176}
                    height={60}
                    className="w-40 hover:scale-105 transition"
                  />
                </Link>
              </div>
            </div>
            <p className="text-white text-xs text-sm tracking-[1]">
              Disponível para Android em breve no IOS
            </p>
          </div>
        </div>
      </div>

      
      {open && (
        <AnimatePresence>
          <motion.div
            className="fixed inset-0 z-[99999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 w-full max-w-md mx-4 p-6 rounded-2xl bg-white shadow-2xl"
            >
              <h2 className="text-lg font-bold mb-1 text-gray-800">
                Recuperar senha
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                Digite seu email e enviaremos um link para redefinição.
              </p>
              {resetSuccess && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-green-100 border border-green-400 text-green-700 text-sm">
                  {resetSuccess}
                </div>
              )}
              {resetError && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-red-100 border border-red-400 text-red-700 text-sm">
                  {resetError}
                </div>
              )}
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Digite seu email"
                className="w-full p-3 text-sm rounded-xl bg-gray-100 text-black border border-gray-300 outline-none focus:ring-2 focus:ring-teal-400"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSendReset}
                  disabled={resetLoading}
                  className={`flex-1 p-2 text-sm rounded-lg font-semibold text-white transition ${resetLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-teal-600 hover:bg-teal-500"
                    }`}
                >
                  {resetLoading ? "Enviando..." : "Enviar link"}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 p-2 text-sm rounded-lg bg-red-500 hover:bg-red-400 text-white font-semibold transition"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}