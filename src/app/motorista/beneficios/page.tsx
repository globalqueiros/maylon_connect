"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle,
  Gift,
  Copy,
  Loader2,
  CreditCard,
  Zap,
  ChevronRight,
  X,
} from "lucide-react";
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

function dedupeBeneficios(lista: Beneficio[]): Beneficio[] {
  const map = new Map<number, Beneficio>();

  for (const item of lista) {
    const id = Number(item.id);

    if (!Number.isFinite(id)) continue;

    const next = {
      ...item,
      id,
    };

    const prev = map.get(id);

    if (!prev) {
      map.set(id, next);
      continue;
    }

    if (!next.status && prev.status) {
      map.set(id, next);
    }
  }

  return Array.from(map.values());
}

function formatValor(valor?: string | number | null) {
  if (valor === null || valor === undefined || valor === "") {
    return "R$ 0,00";
  }

  let numero: number;

  if (typeof valor === "number") {
    numero = valor;
  } else {
    const texto = String(valor).trim();

    if (texto.includes(",")) {
      numero = Number(
        texto.replace(/\./g, "").replace(",", ".")
      );
    } else {
      numero = Number(texto);
    }
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0);
}

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
  const [loadingBeneficios, setLoadingBeneficios] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [beneficioSelecionado, setBeneficioSelecionado] =
    useState<Beneficio | null>(null);

  const beneficioRef = useRef<Beneficio | null>(null);

  const [pixLoading, setPixLoading] = useState(false);

  const [pixEtapa, setPixEtapa] =
    useState<PixEtapa>("autorizacao");

  const [pixEmv, setPixEmv] = useState("");
  const [pixQr, setPixQr] = useState("");
  const [pixPedido, setPixPedido] = useState("");
  const [pixAuthId, setPixAuthId] = useState("");
  const [pixMessage, setPixMessage] = useState("");
  const [pixError, setPixError] = useState<string | null>(null);

  const [cancelandoId, setCancelandoId] =
    useState<number | null>(null);

  const [beneficioCancelar, setBeneficioCancelar] =
    useState<Beneficio | null>(null);

  const pollRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const carregarUsuario = async () => {
    setLoadingUser(true);

    try {
      let res = await fetch("/api/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

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
        const err = await res.json().catch(() => ({}));

        console.error("Erro /api/me:", res.status, err);

        setUsuario(null);

        setAlerta({
          tipo: "error",
          mensagem:
            err?.message ||
            "Não foi possível carregar sua sessão. Tente novamente.",
        });

        return;
      }

      const data = await res.json();

      if (!data?.id) {
        setUsuario(null);

        setAlerta({
          tipo: "error",
          mensagem: "Sessão inválida. Faça login novamente.",
        });

        return;
      }

      const userType = String(
        data.user_type || data.tipo || ""
      )
        .trim()
        .toLowerCase();

      if (
        userType === "driver" ||
        userType === "motorista"
      ) {
        window.location.href = "/motorista";
        return;
      }

      if (
        userType !== "customer" &&
        userType !== "passageiro" &&
        userType !== "passenger"
      ) {
        setUsuario(null);

        setAlerta({
          tipo: "error",
          mensagem: "Tipo de usuário não configurado.",
        });

        return;
      }

      setAlerta(null);

      setUsuario({
        id: Number(data.id),
        tipo: userType,
        user_type: data.user_type,
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);

      setUsuario(null);

      setAlerta({
        tipo: "error",
        mensagem: "Erro de conexão ao carregar benefícios.",
      });
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    void carregarUsuario();
  }, []);

  useEffect(() => {
    if (!usuario) return;

    if (
      usuario.tipo !== "customer" &&
      usuario.tipo !== "passageiro" &&
      usuario.tipo !== "passenger"
    ) {
      return;
    }

    const carregarBeneficios = async () => {
      setLoadingBeneficios(true);

      try {
        const res = await fetch("/api/beneficios", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            usuario_id: usuario.id,
            tipo: usuario.tipo,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.error ||
            "Não foi possível carregar os benefícios."
          );
        }

        let lista: Beneficio[] = [];

        if (Array.isArray(data)) {
          lista = data;
        } else if (Array.isArray(data.beneficios)) {
          lista = data.beneficios;
        } else if (Array.isArray(data.data)) {
          lista = data.data;
        }

        setBeneficios(
          dedupeBeneficios(
            lista.filter(
              (b) =>
                b.tipo === "passageiro" ||
                b.tipo === "customer" ||
                b.tipo === "ambos" ||
                b.tipo === "assinatura" ||
                !b.tipo
            )
          )
        );
      } catch (error) {
        console.error(
          "Erro ao carregar benefícios:",
          error
        );

        setAlerta({
          tipo: "error",
          mensagem:
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os benefícios.",
        });
      } finally {
        setLoadingBeneficios(false);
      }
    };

    void carregarBeneficios();
  }, [usuario]);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
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
          `/api/btg/pix/status?pedido=${encodeURIComponent(
            pedido
          )}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!res.ok) return;

        if (data.rejected) {
          stopPolling();

          window.location.href =
            `/passageiro/beneficios/pagamento/recusado?method=pix&pedido=${encodeURIComponent(
              pedido
            )}&reason=pix_rejected&valor=${encodeURIComponent(
              String(
                beneficioSelecionado?.valor || ""
              )
            )}`;

          return;
        }

        if (data.etapa === "pagamento") {
          setPixEtapa("pagamento");
          setPixEmv(data.emv || "");
          setPixQr(data.qr_image || "");
          setPixMessage(data.message || "");
        }

        if (
          data.paid ||
          data.etapa === "pago"
        ) {
          stopPolling();

          setPixEtapa("pago");

          const valor =
            data.valor ||
            beneficioSelecionado?.valor ||
            "";

          window.location.href =
            `/passageiro/beneficios/pagamento/sucesso?method=pix&pedido=${encodeURIComponent(
              pedido
            )}&valor=${encodeURIComponent(
              String(valor)
            )}`;
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
    setOpenCartao(false);
    resetPixState();
    setPixModalOpen(true);
  };

  const abrirCartaoModal = () => {
    setModalOpen(false);
    setPixModalOpen(false);
    resetPixState();
    setOpenCartao(true);
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
    const selected =
      beneficioRef.current ||
      beneficioSelecionado;

    const meRes = await fetch("/api/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!meRes.ok) {
      throw new Error(
        "Sessão expirada. Faça login novamente."
      );
    }

    const me = await meRes.json();

    const usuarioId = Number(me?.id);
    const beneficioId = Number(selected?.id);

    if (
      !Number.isFinite(usuarioId) ||
      usuarioId <= 0
    ) {
      throw new Error(
        "Usuário inválido. Faça login novamente."
      );
    }

    if (
      !Number.isFinite(beneficioId) ||
      beneficioId <= 0
    ) {
      throw new Error(
        "Benefício inválido. Recarregue a página."
      );
    }

    setUsuario((prev) =>
      prev
        ? {
            ...prev,
            id: usuarioId,
            tipo: me.user_type || prev.tipo,
            user_type: me.user_type,
          }
        : {
            id: usuarioId,
            tipo: me.user_type || me.tipo || "",
            user_type: me.user_type,
          }
    );

    return {
      usuarioId,
      beneficioId,
      titulo: String(
        selected?.titulo || ""
      ),
      valor: String(
        selected?.valor ?? ""
      ).replace(",", "."),
    };
  };

  const gerarPixAutorizacao = async () => {
    const selected =
      beneficioRef.current ||
      beneficioSelecionado;

    if (!selected?.id) {
      setPixError(
        "Benefício não selecionado. Feche e abra novamente."
      );
      return;
    }

    setPixLoading(true);
    setPixError(null);

    try {
      const {
        usuarioId,
        beneficioId,
        titulo,
        valor,
      } = await resolvePaymentIds();

      const payload = {
        usuario_id: usuarioId,
        beneficio_id: beneficioId,
        titulo,
        valor,
      };

      const res = await fetch(
        `/api/btg/pix/authorize?usuario_id=${usuarioId}&beneficio_id=${beneficioId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        let message =
          data.error ||
          "Erro ao gerar autorização Pix";

        if (
          data?.details?.beneficio_id == null ||
          data?.details?.usuario_id == null
        ) {
          message +=
            " (usuário/benefício não identificados — faça login novamente)";
        }

        if (
          String(message).includes("CPF/CNPJ")
        ) {
          message +=
            " Vá em Perfil e salve seu CPF antes de tentar novamente.";
        }

        if (
          String(message).includes("Configuração BTG")
        ) {
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

      if (data.pedido_codigo) {
        startPolling(data.pedido_codigo);
      }
    } catch (error: any) {
      setPixError(
        error?.message ||
        "Erro ao gerar Pix"
      );
    } finally {
      setPixLoading(false);
    }
  };

  const copiarEmv = async () => {
    if (!pixEmv) return;

    try {
      await navigator.clipboard.writeText(
        pixEmv
      );

      setAlerta({
        tipo: "success",
        mensagem: "Código Pix copiado!",
      });

      setTimeout(() => {
        setAlerta(null);
      }, 3000);
    } catch {
      setAlerta({
        tipo: "error",
        mensagem:
          "Não foi possível copiar o código Pix.",
      });
    }
  };

  const cancelarComReembolso = async (
    beneficio: Beneficio
  ) => {
    if (!usuario?.id) return;

    setCancelandoId(beneficio.id);
    setAlerta(null);

    try {
      const res = await fetch(
        "/api/beneficios/cancelar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            usuario_id: usuario.id,
            beneficio_id: beneficio.id,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
          "Falha ao cancelar o serviço"
        );
      }

      setBeneficioCancelar(null);
      setOpenCartao(false);
      setPixModalOpen(false);

      resetPixState();

      setModalOpen(false);

      beneficioRef.current = null;
      setBeneficioSelecionado(null);

      setAlerta({
        tipo: "success",
        mensagem:
          data.message ||
          "Serviço cancelado. Reembolso em andamento.",
      });

      const reload = await fetch(
        "/api/beneficios",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            usuario_id: usuario.id,
            tipo: usuario.tipo,
          }),
        }
      );

      const listaData = await reload.json();

      let lista: Beneficio[] = [];

      if (Array.isArray(listaData)) {
        lista = listaData;
      } else if (
        Array.isArray(listaData.beneficios)
      ) {
        lista = listaData.beneficios;
      } else if (
        Array.isArray(listaData.data)
      ) {
        lista = listaData.data;
      }

      setBeneficios(
        dedupeBeneficios(
          lista.filter(
            (b: Beneficio) =>
              b.tipo === "passageiro" ||
              b.tipo === "customer" ||
              b.tipo === "ambos" ||
              b.tipo === "assinatura" ||
              !b.tipo
          )
        )
      );
    } catch (error: any) {
      setAlerta({
        tipo: "error",
        mensagem:
          error?.message ||
          "Erro ao cancelar serviço",
      });
    } finally {
      setCancelandoId(null);
    }
  };

  const ativos = beneficios.filter(
    (b) => !b.status
  );

  const disponiveis = beneficios.filter(
    (b) => b.status
  );

  const getImageSrc = (img?: string) => {
    if (!img) return "/bg-login.png";

    if (
      img.startsWith("http://") ||
      img.startsWith("https://")
    ) {
      return img;
    }

    return img.startsWith("/")
      ? img
      : `/${img}`;
  };

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent px-4">
        <div className="flex w-full max-w-[340px] flex-col items-center rounded-[28px] bg-white p-10 text-center shadow-xl ring-1 ring-black/5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
            <Loader2
              size={32}
              strokeWidth={2.5}
              className="animate-spin text-teal-600"
            />
          </div>

          <p className="mt-5 text-sm font-bold text-teal-700">
            Carregando sua página
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Aguarde um momento...
          </p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl ring-1 ring-black/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertTriangle
              className="text-red-500"
              size={26}
            />
          </div>

          <h2 className="mt-4 text-lg font-bold text-teal-700">
            Não foi possível abrir Benefícios
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {alerta?.mensagem ||
              "Sua sessão pode ter expirado. Tente novamente."}
          </p>

          <button
            type="button"
            onClick={() =>
              void carregarUsuario()
            }
            className="mt-5 w-full cursor-pointer rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            Tentar novamente
          </button>

          <a
            href="/"
            className="mt-3 block text-xs font-medium text-teal-600 hover:underline"
          >
            Fazer login novamente
          </a>

          <a
            href="/passageiro"
            className="mt-2 block text-xs font-medium text-teal-600 hover:underline"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-8xl">
        {alerta && (
          <div
            className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm ${
              alerta.tipo === "success"
                ? "border-teal-200 bg-teal-50 text-teal-700"
                : alerta.tipo === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {alerta.tipo === "success" ? (
              <CheckCircle size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}

            <span>{alerta.mensagem}</span>
          </div>
        )}

        <div className="relative my-3 mt-0 overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-r from-teal-700 via-teal-600 to-teal-500 px-5 py-6 shadow-2xl shadow-teal-950/30 sm:px-7 lg:px-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-teal-200/10 blur-3xl" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-[#0f766e]/15">
              <Gift
                size={28}
                strokeWidth={2}
                className="text-white"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Benefícios
              </h1>

              <p className="mt-0 text-sm text-white/70">
                Gerencie seus benefícios e aproveite vantagens exclusivas.
              </p>
            </div>
          </div>
        </div>

        <section className="mb-6 overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-xl shadow-teal-950/10">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                <CheckCircle
                  size={20}
                  className="text-teal-600"
                />
              </div>

              <div>
                <h2 className="text-lg font-bold text-teal-700">
                  Benefícios Ativos
                </h2>

                <p className="text-xs text-slate-500">
                  Serviços atualmente contratados.
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-600">
              {ativos.length} ativo(s)
            </span>
          </div>

          <div className="p-5 sm:p-6">
            {loadingBeneficios ? (
              <div className="flex min-h-[160px] items-center justify-center">
                <div className="flex flex-col items-center">
                  <Loader2
                    size={28}
                    className="animate-spin text-teal-600"
                  />

                  <p className="mt-3 text-xs font-medium text-gray-500">
                    Carregando benefícios...
                  </p>
                </div>
              </div>
            ) : ativos.length === 0 ? (
              <div className="flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
                <AlertTriangle
                  size={22}
                  className="shrink-0 text-red-500"
                />

                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Nenhum benefício ativo
                  </p>

                  <p className="mt-0.5 text-xs text-red-500">
                    Escolha um dos benefícios disponíveis abaixo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {ativos.map((b) => (
                  <div
                    key={b.id}
                    className="group rounded-[22px] border border-teal-100 bg-gradient-to-br from-white to-teal-50/40 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-900/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                          <CheckCircle
                            size={19}
                            className="text-teal-600"
                          />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-gray-900">
                            {b.titulo}
                          </h3>

                          <p className="mt-0.5 text-xs capitalize text-gray-500">
                            {b.status_assinatura ||
                              "ativo"}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                        Ativo
                      </span>
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Mensalidade
                      </p>

                      <p className="mt-1 text-lg font-extrabold text-teal-600">
                        {formatValor(b.valor)}

                        <span className="ml-1 text-[10px] font-medium text-gray-400">
                          /mês
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={
                        cancelandoId === b.id
                      }
                      onClick={() =>
                        setBeneficioCancelar(b)
                      }
                      className="mt-4 w-full cursor-pointer rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancelandoId === b.id
                        ? "Cancelando..."
                        : "Cancelar benefício"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-xl shadow-teal-950/10">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                <Gift
                  size={20}
                  className="text-teal-600"
                />
              </div>

              <div>
                <h2 className="text-lg font-bold text-teal-700">
                  Benefícios Disponíveis
                </h2>

                <p className="text-xs text-slate-500">
                  Escolha uma vantagem para ativar.
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-600">
              {disponiveis.length} disponível(is)
            </span>
          </div>

          <div className="p-5 sm:p-6">
            {loadingBeneficios ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="flex flex-col items-center">
                  <Loader2
                    size={28}
                    className="animate-spin text-teal-600"
                  />

                  <p className="mt-3 text-xs font-medium text-gray-500">
                    Carregando benefícios...
                  </p>
                </div>
              </div>
            ) : disponiveis.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-8 text-center">
                <Gift
                  size={28}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Nenhum benefício disponível
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Novos benefícios aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {disponiveis.map((b) => (
                  <article
                    key={b.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-600/30 hover:shadow-xl"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={getImageSrc(b.imagem)}
                        alt={b.titulo}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                      <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-600 shadow-sm">
                        Benefício Exclusivo
                      </span>

                      <div className="absolute bottom-4 left-5 right-5">
                        <h3 className="line-clamp-2 text-xl font-bold leading-tight text-white">
                          {b.titulo}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5">
                      <p className="line-clamp-3 min-h-[60px] text-justify text-xs leading-5 text-gray-500">
                        {b.descricao}
                      </p>

                      <div className="mt-5 flex items-end justify-between gap-4 border-t border-gray-100 pt-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Valor mensal
                          </p>

                          <p className="mt-1 text-xl font-extrabold text-teal-600">
                            {formatValor(b.valor)}
                          </p>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
                          <Gift
                            size={17}
                            className="text-teal-600"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          abrirModal(b)
                        }
                        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700 hover:shadow-md"
                      >
                        Ativar benefício

                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {beneficioCancelar && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => {
            if (cancelandoId == null) {
              setBeneficioCancelar(null);
            }
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-gradient-to-br from-teal-800 via-teal-700 to-teal-500 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                  <AlertTriangle size={22} />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (cancelandoId == null) {
                      setBeneficioCancelar(null);
                    }
                  }}
                  className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={19} />
                </button>
              </div>

              <h3 className="mt-4 text-xl font-bold">
                Cancelar benefício?
              </h3>

              <p className="mt-1 text-sm text-white/80">
                Esta ação encerra o serviço e solicita a devolução do valor.
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  Plano
                </p>

                <p className="mt-1 text-sm font-bold text-gray-900">
                  {beneficioCancelar.titulo}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {formatValor(
                    beneficioCancelar.valor
                  )}
                  /mês
                </p>
              </div>

              <p className="text-xs leading-5 text-justify text-gray-500">
                Para pagamentos realizados com cartão, o reembolso é iniciado automaticamente. O valor pode levar alguns dias úteis para aparecer na conta.
              </p>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    cancelandoId ===
                    beneficioCancelar.id
                  }
                  onClick={() =>
                    setBeneficioCancelar(null)
                  }
                  className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  Manter benefício
                </button>

                <button
                  type="button"
                  disabled={
                    cancelandoId ===
                    beneficioCancelar.id
                  }
                  onClick={() =>
                    void cancelarComReembolso(
                      beneficioCancelar
                    )
                  }
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {cancelandoId ===
                  beneficioCancelar.id ? (
                    <>
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                      Cancelando...
                    </>
                  ) : (
                    "Cancelar e devolver"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen &&
        beneficioSelecionado && (
          <div
            className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
            onClick={fecharModal}
          >
            <div className="flex min-h-screen items-center justify-center py-6">
              <div
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
              >
                <div className="relative h-48">
                  <Image
                    src={getImageSrc(
                      beneficioSelecionado.imagem
                    )}
                    alt={
                      beneficioSelecionado.titulo
                    }
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f766e]/90 via-[#0f766e]/40 to-transparent" />

                  <button
                    type="button"
                    onClick={fecharModal}
                    className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition hover:bg-white"
                  >
                    <X size={17} />
                  </button>

                  <div className="absolute bottom-5 left-6 right-6">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                      Benefício Exclusivo
                    </span>

                    <h2 className="mt-2 text-2xl font-bold text-white">
                      {beneficioSelecionado.titulo}
                    </h2>
                  </div>
                </div>

                <div className="p-6">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <h3 className="text-sm font-bold text-gray-900">
                      O que está incluso?
                    </h3>

                    <p className="mt-2 text-justify text-xs leading-5 text-gray-500">
                      {beneficioSelecionado.descricao}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-teal-600/20 bg-teal-50 p-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Assinatura mensal
                      </p>

                      <h3 className="mt-1 text-xl font-extrabold text-teal-600">
                        {formatValor(
                          beneficioSelecionado.valor
                        )}
                      </h3>
                    </div>

                    <Gift
                      size={24}
                      className="text-teal-600"
                    />
                  </div>

                  <div className="my-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <label
                      htmlFor="politica_termo"
                      className="flex cursor-pointer items-start gap-3"
                    >
                      <span className="relative mt-1 shrink-0">
                        <input
                          type="checkbox"
                          name="politica_termo"
                          id="politica_termo"
                          required
                          className="peer sr-only"
                        />

                        <span className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-slate-300 bg-white transition-all duration-200 peer-checked:border-teal-500 peer-checked:bg-teal-500 peer-focus:ring-4 peer-focus:ring-teal-500/20 peer-checked:after:scale-100 after:scale-0 after:font-bold after:text-[13px] after:leading-none after:text-white after:content-['✓'] after:transition-transform after:duration-200" />
                      </span>

                      <span className="text-justify text-xs leading-5 text-slate-600">
                        Declaro que li e concordo com os{" "}
                        <a
                          href="/passageiro/termos-de-uso"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-teal-700 underline"
                        >
                          Termos de Uso
                        </a>
                        ,{" "}
                        <a
                          href="/passageiro/politica-de-privacidade"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-teal-700 underline"
                        >
                          Política de Privacidade
                        </a>{" "}
                        e{" "}
                        <a
                          href="/passageiro/regras-assinatura"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-teal-700 underline"
                        >
                          Regras de Assinatura
                        </a>
                        , Cobrança, Renovação Automática e Cancelamento do{" "}
                        <strong className="font-bold text-teal-700">
                          Maylon Pass
                        </strong>
                        .
                      </span>
                    </label>
                  </div>

                  <h3 className="mt-0 text-sm font-bold text-gray-900">
                    Forma de pagamento
                  </h3>

                  <div className="mt-3 grid gap-3">
                    <button
                      type="button"
                      onClick={abrirPixModal}
                      className="group flex cursor-pointer items-center justify-between rounded-2xl border border-gray-200 p-4 transition hover:border-teal-600 hover:bg-teal-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                          <Zap
                            size={21}
                            className="text-teal-600"
                          />
                        </div>

                        <div className="text-left">
                          <h4 className="text-sm font-bold text-gray-900">
                            PIX
                          </h4>

                          <p className="mt-0.5 text-xs text-gray-500">
                            Autorização + 1ª mensalidade
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-teal-600"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={abrirCartaoModal}
                      className="group flex cursor-pointer items-center justify-between rounded-2xl border border-gray-200 p-4 transition hover:border-teal-600 hover:bg-teal-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                          <CreditCard
                            size={21}
                            className="text-teal-700"
                          />
                        </div>

                        <div className="text-left">
                          <h4 className="text-sm font-bold text-gray-900">
                            Cartão de Crédito
                          </h4>

                          <p className="mt-0.5 text-xs text-gray-500">
                            Cobrança recorrente via Stripe
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-teal-600"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {usuario &&
        beneficioSelecionado && (
          <CardCheckoutModal
            open={openCartao}
            onClose={() => {
              setOpenCartao(false);

              if (beneficioSelecionado) {
                setModalOpen(true);
              }
            }}
            usuarioId={Number(usuario.id)}
            beneficioId={Number(
              beneficioSelecionado.id
            )}
            titulo={beneficioSelecionado.titulo}
            valor={beneficioSelecionado.valor}
          />
        )}

      {pixModalOpen &&
        beneficioSelecionado && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="bg-gradient-to-r from-teal-500 to-teal-700 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                      Pagamento
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      Pagamento via PIX
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={fecharPixModal}
                    className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                  <p className="text-xs font-semibold text-gray-600">
                    {pixEtapa === "autorizacao"
                      ? "1/2 — Autorize o débito mensal automático"
                      : pixEtapa === "pagamento"
                        ? "2/2 — Pague a primeira mensalidade"
                        : "Pagamento confirmado"}
                  </p>
                </div>

                {!pixEmv && (
                  <p className="my-3 text-center text-xs leading-5 text-gray-500">
                    Primeiro geramos um QR Code de autorização do Pix Automático. Depois da aprovação, aparecerá o QR Code da primeira mensalidade.
                  </p>
                )}

                {pixMessage && (
                  <p className="mt-3 text-center text-xs font-medium text-teal-600">
                    {pixMessage}
                  </p>
                )}

                {pixQr && (
                  <div className="my-5 flex justify-center">
                    <img
                      src={pixQr}
                      alt="QR Code Pix"
                      className="h-52 w-52 rounded-2xl border bg-white p-2 shadow-sm"
                    />
                  </div>
                )}

                {pixEmv && (
                  <div className="mb-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Pix Copia e Cola
                    </p>

                    <div className="max-h-24 overflow-y-auto break-all rounded-xl border border-gray-100 bg-gray-50 p-3 text-[10px] leading-4 text-gray-600">
                      {pixEmv}
                    </div>

                    <button
                      type="button"
                      onClick={copiarEmv}
                      className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <Copy size={15} />
                      Copiar código
                    </button>
                  </div>
                )}

                {pixPedido && (
                  <p className="mb-3 text-center text-[10px] text-gray-400">
                    Pedido #{pixPedido}

                    {pixAuthId
                      ? ` · Auth ${pixAuthId.slice(0, 8)}...`
                      : ""}
                  </p>
                )}

                {pixError && (
                  <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                    {pixError}
                  </p>
                )}

                {!pixEmv ? (
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-xs font-bold text-white transition hover:bg-teal-700 disabled:opacity-70"
                    onClick={gerarPixAutorizacao}
                    disabled={pixLoading}
                  >
                    {pixLoading ? (
                      <>
                        <Loader2
                          className="animate-spin"
                          size={17}
                        />
                        Gerando autorização...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        Gerar QR de Autorização
                      </>
                    )}
                  </button>
                ) : (
                  <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-center text-xs font-medium text-amber-800">
                    Aguardando confirmação no app do banco...
                  </div>
                )}

                <button
                  type="button"
                  onClick={fecharPixModal}
                  className="mt-2.5 w-full cursor-pointer rounded-xl border border-gray-200 py-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}