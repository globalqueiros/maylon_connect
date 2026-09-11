"use client";

import { useEffect, useMemo, useState } from "react";
import NvoipWidget from "../../components/NvoipWidget";
import {
  Eye,
  Mails,
  MessagesSquare,
  Search,
  Paperclip,
  Send,
  Trash2,
  FileText,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Headphones,
  ShieldCheck,
  CircleHelp,
  MessageCircle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

type Formulario = {
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  categoria: string;
};

type Alerta = {
  type: "success" | "error";
  message: string;
} | null;

type Protocolo = {
  codigo?: string;
  assunto?: string;
  criado_em?: string;
  status?: string;
};

const faq = [
  {
    pergunta: "Como cancelar uma passagem?",
    resposta:
      "Abra um protocolo selecionando a categoria Cancelamento e informe os dados da sua viagem.",
  },
  {
    pergunta: "Como solicitar reembolso?",
    resposta:
      "Selecione a categoria Reembolso e descreva o motivo da solicitação. Nossa equipe analisará o pedido.",
  },
  {
    pergunta: "Como alterar minha viagem?",
    resposta:
      "Utilize a categoria Alteração de viagem e informe a data e os dados que deseja modificar.",
  },
  {
    pergunta: "Como acompanhar meu protocolo?",
    resposta:
      "Acompanhe todas as solicitações na área Meus Protocolos e clique no ícone de visualização.",
  },
  {
    pergunta: "Problemas com pagamento",
    resposta:
      "Selecione Pagamento e envie uma descrição detalhada. Se possível, anexe um comprovante.",
  },
];

export default function DashboardLayout() {
  const [form, setForm] = useState<Formulario>({
    nome: "",
    email: "",
    assunto: "",
    mensagem: "",
    categoria: "",
  });

  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [buscaProtocolo, setBuscaProtocolo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [alert, setAlert] = useState<Alerta>(null);
  const [faqAberto, setFaqAberto] = useState<number | null>(null);

  function gerarProtocoloPersistente() {
    if (typeof window === "undefined") return "";

    const TEMPO_LIMITE = 90 * 60 * 1000;

    const salvo = localStorage.getItem("protocolo");
    const salvoTempo = localStorage.getItem("protocolo_time");
    const agora = Date.now();

    if (
      salvo &&
      salvoTempo &&
      agora - Number(salvoTempo) < TEMPO_LIMITE
    ) {
      return salvo;
    }

    const ano = new Date().getFullYear();

    const random = Math.floor(
      100000000 + Math.random() * 900000000
    );

    const novo = `MAY - ${random}${ano}`;

    localStorage.setItem("protocolo", novo);
    localStorage.setItem(
      "protocolo_time",
      String(agora)
    );

    return novo;
  }

  function gerarNovoProtocolo() {
    const ano = new Date().getFullYear();

    const random = Math.floor(
      100000000 + Math.random() * 900000000
    );

    const novo = `MAY - ${random}${ano}`;

    localStorage.setItem("protocolo", novo);
    localStorage.setItem(
      "protocolo_time",
      String(Date.now())
    );

    return novo;
  }

  useEffect(() => {
    setCodigo(gerarProtocoloPersistente());
  }, []);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [usuarioRes, protocolosRes] =
          await Promise.all([
            fetch("/api/me", {
              credentials: "include",
              cache: "no-store",
            }),
            fetch("/api/protocolo", {
              credentials: "include",
              cache: "no-store",
            }),
          ]);

        if (usuarioRes.ok) {
          const data = await usuarioRes.json();

          setForm((prev) => ({
            ...prev,
            nome:
              data.full_name ||
              data.nome ||
              "",
            email: data.email || "",
          }));
        }

        if (protocolosRes.ok) {
          const data = await protocolosRes.json();

          setProtocolos(
            Array.isArray(data) ? data : []
          );
        }
      } catch (error) {
        console.error(
          "Erro ao carregar central:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCodigo(
        gerarProtocoloPersistente()
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!alert) return;

    const timer = setTimeout(() => {
      setAlert(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [alert]);

  const protocolosFiltrados = useMemo(() => {
    return protocolos.filter((item) => {
      const codigoItem = String(
        item.codigo || ""
      ).toLowerCase();

      const busca = buscaProtocolo
        .toLowerCase()
        .trim();

      const correspondeBusca =
        !busca ||
        codigoItem.includes(busca);

      const correspondeStatus =
        filtroStatus === "Todos" ||
        item.status === filtroStatus;

      return (
        correspondeBusca &&
        correspondeStatus
      );
    });
  }, [
    protocolos,
    buscaProtocolo,
    filtroStatus,
  ]);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!form.categoria) {
      setAlert({
        type: "error",
        message:
          "Selecione uma categoria para o atendimento.",
      });
      return;
    }

    if (!form.assunto.trim()) {
      setAlert({
        type: "error",
        message:
          "Informe o assunto da solicitação.",
      });
      return;
    }

    if (!form.mensagem.trim()) {
      setAlert({
        type: "error",
        message:
          "Digite uma mensagem para sua solicitação.",
      });
      return;
    }

    try {
      setEnviando(true);
      setAlert(null);

      const codigoAtual = codigo;

      const res = await fetch(
        "/api/protocolo",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...form,
            codigo: codigoAtual,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "Erro ao criar protocolo."
        );
      }

      setAlert({
        type: "success",
        message:
          "Protocolo criado com sucesso!",
      });

      setCodigo(gerarNovoProtocolo());

      setForm((prev) => ({
        ...prev,
        assunto: "",
        mensagem: "",
        categoria: "",
      }));

      setArquivo(null);

      const protocolosRes =
        await fetch("/api/protocolo", {
          credentials: "include",
          cache: "no-store",
        });

      if (protocolosRes.ok) {
        const protocolosData =
          await protocolosRes.json();

        setProtocolos(
          Array.isArray(protocolosData)
            ? protocolosData
            : []
        );
      }
    } catch (error) {
      console.error(error);

      setAlert({
        type: "error",
        message:
          "Erro ao criar protocolo.",
      });
    } finally {
      setEnviando(false);
    }
  };

  const abrirChat = () => {
    if (
      typeof window !== "undefined" &&
      (window as any).Huggy
    ) {
      (window as any).Huggy.openBox();
      return;
    }

    setAlert({
      type: "error",
      message:
        "Chat indisponível no momento. Tente novamente mais tarde.",
    });
  };

  const limparFormulario = () => {
    setForm((prev) => ({
      ...prev,
      assunto: "",
      mensagem: "",
      categoria: "",
    }));

    setArquivo(null);
  };

  const scrollParaProtocolo = () => {
    document
      .getElementById("abrir-protocolo")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const statusCounts = {
    total: protocolos.length,
    aberto: protocolos.filter(
      (item) => item.status === "Aberto"
    ).length,
    andamento: protocolos.filter(
      (item) =>
        item.status === "Em andamento"
    ).length,
    finalizado: protocolos.filter(
      (item) =>
        item.status === "Finalizado"
    ).length,
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm rounded-[30px] border border-gray-200 bg-white p-10 text-center shadow-xl shadow-[#073b70]/10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf3f9]">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#073b70] border-t-transparent" />
          </div>

          <h2 className="mt-6 text-lg font-black text-[#073b70]">
            Carregando sua central
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Aguarde um momento...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-700">
      <NvoipWidget />

      <main className="mx-auto w-full max-w-8xl">

        <section className="relative overflow-hidden rounded-[32px] bg-[#073b70] shadow-2xl shadow-[#073b70]/15">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border-[70px] border-white/[0.035]" />
          <div className="absolute -bottom-32 left-1/2 h-80 w-80 rounded-full border-[60px] border-white/[0.025]" />

          <div className="relative px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

              <div className="max-w-3xl">
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[46px]">
                  Como podemos ajudar?
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                  Resolva suas dúvidas, abra uma
                  solicitação ou acompanhe seus
                  protocolos de atendimento em um
                  só lugar.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-3">
                <div className="min-w-[145px] rounded-2xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <FileText size={19} />
                  </div>

                  <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/45">
                    Protocolos
                  </p>

                  <p className="mt-1 text-2xl font-black text-white">
                    {protocolos.length}
                  </p>
                </div>

                <div className="hidden min-w-[145px] rounded-2xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur sm:block">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <ShieldCheck size={19} />
                  </div>

                  <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/45">
                    Atendimento
                  </p>

                  <p className="mt-1 text-sm font-black text-white">
                    Disponível
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3">
            <div className="mt-1 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Escolha como falar conosco
                </h2>

                <p className="mt-0 text-sm text-white/80">
                  Atendimento pelos canais oficiais da Maylon.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <a
              href="https://wa.me/5511974204958"
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#19b95b]/30 hover:shadow-xl hover:shadow-gray-200/60"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf8ef] text-[#159447]">
                  <FontAwesomeIcon
                    icon={faWhatsapp}
                    size="lg"
                  />
                </div>

                <ChevronRight
                  size={19}
                  className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-[#159447]"
                />
              </div>

              <h3 className="mt-7 text-xl font-black text-[#073b70]">
                WhatsApp
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Atendimento rápido e direto
                com nossa equipe.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[#159447]">
                Iniciar atendimento
                <ChevronRight size={14} />
              </div>
            </a>

            <a
              href="mailto:atendimento@maylon.com.br"
              className="group rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#073b70]/25 hover:shadow-xl hover:shadow-gray-200/60"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f9] text-[#073b70]">
                  <Mails size={22} />
                </div>

                <ChevronRight
                  size={19}
                  className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-[#073b70]"
                />
              </div>

              <h3 className="mt-7 text-xl font-black text-[#073b70]">
                E-mail
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Envie sua solicitação com todos
                os detalhes necessários.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[#073b70]">
                Enviar mensagem
                <ChevronRight size={14} />
              </div>
            </a>

            <button
              type="button"
              onClick={abrirChat}
              className="group rounded-[24px] border border-gray-200 bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#073b70]/25 hover:shadow-xl hover:shadow-gray-200/60"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3f9] text-[#073b70]">
                  <MessagesSquare size={22} />
                </div>

                <ChevronRight
                  size={19}
                  className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-[#073b70]"
                />
              </div>

              <h3 className="mt-7 text-xl font-black text-[#073b70]">
                Chat Online
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Converse com nossa equipe em
                tempo real.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[#073b70]">
                Abrir atendimento
                <ChevronRight size={14} />
              </div>
            </button>

          </div>
        </section>

        <section
          id="abrir-protocolo"
          className="mt-8 overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-xl shadow-gray-200/50"
        >
          <div className="border-b border-gray-100 bg-[#fafbfd] px-6 py-7 sm:px-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf3f9] text-[#073b70]">
                  <FileText size={22} />
                </div>

                <div>
                  <h2 className="mt-1 text-2xl font-black text-[#073b70]">
                    Abrir Protocolo
                  </h2>

                  <p className="mt-0 text-sm text-gray-500">
                    Preencha os dados abaixo para registrar seu atendimento.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#d8e3ed] bg-white px-5 py-4 shadow-sm xl:min-w-[350px]">
                <div className="flex items-center justify-between gap-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                      Número do protocolo
                    </p>

                    <p className="mt-1 text-xl font-black tracking-wide text-[#073b70]">
                      {codigo || "Gerando..."}
                    </p>

                    <p className="mt-1 text-[10px] text-gray-400">
                      Guarde este número para acompanhamento.
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#073b70] text-white shadow-md shadow-[#073b70]/20">
                    <FileText size={18} />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="p-6 sm:p-8">
            {alert && (
              <div
                className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
                  alert.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {alert.type === "success" ? (
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0"
                  />
                ) : (
                  <AlertCircle
                    size={20}
                    className="mt-0.5 shrink-0"
                  />
                )}

                <div>
                  <p className="font-black">
                    {alert.type === "success"
                      ? "Solicitação enviada"
                      : "Não foi possível enviar"}
                  </p>

                  <p className="mt-1 text-sm">
                    {alert.message}
                  </p>

                  {alert.type === "success" && (
                    <p className="mt-1 text-sm">
                      Nº do protocolo:{" "}
                      <strong>{codigo}</strong>
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Nome completo
                  </label>

                  <input
                    type="text"
                    readOnly
                    value={form.nome}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-600 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                    E-mail
                  </label>

                  <input
                    type="email"
                    readOnly
                    value={form.email}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-600 outline-none"
                  />
                </div>

              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Categoria
                  </label>

                  <select
                    value={form.categoria}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        categoria:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 outline-none transition focus:border-[#073b70] focus:ring-4 focus:ring-[#073b70]/10"
                  >
                    <option value="">
                      Selecione uma categoria
                    </option>
                    <option value="Cancelamento">
                      Cancelamento
                    </option>
                    <option value="Reembolso">
                      Reembolso
                    </option>
                    <option value="Alteração de viagem">
                      Alteração de viagem
                    </option>
                    <option value="Pagamento">
                      Pagamento
                    </option>
                    <option value="Bagagem">
                      Bagagem
                    </option>
                    <option value="Conta">
                      Conta
                    </option>
                    <option value="Outros">
                      Outros
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Assunto
                  </label>

                  <input
                    value={form.assunto}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        assunto:
                          e.target.value,
                      })
                    }
                    placeholder="Digite o assunto da solicitação"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#073b70] focus:ring-4 focus:ring-[#073b70]/10"
                  />
                </div>

              </div>

              <div className="mt-5">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Mensagem
                </label>

                <textarea
                  value={form.mensagem}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      mensagem:
                        e.target.value,
                    })
                  }
                  rows={6}
                  placeholder="Descreva detalhadamente o que aconteceu e como podemos ajudar..."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-4 text-sm leading-6 text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#073b70] focus:ring-4 focus:ring-[#073b70]/10"
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Documento ou comprovante
                </label>

                <label className="group flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-4 transition hover:border-[#073b70] hover:bg-[#f6f9fc]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#073b70] shadow-sm">
                    <Paperclip size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#073b70]">
                      {arquivo
                        ? arquivo.name
                        : "Adicionar um arquivo"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Clique para selecionar um documento.
                    </p>
                  </div>

                  <span className="hidden rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-[#073b70] shadow-sm sm:block">
                    Selecionar
                  </span>

                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setArquivo(
                        e.target.files?.[0] ||
                          null
                      )
                    }
                  />
                </label>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={limparFormulario}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={17} />
                  Limpar
                </button>

                <button
                  type="submit"
                  disabled={enviando}
                  className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-black text-white shadow-lg transition ${
                    enviando
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-[#35aa8a] shadow-[#35aa8a]/20 hover:-translate-y-0.5 hover:bg-[#0a694f] hover:shadow-xl"
                  }`}
                >
                  <Send size={17} />

                  {enviando
                    ? "Enviando..."
                    : "Enviar Solicitação"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">

          <aside className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/40">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf3f9] text-[#073b70]">
                <CircleHelp size={21} />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#073b70]">
                  Precisa de ajuda?
                </h2>

                <p className="text-xs text-gray-500">
                  Dúvidas frequentes
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {faq.map((item, index) => {
                const aberto =
                  faqAberto === index;

                return (
                  <div
                    key={item.pergunta}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setFaqAberto(
                          aberto
                            ? null
                            : index
                        )
                      }
                      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                    >
                      <span className="text-sm font-bold text-gray-700">
                        {item.pergunta}
                      </span>

                      {aberto ? (
                        <Plus
                          size={16}
                          className="shrink-0 rotate-45 text-[#073b70]"
                        />
                      ) : (
                        <ChevronRight
                          size={16}
                          className="shrink-0 text-gray-400"
                        />
                      )}
                    </button>

                    {aberto && (
                      <div className="border-t border-gray-200 px-4 pb-4 pt-3">
                        <p className="text-xs leading-5 text-gray-500">
                          {item.resposta}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl bg-[#073b70] p-5 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <MessageCircle size={19} />
              </div>

              <h3 className="mt-4 font-black">
                Fale com nossa equipe
              </h3>

              <p className="mt-1 text-xs leading-5 text-white/65">
                Não encontrou a resposta?
                Converse diretamente com um
                atendente.
              </p>

              <button
                type="button"
                onClick={abrirChat}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-black text-[#073b70] transition hover:bg-gray-100"
              >
                <MessagesSquare size={16} />
                Abrir Chat
              </button>
            </div>
          </aside>

          <section className="min-w-0 rounded-[30px] border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/40 sm:p-7">

            <div className="flex flex-col gap-5 border-b border-gray-100 pb-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf3f9] text-[#073b70]">
                    <FileText size={20} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-[#073b70]">
                      Meus Protocolos
                    </h2>

                    <p className="text-xs text-gray-500">
                      Histórico das suas solicitações
                    </p>
                  </div>
                </div>

                <span className="w-fit rounded-full bg-[#edf3f9] px-3 py-1.5 text-xs font-black text-[#073b70]">
                  {protocolos.length} registros
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                    Total
                  </p>
                  <p className="mt-1 text-lg font-black text-[#073b70]">
                    {statusCounts.total}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                    Abertos
                  </p>
                  <p className="mt-1 text-lg font-black text-green-600">
                    {statusCounts.aberto}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                    Em andamento
                  </p>
                  <p className="mt-1 text-lg font-black text-yellow-600">
                    {statusCounts.andamento}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                    Finalizados
                  </p>
                  <p className="mt-1 text-lg font-black text-gray-600">
                    {statusCounts.finalizado}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  value={buscaProtocolo}
                  onChange={(e) =>
                    setBuscaProtocolo(
                      e.target.value
                    )
                  }
                  placeholder="Pesquisar pelo número do protocolo..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#073b70] focus:bg-white focus:ring-4 focus:ring-[#073b70]/10"
                />
              </div>

              <select
                value={filtroStatus}
                onChange={(e) =>
                  setFiltroStatus(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-700 outline-none transition focus:border-[#073b70] focus:bg-white focus:ring-4 focus:ring-[#073b70]/10"
              >
                <option value="Todos">
                  Todos os status
                </option>
                <option value="Aberto">
                  Aberto
                </option>
                <option value="Em andamento">
                  Em andamento
                </option>
                <option value="Finalizado">
                  Finalizado
                </option>
              </select>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#f7f9fb]">
                    <tr className="border-b border-gray-100">
                      <th className="whitespace-nowrap px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
                        Protocolo
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
                        Assunto
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
                        Data
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
                        Status
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
                        Ação
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {protocolosFiltrados.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-14 text-center"
                        >
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                            <FileText size={22} />
                          </div>

                          <p className="mt-4 text-sm font-black text-gray-600">
                            Nenhum protocolo encontrado
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Tente alterar os filtros.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      protocolosFiltrados.map(
                        (item, index) => (
                          <tr
                            key={`${item.codigo}-${index}`}
                            className="group transition hover:bg-[#f9fbfd]"
                          >
                            <td className="whitespace-nowrap px-5 py-4">
                              <span className="text-xs font-black text-[#073b70]">
                                {item.codigo ||
                                  "-"}
                              </span>
                            </td>

                            <td className="max-w-[260px] px-5 py-4">
                              <p className="truncate text-xs font-semibold text-gray-700">
                                {item.assunto ||
                                  "-"}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock3
                                  size={14}
                                />

                                {item.criado_em
                                  ? new Date(
                                      item.criado_em
                                    ).toLocaleString(
                                      "pt-BR"
                                    )
                                  : "-"}
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black ${
                                  item.status ===
                                  "Aberto"
                                    ? "bg-green-100 text-green-700"
                                    : item.status ===
                                        "Em andamento"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />

                                {item.status ||
                                  "Pendente"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <Link
                                href={`/protocolo/${item.codigo}`}
                                title="Visualizar protocolo"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3f9] text-[#073b70] transition hover:bg-[#073b70] hover:text-white"
                              >
                                <Eye size={16} />
                              </Link>
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Exibindo{" "}
                <strong className="text-gray-600">
                  {protocolosFiltrados.length}
                </strong>{" "}
                de{" "}
                <strong className="text-gray-600">
                  {protocolos.length}
                </strong>{" "}
                protocolos
              </span>

              <span className="flex items-center gap-1.5">
                <CheckCircle2
                  size={14}
                  className="text-green-600"
                />
                Informações atualizadas
              </span>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}