"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";

type CajuBeneficiosModalProps = {
  onClose: () => void;
  beneficioId?: string | number | null;
};

type Usuario = {
  id?: string | number;
  full_name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
};

export default function CajuBeneficiosModal({
  onClose,
  beneficioId,
}: CajuBeneficiosModalProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");

  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [observacoes, setObservacoes] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [protocolo, setProtocolo] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarUsuario() {
      try {
        setCarregando(true);
        setErro("");

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

        const dadosUsuario: Usuario = {
          id: usuarioApi?.id,
          full_name:
            usuarioApi?.full_name ??
            usuarioApi?.fullName ??
            usuarioApi?.name ??
            "",
          email: usuarioApi?.email ?? "",
          cpf: usuarioApi?.cpf ?? usuarioApi?.documento ?? "",
          phone: usuarioApi?.phone ?? usuarioApi?.telefone ?? "",
          cep: usuarioApi?.cep ?? "",
          endereco:
            usuarioApi?.endereco ??
            usuarioApi?.address ??
            usuarioApi?.logradouro ??
            "",
          numero: usuarioApi?.numero ?? usuarioApi?.number ?? "",
          complemento: usuarioApi?.complemento ?? "",
          bairro: usuarioApi?.bairro ?? "",
          cidade: usuarioApi?.cidade ?? usuarioApi?.city ?? "",
          estado: usuarioApi?.estado ?? usuarioApi?.state ?? "",
        };

        setUsuario(dadosUsuario);

        setCpf(formatarCpf(dadosUsuario.cpf || ""));
        setTelefone(formatarTelefone(dadosUsuario.phone || ""));
        setCep(formatarCep(dadosUsuario.cep || ""));
        setEndereco(dadosUsuario.endereco || "");
        setNumero(dadosUsuario.numero || "");
        setComplemento(dadosUsuario.complemento || "");
        setBairro(dadosUsuario.bairro || "");
        setCidade(dadosUsuario.cidade || "");
        setEstado((dadosUsuario.estado || "").toUpperCase());
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
          setCarregando(false);
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

  function formatarCpf(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    return numeros
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function formatarCep(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 8);

    return numeros.replace(/(\d{5})(\d)/, "$1-$2");
  }

  function removerCodigoPais(valor: string) {
    let numeros = valor.replace(/\D/g, "");

    if (numeros.startsWith("55")) {
      numeros = numeros.slice(2);
    }

    return numeros.slice(0, 11);
  }

  function formatarTelefone(valor: string) {
    const numeros = removerCodigoPais(valor);

    if (numeros.length <= 10) {
      return numeros
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return numeros
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  async function buscarCep(valor: string) {
    const cepLimpo = valor.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      return;
    }

    setBuscandoCep(true);
    setErro("");

    try {
      const resposta = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      );

      if (!resposta.ok) {
        throw new Error("Não foi possível consultar o CEP.");
      }

      const data = await resposta.json();

      if (data?.erro) {
        throw new Error("CEP não encontrado.");
      }

      setEndereco(data?.logradouro || "");
      setBairro(data?.bairro || "");
      setCidade(data?.localidade || "");
      setEstado((data?.uf || "").toUpperCase());
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível consultar o CEP."
      );
    } finally {
      setBuscandoCep(false);
    }
  }

  async function enviarSolicitacao() {
    if (enviando) return;

    setErro("");

    if (!usuario?.id) {
      setErro("Usuário não identificado.");
      return;
    }

    if (!beneficioId) {
      setErro("Benefício não identificado.");
      return;
    }

    if (!aceitouTermos) {
      setErro("Aceite os termos para continuar.");
      return;
    }

    if (!usuario.full_name?.trim()) {
      setErro("Nome completo não informado.");
      return;
    }

    if (!usuario.email?.trim()) {
      setErro("E-mail não informado.");
      return;
    }

    const cpfLimpo = cpf.replace(/\D/g, "");
    const telefoneLimpo = removerCodigoPais(telefone);
    const cepLimpo = cep.replace(/\D/g, "");

    if (cpfLimpo.length !== 11) {
      setErro("Informe um CPF válido.");
      return;
    }

    if (telefoneLimpo.length < 10) {
      setErro("Informe um telefone válido.");
      return;
    }

    if (cepLimpo.length !== 8) {
      setErro("Informe um CEP válido.");
      return;
    }

    if (!endereco.trim()) {
      setErro("Informe o endereço.");
      return;
    }

    if (!numero.trim()) {
      setErro("Informe o número da residência.");
      return;
    }

    if (!bairro.trim()) {
      setErro("Informe o bairro.");
      return;
    }

    if (!cidade.trim()) {
      setErro("Informe a cidade.");
      return;
    }

    if (!estado.trim()) {
      setErro("Informe o estado.");
      return;
    }

    setEnviando(true);

    try {
      const resposta = await fetch("/api/beneficios/caju", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          usuario_id: usuario.id,
          beneficio_id: Number(beneficioId),

          nome_completo: usuario.full_name.trim(),
          email: usuario.email.trim(),
          cpf: cpfLimpo,

          telefone: telefoneLimpo,

          cep: cepLimpo,
          endereco: endereco.trim(),
          numero: numero.trim(),
          complemento: complemento.trim(),
          bairro: bairro.trim(),
          cidade: cidade.trim(),
          estado: estado.trim().toUpperCase(),

          observacoes: observacoes.trim(),
        }),
      });

      const data = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          data?.error ||
            data?.mensagem ||
            "Não foi possível enviar sua solicitação."
        );
      }

      setProtocolo(data?.codigo || data?.protocolo || "");
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

  const inputClass =
    "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10";

  const inputReadOnlyClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none";

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !enviando) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-[30px] bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-orange-500 px-6 py-5 text-white">
          <div>
            <h2 className="text-2xl font-extrabold">
              Caju Benefícios
            </h2>

            <p className="mt-1 text-sm text-white/80">
              Solicite seu benefício Caju.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="cursor-pointer rounded-full p-2 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={22} />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-6">
          {sucesso ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2
                  size={42}
                  className="text-emerald-600"
                />
              </div>

              <h3 className="mt-5 text-2xl font-extrabold text-slate-900">
                Solicitação enviada!
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                Sua solicitação do benefício Caju foi registrada com sucesso.
              </p>

              {protocolo && (
                <div className="mx-auto mt-5 max-w-sm rounded-2xl bg-orange-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                    Protocolo
                  </p>

                  <p className="mt-1 text-lg font-extrabold text-orange-800">
                    {protocolo}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="mt-7 cursor-pointer rounded-xl bg-orange-500 px-8 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Fechar
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {carregando && (
                <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700">
                  <Loader2 size={17} className="animate-spin" />
                  Carregando seus dados...
                </div>
              )}

              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
                <h3 className="font-bold text-orange-800">
                  Benefício Caju
                </h3>

                <p className="mt-2 text-justify text-sm leading-6 text-orange-700">
                  A Caju oferece benefícios flexíveis, incluindo opções de
                  mobilidade. A solicitação será analisada conforme as
                  condições disponíveis para o benefício.
                </p>
              </div>

              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Dados pessoais
                  </h3>
                  <p className="mt-0 text-sm text-slate-500">
                    Confira seus dados antes de enviar a solicitação.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Nome completo
                    </label>

                    <input
                      type="text"
                      value={usuario?.full_name || ""}
                      readOnly
                      className={inputReadOnlyClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      E-mail
                    </label>

                    <input
                      type="email"
                      value={usuario?.email || ""}
                      readOnly
                      className={inputReadOnlyClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      CPF
                    </label>

                    <input
                      type="text"
                      value={cpf}
                      onChange={(event) =>
                        setCpf(formatarCpf(event.target.value))
                      }
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Telefone
                    </label>

                    <input
                      type="tel"
                      value={telefone}
                      onChange={(event) =>
                        setTelefone(formatarTelefone(event.target.value))
                      }
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className={inputClass}
                    />

                    <p className="mt-1.5 text-xs text-slate-400">
                      O código +55 será removido automaticamente.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-slate-200 p-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Endereço residencial
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Informe o endereço onde você reside.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      CEP
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        value={cep}
                        onChange={(event) => {
                          const novoCep = formatarCep(event.target.value);

                          setCep(novoCep);

                          if (
                            novoCep.replace(/\D/g, "").length === 8
                          ) {
                            void buscarCep(novoCep);
                          }
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                        className={inputClass}
                      />

                      {buscandoCep && (
                        <Loader2
                          size={18}
                          className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-orange-500"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Número
                    </label>

                    <input
                      type="text"
                      value={numero}
                      onChange={(event) =>
                        setNumero(event.target.value)
                      }
                      placeholder="Ex.: 123"
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Logradouro
                    </label>

                    <input
                      type="text"
                      value={endereco}
                      onChange={(event) =>
                        setEndereco(event.target.value)
                      }
                      placeholder="Rua, avenida, travessa..."
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Complemento
                    </label>

                    <input
                      type="text"
                      value={complemento}
                      onChange={(event) =>
                        setComplemento(event.target.value)
                      }
                      placeholder="Apartamento, bloco, casa..."
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Bairro
                    </label>

                    <input
                      type="text"
                      value={bairro}
                      onChange={(event) =>
                        setBairro(event.target.value)
                      }
                      placeholder="Digite o bairro"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Cidade
                    </label>

                    <input
                      type="text"
                      value={cidade}
                      onChange={(event) =>
                        setCidade(event.target.value)
                      }
                      placeholder="Digite a cidade"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Estado
                    </label>

                    <input
                      type="text"
                      value={estado}
                      onChange={(event) =>
                        setEstado(
                          event.target.value
                            .toUpperCase()
                            .slice(0, 2)
                        )
                      }
                      placeholder="UF"
                      maxLength={2}
                      className={`${inputClass} uppercase`}
                    />
                  </div>
                </div>
              </section>

              <section>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Observação <small>(Opcional)</small>
                </label>
                <textarea
                  value={observacoes}
                  onChange={(event) =>
                    setObservacoes(event.target.value)
                  }
                  rows={4}
                  placeholder="Digite alguma observação..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                />
              </section>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={aceitouTermos}
                  onChange={(event) =>
                    setAceitouTermos(event.target.checked)
                  }
                  className="mt-1 h-4 w-4 accent-orange-500"
                />

                <span className="text-xs leading-5 text-slate-600">
                  Declaro que li e concordo com os termos da solicitação e
                  autorizo o tratamento dos meus dados para análise do
                  benefício.
                </span>
              </label>

              {erro && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {erro}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={enviando}
                  className="cursor-pointer rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => void enviarSolicitacao()}
                  disabled={
                    enviando ||
                    !aceitouTermos ||
                    !usuario?.id ||
                    carregando
                  }
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
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
                    "Solicitar benefício"
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