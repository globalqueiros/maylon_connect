"use client";
import { useState } from "react";
import Image from "next/image";
import { MoveLeft, Mail } from "lucide-react";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSend = async () => {
    if (loading) return;
    if (!email) {
      setError("Digite seu email cadastrado");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Digite seu email cadastrado");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const res = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar link");
      }
      setSuccess(
        "Link enviado! Verifique seu e-mail (e a caixa de spam)."
      );
      setEmail("");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <Image
        src="/bg-login.png"
        alt="Background"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
        <h1 className="text-3xl font-bold text-white text-center">
          Portal Connect
        </h1>
        <p className="text-gray-300 text-sm text-center mt-2 mb-6 leading-relaxed">
          Entre com segurança usando um Magic Link enviado para seu e-mail.
        </p>
        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-green-500 bg-green-500/10 text-green-400 text-sm animate-slideFade">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-red-500 bg-red-500/10 text-red-400 text-sm animate-slideFade">
            {error}
          </div>
        )}
        <input
          type="email"
          placeholder="Digite seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 text-sm rounded-xl bg-white/20 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-teal-400 mb-4"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className={`w-full p-3 rounded-3xl cursor-pointer font-semibold text-white flex items-center justify-center gap-2 transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-teal-500 hover:bg-teal-600 hover:scale-[1.02]"
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Mail size={16} />
              Enviar Link
            </>
          )}
        </button>
        <div className="flex justify-center mt-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition hover:underline"
          >
            <MoveLeft size={16} />
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}