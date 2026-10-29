"use client";
import { useEffect, useState } from "react";
import { Check, Loader2, Mail, X } from "lucide-react";

type Aviso = { tipo: "sucesso" | "erro"; texto: string } | null;

async function chamar(body: Record<string, string>) {
  const res = await fetch("/api/send-verification", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "email", ...body }),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, data };
}

/** Envia um código para o e-mail da conta e confere o código digitado. */
export default function ConfirmarEmailModal({
  email,
  onFechar,
  onConfirmado,
}: {
  email: string;
  onFechar: () => void;
  onConfirmado: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [conferindo, setConferindo] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);

  const ocupado = enviando || conferindo;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !ocupado) onFechar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ocupado, onFechar]);

  const enviar = async () => {
    setEnviando(true);
    setAviso(null);
    try {
      const { ok, data } = await chamar({ action: "send" });
      if (ok && data?.verified) {
        onConfirmado();
        return;
      }
      if (!ok) throw new Error(data?.message || "Não foi possível enviar o código.");
      setCodigoEnviado(true);
      setAviso({ tipo: "sucesso", texto: "Código enviado. Confira sua caixa de entrada e o spam." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: error instanceof Error ? error.message : "Não foi possível enviar o código." });
    } finally {
      setEnviando(false);
    }
  };

  const conferir = async () => {
    setConferindo(true);
    setAviso(null);
    try {
      const { ok, data } = await chamar({ action: "verify", code: codigo });
      if (!ok) throw new Error(data?.message || "Código inválido ou expirado.");
      onConfirmado();
    } catch (error) {
      setAviso({ tipo: "erro", texto: error instanceof Error ? error.message : "Código inválido ou expirado." });
    } finally {
      setConferindo(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => !ocupado && onFechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-email-titulo"
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6F4] text-[#149C8B]">
              <Mail size={20} />
            </span>
            <div>
              <h2 id="confirmar-email-titulo" className="font-semibold text-gray-900">
                Confirmar e-mail
              </h2>
              <p className="text-xs text-gray-500">Enviaremos um código de 6 números.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            disabled={ocupado}
            aria-label="Fechar"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm text-gray-600">O código vai para:</p>
            <p className="mt-1 break-all font-semibold text-gray-900">{email}</p>
          </div>

          <button
            type="button"
            onClick={enviar}
            disabled={ocupado}
            className="mt-4 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#149C8B]/30 bg-[#149C8B]/5 text-sm font-semibold text-[#0B6F68] transition hover:bg-[#149C8B]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            {enviando ? "Enviando código..." : codigoEnviado ? "Enviar outro código" : "Enviar código"}
          </button>

          <label htmlFor="confirmar-email-codigo" className="mt-5 mb-2 block text-sm font-semibold text-gray-700">
            Código de confirmação
          </label>
          <input
            id="confirmar-email-codigo"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={codigo}
            onChange={(event) => setCodigo(event.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-center text-lg font-bold tracking-[0.3em] text-gray-900 outline-none transition placeholder:font-normal placeholder:text-gray-300 focus:border-[#149C8B] focus:bg-white focus:ring-4 focus:ring-[#149C8B]/10"
          />

          {aviso && (
            <p
              role={aviso.tipo === "erro" ? "alert" : "status"}
              className={`mt-3 text-sm ${aviso.tipo === "erro" ? "text-red-600" : "text-emerald-700"}`}
            >
              {aviso.texto}
            </p>
          )}

          <button
            type="button"
            onClick={conferir}
            disabled={ocupado || codigo.length !== 6}
            className="mt-5 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#149C8B] text-sm font-semibold text-white transition hover:bg-[#0f897a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {conferindo ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {conferindo ? "Conferindo..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
