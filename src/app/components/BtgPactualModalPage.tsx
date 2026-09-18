"use client";

import type { FormEvent } from "react";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, X } from "lucide-react";

type FormularioBtg = {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  observacoes: string;
};

type Usuario = {
  id?: string | number;
  full_name?: string;
  fullName?: string;
  name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  telefone?: string;
};

type RespostaApi = {
  mensagem?: string;
  error?: string;
  codigo?: string;
};

type BtgPactualModalProps = {
  onClose?: () => void;
  beneficioId?: string | number | null;
};

const FORMULARIO_INICIAL: FormularioBtg = {
  nome: "",
  cpf: "",
  telefone: "",
  email: "",
  observacoes: "",
};

function formatarCPF(valor: string): string {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarTelefone(valor: string): string {
  let numeros = valor.replace(/\D/g, "");

  if (numeros.startsWith("55") && numeros.length > 11) {
    numeros = numeros.slice(2);
  }

  numeros = numeros.slice(0, 11);

  if (!numeros) {
    return "";
  }

  if (numeros.length <= 2) {
    return `(${numeros}`;
  }

  if (numeros.length <= 7) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

export default function BtgPactualModal({
  onClose,
  beneficioId: beneficioIdProp,
}: BtgPactualModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const beneficioIdUrl = searchParams.get("beneficio_id");

  const beneficioId =
    beneficioIdProp !== undefined && beneficioIdProp !== null
      ? String(beneficioIdProp)
      : beneficioIdUrl;

  const [formulario, setFormulario] =
    useState<FormularioBtg>(FORMULARIO_INICIAL);

  const [usuarioId, setUsuarioId] = useState<string | number | null>(null);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [btgModalOpen, setBtgModalOpen] = useState(false);
  const [cajuModalOpen, setCajuModalOpen] = useState(false);
  const [conectcarModalOpen, setConectcarModalOpen] = useState(false);
  const [seguroVidaModalOpen, setSeguroVidaModalOpen] = useState(false);
  const [codigoProtocolo, setCodigoProtocolo] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarUsuario() {
      try {
        setCarregandoUsuario(true);

        const resposta = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!resposta.ok) {
          if (ativo) {
            setErro("Não foi possível carregar seus dados.");
          }

          return;
        }

        const data: Usuario = await resposta.json();

        if (!ativo) {
          return;
        }

        setUsuarioId(data.id ?? null);

        setFormulario((anterior) => ({
          ...anterior,
          nome:
            data.full_name ||
            data.fullName ||
            data.name ||
            anterior.nome,
          email: data.email || anterior.email,
          cpf: data.cpf ? formatarCPF(data.cpf) : anterior.cpf,
          telefone:
            data.phone || data.telefone
              ? formatarTelefone(data.phone || data.telefone || "")
              : anterior.telefone,
        }));
      } catch {
        if (ativo) {
          setErro("Não foi possível carregar seus dados.");
        }
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

  function atualizarCampo(
    campo: keyof FormularioBtg,
    valor: string,
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    if (erro) {
      setErro("");
    }
  }

  function fecharModal() {
    if (enviando) {
      return;
    }

    if (onClose) {
      onClose();
      return;
    }

    router.back();
  }

  function fecharModalComFallback() {
    if (enviando) {
      return;
    }

    if (onClose) {
      onClose();
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/motorista/beneficios");
  }

  async function enviarFormulario(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (enviando) {
      return;
    }

    setErro("");

    if (!beneficioId || Number.isNaN(Number(beneficioId))) {
      setErro("Benefício inválido. Tente novamente.");
      return;
    }

    if (!usuarioId) {
      setErro("Não foi possível identificar seu usuário.");
      return;
    }

    if (!aceitouTermos) {
      setErro(
        "Você precisa aceitar os Termos de Uso e a Política de Privacidade.",
      );
      return;
    }

    if (!formulario.nome.trim()) {
      setErro("Informe seu nome completo.");
      return;
    }

    const cpfNumeros = formulario.cpf.replace(/\D/g, "");

    if (cpfNumeros.length !== 11) {
      setErro("Informe um CPF válido.");
      return;
    }

    const telefoneNumeros = formulario.telefone.replace(/\D/g, "");

    if (
      telefoneNumeros.length < 10 ||
      telefoneNumeros.length > 11
    ) {
      setErro("Informe um telefone válido.");
      return;
    }

    if (!formulario.email.trim()) {
      setErro("Informe seu e-mail.");
      return;
    }

    try {
      setEnviando(true);

      const resposta = await fetch("/api/beneficios/btg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          usuario_id: usuarioId,
          beneficio_id: Number(beneficioId),
          nome: formulario.nome.trim(),
          cpf: cpfNumeros,
          telefone: telefoneNumeros,
          email: formulario.email.trim(),
          observacoes: formulario.observacoes.trim(),
        }),
      });

      const texto = await resposta.text();

      let data: RespostaApi = {};

      try {
        data = texto ? JSON.parse(texto) : {};
      } catch {
        data = {};
      }

      if (!resposta.ok) {
        throw new Error(
          data.error ||
          data.mensagem ||
          "Não foi possível enviar a solicitação.",
        );
      }

      setCodigoProtocolo(data.codigo || "");
      setSucesso(true);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao enviar a solicitação.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="btg-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          fecharModalComFallback();
        }
      }}
    >
      <div
        className="relative flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="flex items-center justify-between bg-[#003b5c] px-6 py-5 text-white">
          <div>
            <h1
              id="btg-modal-title"
              className="text-xl font-extrabold"
            >
              Solicitação BTG Pactual
            </h1>

            <p className="mt-1 text-sm text-white/80">
              Preencha seus dados para continuar.
            </p>
          </div>

          <button
            type="button"
            onClick={fecharModalComFallback}
            disabled={enviando}
            aria-label="Fechar modal"
            className="cursor-pointer rounded-full p-2 text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={22} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-6 sm:px-7">
          {sucesso ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2
                  size={44}
                  className="text-emerald-600"
                />
              </div>

              <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
                Solicitação enviada!
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                Recebemos seus dados com sucesso. Nossa equipe irá
                analisar sua solicitação e entrar em contato quando
                necessário.
              </p>

              {codigoProtocolo && (
                <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                    Protocolo
                  </p>

                  <p className="mt-2 text-lg font-extrabold text-teal-900">
                    {codigoProtocolo}
                  </p>

                  <p className="mt-1 text-xs text-teal-700">
                    Obs.: anote o número do protocolo.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={fecharModalComFallback}
                className="mt-7 cursor-pointer rounded-xl bg-teal-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-teal-700"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form
              onSubmit={enviarFormulario}
              className="space-y-5"
            >
              {carregandoUsuario && (
                <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Carregando seus dados...
                </div>
              )}

              <div>
                <label
                  htmlFor="nome"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Nome completo
                </label>

                <input
                  id="nome"
                  name="nome"
                  type="text"
                  value={formulario.nome}
                  onChange={(event) =>
                    atualizarCampo(
                      "nome",
                      event.target.value,
                    )
                  }
                  placeholder="Digite seu nome completo"
                  required
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="cpf"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    CPF
                  </label>

                  <input
                    id="cpf"
                    name="cpf"
                    type="text"
                    value={formulario.cpf}
                    onChange={(event) =>
                      atualizarCampo(
                        "cpf",
                        formatarCPF(event.target.value),
                      )
                    }
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="telefone"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Telefone
                  </label>

                  <input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    value={formulario.telefone}
                    onChange={(event) =>
                      atualizarCampo(
                        "telefone",
                        formatarTelefone(
                          event.target.value,
                        ),
                      )
                    }
                    placeholder="(00) 00000-0000"
                    required
                    maxLength={15}
                    inputMode="tel"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  E-mail
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formulario.email}
                  onChange={(event) =>
                    atualizarCampo(
                      "email",
                      event.target.value,
                    )
                  }
                  placeholder="seuemail@exemplo.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="observacoes"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Observações
                </label>

                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formulario.observacoes}
                  onChange={(event) =>
                    atualizarCampo(
                      "observacoes",
                      event.target.value,
                    )
                  }
                  placeholder="Digite alguma observação, se necessário..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={aceitouTermos}
                    onChange={(event) => {
                      setAceitouTermos(
                        event.target.checked,
                      );

                      if (erro) {
                        setErro("");
                      }
                    }}
                    className="mt-1 h-4 w-4 cursor-pointer accent-teal-600"
                  />

                  <span className="text-xs leading-5 text-slate-600">
                    Declaro que li e concordo com os{" "}
                    <a
                      href="/motorista/beneficios/btg_pactual/termos_uso"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-teal-700 underline transition hover:text-teal-800"
                    >
                      Termos de Uso
                    </a>
                    , a{" "}
                    <a
                      href="/motorista/beneficios/btg_pactual/politica_privacidade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-teal-700 underline transition hover:text-teal-800"
                    >
                      Política de Privacidade
                    </a>{" "}
                    e autorizo o tratamento dos meus dados para
                    análise desta solicitação.
                  </span>
                </label>
              </div>

              {erro && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-5 text-red-700"
                >
                  {erro}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fecharModalComFallback}
                  disabled={enviando}
                  className="cursor-pointer rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    enviando ||
                    !aceitouTermos ||
                    !usuarioId
                  }
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {enviando ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Enviando...
                    </>
                  ) : (
                    "Enviar solicitação"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}