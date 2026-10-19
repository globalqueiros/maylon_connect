"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  ShieldCheck,
  Star,
  Crown,
} from "lucide-react";
import CardCheckoutModal from "../../components/CardCheckoutModal";

type PlanoTipo = "basico" | "plus" | "premium";

type Plano = {
  id: PlanoTipo;
  nome: string;
  descricao: string;
  preco: string; // preço padrão do plano, usado quando o benefício não tem preço próprio
  icon: typeof Gift;
};

type Usuario = {
  id: string;
  tipo: string;
  user_type?: string;
};

type Beneficio = {
  id: number;
  tipo: string;
  imagem: string;
  titulo: string;
  descricao: string;
  valor: string | number;
  valorPlus?: string | number | null;
  valorPremium?: string | number | null;
  valor_plus?: string | number | null;
  valor_premium?: string | number | null;
  status: boolean;
  status_assinatura?: string;
};

type Alerta = {
  tipo: "success" | "error" | "warning";
  mensagem: string;
};

const PLANOS: Plano[] = [
  {
    id: "basico",
    nome: "Básico",
    descricao: "Seu plano essencial",
    preco: "29,90",
    icon: Gift,
  },
  {
    id: "plus",
    nome: "Plus",
    descricao: "Mais vantagens para você",
    preco: "59,90",
    icon: Star,
  },
  {
    id: "premium",
    nome: "Premium",
    descricao: "Experiência completa",
    preco: "89,90",
    icon: Crown,
  },
];

function normalizarValor(valor: string | number | null | undefined): number | null {
  if (valor === null || valor === undefined || String(valor).trim() === "") {
    return null;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor) && valor >= 0 ? valor : null;
  }

  let texto = valor.trim().replace(/\s/g, "").replace(/^R\$/i, "");

  if (texto.includes(",")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  }

  const numero = Number(texto);

  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

function formatValor(valor: string | number | null | undefined): string {
  const numero = normalizarValor(valor);

  if (numero === null) return "Preço não cadastrado";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
}

/**
 * Se o benefício tem preço próprio para o plano, usa ele.
 * Se não tiver, usa o preço padrão do plano (PLANOS[].preco).
 */
function getValorPlano(
  beneficio: Beneficio,
  plano: PlanoTipo
): number | null {
  const padrao = normalizarValor(PLANOS.find((p) => p.id === plano)?.preco);

  switch (plano) {
    case "basico":
      return normalizarValor(beneficio.valor) ?? padrao;

    case "plus":
      return (
        normalizarValor(beneficio.valor_plus ?? beneficio.valorPlus) ?? padrao
      );

    case "premium":
      return (
        normalizarValor(beneficio.valor_premium ?? beneficio.valorPremium) ??
        padrao
      );

    default:
      return null;
  }
}

