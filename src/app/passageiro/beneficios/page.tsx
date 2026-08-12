"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AlertTriangle, CheckCircle, Gift, Copy, Loader2 } from "lucide-react";
import CardCheckoutModal from "../../components/CardCheckoutModal";

type Beneficio = {
  id: number;
  tipo: string;
  imagem: string;
  titulo: string;
  descricao: string;
  valor: string;
  status: boolean;
  status_assinatura?:
    | "aprovado"
    | "pendente"
    | "cancelado"
    | "expirado"
    | "erro"
    | "autorizado";
};

type Usuario = {
  id: number;
  tipo: string;
  user_type?: string;
};

type PixEtapa = "autorizacao" | "pagamento" | "pago";

export default function BeneficiosPage() {
  const [alerta, setAlerta] = useState<{
    tipo: "success" | "error" | "warning";
    mensagem: string;
  } | null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [openCartao, setOpenCartao] = useState(false);
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [beneficioSelecionado, setBeneficioSelecionado] =
    useState<Beneficio | null>(null);
  const beneficioRef = useRef<Beneficio | null>(null);

  const [pixLoading, setPixLoading] = useState(false);
  const [pixEtapa, setPixEtapa] = useState<PixEtapa>("autorizacao");
  const [pixEmv, setPixEmv] = useState("");
  const [pixQr, setPixQr] = useState("");
  const [pixPedido, setPixPedido] = useState("");
  const [pixAuthId, setPixAuthId] = useState("");
  const [pixMessage, setPixMessage] = useState("");
  const [pixError, setPixError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        let res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        // One refresh attempt before giving up (avoids false logouts)
        if (res.status === 401) {
          await fetch("/api/refresh", {
            method: "POST",
            credentials: "include",
            cache: "no-store",
          });
          res = await fetch("/api/me", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          });
        }

        if (res.status === 401) {
          window.location.href = "/";
          return;
        }

        if (!res.ok) {
          console.error("Erro /api/me:", res.status);
          setAlerta({
            tipo: "error",
            mensagem: "Não foi possível carregar sua sessão. Tente novamente.",
          });
          return;
        }

        const data = await res.json();
        if (!data?.id) {
          setAlerta({
            tipo: "error",
            mensagem: "Sessão inválida. Recarregue a página.",
          });
          return;
        }

        setUsuario({
          id: Number(data.id),
          tipo: data.user_type || data.tipo,
          user_type: data.user_type,
        });
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        setAlerta({
          tipo: "error",
          mensagem: "Erro de conexão ao carregar benefícios.",
        });
      } finally {
        setLoadingUser(false);
      }
    };

    carregarUsuario();
  }, []);

  useEffect(() => {
    if (!usuario) return;

    const carregarBeneficios = async () => {
      const res = await fetch("/api/beneficios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          usuario_id: usuario.id,
          tipo: usuario.tipo,
        }),
      });

      const data = await res.json();
      let lista: Beneficio[] = [];
      if (Array.isArray(data)) lista = data;
      else if (Array.isArray(data.beneficios)) lista = data.beneficios;
      else if (Array.isArray(data.data)) lista = data.data;

      setBeneficios(
        lista.filter(
          (b) =>
            b.tipo === "passageiro" ||
            b.tipo === "customer" ||
            b.tipo === "ambos"
        )
      );
    };

    carregarBeneficios();
  }, [usuario]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = (pedido: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/btg/pix/status?pedido=${encodeURIComponent(pedido)}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (!res.ok) return;

        if (data.rejected) {
          stopPolling();
          window.location.href = `/passageiro/beneficios/pagamento/recusado?method=pix&pedido=${encodeURIComponent(pedido)}&reason=pix_rejected&valor=${encodeURIComponent(String(beneficioSelecionado?.valor || ""))}`;
          return;
        }

        if (data.etapa === "pagamento") {
          setPixEtapa("pagamento");
          setPixEmv(data.emv || "");
          setPixQr(data.qr_image || "");
          setPixMessage(data.message || "");
        }

        if (data.paid || data.etapa === "pago") {
          stopPolling();
          setPixEtapa("pago");
          const valor = data.valor || beneficioSelecionado?.valor || "";
          window.location.href = `/passageiro/beneficios/pagamento/sucesso?method=pix&pedido=${encodeURIComponent(pedido)}&valor=${encodeURIComponent(String(valor))}`;
        }
      } catch (error) {
        console.error("Erro polling Pix:", error);
      }
    }, 4000);
  };

  const abrirModal = (beneficio: Beneficio) => {
    const normalized: Beneficio = {
      ...beneficio,
      id: Number(beneficio.id),
      valor: String(beneficio.valor ?? ""),
      titulo: String(beneficio.titulo ?? ""),
    };
    beneficioRef.current = normalized;
    setBeneficioSelecionado(normalized);
    setModalOpen(true);
  };

  const resetPixState = () => {
    stopPolling();
    setPixEtapa("autorizacao");
    setPixEmv("");
    setPixQr("");
    setPixPedido("");
    setPixAuthId("");
    setPixMessage("");
    setPixError(null);
    setPixLoading(false);
  };

  const abrirPixModal = () => {
    setModalOpen(false);
    resetPixState();
    setTimeout(() => setPixModalOpen(true), 200);
  };

  const abrirCartaoModal = () => {
    setModalOpen(false);
    setTimeout(() => setOpenCartao(true), 200);
  };

  const fecharPixModal = () => {
    resetPixState();
    setPixModalOpen(false);
  };

  const fecharModal = () => {
    setModalOpen(false);
    if (!pixModalOpen && !openCartao) {
      beneficioRef.current = null;
      setBeneficioSelecionado(null);
    }
  };

  const resolvePaymentIds = async () => {
    const selected = beneficioRef.current || beneficioSelecionado;
    const meRes = await fetch("/api/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (!meRes.ok) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }
    const me = await meRes.json();
    const usuarioId = Number(me?.id);
    const beneficioId = Number(selected?.id);

    if (!Number.isFinite(usuarioId) || usuarioId <= 0) {
      throw new Error("Usuário inválido. Faça login novamente.");
    }
    if (!Number.isFinite(beneficioId) || beneficioId <= 0) {
      throw new Error("Benefício inválido. Recarregue a página e tente novamente.");
    }

    setUsuario((prev) =>
      prev
        ? { ...prev, id: usuarioId, tipo: me.user_type || prev.tipo, user_type: me.user_type }
        : { id: usuarioId, tipo: me.user_type, user_type: me.user_type }
    );

    return {
      usuarioId,
      beneficioId,
      titulo: String(selected?.titulo || ""),
      valor: String(selected?.valor ?? "").replace(",", "."),
    };
  };

  const gerarPixAutorizacao = async () => {
    const selected = beneficioRef.current || beneficioSelecionado;
    if (!selected?.id) {
      setPixError("Benefício não selecionado. Feche e abra novamente.");
      return;
    }
    setPixLoading(true);
    setPixError(null);

    try {
      const { usuarioId, beneficioId, titulo, valor } = await resolvePaymentIds();

      const payload = {
        usuario_id: usuarioId,
        beneficio_id: beneficioId,
        titulo,
        valor,
      };
      console.log("PIX authorize payload:", payload);

      const res = await fetch(
        `/api/btg/pix/authorize?usuario_id=${usuarioId}&beneficio_id=${beneficioId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        console.error("PIX authorize failed:", data);
        let message = data.error || "Erro ao gerar autorização Pix";
        if (
          data?.details?.beneficio_id == null ||
          data?.details?.usuario_id == null
        ) {
          message +=
            " (usuário/benefício não identificados — faça login novamente)";
        }
        if (String(message).includes("CPF/CNPJ")) {
          message +=
            " Vá em Perfil e salve seu CPF antes de tentar novamente.";
        }
        if (String(message).includes("Configuração BTG")) {
          message +=
            " Peça ao administrador para preencher BTG_ACCOUNT_NUMBER e BTG_PIX_KEY no .env do servidor.";
        }
        throw new Error(message);
      }

      setPixEtapa("autorizacao");
      setPixEmv(data.emv || "");
      setPixQr(data.qr_image || "");
      setPixPedido(data.pedido_codigo || "");
      setPixAuthId(data.authorization_id || "");
      setPixMessage(data.message || "");
      startPolling(data.pedido_codigo);
    } catch (error: any) {
      setPixError(error?.message || "Erro ao gerar Pix");
    } finally {
      setPixLoading(false);
    }
  };

  const copiarEmv = async () => {
    if (!pixEmv) return;
    await navigator.clipboard.writeText(pixEmv);
    setAlerta({
      tipo: "success",
      mensagem: "Código Pix copiado!",
    });
    setTimeout(() => setAlerta(null), 3000);
  };

  const ativos = beneficios.filter((b) => !b.status);
  const disponiveis = beneficios.filter((b) => b.status);

  const getImageSrc = (img?: string) => {
    if (!img) return "/bg-login.png";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    return img.startsWith("/") ? img : `/${img}`;
  };

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-gray-400 p-8 shadow-lg">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="font-medium text-gray-300">
            Aguarde, carregando página...
          </p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow">
          <p className="font-semibold text-gray-900">
            Não foi possível abrir Benefícios
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {alerta?.mensagem ||
              "Sua sessão pode ter expirado. Tente novamente."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 w-full rounded-xl bg-[#009688] py-2 font-semibold text-white"
          >
            Tentar novamente
          </button>
          <a
            href="/passageiro"
            className="mt-3 block text-sm text-teal-700 underline"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {alerta && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
            alerta.tipo === "success"
              ? "bg-emerald-100 text-emerald-800"
              : alerta.tipo === "warning"
                ? "bg-amber-100 text-amber-800"
                : "bg-red-100 text-red-700"
          }`}
        >
          {alerta.mensagem}
        </div>
      )}

      <div className="mb-10">
        <h1 className="text-xl font-bold leading-none text-white">
          Área de Benefícios
        </h1>
        <p className="mt-1 text-sm text-teal-100">
          Gerencie seus benefícios e aproveite nossas vantagens exclusivas.
        </p>
      </div>

      <div className="mb-10">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle className="h-5 w-5 text-emerald-300" />
          </div>
          <h2 className="text-xl font-bold leading-none text-white">
            Benefícios Ativos
          </h2>
        </div>
        {ativos.length === 0 && (
          <div className="flex items-center gap-4 rounded-2xl border border-red-300 bg-white px-6 py-5 shadow">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <span className="font-medium text-red-500">
              Nenhum benefício ativo no momento.
            </span>
          </div>
        )}
        {ativos.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ativos.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-emerald-200 bg-white p-5 shadow"
              >
                <h3 className="font-bold text-gray-900">{b.titulo}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Status: {b.status_assinatura || "ativo"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold leading-none text-white">
            Benefícios Disponíveis
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {disponiveis.map((b) => (
            <div
              key={b.id}
              className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="relative h-60 overflow-hidden">
                <Image
                  src={getImageSrc(b.imagem)}
                  alt={b.titulo}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-1 text-sm font-semibold text-[#009688] backdrop-blur">
                  Benefício Exclusivo
                </span>
                <div className="absolute bottom-5 left-6 right-6">
                  <h3 className="text-2xl font-bold text-white">{b.titulo}</h3>
                </div>
              </div>
              <div className="flex flex-col p-6 pt-4">
                <p className="line-clamp-4 flex-1 text-justify text-sm leading-6 text-gray-600">
                  {b.descricao}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="mb-0 text-xs uppercase tracking-widest text-gray-400">
                      Valor
                    </span>
                    <h4 className="mt-0 text-xl font-extrabold text-[#009688]">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(b.valor))}
                    </h4>
                  </div>
                </div>
                <button
                  onClick={() => abrirModal(b)}
                  className="mt-3 w-full cursor-pointer rounded-2xl bg-[#009688] py-2 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#00796B] hover:shadow-xl"
                >
                  Ativar Benefício
                </button>
              </div>
            </div>
          ))}
        </div>

        {modalOpen && beneficioSelecionado && (
          <div
            className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
            onClick={fecharModal}
          >
            <div className="flex min-h-screen items-center justify-center p-6">
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
              >
                <div className="relative h-52">
                  <Image
                    src={getImageSrc(beneficioSelecionado.imagem)}
                    alt={beneficioSelecionado.titulo}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#003d39] via-[#003d3990] to-transparent" />
                  <button
                    onClick={fecharModal}
                    className="absolute right-4 top-4 h-10 w-10 cursor-pointer rounded-full bg-white/90 text-gray-700 hover:bg-white"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-6 left-6">
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      BENEFÍCIO EXCLUSIVO
                    </span>
                    <h2 className="mt-3 text-3xl font-bold text-white">
                      {beneficioSelecionado.titulo}
                    </h2>
                  </div>
                </div>
                <div className="p-8">
                  <div className="rounded-2xl border bg-gray-50 p-5">
                    <h3 className="font-semibold text-gray-900">
                      O que está incluso?
                    </h3>
                    <p className="mt-2 text-justify text-sm leading-6 text-gray-600">
                      {beneficioSelecionado.descricao}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between rounded-2xl border border-teal-200 bg-teal-50 p-5">
                    <div>
                      <p className="text-xs text-gray-500">Assinatura Mensal</p>
                      <h3 className="text-2xl font-bold text-[#009688]">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(beneficioSelecionado.valor))}
                      </h3>
                    </div>
                  </div>
                  <h3 className="mt-8 text-lg font-bold text-gray-900">
                    Forma de pagamento
                  </h3>
                  <div className="mt-4 grid gap-4">
                    <button
                      onClick={abrirPixModal}
                      disabled={loadingId === beneficioSelecionado.id}
                      className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-gray-200 p-5 transition hover:border-[#009688] hover:bg-teal-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 text-3xl">
                          ⚡
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold">PIX</h4>
                          <p className="text-sm text-gray-500">
                            Autorização + 1ª mensalidade
                          </p>
                        </div>
                      </div>
                      ➜
                    </button>
                    <button
                      onClick={abrirCartaoModal}
                      disabled={loadingId === beneficioSelecionado.id}
                      className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-gray-200 p-5 transition hover:border-[#009688] hover:bg-teal-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-3xl">
                          💳
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold">Cartão de Crédito</h4>
                          <p className="text-sm text-gray-500">
                            Cobrança recorrente via Stripe
                          </p>
                        </div>
                      </div>
                      ➜
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {usuario && beneficioSelecionado && (
          <CardCheckoutModal
            open={openCartao}
            onClose={() => {
              setOpenCartao(false);
              if (beneficioSelecionado) setModalOpen(true);
            }}
            usuarioId={Number(usuario.id)}
            beneficioId={Number(beneficioSelecionado.id)}
            titulo={beneficioSelecionado.titulo}
            valor={beneficioSelecionado.valor}
          />
        )}
      </div>

      {pixModalOpen && beneficioSelecionado && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8">
            <h2 className="text-center text-2xl font-bold">
              Pagamento via PIX
            </h2>
            <p className="mt-2 text-center text-gray-500">
              {pixEtapa === "autorizacao"
                ? "1/2 — Autorize o débito mensal automático"
                : pixEtapa === "pagamento"
                  ? "2/2 — Pague a primeira mensalidade"
                  : "Pagamento confirmado"}
            </p>

            {!pixEmv && (
              <p className="mt-4 text-center text-sm text-gray-600">
                Primeiro geramos um QR Code de autorização do Pix Automático.
                Depois da aprovação, aparece o QR da primeira mensalidade.
              </p>
            )}

            {pixMessage && (
              <p className="mt-3 text-center text-sm text-teal-700">{pixMessage}</p>
            )}

            {pixQr && (
              <div className="my-6 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pixQr}
                  alt="QR Code Pix"
                  className="h-56 w-56 rounded-xl border bg-white p-2"
                />
              </div>
            )}

            {pixEmv && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                  Pix Copia e Cola
                </p>
                <div className="break-all rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                  {pixEmv}
                </div>
                <button
                  onClick={copiarEmv}
                  className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border py-2 text-sm font-medium"
                >
                  <Copy size={16} /> Copiar código
                </button>
              </div>
            )}

            {pixPedido && (
              <p className="mb-3 text-center text-xs text-gray-400">
                Pedido #{pixPedido}
                {pixAuthId ? ` · Auth ${pixAuthId.slice(0, 8)}...` : ""}
              </p>
            )}

            {pixError && (
              <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                {pixError}
              </p>
            )}

            {!pixEmv ? (
              <button
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#009688] py-3 text-white disabled:opacity-70"
                onClick={gerarPixAutorizacao}
                disabled={pixLoading}
              >
                {pixLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Gerando autorização...
                  </>
                ) : (
                  "Gerar QR de Autorização"
                )}
              </button>
            ) : (
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-center text-sm text-amber-800">
                Aguardando confirmação no app do banco...
              </div>
            )}

            <button
              onClick={fecharPixModal}
              className="mt-3 w-full cursor-pointer rounded-xl border py-3"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
