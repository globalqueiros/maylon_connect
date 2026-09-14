"use client";

import { useEffect, useMemo, useState } from "react";
import NvoipWidget from "../../components/NvoipWidget";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Eye,
  FileText,
  Mails,
  MessageCircle,
  MessagesSquare,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  Trash2,
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

    const tempoLimite = 90 * 60 * 1000;
    const salvo = localStorage.getItem("protocolo");
    const salvoTempo = localStorage.getItem("protocolo_time");
    const agora = Date.now();

    if (
      salvo &&
      salvoTempo &&
      agora - Number(salvoTempo) < tempoLimite
    ) {
      return salvo;
    }

    return gerarNovoProtocolo();
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
        const [usuarioRes, protocolosRes] = await Promise.all([
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
            nome: data.full_name || data.nome || "",
            email: data.email || "",
          }));
        }

        if (protocolosRes.ok) {
          const data = await protocolosRes.json();
          setProtocolos(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Erro ao carregar central:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  useEffect(() => {
    if (!alert) return;

    const timer = setTimeout(() => {
      setAlert(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [alert]);

  const protocolosFiltrados = useMemo(() => {
    const busca = buscaProtocolo.toLowerCase().trim();

    return protocolos.filter((item) => {
      const codigoItem = String(item.codigo || "").toLowerCase();

      const correspondeBusca =
        !busca || codigoItem.includes(busca);

      const correspondeStatus =
        filtroStatus === "Todos" ||
        item.status === filtroStatus;

      return correspondeBusca && correspondeStatus;
    });
  }, [protocolos, buscaProtocolo, filtroStatus]);

  const statusCounts = {
    total: protocolos.length,
    aberto: protocolos.filter(
      (item) => item.status === "Aberto"
    ).length,
    andamento: protocolos.filter(
      (item) => item.status === "Em andamento"
    ).length,
    finalizado: protocolos.filter(
      (item) => item.status === "Finalizado"
    ).length,
  };

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
        message: "Informe o assunto da solicitação.",
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
      const formData = new FormData();

      formData.append("nome", form.nome);
      formData.append("email", form.email);
      formData.append("assunto", form.assunto);
      formData.append("mensagem", form.mensagem);
      formData.append("categoria", form.categoria);
      formData.append("codigo", codigoAtual);

      if (arquivo) {
        formData.append("arquivo", arquivo);
      }

      const res = await fetch("/api/protocolo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Erro ao criar protocolo."
        );
      }

      setAlert({
        type: "success",
        message: "Protocolo criado com sucesso!",
      });

      const novoCodigo = gerarNovoProtocolo();
      setCodigo(novoCodigo);

      setForm((prev) => ({
        ...prev,
        assunto: "",
        mensagem: "",
        categoria: "",
      }));

      setArquivo(null);

      const protocolosRes = await fetch("/api/protocolo", {
        credentials: "include",
        cache: "no-store",
      });

      if (protocolosRes.ok) {
        const protocolosData = await protocolosRes.json();

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
          error instanceof Error
            ? error.message
            : "Erro ao criar protocolo.",
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

  const statusClasses = (status?: string) => {
    if (status === "Aberto") {
      return "bg-[#e8faf6] text-[#0f766e] border-[#bce9df]";
    }

    if (status === "Em andamento") {
      return "bg-[#fff8e7] text-[#a66b00] border-[#f5dfab]";
    }

    if (status === "Finalizado") {
      return "bg-[#eef6f5] text-[#52706d] border-[#d6e6e4]";
    }

    return "bg-gray-50 text-gray-500 border-gray-200";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-[380px] rounded-[32px] border border-gray-200/80 bg-white p-10 text-center shadow-[0_25px_80px_rgba(15,118,110,0.10)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#0f766e] shadow-xl shadow-[#0f766e]/20">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
          </div>

          <h2 className="mt-6 text-lg font-black tracking-tight text-[#0f766e]">
            Preparando seu atendimento
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Estamos carregando suas informações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-700">
      <NvoipWidget />

      <main className="mx-auto w-full max-w-8xl">
        <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#115e59] via-[#0f766e] to-[#0d9488] shadow-[0_30px_90px_rgba(15,118,110,0.20)]">
          <div className="absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full border-[110px] border-white/[0.035]" />

          <div className="absolute -bottom-52 left-[38%] h-[520px] w-[520px] rounded-full border-[90px] border-white/[0.025]" />

          <div className="absolute right-[25%] top-10 h-44 w-44 rounded-full bg-[#5eead4]/15 blur-[80px]" />

          <div className="absolute bottom-0 left-0 h-40 w-72 rounded-full bg-[#14b8a6]/10 blur-[70px]" />

          <div className="relative grid gap-10 px-6 py-9 sm:px-9 lg:grid-cols-[1fr_auto] lg:px-12 lg:py-12">
            <div className="max-w-3xl">

              <h1 className="mt-4 text-4xl font-black leading-[1.04] tracking-[-0.04em] text-white sm:text-4xl lg:text-4xl">
                Estamos aqui para
                <span className="block text-[#99f6e4]">
                  ajudar você.
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65 sm:text-sm">
                Tire suas dúvidas, converse com nossa equipe
                ou registre uma solicitação. Tudo organizado
                em um único espaço de atendimento.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 self-end lg:min-w-[330px]">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.08] p-5 backdrop-blur-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <FileText size={19} />
                </div>

                <p className="mt-6 text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
                  Solicitações
                </p>

                <p className="mt-1 text-3xl font-black text-white">
                  {statusCounts.total}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.08] p-5 backdrop-blur-xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5eead4]/15 text-[#99f6e4]">
                  <ShieldCheck size={19} />
                </div>

                <p className="mt-6 text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
                  Atendimento
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#99f6e4] shadow-[0_0_10px_#99f6e4]" />

                  <span className="text-sm font-black text-[#99f6e4]">
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-5">
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
              Fale conosco
            </h2>

            <p className="mt-1 text-sm text-white/80">
              Escolha o canal mais conveniente para você.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="https://wa.me/5511974204958"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,35,55,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,118,110,0.12)]"
            >
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-[#20b85a]/5 transition duration-500 group-hover:scale-150" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#eaf8f0] text-[#159447]">
                  <FontAwesomeIcon icon={faWhatsapp} size="lg" />
                </div>

                <ChevronRight
                  size={19}
                  className="text-gray-300 transition duration-300 group-hover:translate-x-1 group-hover:text-[#159447]"
                />
              </div>

              <div className="relative mt-7">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#159447]">
                  Canal rápido
                </p>

                <h3 className="mt-1 text-xl font-black text-[#115e59]">
                  WhatsApp
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Converse diretamente com nossa equipe
                  de atendimento.
                </p>

                <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-black text-[#159447]">
                  Iniciar conversa
                  <ChevronRight size={14} />
                </span>
              </div>
            </a>

            <a
              href="mailto:atendimento@maylon.com.br"
              className="group relative overflow-hidden rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,35,55,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,118,110,0.12)]"
            >
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-[#0f766e]/5 transition duration-500 group-hover:scale-150" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#e6fffb] text-[#0f766e]">
                  <Mails size={22} />
                </div>

                <ChevronRight
                  size={19}
                  className="text-gray-300 transition duration-300 group-hover:translate-x-1 group-hover:text-[#0f766e]"
                />
              </div>

              <div className="relative mt-7">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f766e]">
                  Atendimento detalhado
                </p>

                <h3 className="mt-1 text-xl font-black text-[#115e59]">
                  E-mail
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Envie sua solicitação com todos os
                  detalhes necessários.
                </p>

                <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-black text-[#0f766e]">
                  Enviar mensagem
                  <ChevronRight size={14} />
                </span>
              </div>
            </a>

            <button
              type="button"
              onClick={abrirChat}
              className="group relative overflow-hidden rounded-[28px] border border-gray-200/80 bg-white p-6 text-left shadow-[0_12px_40px_rgba(15,35,55,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,118,110,0.12)]"
            >
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-[#0f766e]/5 transition duration-500 group-hover:scale-150" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#e6fffb] text-[#0f766e]">
                  <MessagesSquare size={22} />
                </div>

                <ChevronRight
                  size={19}
                  className="text-gray-300 transition duration-300 group-hover:translate-x-1 group-hover:text-[#0f766e]"
                />
              </div>

              <div className="relative mt-7">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f766e]">
                  Tempo real
                </p>

                <h3 className="mt-1 text-xl font-black text-[#115e59]">
                  Chat Online
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Converse com um atendente em tempo real.
                </p>

                <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-black text-[#0f766e]">
                  Abrir atendimento
                  <ChevronRight size={14} />
                </span>
              </div>
            </button>
          </div>
        </section>

        <section
          id="abrir-protocolo"
          className="mt-9 overflow-hidden rounded-[32px] border border-gray-200/80 bg-white shadow-[0_18px_60px_rgba(15,118,110,0.07)]"
        >
          <div className="grid lg:grid-cols-[1fr_330px]">
            <div className="p-6 sm:p-8 lg:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#0f766e] text-white shadow-lg shadow-[#0f766e]/15">
                  <FileText size={22} />
                </div>

                <div>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[#115e59]">
                    Abrir protocolo
                  </h2>
                  <p className="mt-0 text-sm text-gray-500">
                    Preencha as informações para iniciar seu
                    atendimento.
                  </p>
                </div>
              </div>

              {alert && (
                <div
                  className={`mt-7 flex items-start gap-3 rounded-2xl border p-4 ${
                    alert.type === "success"
                      ? "border-[#bce9df] bg-[#effcf9] text-[#0f766e]"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {alert.type === "success" ? (
                    <CheckCircle2
                      size={19}
                      className="mt-0.5 shrink-0"
                    />
                  ) : (
                    <AlertCircle
                      size={19}
                      className="mt-0.5 shrink-0"
                    />
                  )}

                  <div>
                    <p className="text-sm font-black">
                      {alert.type === "success"
                        ? "Solicitação enviada"
                        : "Não foi possível enviar"}
                    </p>

                    <p className="mt-1 text-xs leading-5">
                      {alert.message}
                    </p>

                    {alert.type === "success" && (
                      <p className="mt-1 text-xs">
                        Protocolo:{" "}
                        <strong>{codigo}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="mt-8"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">
                      Nome completo
                    </label>

                    <input
                      type="text"
                      readOnly
                      value={form.nome}
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f5faf9] px-4 text-sm font-medium text-gray-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">
                      E-mail
                    </label>

                    <input
                      type="email"
                      readOnly
                      value={form.email}
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f5faf9] px-4 text-sm font-medium text-gray-500 outline-none"
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">
                      Categoria
                    </label>

                    <select
                      value={form.categoria}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          categoria: e.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
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
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">
                      Assunto
                    </label>

                    <input
                      value={form.assunto}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          assunto: e.target.value,
                        }))
                      }
                      placeholder="Ex.: Problema com minha viagem"
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">
                    Mensagem
                  </label>

                  <textarea
                    value={form.mensagem}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        mensagem: e.target.value,
                      }))
                    }
                    rows={6}
                    placeholder="Descreva detalhadamente o que aconteceu..."
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm leading-6 text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
                  />
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">
                    Anexo
                  </label>

                  <label className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-[#f7fbfa] p-4 transition hover:border-[#0f766e] hover:bg-[#f1fbf8]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0f766e] shadow-sm">
                      <Paperclip size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-[#115e59]">
                        {arquivo
                          ? arquivo.name
                          : "Adicionar documento ou comprovante"}
                      </p>

                      <p className="mt-1 text-[10px] text-gray-400">
                        PDF, JPG, PNG ou WEBP
                      </p>
                    </div>

                    <span className="hidden rounded-xl border border-gray-200 bg-white px-4 py-2 text-[10px] font-black text-[#0f766e] sm:block">
                      Selecionar
                    </span>

                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,.webp"
                      className="hidden"
                      onChange={(e) =>
                        setArquivo(
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </label>

                  {arquivo && (
                    <div className="mt-2 flex items-center justify-between rounded-xl border border-[#bce9df] bg-[#effcf9] px-4 py-2.5">
                      <span className="truncate text-[11px] font-bold text-[#0f766e]">
                        {arquivo.name}
                      </span>

                      <button
                        type="button"
                        onClick={() => setArquivo(null)}
                        className="ml-3 cursor-pointer text-[10px] font-black text-red-500 hover:text-red-700"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={limparFormulario}
                    className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 text-xs font-black text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                    Limpar
                  </button>

                  <button
                    type="submit"
                    disabled={enviando}
                    className={`inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl px-7 text-xs font-black text-white shadow-lg transition ${
                      enviando
                        ? "cursor-not-allowed bg-gray-400"
                        : "bg-[#0f766e] shadow-[#0f766e]/20 hover:-translate-y-0.5 hover:bg-[#115e59]"
                    }`}
                  >
                    <Send size={16} />

                    {enviando
                      ? "Enviando..."
                      : "Enviar solicitação"}
                  </button>
                </div>
              </form>
            </div>

            <aside className="border-t border-gray-100 bg-[#f5faf9] p-6 lg:border-l lg:border-t-0 lg:p-8">
              <div className="rounded-[26px] bg-gradient-to-br from-[#115e59] to-[#0f766e] p-6 text-white shadow-xl shadow-[#0f766e]/15">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <FileText size={18} />
                </div>

                <p className="mt-6 text-[9px] font-black uppercase tracking-[0.18em] text-white/45">
                  Seu protocolo
                </p>

                <p className="mt-2 break-all text-xl font-black tracking-wide">
                  {codigo || "Gerando..."}
                </p>

                <div className="mt-5 h-px bg-white/10" />

                <div className="mt-5 flex gap-3">
                  <ShieldCheck
                    size={17}
                    className="mt-0.5 shrink-0 text-[#99f6e4]"
                  />

                  <p className="text-xs leading-5 text-white/60">
                    Este número será utilizado para
                    acompanhar sua solicitação.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[26px] border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6fffb] text-[#0f766e]">
                    <Clock3 size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-black text-[#115e59]">
                      Atendimento
                    </p>

                    <p className="mt-0.5 text-[10px] text-gray-400">
                      Acompanhe pelo histórico
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-[#f5faf9] p-3">
                    <p className="text-[8px] font-black uppercase tracking-wider text-gray-400">
                      Abertos
                    </p>

                    <p className="mt-1 text-lg font-black text-[#0f766e]">
                      {statusCounts.aberto}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#f5faf9] p-3">
                    <p className="text-[8px] font-black uppercase tracking-wider text-gray-400">
                      Finalizados
                    </p>

                    <p className="mt-1 text-lg font-black text-[#0f766e]">
                      {statusCounts.finalizado}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-9 grid gap-6 xl:grid-cols-[370px_minmax(0,1fr)]">
          <aside className="rounded-[32px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,118,110,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-[#e6fffb] text-[#0f766e]">
                <CircleHelp size={20} />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f766e]">
                  Ajuda
                </p>

                <h2 className="text-xl font-black tracking-tight text-[#115e59]">
                  Perguntas frequentes
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {faq.map((item, index) => {
                const aberto = faqAberto === index;

                return (
                  <div
                    key={item.pergunta}
                    className={`overflow-hidden rounded-2xl border transition-all ${
                      aberto
                        ? "border-[#bce9df] bg-[#f1fbf8]"
                        : "border-gray-100 bg-[#f8fbfa]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setFaqAberto(
                          aberto ? null : index
                        )
                      }
                      className="flex cursor-pointer w-full items-center justify-between gap-3 px-4 py-4 text-left"
                    >
                      <span className="text-xs font-black text-gray-700">
                        {item.pergunta}
                      </span>

                      <ChevronRight
                        size={15}
                        className={`shrink-0 text-gray-400 transition ${
                          aberto
                            ? "rotate-90 text-[#0f766e]"
                            : ""
                        }`}
                      />
                    </button>

                    {aberto && (
                      <div className="border-t border-gray-200/70 px-4 pb-4 pt-3">
                        <p className="text-[11px] leading-5 text-gray-500">
                          {item.resposta}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="relative mt-6 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#115e59] to-[#0f766e] p-5 text-white">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/[0.05]" />

              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <MessageCircle size={18} />
                </div>

                <h3 className="mt-5 text-sm font-black">
                  Ainda precisa de ajuda?
                </h3>

                <p className="mt-1 text-[11px] leading-5 text-white/55">
                  Nossa equipe está pronta para atender você.
                </p>

                <button
                  type="button"
                  onClick={abrirChat}
                  className="mt-5 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white text-[11px] font-black text-[#0f766e] transition hover:bg-[#ecfffc]"
                >
                  <MessagesSquare size={15} />
                  Abrir atendimento
                </button>
              </div>
            </div>
          </aside>

          <section className="min-w-0 rounded-[32px] border border-gray-200/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,118,110,0.06)] sm:p-7 lg:p-8">
            <div className="flex flex-col gap-5 border-b border-gray-100 pb-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-[#0f766e] text-white">
                    <FileText size={19} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black tracking-tight text-[#115e59]">
                      Meus protocolos
                    </h2>

                    <p className="text-xs text-gray-400">
                      Acompanhe todas as suas solicitações.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-[#d5ece8] bg-[#f2fbf9] px-3.5 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0f766e]" />

                  <span className="text-[10px] font-black text-[#115e59]">
                    {protocolos.length} registros
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-gray-100 bg-[#f8fbfa] p-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-gray-400">
                    Total
                  </p>

                  <p className="mt-1 text-xl font-black text-[#115e59]">
                    {statusCounts.total}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#cdeee5] bg-[#f0fbf8] p-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[#0f766e]">
                    Abertos
                  </p>

                  <p className="mt-1 text-xl font-black text-[#0f766e]">
                    {statusCounts.aberto}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#f4e1b1] bg-[#fffaf0] p-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[#a66b00]">
                    Andamento
                  </p>

                  <p className="mt-1 text-xl font-black text-[#956300]">
                    {statusCounts.andamento}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-[#f8fbfa] p-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-gray-400">
                    Finalizados
                  </p>

                  <p className="mt-1 text-xl font-black text-gray-600">
                    {statusCounts.finalizado}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_210px]">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  value={buscaProtocolo}
                  onChange={(e) =>
                    setBuscaProtocolo(e.target.value)
                  }
                  placeholder="Pesquisar protocolo..."
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f8fbfa] pl-11 pr-4 text-xs outline-none transition focus:border-[#0f766e] focus:bg-white focus:ring-4 focus:ring-[#0f766e]/10"
                />
              </div>

              <select
                value={filtroStatus}
                onChange={(e) =>
                  setFiltroStatus(e.target.value)
                }
                className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f8fbfa] px-4 text-xs text-gray-700 outline-none transition focus:border-[#0f766e] focus:bg-white focus:ring-4 focus:ring-[#0f766e]/10"
              >
                <option value="Todos">
                  Todos os status
                </option>

                <option value="Aberto">Aberto</option>

                <option value="Em andamento">
                  Em andamento
                </option>

                <option value="Finalizado">
                  Finalizado
                </option>
              </select>
            </div>

            <div className="mt-5 overflow-hidden rounded-[22px] border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#f8fbfa]">
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-4 text-left text-[8px] font-black uppercase tracking-[0.16em] text-gray-400">
                        Protocolo
                      </th>

                      <th className="px-5 py-4 text-left text-[8px] font-black uppercase tracking-[0.16em] text-gray-400">
                        Assunto
                      </th>

                      <th className="px-5 py-4 text-left text-[8px] font-black uppercase tracking-[0.16em] text-gray-400">
                        Data
                      </th>

                      <th className="px-5 py-4 text-left text-[8px] font-black uppercase tracking-[0.16em] text-gray-400">
                        Status
                      </th>

                      <th className="px-5 py-4 text-left text-[8px] font-black uppercase tracking-[0.16em] text-gray-400">
                        Ação
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {protocolosFiltrados.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-16 text-center"
                        >
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf7f5] text-[#0f766e]">
                            <FileText size={21} />
                          </div>

                          <p className="mt-4 text-xs font-black text-gray-600">
                            Nenhum protocolo encontrado
                          </p>

                          <p className="mt-1 text-[10px] text-gray-400">
                            Ajuste os filtros ou abra uma nova
                            solicitação.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      protocolosFiltrados.map(
                        (item, index) => (
                          <tr
                            key={`${item.codigo}-${index}`}
                            className="group transition hover:bg-[#f8fcfb]"
                          >
                            <td className="whitespace-nowrap px-5 py-4">
                              <span className="rounded-lg border border-[#cfe9e5] bg-[#f1f9f7] px-2.5 py-1.5 text-[10px] font-black text-[#0f766e]">
                                {item.codigo || "-"}
                              </span>
                            </td>

                            <td className="max-w-[300px] px-5 py-4">
                              <p className="truncate text-[11px] font-bold text-gray-700">
                                {item.assunto || "-"}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                <Clock3 size={13} />

                                {item.criado_em
                                  ? new Date(
                                      item.criado_em
                                    ).toLocaleString("pt-BR")
                                  : "-"}
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black ${statusClasses(
                                  item.status
                                )}`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />

                                {item.status || "Pendente"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <Link
                                href={`/passageiro/protocolo/${item.codigo}`}
                                title="Visualizar protocolo"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-[#0f766e] shadow-sm transition hover:border-[#0f766e] hover:bg-[#0f766e] hover:text-white"
                              >
                                <Eye size={15} />
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

            <div className="mt-5 flex flex-col gap-2 text-[10px] text-gray-400 sm:flex-row sm:items-center sm:justify-between">
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
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}