"use client";
import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import Header from "../../components/header";
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

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1">
        <Header toggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="p-6 bg-gray-50 min-h-screen">
          <HuggyChat />
          <div className="bg-white rounded-2xl shadow p-6 mx-auto">
            <h5 className="text-xl mb-1 font-semibold">Nossos canais de atendimento</h5>
            <p className="text-sm mb-3">Suporte disponível 24 horas por dia via chat e WhatsApp no app Maylon. Tempo médio de resposta ágil e eficiente.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="https://wa.me/5511974204958"
                target="_blank"
                className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg bg-teal-500 hover:bg-teal-600 cursor-pointer text-white transition shadow"
              >
              <span className="text-base"><FontAwesomeIcon icon={faWhatsapp} style={{ fontSize: "16px" }} /></span>
                <span className="font-medium">WhatsApp</span>
              </a>
              <a
                href="mailto:atendimento@maylon.com.br"
                className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg bg-teal-500 hover:bg-teal-600 cursor-pointer text-white transition shadow"
              >
                <span className="text-xl"><Mails size={16} /></span>
                <span className="font-medium">Email</span>
              </a>
              <button
                onClick={() => {
                  if (typeof window !== "undefined" && (window as any).Huggy) {
                    (window as any).Huggy.openBox();
                  } else {
                    window.alert("Chat indisponível no momento. Tente novamente mais tarde");
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg bg-teal-500 hover:bg-teal-600 cursor-pointer text-white transition shadow"
              >
                <span className="text-xl"><MessagesSquare size={16} /></span>
                <span className="font-medium">Abrir Chat</span>
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 mt-4 mx-auto">
            <h1 className="text-xl font-bold mb-1">
              Abrir Protocolo
            </h1>
            {alert && (
              <div
                className={`flex items-start gap-3 p-4 rounded-xl mb-4 mt-3 shadow-lg
                animate-fade-in-up
                  ${alert.type === "success"
                    ? "bg-green-100 border border-green-300 text-green-800"
                    : "bg-red-100 border border-red-300 text-red-800"
                  }`}
              >
                <div className="mt-0.5 text-lg">
                  {alert.type === "success" ? "✅" : "❌"}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-semibold">
                    {alert.type === "success" ? "Sucesso!" : "Erro!"}
                  </p>
                  <p className="text-xs">
                    {alert.message}
                    {alert.type === "success" && (
                      <>
                        {" "}Nº do protocolo: <strong>{codigo}</strong>
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="my-3">
                <p className="text-black text-sm mb-0">Nº do Protocolo: <strong>{codigo}</strong></p>
                <small className="text-red-400 text-xs mt-0 font-semibold">Atenção! Anote seu número de protocolo para acompanhamento.</small>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label htmlFor="nome" className="text-sm mb-2">
                    Nome Completo:
                  </label>
                  <input
                    placeholder="Nome completo"
                    type="text"
                    readOnly
                    value={form.nome}
                    onChange={(e) =>
                      setForm({ ...form, nome: e.target.value })
                    }
                    className="w-full p-3 text-sm rounded-xl bg-white text-black placeholder:text-gray-500 border border-teal-400 outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="email" className="text-sm mb-2">
                    Email:
                  </label>
                  <input
                    placeholder="Email"
                    readOnly
                    value={form.email}
                    type="email"
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full p-3 text-sm rounded-xl bg-white text-black placeholder:text-gray-500 border border-teal-400 outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>
              <label htmlFor="assunto" className="text-sm mb-2">
                Assunto:
              </label>
              <input
                placeholder="Assunto"
                value={form.assunto}
                type="text"
                onChange={(e) =>
                  setForm({ ...form, assunto: e.target.value })
                }
                className="w-full p-3 text-sm rounded-xl bg-white text-black placeholder:text-gray-500 border border-teal-400 mt-1 outline-none focus:ring-2 focus:ring-teal-400"

              />
              <label htmlFor="mensagem" className="text-sm mb-2">
                Mensagem:
              </label>
              <textarea
                placeholder="Mensagem"
                value={form.mensagem}
                onChange={(e) =>
                  setForm({ ...form, mensagem: e.target.value })
                }
                className="w-full h-32 resize-none p-3 text-sm rounded-xl bg-white text-black placeholder:text-gray-500 border border-teal-400 mt-1 outline-none focus:ring-2 focus:ring-teal-400"

              />
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 text-sm rounded-xl font-medium transition flex items-center cursor-pointer justify-center gap-2
                    ${loading
                      ? "bg-teal-400 cursor-not-allowed"
                      : "bg-teal-600 hover:bg-teal-500 cursor-pointer"
                    } text-white`}
                >
                  {loading && (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                  {loading ? "Enviando..." : "✔️ Enviar"}
                </button>
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
                  className="px-4 py-2 text-sm rounded-xl font-medium text-white bg-red-500 hover:bg-red-400 cursor-pointer transition"
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
          <div className="flex flex-col md:flex-row gap-6 mt-4">
            <div className="flex-1 bg-white rounded-2xl shadow p-5 mx-auto">
              Lado esquerdo
            </div>
            <div className="flex-1 bg-gray-100 rounded-2xl shadow p-5 mx-auto">
              <h2 className="text-base font-bold mb-4">📄 Protocolos</h2>
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-y border-gray-100">
                    <tr className="text-left text-xs text-gray-500">
                      <th className="px-6 py-3">Nº do Protocolo</th>
                      <th className="px-6 py-3">Assunto</th>
                      <th className="px-6 py-3">Data</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {protocolos?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-white bg-red-500">
                          Nenhum protocolo encontrado
                        </td>
                      </tr>
                    ) : (
                      protocolos.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium text-xs">
                            {item.codigo}
                          </td>
                          <td className="px-6 py-3 text-xs">
                            {item.assunto}
                          </td>
                          <td className="px-6 py-3 text-xs">
                            {new Date(item.criado_em).toLocaleString("pt-BR")}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`px-2 py-1 text-xs rounded-full
                                  ${item.status === "Aberto"
                                  ? "bg-green-100 text-green-700"
                                  : item.status === "Em andamento"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <Link href={`/protocolo/${item.codigo}`}><Eye size={16} /></Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}