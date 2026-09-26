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

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  data?: unknown;
  [key: string]: unknown;
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

async function lerResposta(res: Response): Promise<ApiResponse> {
  const texto = await res.text();

  if (!texto.trim()) {
    return {};
  }

  try {
    const json = JSON.parse(texto);

    if (json && typeof json === "object") {
      return json;
    }

    return {};
  } catch {
    return {
      error: texto.slice(0, 500),
    };
  }
}

function gerarNovoProtocolo() {
  const ano = new Date().getFullYear();
  const random = Math.floor(100000000 + Math.random() * 900000000);
  const novo = `MAY - ${random}${ano}`;

  if (typeof window !== "undefined") {
    localStorage.setItem("protocolo", novo);
    localStorage.setItem("protocolo_time", String(Date.now()));
  }

  return novo;
}

function gerarProtocoloPersistente() {
  if (typeof window === "undefined") {
    return "";
  }

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

function extrairProtocolos(data: ApiResponse): Protocolo[] {
  if (Array.isArray(data)) {
    return data as Protocolo[];
  }

  if (Array.isArray(data.data)) {
    return data.data as Protocolo[];
  }

  if (Array.isArray(data.protocolos)) {
    return data.protocolos as Protocolo[];
  }

  return [];
}

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

        const usuarioData = await lerResposta(usuarioRes);
        const protocolosData = await lerResposta(protocolosRes);

        if (usuarioRes.ok) {
          setForm((prev) => ({
            ...prev,
            nome:
              String(
                usuarioData.full_name ||
                  usuarioData.nome ||
                  ""
              ),
            email: String(usuarioData.email || ""),
          }));
        }

        if (protocolosRes.ok) {
          setProtocolos(extrairProtocolos(protocolosData));
        } else {
          console.error(
            "Erro ao carregar protocolos:",
            protocolosData.error ||
              `Status ${protocolosRes.status}`
          );

          setProtocolos([]);
        }
      } catch (error) {
        console.error("Erro ao carregar central:", error);

        setAlert({
          type: "error",
          message:
            "Não foi possível carregar seus protocolos.",
        });
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  useEffect(() => {
    if (!alert) {
      return;
    }

    const timer = setTimeout(() => {
      setAlert(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [alert]);

  const protocolosFiltrados = useMemo(() => {
    const busca = buscaProtocolo.toLowerCase().trim();

    return protocolos.filter((item) => {
      const codigoItem = String(
        item.codigo || ""
      ).toLowerCase();

      const assuntoItem = String(
        item.assunto || ""
      ).toLowerCase();

      const correspondeBusca =
        !busca ||
        codigoItem.includes(busca) ||
        assuntoItem.includes(busca);

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

  const atualizarProtocolos = async () => {
    try {
      const res = await fetch("/api/protocolo", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await lerResposta(res);

      if (!res.ok) {
        console.error(
          "Erro ao atualizar protocolos:",
          data.error ||
            `Status ${res.status}`
        );
        return;
      }

      setProtocolos(extrairProtocolos(data));
    } catch (error) {
      console.error(
        "Erro ao atualizar protocolos:",
        error
      );
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const categoria = form.categoria.trim();
    const assunto = form.assunto.trim();
    const mensagem = form.mensagem.trim();

    if (!categoria) {
      setAlert({
        type: "error",
        message:
          "Selecione uma categoria para o atendimento.",
      });
      return;
    }

    if (!assunto) {
      setAlert({
        type: "error",
        message:
          "Informe o assunto da solicitação.",
      });
      return;
    }

    if (!mensagem) {
      setAlert({
        type: "error",
        message:
          "Digite uma mensagem para sua solicitação.",
      });
      return;
    }

    if (!codigo) {
      setAlert({
        type: "error",
        message:
          "Aguarde a geração do número do protocolo.",
      });
      return;
    }

    if (arquivo) {
      const tamanhoMaximo = 10 * 1024 * 1024;

      if (arquivo.size > tamanhoMaximo) {
        setAlert({
          type: "error",
          message:
            "O arquivo não pode ter mais de 10 MB.",
        });
        return;
      }

      const extensoesPermitidas = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];

      if (
        arquivo.type &&
        !extensoesPermitidas.includes(arquivo.type)
      ) {
        setAlert({
          type: "error",
          message:
            "Formato de arquivo não permitido. Envie PDF, JPG, PNG ou WEBP.",
        });
        return;
      }
    }

    try {
      setEnviando(true);
      setAlert(null);

      const codigoAtual = codigo;
      const formData = new FormData();

      formData.append(
        "nome",
        form.nome.trim()
      );
      formData.append(
        "email",
        form.email.trim()
      );
      formData.append(
        "categoria",
        categoria
      );
      formData.append(
        "assunto",
        assunto
      );
      formData.append(
        "mensagem",
        mensagem
      );
      formData.append(
        "codigo",
        codigoAtual
      );

      if (arquivo) {
        formData.append(
          "arquivo",
          arquivo
        );
      }

      const res = await fetch("/api/protocolo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await lerResposta(res);

      if (!res.ok) {
        throw new Error(
          data.error ||
            String(data.message || "") ||
            `Erro ao criar protocolo. Status: ${res.status}.`
        );
      }

      if (data.success === false) {
        throw new Error(
          data.error ||
            String(data.message || "") ||
            "Erro ao criar protocolo."
        );
      }

      setAlert({
        type: "success",
        message:
          data.message ||
          "Protocolo criado com sucesso!",
      });

      setForm((prev) => ({
        ...prev,
        assunto: "",
        mensagem: "",
        categoria: "",
      }));

      setArquivo(null);

      const novoCodigo = gerarNovoProtocolo();
      setCodigo(novoCodigo);

      await atualizarProtocolos();
    } catch (error) {
      console.error(
        "Erro ao enviar protocolo:",
        error
      );

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
    setAlert(null);
  };

  const statusClasses = (status?: string) => {
    if (status === "Aberto") {
      return "border-[#bce9df] bg-[#e8faf6] text-[#0f766e]";
    }

    if (status === "Em andamento") {
      return "border-[#f5dfab] bg-[#fff8e7] text-[#a66b00]";
    }

    if (status === "Finalizado") {
      return "border-[#d6e6e4] bg-[#eef6f5] text-[#52706d]";
    }

    return "border-gray-200 bg-gray-50 text-gray-500";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-[320px] rounded-[24px] border border-gray-200/80 bg-white p-7 text-center shadow-[0_25px_80px_rgba(15,118,110,0.10)] sm:max-w-[380px] sm:rounded-[32px] sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#0f766e] shadow-xl shadow-[#0f766e]/20 sm:h-16 sm:w-16 sm:rounded-[20px]">
            <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/30 border-t-white sm:h-7 sm:w-7" />
          </div>

          <h2 className="mt-5 text-base font-black tracking-tight text-[#0f766e] sm:mt-6 sm:text-lg">
            Preparando seu atendimento
          </h2>

          <p className="mt-2 text-xs text-gray-400 sm:text-sm">
            Estamos carregando suas informações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-700">
      <NvoipWidget />

      <main className="mx-auto w-full max-w-full 2xl:max-w-[1600px]">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#115e59] via-[#0f766e] to-[#0d9488] shadow-[0_30px_90px_rgba(15,118,110,0.20)] sm:rounded-[30px] lg:rounded-[36px]">
          <div className="absolute -right-40 -top-40 h-[320px] w-[320px] rounded-full border-[70px] border-white/[0.035] sm:h-[420px] sm:w-[420px] lg:h-[560px] lg:w-[560px] lg:border-[110px]" />
          <div className="absolute -bottom-52 left-[38%] hidden h-[520px] w-[520px] rounded-full border-[90px] border-white/[0.025] md:block" />
          <div className="absolute right-[25%] top-10 h-32 w-32 rounded-full bg-[#5eead4]/15 blur-[80px] lg:h-44 lg:w-44" />
          <div className="absolute bottom-0 left-0 h-40 w-72 rounded-full bg-[#14b8a6]/10 blur-[70px]" />

          <div className="relative grid gap-6 px-5 py-7 sm:gap-8 sm:px-8 sm:py-9 lg:grid-cols-[1fr_auto] lg:gap-10 lg:px-12 lg:py-12 2xl:px-16 2xl:py-14">
            <div className="max-w-3xl 2xl:max-w-4xl">
              <h1 className="mt-2 text-3xl font-black leading-[1.05] tracking-[-0.04em] text-white sm:mt-3 sm:text-4xl lg:mt-4 lg:text-5xl 2xl:text-6xl">
                Estamos aqui para
                <span className="block text-[#99f6e4]">
                  ajudar você.
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-xs leading-5 text-white/65 sm:mt-4 sm:text-sm sm:leading-6 2xl:max-w-3xl 2xl:text-base 2xl:leading-7">
                Tire suas dúvidas, converse com nossa equipe
                ou registre uma solicitação. Tudo organizado
                em um único espaço de atendimento.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 self-end sm:max-w-md lg:w-auto lg:min-w-[330px] 2xl:min-w-[380px] 2xl:gap-4">
              <div className="rounded-[20px] border border-white/10 bg-white/[0.08] p-4 backdrop-blur-xl sm:rounded-[24px] sm:p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white sm:h-11 sm:w-11">
                  <FileText size={19} />
                </div>

                <p className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-white/40 sm:mt-6 2xl:text-[10px]">
                  Solicitações
                </p>

                <p className="mt-1 text-2xl font-black text-white sm:text-3xl 2xl:text-4xl">
                  {statusCounts.total}
                </p>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/[0.08] p-4 backdrop-blur-xl sm:rounded-[24px] sm:p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5eead4]/15 text-[#99f6e4] sm:h-11 sm:w-11">
                  <ShieldCheck size={19} />
                </div>

                <p className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-white/40 sm:mt-6 2xl:text-[10px]">
                  Atendimento
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#99f6e4] shadow-[0_0_10px_#99f6e4]" />
                  <span className="text-sm font-black text-[#99f6e4] 2xl:text-base">
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CANAIS */}
        <section className="mt-5 lg:mt-6">
          <div className="mb-4 sm:mb-5">
            <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl 2xl:text-3xl">
              Fale conosco
            </h2>

            <p className="mt-1 text-xs text-white/80 sm:text-sm 2xl:text-base">
              Escolha o canal mais conveniente para você.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 2xl:gap-6">
            <a
              href="https://wa.me/5511974204958"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-[22px] border border-gray-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,35,55,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,118,110,0.12)] sm:rounded-[26px] sm:p-6 lg:rounded-[28px] 2xl:p-7"
            >
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-[#20b85a]/5 transition duration-500 group-hover:scale-150" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#eaf8f0] text-[#159447] sm:h-14 sm:w-14 sm:rounded-[18px]">
                  <FontAwesomeIcon
                    icon={faWhatsapp}
                    size="lg"
                  />
                </div>

                <ChevronRight
                  size={19}
                  className="text-gray-300 transition duration-300 group-hover:translate-x-1 group-hover:text-[#159447]"
                />
              </div>

              <div className="relative mt-5 sm:mt-7">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#159447] 2xl:text-[10px]">
                  Canal rápido
                </p>

                <h3 className="mt-1 text-lg font-black text-[#115e59] sm:text-xl 2xl:text-2xl">
                  WhatsApp
                </h3>

                <p className="mt-2 text-xs leading-5 text-gray-400 sm:text-sm sm:leading-6">
                  Converse diretamente com nossa equipe
                  de atendimento.
                </p>

                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-black text-[#159447] sm:mt-6">
                  Iniciar conversa
                  <ChevronRight size={14} />
                </span>
              </div>
            </a>

            <a
              href="mailto:atendimento@maylon.com.br"
              className="group relative overflow-hidden rounded-[22px] border border-gray-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,35,55,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,118,110,0.12)] sm:rounded-[26px] sm:p-6 lg:rounded-[28px] 2xl:p-7"
            >
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-[#0f766e]/5 transition duration-500 group-hover:scale-150" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#e6fffb] text-[#0f766e] sm:h-14 sm:w-14 sm:rounded-[18px]">
                  <Mails size={22} />
                </div>

                <ChevronRight
                  size={19}
                  className="text-gray-300 transition duration-300 group-hover:translate-x-1 group-hover:text-[#0f766e]"
                />
              </div>

              <div className="relative mt-5 sm:mt-7">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f766e] 2xl:text-[10px]">
                  Atendimento detalhado
                </p>

                <h3 className="mt-1 text-lg font-black text-[#115e59] sm:text-xl 2xl:text-2xl">
                  E-mail
                </h3>

                <p className="mt-2 text-xs leading-5 text-gray-400 sm:text-sm sm:leading-6">
                  Envie sua solicitação com todos os
                  detalhes necessários.
                </p>

                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-black text-[#0f766e] sm:mt-6">
                  Enviar mensagem
                  <ChevronRight size={14} />
                </span>
              </div>
            </a>

            <button
              type="button"
              onClick={abrirChat}
              className="group relative overflow-hidden rounded-[22px] border border-gray-200/80 bg-white p-5 text-left shadow-[0_12px_40px_rgba(15,35,55,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,118,110,0.12)] sm:col-span-2 sm:rounded-[26px] sm:p-6 lg:col-span-1 lg:rounded-[28px] 2xl:p-7"
            >
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-[#0f766e]/5 transition duration-500 group-hover:scale-150" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#e6fffb] text-[#0f766e] sm:h-14 sm:w-14 sm:rounded-[18px]">
                  <MessagesSquare size={22} />
                </div>

                <ChevronRight
                  size={19}
                  className="text-gray-300 transition duration-300 group-hover:translate-x-1 group-hover:text-[#0f766e]"
                />
              </div>

              <div className="relative mt-5 sm:mt-7">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f766e] 2xl:text-[10px]">
                  Tempo real
                </p>

                <h3 className="mt-1 text-lg font-black text-[#115e59] sm:text-xl 2xl:text-2xl">
                  Chat Online
                </h3>

                <p className="mt-2 text-xs leading-5 text-gray-400 sm:text-sm sm:leading-6">
                  Converse com um atendente em tempo real.
                </p>

                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-black text-[#0f766e] sm:mt-6">
                  Abrir atendimento
                  <ChevronRight size={14} />
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* ABRIR PROTOCOLO */}
        <section
          id="abrir-protocolo"
          className="mt-6 overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-[0_18px_60px_rgba(15,118,110,0.07)] sm:mt-8 sm:rounded-[28px] lg:mt-9 lg:rounded-[32px]"
        >
          <div className="grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_330px] 2xl:grid-cols-[1fr_380px]">
            <div className="p-5 sm:p-7 lg:p-8 2xl:p-10">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#0f766e] text-white shadow-lg shadow-[#0f766e]/15 sm:h-14 sm:w-14 sm:rounded-[18px]">
                  <FileText size={22} />
                </div>

                <div>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-[#115e59] sm:text-2xl 2xl:text-3xl">
                    Abrir protocolo
                  </h2>

                  <p className="mt-0 text-xs text-gray-500 sm:text-sm 2xl:text-base">
                    Preencha as informações para iniciar seu
                    atendimento.
                  </p>
                </div>
              </div>

              {alert && (
                <div
                  className={`mt-6 flex items-start gap-3 rounded-2xl border p-3 sm:mt-7 sm:p-4 ${
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

                  <div className="min-w-0">
                    <p className="text-sm font-black">
                      {alert.type === "success"
                        ? "Solicitação enviada"
                        : "Não foi possível enviar"}
                    </p>

                    <p className="mt-1 break-words text-xs leading-5">
                      {alert.message}
                    </p>

                    {alert.type === "success" && (
                      <p className="mt-1 break-all text-xs">
                        Protocolo:{" "}
                        <strong>{codigo}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="mt-6 sm:mt-8"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  <div>
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 2xl:text-[10px]">
                      Nome completo
                    </label>

                    <input
                      type="text"
                      readOnly
                      value={form.nome}
                      className="h-11 w-full rounded-2xl border border-gray-200 bg-[#f5faf9] px-4 text-sm font-medium text-gray-500 outline-none sm:h-12 2xl:h-14 2xl:text-base"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 2xl:text-[10px]">
                      E-mail
                    </label>

                    <input
                      type="email"
                      readOnly
                      value={form.email}
                      className="h-11 w-full rounded-2xl border border-gray-200 bg-[#f5faf9] px-4 text-sm font-medium text-gray-500 outline-none sm:h-12 2xl:h-14 2xl:text-base"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:grid-cols-2 sm:gap-5">
                  <div>
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 2xl:text-[10px]">
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
                      className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10 sm:h-12 2xl:h-14 2xl:text-base"
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
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 2xl:text-[10px]">
                      Assunto
                    </label>

                    <input
                      type="text"
                      value={form.assunto}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          assunto: e.target.value,
                        }))
                      }
                      placeholder="Ex.: Problema com minha viagem"
                      required
                      className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10 sm:h-12 2xl:h-14 2xl:text-base"
                    />
                  </div>
                </div>

                <div className="mt-4 sm:mt-5">
                  <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 2xl:text-[10px]">
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
                    required
                    placeholder="Descreva detalhadamente o que aconteceu..."
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10 sm:py-4 2xl:min-h-[200px] 2xl:text-base"
                  />
                </div>

                <div className="mt-4 sm:mt-5">
                  <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 2xl:text-[10px]">
                    Anexo
                  </label>

                  <label className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-[#f7fbfa] p-3 transition hover:border-[#0f766e] hover:bg-[#f1fbf8] sm:gap-4 sm:p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0f766e] shadow-sm sm:h-11 sm:w-11">
                      <Paperclip size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-[#115e59] 2xl:text-sm">
                        {arquivo
                          ? arquivo.name
                          : "Adicionar documento ou comprovante"}
                      </p>

                      <p className="mt-1 text-[10px] text-gray-400 2xl:text-xs">
                        PDF, JPG, PNG ou WEBP • máximo 10 MB
                      </p>
                    </div>

                    <span className="hidden rounded-xl border border-gray-200 bg-white px-4 py-2 text-[10px] font-black text-[#0f766e] sm:block">
                      Selecionar
                    </span>

                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const file =
                          e.target.files?.[0] || null;

                        setArquivo(file);
                        e.target.value = "";
                      }}
                    />
                  </label>

                  {arquivo && (
                    <div className="mt-2 flex items-center justify-between rounded-xl border border-[#bce9df] bg-[#effcf9] px-3 py-2.5 sm:px-4">
                      <span className="truncate text-[11px] font-bold text-[#0f766e]">
                        {arquivo.name}
                      </span>

                      <button
                        type="button"
                        onClick={() => setArquivo(null)}
                        className="ml-3 shrink-0 cursor-pointer text-[10px] font-black text-red-500 hover:text-red-700"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:mt-7 sm:flex-row sm:justify-end sm:pt-6">
                  <button
                    type="button"
                    onClick={limparFormulario}
                    className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 text-xs font-black text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:h-12 sm:w-auto 2xl:h-14 2xl:text-sm"
                  >
                    <Trash2 size={16} />
                    Limpar
                  </button>

                  <button
                    type="submit"
                    disabled={enviando}
                    className={`inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-7 text-xs font-black text-white shadow-lg transition sm:h-12 sm:w-auto 2xl:h-14 2xl:text-sm ${
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

            <aside className="grid gap-4 border-t border-gray-100 bg-[#f5faf9] p-5 sm:p-7 md:grid-cols-2 lg:grid-cols-1 lg:content-start lg:gap-0 lg:border-l lg:border-t-0 lg:p-8 2xl:p-10">
              <div className="rounded-[22px] bg-gradient-to-br from-[#115e59] to-[#0f766e] p-5 text-white shadow-xl shadow-[#0f766e]/15 sm:rounded-[26px] sm:p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <FileText size={18} />
                </div>

                <p className="mt-5 text-[9px] font-black uppercase tracking-[0.18em] text-white/45 sm:mt-6 2xl:text-[10px]">
                  Seu protocolo
                </p>

                <p className="mt-2 break-all text-lg font-black tracking-wide sm:text-xl 2xl:text-2xl">
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

              <div className="rounded-[22px] border border-gray-200 bg-white p-4 sm:rounded-[26px] sm:p-5 lg:mt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6fffb] text-[#0f766e]">
                    <Clock3 size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-black text-[#115e59] 2xl:text-sm">
                      Atendimento
                    </p>

                    <p className="mt-0.5 text-[10px] text-gray-400 2xl:text-xs">
                      Acompanhe pelo histórico
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-[#f5faf9] p-3">
                    <p className="text-[8px] font-black uppercase tracking-wider text-gray-400 2xl:text-[9px]">
                      Abertos
                    </p>

                    <p className="mt-1 text-lg font-black text-[#0f766e] 2xl:text-xl">
                      {statusCounts.aberto}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#f5faf9] p-3">
                    <p className="text-[8px] font-black uppercase tracking-wider text-gray-400 2xl:text-[9px]">
                      Finalizados
                    </p>

                    <p className="mt-1 text-lg font-black text-[#0f766e] 2xl:text-xl">
                      {statusCounts.finalizado}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* FAQ + PROTOCOLOS */}
        <section className="mt-6 grid gap-5 sm:mt-8 lg:mt-9 lg:gap-6 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[400px_minmax(0,1fr)]">
          <aside className="rounded-[24px] border border-gray-200/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,118,110,0.06)] sm:rounded-[28px] sm:p-6 lg:rounded-[32px] 2xl:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#e6fffb] text-[#0f766e] sm:h-12 sm:w-12 sm:rounded-[17px]">
                <CircleHelp size={20} />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f766e] 2xl:text-[10px]">
                  Ajuda
                </p>

                <h2 className="text-lg font-black tracking-tight text-[#115e59] sm:text-xl 2xl:text-2xl">
                  Perguntas frequentes
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-2 sm:mt-6">
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
                      className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left sm:py-4"
                    >
                      <span className="text-xs font-black text-gray-700 2xl:text-sm">
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
                        <p className="text-[11px] leading-5 text-gray-500 2xl:text-xs 2xl:leading-6">
                          {item.resposta}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="relative mt-5 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#115e59] to-[#0f766e] p-5 text-white sm:mt-6 sm:rounded-[26px]">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/[0.05]" />

              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <MessageCircle size={18} />
                </div>

                <h3 className="mt-4 text-sm font-black sm:mt-5 2xl:text-base">
                  Ainda precisa de ajuda?
                </h3>

                <p className="mt-1 text-[11px] leading-5 text-white/55 2xl:text-xs">
                  Nossa equipe está pronta para atender você.
                </p>

                <button
                  type="button"
                  onClick={abrirChat}
                  className="mt-5 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white text-[11px] font-black text-[#0f766e] transition hover:bg-[#ecfffc] 2xl:h-12 2xl:text-xs"
                >
                  <MessagesSquare size={15} />
                  Abrir atendimento
                </button>
              </div>
            </div>
          </aside>

          <section className="min-w-0 rounded-[24px] border border-gray-200/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,118,110,0.06)] sm:rounded-[28px] sm:p-7 lg:rounded-[32px] lg:p-8 2xl:p-10">
            <div className="flex flex-col gap-5 border-b border-gray-100 pb-5 sm:pb-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#0f766e] text-white sm:h-12 sm:w-12 sm:rounded-[17px]">
                    <FileText size={19} />
                  </div>

                  <div>
                    <h2 className="text-lg font-black tracking-tight text-[#115e59] sm:text-xl 2xl:text-2xl">
                      Meus protocolos
                    </h2>

                    <p className="text-xs text-gray-400 2xl:text-sm">
                      Acompanhe todas as suas solicitações.
                    </p>
                  </div>
                </div>

                <div className="flex w-fit items-center gap-2 rounded-full border border-[#d5ece8] bg-[#f2fbf9] px-3.5 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0f766e]" />

                  <span className="text-[10px] font-black text-[#115e59] 2xl:text-xs">
                    {protocolos.length} registros
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:gap-4">
                <div className="rounded-2xl border border-gray-100 bg-[#f8fbfa] p-3 sm:p-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-gray-400 2xl:text-[9px]">
                    Total
                  </p>

                  <p className="mt-1 text-lg font-black text-[#115e59] sm:text-xl 2xl:text-2xl">
                    {statusCounts.total}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#cdeee5] bg-[#f0fbf8] p-3 sm:p-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[#0f766e] 2xl:text-[9px]">
                    Abertos
                  </p>

                  <p className="mt-1 text-lg font-black text-[#0f766e] sm:text-xl 2xl:text-2xl">
                    {statusCounts.aberto}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#f4e1b1] bg-[#fffaf0] p-3 sm:p-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[#a66b00] 2xl:text-[9px]">
                    Andamento
                  </p>

                  <p className="mt-1 text-lg font-black text-[#956300] sm:text-xl 2xl:text-2xl">
                    {statusCounts.andamento}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-[#f8fbfa] p-3 sm:p-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-gray-400 2xl:text-[9px]">
                    Finalizados
                  </p>

                  <p className="mt-1 text-lg font-black text-gray-600 sm:text-xl 2xl:text-2xl">
                    {statusCounts.finalizado}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_210px] 2xl:grid-cols-[1fr_260px]">
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
                  placeholder="Pesquisar protocolo ou assunto..."
                  className="h-11 w-full rounded-2xl border border-gray-200 bg-[#f8fbfa] pl-11 pr-4 text-xs outline-none transition focus:border-[#0f766e] focus:bg-white focus:ring-4 focus:ring-[#0f766e]/10 sm:h-12 2xl:h-14 2xl:text-sm"
                />
              </div>

              <select
                value={filtroStatus}
                onChange={(e) =>
                  setFiltroStatus(e.target.value)
                }
                className="h-11 w-full rounded-2xl border border-gray-200 bg-[#f8fbfa] px-4 text-xs text-gray-700 outline-none transition focus:border-[#0f766e] focus:bg-white focus:ring-4 focus:ring-[#0f766e]/10 sm:h-12 2xl:h-14 2xl:text-sm"
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

            <div className="mt-5 overflow-hidden rounded-[18px] border border-gray-100 sm:rounded-[22px]">
              <div className="overflow-x-auto">
                <table className="min-w-[640px] w-full md:min-w-full">
                  <thead className="bg-[#f8fbfa]">
                    <tr className="border-b border-gray-100">
                      <th className="px-3 py-3 text-left text-[8px] font-black uppercase tracking-[0.16em] text-gray-400 sm:px-4 lg:px-5 lg:py-4 2xl:text-[9px]">
                        Protocolo
                      </th>

                      <th className="px-3 py-3 text-left text-[8px] font-black uppercase tracking-[0.16em] text-gray-400 sm:px-4 lg:px-5 lg:py-4 2xl:text-[9px]">
                        Assunto
                      </th>

                      <th className="px-3 py-3 text-left text-[8px] font-black uppercase tracking-[0.16em] text-gray-400 sm:px-4 lg:px-5 lg:py-4 2xl:text-[9px]">
                        Data
                      </th>

                      <th className="px-3 py-3 text-left text-[8px] font-black uppercase tracking-[0.16em] text-gray-400 sm:px-4 lg:px-5 lg:py-4 2xl:text-[9px]">
                        Status
                      </th>

                      <th className="px-3 py-3 text-left text-[8px] font-black uppercase tracking-[0.16em] text-gray-400 sm:px-4 lg:px-5 lg:py-4 2xl:text-[9px]">
                        Ação
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {protocolosFiltrados.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center sm:py-16"
                        >
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf7f5] text-[#0f766e] sm:h-14 sm:w-14">
                            <FileText size={21} />
                          </div>

                          <p className="mt-4 text-xs font-black text-gray-600 2xl:text-sm">
                            Nenhum protocolo encontrado
                          </p>

                          <p className="mt-1 text-[10px] text-gray-400 2xl:text-xs">
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
                            <td className="whitespace-nowrap px-3 py-3 sm:px-4 lg:px-5 lg:py-4">
                              <span className="rounded-lg border border-[#cfe9e5] bg-[#f1f9f7] px-2.5 py-1.5 text-[10px] font-black text-[#0f766e] 2xl:text-xs">
                                {item.codigo || "-"}
                              </span>
                            </td>

                            <td className="max-w-[180px] px-3 py-3 sm:max-w-[240px] sm:px-4 lg:max-w-[300px] lg:px-5 lg:py-4 2xl:max-w-[420px]">
                              <p className="truncate text-[11px] font-bold text-gray-700 2xl:text-sm">
                                {item.assunto || "-"}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-3 py-3 sm:px-4 lg:px-5 lg:py-4">
                              <div className="flex items-center gap-2 text-[10px] text-gray-400 2xl:text-xs">
                                <Clock3 size={13} />

                                {item.criado_em
                                  ? new Date(
                                      item.criado_em
                                    ).toLocaleString(
                                      "pt-BR"
                                    )
                                  : "-"}
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-3 py-3 sm:px-4 lg:px-5 lg:py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black 2xl:text-[10px] ${statusClasses(
                                  item.status
                                )}`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />

                                {item.status ||
                                  "Pendente"}
                              </span>
                            </td>

                            <td className="px-3 py-3 sm:px-4 lg:px-5 lg:py-4">
                              <Link
                                href={`/passageiro/protocolo/${encodeURIComponent(
                                  item.codigo || ""
                                )}`}
                                title="Visualizar protocolo"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-[#0f766e] shadow-sm transition hover:border-[#0f766e] hover:bg-[#0f766e] hover:text-white 2xl:h-10 2xl:w-10"
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

            <div className="mt-5 flex flex-col gap-2 text-[10px] text-gray-400 sm:flex-row sm:items-center sm:justify-between 2xl:text-xs">
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