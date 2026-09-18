"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";

type SeguroVidaModalProps = {
  onClose: () => void;
  beneficioId?: string | number | null;
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

type Beneficiario = {
  nome: string;
  parentesco: string;
  percentual: string;
};

export default function SeguroVidaModal({
  onClose,
  beneficioId,
}: SeguroVidaModalProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([
    {
      nome: "",
      parentesco: "",
      percentual: "100",
    },
  ]);

  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [protocolo, setProtocolo] = useState("");

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

        const data = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            data?.error || "Não foi possível carregar seus dados."
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

        if (!ativo) return;

        const nome =
          usuarioApi?.full_name ??
          usuarioApi?.fullName ??
          usuarioApi?.name ??
          "";

        const email = usuarioApi?.email ?? "";
        const cpfUsuario =
          usuarioApi?.cpf ?? usuarioApi?.documento ?? "";
        const telefoneUsuario =
          usuarioApi?.phone ?? usuarioApi?.telefone ?? "";

        setUsuario({
          id: usuarioApi?.id,
          full_name: nome,
          email,
          cpf: cpfUsuario,
          phone: telefoneUsuario,
        });

        setCpf(formatarCPF(cpfUsuario));
        setTelefone(formatarTelefone(telefoneUsuario));
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar seus dados."
          );
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

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !enviando) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [enviando, onClose]);

  function formatarCPF(valor: string) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function formatarTelefone(valor: string) {
    let numeros = valor.replace(/\D/g, "");

    if (numeros.startsWith("55") && numeros.length > 11) {
      numeros = numeros.slice(2);
    }

    numeros = numeros.slice(0, 11);

    if (!numeros) return "";

    if (numeros.length <= 2) {
      return `(${numeros}`;
    }

    if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(
      7
    )}`;
  }

  function atualizarBeneficiario(
    index: number,
    campo: keyof Beneficiario,
    valor: string
  ) {
    setBeneficiarios((anterior) =>
      anterior.map((beneficiario, i) =>
        i === index
          ? {
              ...beneficiario,
              [campo]: valor,
            }
          : beneficiario
      )
    );

    setErro("");
  }

  function adicionarBeneficiario() {
    if (beneficiarios.length >= 3) return;

    setBeneficiarios((anterior) => [
      ...anterior,
      {
        nome: "",
        parentesco: "",
        percentual: "",
      },
    ]);
  }

  function removerBeneficiario(index: number) {
    if (beneficiarios.length === 1) return;

    setBeneficiarios((anterior) =>
      anterior.filter((_, i) => i !== index)
    );
  }

  async function enviarSolicitacao() {
    if (enviando) return;

    setErro("");

    if (!usuario?.id) {
      setErro("Não foi possível identificar seu usuário.");
      return;
    }

    if (!beneficioId) {
      setErro("Benefício não identificado.");
      return;
    }

    if (!dataNascimento) {
      setErro("Informe sua data de nascimento.");
      return;
    }

    const cpfNumeros = cpf.replace(/\D/g, "");

    if (cpfNumeros.length !== 11) {
      setErro("Informe um CPF válido.");
      return;
    }

    const telefoneNumeros = telefone.replace(/\D/g, "");

    if (
      telefoneNumeros.length < 10 ||
      telefoneNumeros.length > 11
    ) {
      setErro("Informe um telefone válido.");
      return;
    }

    const percentualTotal = beneficiarios.reduce(
      (total, beneficiario) =>
        total + Number(beneficiario.percentual || 0),
      0
    );

    const beneficiariosInvalidos = beneficiarios.some(
      (beneficiario) =>
        !beneficiario.nome.trim() ||
        !beneficiario.parentesco.trim() ||
        Number(beneficiario.percentual) <= 0
    );

    if (beneficiariosInvalidos) {
      setErro("Preencha corretamente os dados dos beneficiários.");
      return;
    }

    if (percentualTotal !== 100) {
      setErro(
        `A divisão dos beneficiários precisa totalizar 100%. Atualmente está em ${percentualTotal}%.`
      );
      return;
    }

    if (!aceitouTermos) {
      setErro("Aceite os termos para continuar.");
      return;
    }

    setEnviando(true);

    try {
      const resposta = await fetch("/api/beneficios/seguro-vida", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          usuario_id: usuario.id,
          beneficio_id: Number(beneficioId),
          nome: usuario.full_name || "",
          email: usuario.email || "",
          cpf: cpfNumeros,
          telefone: telefoneNumeros,
          data_nascimento: dataNascimento,
          observacoes: observacoes.trim(),
          beneficiarios: beneficiarios.map((beneficiario) => ({
            nome: beneficiario.nome.trim(),
            parentesco: beneficiario.parentesco.trim(),
            percentual: Number(beneficiario.percentual),
          })),
        }),
      });

      const texto = await resposta.text();

      let data: {
        error?: string;
        mensagem?: string;
        codigo?: string;
        protocolo?: string;
      } = {};

      try {
        data = texto ? JSON.parse(texto) : {};
      } catch {
        data = {};
      }

      if (!resposta.ok) {
        throw new Error(
          data?.error ||
            data?.mensagem ||
            "Não foi possível enviar sua solicitação."
        );
      }

      setProtocolo(
        data?.codigo ||
          data?.protocolo ||
          ""
      );

      setSucesso(true);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao enviar a solicitação."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="seguro-vida-modal-title"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !enviando
        ) {
          onClose();
        }
      }}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#0b6e4f] px-6 py-5 text-white">
          <div>
            <h2
              id="seguro-vida-modal-title"
              className="mt-1 text-2xl font-extrabold"
            >
              Seguro de Vida
            </h2>

            <p className="mt-0 text-sm text-white/80">
              Solicite seu benefício de proteção.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            aria-label="Fechar"
            className="cursor-pointer rounded-full p-2 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
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

              <h3 className="mt-5 text-2xl font-extrabold text-slate-900">
                Solicitação enviada!
              </h3>

              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                Sua solicitação de Seguro de Vida foi registrada
                com sucesso. Nossa equipe poderá entrar em contato
                para dar continuidade ao processo.
              </p>

              {protocolo && (
                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-7 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    Protocolo
                  </p>

                  <p className="mt-1 text-lg font-extrabold text-emerald-900">
                    {protocolo}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="mt-7 cursor-pointer rounded-xl bg-[#0b6e4f] px-8 py-3 text-sm font-bold text-white transition hover:bg-[#095c42]"
              >
                Fechar
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {carregandoUsuario && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Carregando seus dados...
                </div>
              )}

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <h3 className="font-bold text-emerald-900">
                  Proteção para você e sua família
                </h3>

                <p className="mt-2 text-sm leading-6 text-emerald-800/80">
                  Preencha seus dados para solicitar o Seguro de
                  Vida. A contratação e as condições estão sujeitas
                  à análise e às regras do produto.
                </p>
              </div>

              <div>
                <label
                  htmlFor="seguro-nome"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Nome completo
                </label>

                <input
                  id="seguro-nome"
                  type="text"
                  value={usuario?.full_name || ""}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="seguro-cpf"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    CPF
                  </label>

                  <input
                    id="seguro-cpf"
                    type="text"
                    value={cpf}
                    onChange={(event) =>
                      setCpf(formatarCPF(event.target.value))
                    }
                    maxLength={14}
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0b6e4f] focus:ring-4 focus:ring-[#0b6e4f]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="seguro-nascimento"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Data de nascimento
                  </label>

                  <input
                    id="seguro-nascimento"
                    type="date"
                    value={dataNascimento}
                    onChange={(event) =>
                      setDataNascimento(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0b6e4f] focus:ring-4 focus:ring-[#0b6e4f]/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="seguro-email"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    E-mail
                  </label>

                  <input
                    id="seguro-email"
                    type="email"
                    value={usuario?.email || ""}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="seguro-telefone"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Telefone
                  </label>

                  <input
                    id="seguro-telefone"
                    type="tel"
                    value={telefone}
                    onChange={(event) =>
                      setTelefone(
                        formatarTelefone(event.target.value)
                      )
                    }
                    maxLength={15}
                    inputMode="tel"
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0b6e4f] focus:ring-4 focus:ring-[#0b6e4f]/10"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Beneficiários
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Informe quem deverá receber a indenização,
                      conforme as regras do seguro.
                    </p>
                  </div>

                  {beneficiarios.length < 3 && (
                    <button
                      type="button"
                      onClick={adicionarBeneficiario}
                      className="cursor-pointer rounded-xl border border-[#0b6e4f] px-3 py-2 text-xs font-bold text-[#0b6e4f] transition hover:bg-emerald-50"
                    >
                      + Adicionar
                    </button>
                  )}
                </div>

                <div className="mt-5 space-y-4">
                  {beneficiarios.map(
                    (beneficiario, index) => (
                      <div
                        key={index}
                        className="rounded-2xl bg-slate-50 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-800">
                            Beneficiário {index + 1}
                          </p>

                          {beneficiarios.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removerBeneficiario(index)
                              }
                              className="cursor-pointer text-xs font-bold text-red-500 hover:text-red-700"
                            >
                              Remover
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div className="sm:col-span-3">
                            <label className="mb-2 block text-xs font-bold text-slate-600">
                              Nome
                            </label>

                            <input
                              type="text"
                              value={beneficiario.nome}
                              onChange={(event) =>
                                atualizarBeneficiario(
                                  index,
                                  "nome",
                                  event.target.value
                                )
                              }
                              placeholder="Nome completo"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0b6e4f] focus:ring-4 focus:ring-[#0b6e4f]/10"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="mb-2 block text-xs font-bold text-slate-600">
                              Parentesco
                            </label>

                            <input
                              type="text"
                              value={beneficiario.parentesco}
                              onChange={(event) =>
                                atualizarBeneficiario(
                                  index,
                                  "parentesco",
                                  event.target.value
                                )
                              }
                              placeholder="Ex.: Cônjuge"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0b6e4f] focus:ring-4 focus:ring-[#0b6e4f]/10"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-bold text-slate-600">
                              Percentual
                            </label>

                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={beneficiario.percentual}
                                onChange={(event) =>
                                  atualizarBeneficiario(
                                    index,
                                    "percentual",
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-9 text-sm outline-none transition focus:border-[#0b6e4f] focus:ring-4 focus:ring-[#0b6e4f]/10"
                              />

                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="seguro-observacoes"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Observações <small>(Opcional)</small>
                </label>

                <textarea
                  id="seguro-observacoes"
                  value={observacoes}
                  onChange={(event) =>
                    setObservacoes(event.target.value)
                  }
                  rows={4}
                  placeholder="Digite alguma observação..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0b6e4f] focus:ring-4 focus:ring-[#0b6e4f]/10"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={aceitouTermos}
                  onChange={(event) => {
                    setAceitouTermos(event.target.checked);
                    setErro("");
                  }}
                  className="mt-1 h-4 w-4 cursor-pointer accent-[#0b6e4f]"
                />

                <span className="text-xs leading-5 text-slate-600">
                  Declaro que li e concordo com os termos da
                  solicitação e autorizo o tratamento dos meus dados
                  para análise do benefício.
                </span>
              </label>

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
                  onClick={onClose}
                  disabled={enviando}
                  className="cursor-pointer rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => void enviarSolicitacao()}
                  disabled={
                    enviando ||
                    carregandoUsuario ||
                    !usuario?.id ||
                    !aceitouTermos
                  }
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0b6e4f] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#095c42] disabled:cursor-not-allowed disabled:bg-slate-300"
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
                    "Solicitar Seguro de Vida"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}