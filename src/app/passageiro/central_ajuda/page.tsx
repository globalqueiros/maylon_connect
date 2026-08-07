"use client";
import { useState, useEffect } from "react";
import HuggyChat from "../../components/huggychat";
import { Eye, Mails, MessagesSquare } from "lucide-react";
import Link from 'next/link';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

export default function DashboardLayout() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    assunto: "",
    mensagem: "",
  });

  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [buscaProtocolo, setBuscaProtocolo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [protocolos, setProtocolos] = useState<any[]>([]);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar");
    if (saved) setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setForm((prev) => ({
          ...prev,
          nome: data.full_name,
          email: data.email,
        }));
      } catch {
        console.error("Erro ao buscar usuário");
      }
    };
    fetchUser();
  }, []);

  function gerarProtocoloPersistente() {
    if (typeof window === "undefined") return "";
    const TEMPO_LIMITE = 90 * 60 * 1000;
    const salvo = localStorage.getItem("protocolo");
    const salvoTempo = localStorage.getItem("protocolo_time");
    const agora = Date.now();
    if (salvo && salvoTempo && agora - Number(salvoTempo) < TEMPO_LIMITE) {
      return salvo;
    }
    const [loading, setLoading] = useState(true);
    const ano = new Date().getFullYear();
    const random = Math.floor(100000000 + Math.random() * 900000000);
    const novo = `MAY - ${random}${ano}`;
    localStorage.setItem("protocolo", novo);
    localStorage.setItem("protocolo_time", String(agora));
    return novo;
  }

  function gerarNovoProtocolo() {
    const ano = new Date().getFullYear();
    const random = Math.floor(100000000 + Math.random() * 900000000);
    const novo = `MAY - ${random}${ano}`;
    localStorage.setItem("protocolo", novo);
    localStorage.setItem("protocolo_time", String(Date.now()));
    return novo;
  }

  useEffect(() => {
    const codigoAtual = gerarProtocoloPersistente();
    setCodigo(codigoAtual);
  }, []);

  useEffect(() => {
    async function carregarDados() {
      try {
        const saved = localStorage.getItem("sidebar");
        if (saved) {
          setCollapsed(saved === "true");
        }
        const res = await fetch("/api/me", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Erro ao buscar usuário");
        }
        const usuario = await res.json();
        setUsuarioId(usuario.id);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "sidebar",
      String(collapsed)
    );
  }, [collapsed]);

  useEffect(() => {
    const interval = setInterval(() => {
      const novo = gerarProtocoloPersistente();
      setCodigo(novo);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);
      setAlert(null);
      const codigoAtual = codigo;
      const res = await fetch("/api/protocolo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          codigo: codigoAtual,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      setAlert({
        type: "success",
        message: "Protocolo criado com sucesso!",
      });
      const novo = gerarNovoProtocolo();
      setCodigo(novo);
      setForm((prev) => ({
        ...prev,
        assunto: "",
        mensagem: "",
      }));
    } catch (error) {
      console.error(error);
      setAlert({
        type: "error",
        message: "Erro ao criar protocolo.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const codigoAtual = gerarProtocoloPersistente();
    setCodigo(codigoAtual);
  }, []);

  useEffect(() => {
    const fetchProtocolos = async () => {
      try {
        const res = await fetch("/api/protocolo");
        if (!res.ok) throw new Error();

        const data = await res.json();
        setProtocolos(data);

      } catch (error) {
        console.error("Erro ao buscar protocolos");
      }
    };

    fetchProtocolos();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#35A78D] border-t-transparent" />
          <p className="mt-4 text-center font-medium text-gray-600">
            Carregando informações...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen">
        <div className="flex-1">
          <HuggyChat />

          <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

            {/* Cabeçalho */}
            <div>
              <h1 className="text-3xl font-bold text-white">
                Central de Ajuda
              </h1>
              <p className="text-white mt-2">
                Abra protocolos, acompanhe solicitações e entre em contato com nossa equipe de atendimento.
              </p>
            </div>

            {/* Canais */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">

              <h2 className="text-xl font-semibold text-gray-800">
                Nossos canais de atendimento
              </h2>

              <p className="text-sm text-gray-500 mt-2 mb-6">
                Nossa equipe está disponível 24 horas por dia para oferecer suporte através
                do WhatsApp, Chat Online e E-mail.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* WhatsApp */}

                <a
                  href="https://wa.me/5511974204958"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
              flex items-center justify-center gap-3
              h-16
              rounded-2xl
              bg-gradient-to-r
              from-green-500
              to-emerald-500
              text-white
              shadow-md
              hover:shadow-xl
              hover:scale-[1.02]
              transition
            "
                >
                  <FontAwesomeIcon icon={faWhatsapp} size="lg" />

                  <span className="font-semibold">
                    WhatsApp
                  </span>

                </a>

                {/* Email */}

                <a
                  href="mailto:atendimento@maylon.com.br"
                  className="
              flex items-center justify-center gap-3
              h-16
              rounded-2xl
              bg-gradient-to-r
              from-cyan-500
              to-teal-500
              text-white
              shadow-md
              hover:shadow-xl
              hover:scale-[1.02]
              transition
            "
                >
                  <Mails size={20} />

                  <span className="font-semibold">
                    E-mail
                  </span>

                </a>

                {/* Chat */}

                <button
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      (window as any).Huggy
                    ) {
                      (window as any).Huggy.openBox();
                    } else {
                      setAlert({
                        type: "error",
                        message:
                          "Chat indisponível no momento. Tente novamente mais tarde."
                      });
                    }
                  }}
                  className="
              flex items-center justify-center gap-3
              h-16
              rounded-2xl
              bg-gradient-to-r
              from-teal-600
              to-cyan-600
              text-white
              shadow-md
              hover:shadow-xl
              hover:scale-[1.02]
              transition
            "
                >
                  <MessagesSquare size={20} />

                  <span className="font-semibold">
                    Abrir Chat
                  </span>

                </button>

              </div>

            </div>

            {/* Card Abrir Protocolo */}

            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">

              <div className="flex items-center justify-between flex-wrap gap-4">

                <div>

                  <h2 className="text-2xl font-bold text-gray-800">
                    Abrir Protocolo
                  </h2>

                  <p className="text-gray-500 text-sm mt-1">
                    Preencha os dados abaixo para abrir uma solicitação.
                  </p>

                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-2xl px-5 py-4">

                  <p className="text-xs text-gray-500 uppercase">
                    Número do protocolo
                  </p>

                  <h2 className="text-xl font-bold text-teal-700">
                    {codigo}
                  </h2>

                  <p className="text-xs text-red-500 mt-1">
                    Guarde este número para acompanhamento.
                  </p>

                </div>

              </div>

              {alert && (
                <div
                  className={`flex items-start gap-3 p-4 rounded-2xl mt-6 mb-6 shadow
            ${alert.type === "success"
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                    }`}
                >
                  <div className="text-xl">
                    {alert.type === "success" ? "✅" : "❌"}
                  </div>

                  <div>
                    <p className="font-semibold">
                      {alert.type === "success" ? "Sucesso!" : "Erro"}
                    </p>

                    <p className="text-sm">
                      {alert.message}

                      {alert.type === "success" && (
                        <>
                          <br />
                          Nº do protocolo:
                          <strong> {codigo}</strong>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nome Completo
                    </label>

                    <input
                      type="text"
                      readOnly
                      value={form.nome}
                      onChange={(e) =>
                        setForm({ ...form, nome: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email
                    </label>

                    <input
                      type="email"
                      readOnly
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <div>

                    <label className="block text-sm font-medium mb-2">
                      Categoria
                    </label>

                    <select
                      className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option>Selecione</option>
                      <option>Cancelamento</option>
                      <option>Reembolso</option>
                      <option>Alteração de viagem</option>
                      <option>Pagamento</option>
                      <option>Bagagem</option>
                      <option>Outros</option>
                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-2">
                      Assunto
                    </label>

                    <input
                      value={form.assunto}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          assunto: e.target.value,
                        })
                      }
                      placeholder="Digite o assunto"
                      className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-teal-500 outline-none"
                    />

                  </div>

                </div>

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Mensagem
                  </label>

                  <textarea
                    value={form.mensagem}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        mensagem: e.target.value,
                      })
                    }
                    rows={6}
                    placeholder="Descreva detalhadamente o problema..."
                    className="w-full rounded-xl border border-gray-300 p-3 resize-none focus:ring-2 focus:ring-teal-500 outline-none"
                  />

                </div>

                <div className="flex justify-end gap-3 pt-2">

                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        nome: "",
                        email: "",
                        assunto: "",
                        mensagem: "",
                      })
                    }
                    className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition"
                  >
                    Limpar
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-8 py-3 rounded-xl text-white font-medium transition
              ${loading
                        ? "bg-teal-400 cursor-not-allowed"
                        : "bg-teal-600 hover:bg-teal-700"
                      }`}
                  >
                    {loading ? "Enviando..." : "Enviar Solicitação"}
                  </button>

                </div>

              </form>

            </div>
            {/* FAQ + Protocolos */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">


              {/* Perguntas Frequentes */}

              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">

                <h2 className="text-lg font-bold text-gray-800 mb-5">
                  ❓ Perguntas Frequentes
                </h2>


                <div className="space-y-3">


                  <button
                    className="
        w-full
        text-left
        p-4
        rounded-xl
        bg-gray-50
        hover:bg-teal-50
        transition
        text-sm
        text-gray-700
        "
                  >
                    Como cancelar uma passagem?
                  </button>


                  <button
                    className="
        w-full
        text-left
        p-4
        rounded-xl
        bg-gray-50
        hover:bg-teal-50
        transition
        text-sm
        text-gray-700
        "
                  >
                    Como solicitar reembolso?
                  </button>


                  <button
                    className="
        w-full
        text-left
        p-4
        rounded-xl
        bg-gray-50
        hover:bg-teal-50
        transition
        text-sm
        text-gray-700
        "
                  >
                    Como alterar minha viagem?
                  </button>


                  <button
                    className="
        w-full
        text-left
        p-4
        rounded-xl
        bg-gray-50
        hover:bg-teal-50
        transition
        text-sm
        text-gray-700
        "
                  >
                    Como acompanhar meu protocolo?
                  </button>


                  <button
                    className="
        w-full
        text-left
        p-4
        rounded-xl
        bg-gray-50
        hover:bg-teal-50
        transition
        text-sm
        text-gray-700
        "
                  >
                    Problemas com pagamento
                  </button>


                </div>


                <div className="mt-6 bg-teal-50 rounded-2xl p-4">

                  <h3 className="font-semibold text-teal-700 text-sm">
                    Precisa de ajuda?
                  </h3>

                  <p className="text-xs text-gray-600 mt-1">
                    Nossa equipe está pronta para atender sua solicitação.
                  </p>


                  <button
                    onClick={() => {
                      if (
                        typeof window !== "undefined" &&
                        (window as any).Huggy
                      ) {
                        (window as any).Huggy.openBox();
                      }
                    }}
                    className="
        mt-3
        w-full
        bg-teal-600
        hover:bg-teal-700
        text-white
        rounded-xl
        py-2
        text-sm
        transition
        "
                  >
                    Falar com atendente
                  </button>

                </div>


              </div>



              {/* Protocolos */}

              <div className="
      lg:col-span-2
      bg-white
      rounded-3xl
      shadow-lg
      border
      border-gray-100
      p-6
  ">


                <div className="flex items-center justify-between mb-5">

                  <h2 className="text-lg font-bold text-gray-800">
                    📄 Meus Protocolos
                  </h2>


                  <span className="
        text-xs
        bg-teal-50
        text-teal-700
        px-3
        py-1
        rounded-full
      ">
                    {protocolos?.length || 0} registros
                  </span>

                </div>



                <div className="
      overflow-x-auto
      rounded-2xl
      border
      border-gray-100
    ">


                  <table className="min-w-full">


                    <thead className="bg-gray-50">

                      <tr className="text-left text-xs text-gray-500">

                        <th className="px-5 py-4">
                          Protocolo
                        </th>

                        <th className="px-5 py-4">
                          Assunto
                        </th>

                        <th className="px-5 py-4">
                          Data
                        </th>

                        <th className="px-5 py-4">
                          Status
                        </th>

                        <th className="px-5 py-4">
                          Ação
                        </th>

                      </tr>

                    </thead>



                    <tbody className="divide-y">


                      {protocolos?.length === 0 ? (

                        <tr>

                          <td
                            colSpan={5}
                            className="
                text-center
                py-8
                text-sm
                text-gray-500
                "
                          >
                            Nenhum protocolo encontrado
                          </td>

                        </tr>


                      ) : (


                        protocolos.map((item, index) => (


                          <tr
                            key={index}
                            className="
                hover:bg-gray-50
                transition
                "
                          >


                            <td className="px-5 py-4 text-xs font-semibold">

                              {item.codigo}

                            </td>



                            <td className="px-5 py-4 text-xs">

                              {item.assunto}

                            </td>



                            <td className="px-5 py-4 text-xs">

                              {new Date(
                                item.criado_em
                              ).toLocaleString("pt-BR")}

                            </td>



                            <td className="px-5 py-4">


                              <span
                                className={`
                    px-3
                    py-1
                    rounded-full
                    text-xs
                    font-medium

                    ${item.status === "Aberto"
                                    ?
                                    "bg-green-100 text-green-700"

                                    :

                                    item.status === "Em andamento"
                                      ?

                                      "bg-yellow-100 text-yellow-700"

                                      :

                                      "bg-gray-100 text-gray-700"
                                  }
                    `}
                              >

                                {item.status}

                              </span>


                            </td>



                            <td className="px-5 py-4">


                              <Link
                                href={`/protocolo/${item.codigo}`}
                                className="
                    inline-flex
                    items-center
                    justify-center
                    w-8
                    h-8
                    rounded-lg
                    bg-teal-50
                    text-teal-600
                    hover:bg-teal-100
                    transition
                    "
                              >

                                <Eye size={16} />

                              </Link>


                            </td>


                          </tr>


                        ))

                      )}


                    </tbody>


                  </table>


                </div>


              </div>


            </div>
            {/* Filtros de protocolos */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">


              {/* Busca */}

              <div>

                <label className="text-xs text-gray-500 mb-2 block">
                  Pesquisar protocolo
                </label>

                <div className="
      flex
      items-center
      gap-2
      border
      rounded-xl
      px-3
      bg-gray-50
    ">

                  <span>
                    🔎
                  </span>

                  <input
                    value={buscaProtocolo}
                    onChange={(e) => setBuscaProtocolo(e.target.value)}
                    placeholder="Digite o número"
                    className="
          w-full
          bg-transparent
          py-3
          outline-none
          text-sm
        "
                  />

                </div>

              </div>



              {/* Status */}

              <div>

                <label className="text-xs text-gray-500 mb-2 block">
                  Filtrar status
                </label>


                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="
      w-full
      rounded-xl
      border
      p-3
      bg-gray-50
      text-sm
      outline-none
      "
                >

                  <option value="Todos">
                    Todos
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



              {/* Anexo */}

              <div>

                <label className="text-xs text-gray-500 mb-2 block">
                  Anexar documento
                </label>


                <label
                  className="
      flex
      items-center
      justify-center
      gap-2
      border
      border-dashed
      border-teal-400
      rounded-xl
      p-3
      cursor-pointer
      bg-teal-50
      hover:bg-teal-100
      transition
      text-sm
      text-teal-700
      "
                >

                  📎

                  {arquivo
                    ? arquivo.name
                    : "Selecionar arquivo"
                  }


                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setArquivo(
                        e.target.files?.[0] || null
                      )
                    }
                  />


                </label>


              </div>


            </div>
          </div>
        </div>
      </div>
    </>
  );
}