function getImagem(imagem?: string): string {
  if (!imagem) return "/bg-login.png";
  if (/^https?:\/\//i.test(imagem)) return imagem;
  return imagem.startsWith("/") ? imagem : `/${imagem}`;
}

function extrairUsuario(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;

  const resposta = data as Record<string, unknown>;
  const candidatos = [
    resposta.user,
    resposta.usuario,
    resposta.data,
    resposta,
  ];

  for (const candidato of candidatos) {
    if (!candidato || typeof candidato !== "object") continue;

    const objeto = candidato as Record<string, unknown>;

    if (
      objeto.id !== undefined ||
      objeto.usuario_id !== undefined ||
      objeto.user_id !== undefined
    ) {
      return objeto;
    }

    const interno = objeto.user ?? objeto.usuario;

    if (interno && typeof interno === "object") {
      const u = interno as Record<string, unknown>;

      if (
        u.id !== undefined ||
        u.usuario_id !== undefined ||
        u.user_id !== undefined
      ) {
        return u;
      }
    }
  }

  return null;
}

function extrairBeneficios(data: unknown): Beneficio[] {
  const resposta = data as {
    beneficios?: Beneficio[];
    data?: Beneficio[] | { beneficios?: Beneficio[] };
  } | null;

  let lista: Beneficio[] = [];

  if (Array.isArray(data)) {
    lista = data as Beneficio[];
  } else if (Array.isArray(resposta?.beneficios)) {
    lista = resposta.beneficios;
  } else if (Array.isArray(resposta?.data)) {
    lista = resposta.data;
  } else if (
    resposta?.data &&
    !Array.isArray(resposta.data) &&
    Array.isArray(resposta.data.beneficios)
  ) {
    lista = resposta.data.beneficios;
  }

  const unicos = new Map<number, Beneficio>();

  for (const item of lista) {
    const id = Number(item.id);

    if (!Number.isFinite(id)) continue;

    if (
      item.tipo &&
      ![
        "passageiro",
        "customer",
        "ambos",
        "assinatura",
      ].includes(String(item.tipo).toLowerCase())
    ) {
      continue;
    }

    unicos.set(id, {
      ...item,
      id,
      valor: item.valor,
    });
  }

  return Array.from(unicos.values());
}

export default function BeneficiosPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingBeneficios, setLoadingBeneficios] = useState(false);

  const [alerta, setAlerta] = useState<Alerta | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [openCartao, setOpenCartao] = useState(false);

  const [beneficioSelecionado, setBeneficioSelecionado] =
    useState<Beneficio | null>(null);

  const beneficioRef = useRef<Beneficio | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [planoSelecionado, setPlanoSelecionado] =
    useState<PlanoTipo>("basico");
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const [pixLoading, setPixLoading] = useState(false);
  const [pixEmv, setPixEmv] = useState("");
  const [pixQr, setPixQr] = useState("");
  const [pixPedido, setPixPedido] = useState("");
  const [pixAuthId, setPixAuthId] = useState("");
  const [pixMessage, setPixMessage] = useState("");
  const [pixError, setPixError] = useState<string | null>(null);

  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [beneficioCancelar, setBeneficioCancelar] =
    useState<Beneficio | null>(null);

  const valorSelecionado = useMemo(() => {
    if (!beneficioSelecionado) return null;

    return getValorPlano(beneficioSelecionado, planoSelecionado);
  }, [beneficioSelecionado, planoSelecionado]);

  const planoAtual = PLANOS.find(
    (p) => p.id === planoSelecionado
  );

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const resetPix = useCallback(() => {
    stopPolling();
    setPixLoading(false);
    setPixEmv("");
    setPixQr("");
    setPixPedido("");
    setPixAuthId("");
    setPixMessage("");
    setPixError(null);
  }, [stopPolling]);

  const carregarUsuario = useCallback(async () => {
    setLoadingUser(true);
    setAlerta(null);

    try {
      let res = await fetch("/api/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        const refresh = await fetch("/api/refresh", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });

        if (refresh.ok) {
          res = await fetch("/api/me", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          });
        }
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Falha na autenticação (HTTP ${res.status}).`
        );
      }

      const user = extrairUsuario(data);

      if (!user) {
        throw new Error(
          "A API /api/me não retornou o ID do usuário. Verifique a resposta da autenticação."
        );
      }

      const id =
        user.id ??
        user.usuario_id ??
        user.user_id;

      if (id === null || id === undefined || String(id).trim() === "") {
        throw new Error("A sessão não contém um identificador de usuário.");
      }

      setUsuario({
        id: String(id),
        tipo: String(user.user_type ?? user.tipo ?? user.perfil ?? ""),
        user_type:
          user.user_type !== undefined
            ? String(user.user_type)
            : undefined,
      });
    } catch (error) {
      console.error("Falha ao carregar usuário:", error);
      setUsuario(null);
      setAlerta({
        tipo: "error",
        mensagem:
          error instanceof Error
            ? error.message
            : "Não foi possível validar sua sessão.",
      });
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const carregarBeneficios = useCallback(async () => {
    if (!usuario) return;

    setLoadingBeneficios(true);

    try {
      const res = await fetch("/api/beneficios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          usuario_id: usuario.id,
          tipo: usuario.tipo,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Erro ao carregar benefícios."
        );
      }

      setBeneficios(extrairBeneficios(data));
    } catch (error) {
      setAlerta({
        tipo: "error",
        mensagem:
          error instanceof Error
            ? error.message
            : "Erro ao carregar benefícios.",
      });
    } finally {
      setLoadingBeneficios(false);
    }
  }, [usuario]);

  useEffect(() => {
    void carregarUsuario();
  }, [carregarUsuario]);

  useEffect(() => {
    if (usuario) void carregarBeneficios();
  }, [usuario, carregarBeneficios]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const abrirModal = (beneficio: Beneficio) => {
    beneficioRef.current = beneficio;
    setBeneficioSelecionado(beneficio);
    setPlanoSelecionado("basico");
    setAceitouTermos(false);
    setAlerta(null);
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);

    if (!pixModalOpen && !openCartao) {
      beneficioRef.current = null;
      setBeneficioSelecionado(null);
    }
  };

  const resolverDadosPagamento = async () => {
    const beneficio = beneficioRef.current ?? beneficioSelecionado;

    if (!beneficio) {
      throw new Error("Selecione um benefício.");
    }

    const valor = getValorPlano(beneficio, planoSelecionado);

    if (valor === null) {
      throw new Error(
        `O preço do plano ${planoSelecionado} não está cadastrado para "${beneficio.titulo}".`
      );
    }

    if (valor <= 0) {
      throw new Error("O preço cadastrado precisa ser maior que zero.");
    }

    return {
      usuario_id: usuario?.id,
      beneficio_id: beneficio.id,
      titulo: beneficio.titulo,
      plano: planoSelecionado,
      valor: valor.toFixed(2),
    };
  };

  const iniciarPolling = useCallback(
    (pedido: string) => {
      stopPolling();

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/btg/pix/status?pedido=${encodeURIComponent(pedido)}`,
            {
              credentials: "include",
              cache: "no-store",
            }
          );

          const data = await res.json().catch(() => ({}));

          if (!res.ok) return;

          if (data.rejected) {
            stopPolling();
            setPixError("A autorização Pix foi recusada.");
            return;
          }

          if (data.paid || data.etapa === "pago") {
            stopPolling();

            const valor =
              data.valor ??
              valorSelecionado?.toFixed(2) ??
              "";

            window.location.href =
              `/passageiro/beneficios/pagamento/sucesso?method=pix` +
              `&pedido=${encodeURIComponent(pedido)}` +
              `&valor=${encodeURIComponent(String(valor))}` +
              `&plano=${encodeURIComponent(planoSelecionado)}`;

            return;
          }

          if (data.emv) setPixEmv(data.emv);
          if (data.qr_image) setPixQr(data.qr_image);
          if (data.message) setPixMessage(data.message);
        } catch (error) {
          console.error("Erro consultando Pix:", error);
        }
      }, 4000);
    },
    [stopPolling, valorSelecionado, planoSelecionado]
  );

  const gerarPixAutorizacao = async () => {
    if (!aceitouTermos) {
      setPixError("Aceite os termos antes de continuar.");
      return;
    }

    setPixLoading(true);
    setPixError(null);

    try {
      const payload = await resolverDadosPagamento();

      const res = await fetch("/api/btg/pix/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Não foi possível gerar o Pix."
        );
      }

      setPixEmv(data.emv || "");
      setPixQr(data.qr_image || "");
      setPixPedido(data.pedido_codigo || "");
      setPixAuthId(data.authorization_id || "");
      setPixMessage(data.message || "");

      if (data.pedido_codigo) iniciarPolling(data.pedido_codigo);
    } catch (error) {
      setPixError(
        error instanceof Error ? error.message : "Erro ao gerar Pix."
      );
    } finally {
      setPixLoading(false);
    }
  };

  const copiarEmv = async () => {
    if (!pixEmv) return;

    try {
      await navigator.clipboard.writeText(pixEmv);
      setAlerta({ tipo: "success", mensagem: "Código Pix copiado." });
    } catch {
      setPixError("Não foi possível copiar o código Pix.");
    }
  };

  const cancelarBeneficio = async (beneficio: Beneficio) => {
    setCancelandoId(beneficio.id);
    setAlerta(null);

    try {
      const res = await fetch("/api/beneficios/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          usuario_id: usuario?.id,
          beneficio_id: beneficio.id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível cancelar.");
      }

      setBeneficioCancelar(null);
      setAlerta({
        tipo: "success",
        mensagem: data.message || "Cancelamento solicitado.",
      });

      await carregarBeneficios();
    } catch (error) {
      setAlerta({
        tipo: "error",
        mensagem:
          error instanceof Error ? error.message : "Erro ao cancelar.",
      });
    } finally {
      setCancelandoId(null);
    }
  };

  const ativos = beneficios.filter((b) => !b.status);
  const disponiveis = beneficios.filter((b) => b.status);

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-teal-600" size={36} />
      </div>
    );
  }

  if (!usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl">
          <AlertTriangle className="mx-auto text-red-500" size={34} />
          <h1 className="mt-4 text-xl font-extrabold">
            Não foi possível abrir Benefícios
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            {alerta?.mensagem || "Não foi possível validar sua sessão."}
          </p>
          <button
            type="button"
            onClick={() => void carregarUsuario()}
            className="mt-5 w-full rounded-xl bg-teal-700 px-4 py-3 font-bold text-white hover:bg-teal-800"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="mt-4 block text-sm font-semibold text-teal-700"
          >
            Voltar ao login
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen mb-3">
      <div className="mx-auto max-w-8xl space-y-6">
        {alerta && (
          <div
            role="status"
            className={`flex items-center gap-3 rounded-2xl border p-4 text-sm ${
              alerta.tipo === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : alerta.tipo === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {alerta.tipo === "success" ? (
              <CheckCircle size={19} />
            ) : (
              <AlertTriangle size={19} />
            )}
            <span className="flex-1">{alerta.mensagem}</span>
            <button
              type="button"
              onClick={() => setAlerta(null)}
              aria-label="Fechar aviso"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <header className="rounded-3xl bg-gradient-to-r from-teal-800 via-teal-700 to-teal-500 p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-center gap-4">
            <span className="rounded-2xl bg-white/15 p-3">
              <Gift size={30} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-100">
                Maylon · Vantagens
              </p>
              <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
                Meus benefícios
              </h1>
              <p className="mt-2 text-sm text-white/80">
                Gerencie suas assinaturas e escolha seu plano.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold">Benefícios ativos</h2>
              <p className="mt-1 text-sm text-slate-500">
                Serviços vinculados à sua conta.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {ativos.length} ativo(s)
            </span>
          </div>

          {loadingBeneficios ? (
            <Loader2 className="mx-auto mt-8 animate-spin text-teal-600" />
          ) : ativos.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              Nenhum benefício ativo no momento.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ativos.map((b) => (
                <article
                  key={b.id}
                  className="rounded-2xl border border-teal-100 p-5"
                >
                  <h3 className="font-bold">{b.titulo}</h3>
                  <p className="mt-2 text-xl font-extrabold text-teal-700">
                    {formatValor(b.valor)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setBeneficioCancelar(b)}
                    disabled={cancelandoId === b.id}
                    className="mt-4 w-full rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 disabled:opacity-50"
                  >
                    {cancelandoId === b.id
                      ? "Cancelando..."
                      : "Cancelar benefício"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold">
                Benefícios disponíveis
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Selecione um benefício para conhecer os planos.
              </p>
            </div>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
              {disponiveis.length} disponível(is)
            </span>
          </div>

          {loadingBeneficios ? (
            <Loader2 className="mx-auto mt-8 animate-spin text-teal-600" />
          ) : disponiveis.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              Nenhum benefício disponível no momento.
            </p>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {disponiveis.map((b) => (
                <article
                  key={b.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-teal-300 hover:shadow-lg"
                >
                  <div className="relative h-44">
                    <Image
                      src={getImagem(b.imagem)}
                      alt={b.titulo}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-extrabold">{b.titulo}</h3>
                    <p className="mt-2 line-clamp-3 min-h-16 text-sm leading-6 text-slate-500">
                      {b.descricao}
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {PLANOS.map((p) => {
                        const valor = getValorPlano(b, p.id);

                        return (
                          <div
                            key={p.id}
                            className="rounded-xl bg-teal-50 p-2 text-center"
                          >
                            <p className="text-xs font-bold text-teal-800">
                              {p.nome}
                            </p>
                            <p className="mt-1 text-xs font-extrabold text-teal-700">
                              {formatValor(valor)}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => abrirModal(b)}
                      className="mt-4 cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 p-3 font-bold text-white hover:bg-teal-800"
                    >
                      Conhecer planos <ChevronRight size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {beneficioCancelar && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <AlertTriangle className="text-red-500" size={30} />
            <h2 className="mt-4 text-xl font-extrabold">
              Cancelar benefício?
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Confirma o cancelamento de {beneficioCancelar.titulo}?
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBeneficioCancelar(null)}
                className="rounded-xl border border-slate-200 p-3 text-sm font-bold"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => void cancelarBeneficio(beneficioCancelar)}
                disabled={cancelandoId !== null}
                className="rounded-xl bg-red-600 p-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {cancelandoId !== null ? "Aguarde..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && beneficioSelecionado && (
        <div
          className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-5"
          onClick={fecharModal}
        >
          <div className="flex min-h-full items-center justify-center py-4">
            <section
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
                    Benefício Maylon
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold">
                    {beneficioSelecionado.titulo}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {beneficioSelecionado.descricao}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fecharModal}
                  aria-label="Fechar"
                >
                  <X size={21} />
                </button>
              </div>

              <h3 className="mt-6 font-bold">Escolha seu plano</h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {PLANOS.map((p) => {
                  const Icone = p.icon;
                  const escolhido = planoSelecionado === p.id;
                  const valor = getValorPlano(beneficioSelecionado, p.id);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={escolhido}
                      onClick={() => setPlanoSelecionado(p.id)}
                      className={`rounded-2xl border p-4 text-left ${
                        escolhido
                          ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/20"
                          : "border-slate-200 hover:border-teal-300"
                      }`}
                    >
                      <Icone className="text-teal-700" size={23} />
                      <p className="mt-3 font-extrabold">{p.nome}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {p.descricao}
                      </p>
                      <p className="mt-3 text-xl font-extrabold text-teal-700">
                        {formatValor(valor)}
                      </p>
                      <p className="text-xs text-slate-400">por mês</p>

                      {escolhido && (
                        <p className="mt-2 text-xs font-bold text-teal-700">
                          Selecionado
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-teal-50 p-4">
                <div>
                  <p className="text-xs text-teal-800">Total mensal</p>
                  <p className="mt-1 text-2xl font-extrabold text-teal-800">
                    {formatValor(valorSelecionado)}
                  </p>
                </div>
                <ShieldCheck className="text-teal-700" size={28} />
              </div>

              <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-xs leading-5 text-slate-600">
                <input
                  type="checkbox"
                  checked={aceitouTermos}
                  onChange={(e) => setAceitouTermos(e.target.checked)}
                  className="mt-1 accent-teal-700"
                />
                Li e concordo com os termos de uso, a política de privacidade
                e as condições de cobrança recorrente e cancelamento.
              </label>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={valorSelecionado === null || valorSelecionado <= 0}
                  onClick={() => {
                    if (!aceitouTermos) {
                      setAlerta({
                        tipo: "warning",
                        mensagem: "Aceite os termos antes de continuar.",
                      });
                      return;
                    }

                    if (valorSelecionado === null || valorSelecionado <= 0) {
                      setAlerta({
                        tipo: "error",
                        mensagem: "Cadastre um preço válido para este plano.",
                      });
                      return;
                    }

                    setAlerta(null);
                    setModalOpen(false);
                    resetPix();
                    setPixModalOpen(true);
                  }}
                  className="flex items-center cursor-pointer justify-center gap-2 rounded-xl bg-teal-700 p-3 font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap size={18} /> Pix Automático
                </button>

                <button
                  type="button"
                  disabled={valorSelecionado === null || valorSelecionado <= 0}
                  onClick={() => {
                    if (!aceitouTermos) {
                      setAlerta({
                        tipo: "warning",
                        mensagem: "Aceite os termos antes de continuar.",
                      });
                      return;
                    }

                    if (valorSelecionado === null || valorSelecionado <= 0) {
                      setAlerta({
                        tipo: "error",
                        mensagem: "Cadastre um preço válido para este plano.",
                      });
                      return;
                    }

                    setAlerta(null);
                    setModalOpen(false);
                    setOpenCartao(true);
                  }}
                  className="flex items-center cursor-pointer justify-center gap-2 rounded-xl border border-slate-200 p-3 font-bold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CreditCard size={18} /> Cartão de crédito
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {usuario && beneficioSelecionado && (
        <CardCheckoutModal
          open={openCartao}
          onClose={() => {
            setOpenCartao(false);
            setModalOpen(true);
          }}
          usuarioId={usuario.id}
          beneficioId={beneficioSelecionado.id}
          titulo={`${beneficioSelecionado.titulo} - ${planoAtual?.nome ?? planoSelecionado}`}
          valor={valorSelecionado?.toFixed(2) ?? ""}
        />
      )}

      {pixModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-5">
          <section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <header className="flex items-center justify-between bg-gradient-to-r from-teal-700 to-teal-500 p-5 text-white">
              <div>
                <p className="text-xs text-white/70">Maylon · Pagamento</p>
                <h2 className="mt-1 text-xl font-extrabold">
                  Pix Automático
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetPix();
                  setPixModalOpen(false);
                  setModalOpen(true);
                }}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </header>

            <div className="space-y-4 p-5">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  {beneficioSelecionado?.titulo} · {planoAtual?.nome}
                </p>
                <p className="mt-1 text-xl font-extrabold text-teal-700">
                  {formatValor(valorSelecionado)}/mês
                </p>
              </div>

              {pixMessage && (
                <p className="text-sm text-teal-700">{pixMessage}</p>
              )}

              {pixQr && (
                <div className="flex justify-center">
                  <img
                    src={pixQr}
                    alt="QR Code Pix"
                    className="h-48 w-48 object-contain"
                  />
                </div>
              )}

              {pixEmv && (
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-600">
                    Código Pix Copia e Cola
                  </p>
                  <div className="break-all rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    {pixEmv}
                  </div>
                  <button
                    type="button"
                    onClick={() => void copiarEmv()}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold"
                  >
                    <Copy size={16} /> Copiar código
                  </button>
                </div>
              )}

              {pixPedido && (
                <p className="text-center text-xs text-slate-400">
                  Pedido {pixPedido}
                  {pixAuthId ? ` · Autorização ${pixAuthId}` : ""}
                </p>
              )}

              {pixError && (
                <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {pixError}
                </p>
              )}

              {!pixEmv && (
                <button
                  type="button"
                  onClick={() => void gerarPixAutorizacao()}
                  disabled={pixLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 p-3 font-bold text-white disabled:opacity-50"
                >
                  {pixLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Zap size={18} />
                  )}
                  {pixLoading ? "Gerando Pix..." : "Gerar autorização Pix"}
                </button>
              )}

              {pixEmv && (
                <p className="text-center text-xs text-amber-700">
                  Aguardando confirmação do banco. O status é consultado
                  automaticamente quando existe um pedido.
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  resetPix();
                  setPixModalOpen(false);
                  setModalOpen(true);
                }}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold text-slate-600"
              >
                Voltar
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}