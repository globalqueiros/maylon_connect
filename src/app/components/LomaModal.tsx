"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Store,
  X,
} from "lucide-react";

type LomaModalProps = {
  beneficioId: number;
  onClose: () => void;
};

type FormState = {
  nome: string;
  email: string;
  telefone: string;
  placa: string;
  renavam: string;
};

const WHATSAPP_NUMERO = "5511990064082"; // (11) 99006-4082

const CAMPOS_INICIAIS: FormState = {
  nome: "",
  email: "",
  telefone: "",
  placa: "",
  renavam: "",
};

function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);

  if (digitos.length <= 2) {
    return digitos;
  }

  if (digitos.length <= 6) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  }

  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function montarMensagem(dados: FormState): string {
  return [
    "Olá! Gostaria de ativar o benefício Loma.",
    "",
    `Nome: ${dados.nome}`,
    `Email: ${dados.email}`,
    `Telefone: ${dados.telefone}`,
    `Placa do carro: ${dados.placa.toUpperCase()}`,
    `Renavam: ${dados.renavam}`,
  ].join("\n");
}

async function lerResposta(res: Response) {
  const texto = await res.text();

  if (!texto) {
    return {};
  }

  try {
    return JSON.parse(texto);
  } catch {
    return {
      error: res.ok
        ? "A resposta do servidor não está em formato JSON."
        : `Erro do servidor (${res.status}).`,
    };
  }
}

export default function LomaModal({ beneficioId, onClose }: LomaModalProps) {
  const [dados, setDados] = useState<FormState>(CAMPOS_INICIAIS);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarUsuario() {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await lerResposta(res);

        if (!res.ok) {
          throw new Error(
            data?.error ||
            data?.message ||
            "Não foi possível carregar seus dados."
          );
        }

        const usuarioApi =
          data?.motorista ??
          data?.usuario ??
          data?.user ??
          data?.data?.motorista ??
          data?.data?.usuario ??
          data?.data?.user ??
          data?.data ??
          data;

        const nome = String(
          usuarioApi?.full_name ??
          usuarioApi?.fullName ??
          usuarioApi?.name ??
          ""
        ).trim();

        const email = String(usuarioApi?.email ?? "").trim();

        const telefoneBruto = String(
          usuarioApi?.telefone ??
          usuarioApi?.phone ??
          usuarioApi?.celular ??
          usuarioApi?.whatsapp ??
          ""
        );

        if (!ativo) {
          return;
        }

        setDados((anterior) => ({
          ...anterior,
          nome: nome || anterior.nome,
          email: email || anterior.email,
          telefone: telefoneBruto
            ? formatarTelefone(telefoneBruto)
            : anterior.telefone,
        }));
      } catch (error) {
        if (!ativo) {
          return;
        }

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar seus dados."
        );
      } finally {
        if (ativo) {
          setCarregandoUsuario(false);
        }
      }
    }

    void carregarUsuario();

    return () => {
      ativo = false;
    };
  }, []);

  const atualizarCampo = (campo: keyof FormState, valor: string) => {
    setDados((anterior) => ({
      ...anterior,
      [campo]: campo === "telefone" ? formatarTelefone(valor) : valor,
    }));
  };

  const validar = (): string | null => {
    if (!dados.nome.trim()) {
      return "Informe o nome completo.";
    }

    if (!emailValido(dados.email)) {
      return "Informe um email válido.";
    }

    if (dados.telefone.replace(/\D/g, "").length < 10) {
      return "Informe um telefone válido.";
    }

    if (!dados.placa.trim()) {
      return "Informe a placa do carro.";
    }

    if (!dados.renavam.trim()) {
      return "Informe o renavam.";
    }

    return null;
  };

  const enviarWhatsapp = () => {
    const mensagemErro = validar();

    if (mensagemErro) {
      setErro(mensagemErro);
      return;
    }

    setErro(null);
    setEnviando(true);

    try {
      const mensagem = encodeURIComponent(montarMensagem(dados));
      const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${mensagem}`;

      window.open(url, "_blank", "noopener,noreferrer");

      setEnviado(true);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !enviando) {
          onClose();
        }
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="loma-modal-title"
      >
        <div className="bg-gradient-to-br from-teal-800 via-teal-700 to-teal-500 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
              <Store size={22} />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!enviando) {
                  onClose();
                }
              }}
              className="cursor-pointer rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Fechar"
            >
              <X size={19} />
            </button>
          </div>

          <h3 id="loma-modal-title" className="mt-4 text-xl font-bold">
            Loma
          </h3>

          <p className="mt-1 text-sm text-white/80">
            Preencha seus dados para ativar o benefício.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          {carregandoUsuario ? (
            <div className="flex min-h-[160px] items-center justify-center">
              <Loader2 size={26} className="animate-spin text-teal-600" />
            </div>
          ) : enviado ? (
            <div className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
              <CheckCircle2 size={20} className="shrink-0 text-teal-600" />
              <div>
                <p className="text-sm font-semibold text-teal-700">
                  Dados enviados para o WhatsApp!
                </p>
                <p className="mt-0.5 text-xs text-teal-600">
                  Assim que seu benefício for ativado, os links para baixar o
                  app aparecerão na tela de benefícios ativos.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={dados.nome}
                  onChange={(event) =>
                    atualizarCampo("nome", event.target.value)
                  }
                  readOnly
                  placeholder="Seu nome completo"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  Email
                </label>
                <input
                  type="email"
                  value={dados.email}
                  onChange={(event) =>
                    atualizarCampo("email", event.target.value)
                  }
                  readOnly
                  placeholder="seuemail@exemplo.com"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={dados.telefone}
                  onChange={(event) =>
                    atualizarCampo("telefone", event.target.value)
                  }
                  readOnly
                  placeholder="(11) 99999-9999"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Placa do carro
                  </label>
                  <input
                    type="text"
                    value={dados.placa}
                    onChange={(event) =>
                      atualizarCampo("placa", event.target.value.toUpperCase())
                    }
                    placeholder="ABC1D23"
                    maxLength={8}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm uppercase text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Renavam
                  </label>
                  <input
                    type="text"
                    value={dados.renavam}
                    onChange={(event) =>
                      atualizarCampo(
                        "renavam",
                        event.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="00000000000"
                    maxLength={11}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </div>

              {erro && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                  <AlertTriangle size={18} className="shrink-0 text-red-500" />
                  <p className="text-xs font-medium text-red-700">{erro}</p>
                </div>
              )}
            </>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {enviado ? (
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-700"
              >
                Fechar
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={onClose}
                  className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={enviando || carregandoUsuario}
                  onClick={enviarWhatsapp}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviando ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar pelo WhatsApp"
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}