"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type User = {
  id: string;
  full_name: string;
  email: string;
  identification_number?: string | null;
};

type MesRendimento = {
  mes: string;
  valor: number;
};

type DadosInforme = {
  motorista: {
    id: string;
    nome: string;
    identification_number: string | null;
    email: string;
  };
  ano: number;
  anoCalendario: number;
  corridas: number;
  taxas: number;
  totalBruto: number;
  totalLiquido: number;
  mensal: MesRendimento[];
};

export default function Preview() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedYear, setSelectedYear] = useState("");
  const [dadosInforme, setDadosInforme] = useState<DadosInforme | null>(null);
  const [loadingInforme, setLoadingInforme] = useState(false);
  const [erroInforme, setErroInforme] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const formatarMoeda = (valor: number) => {
    return Number(valor || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();

        setUser({
          id: String(data.id || ""),
          full_name:
            data.full_name ||
            data.fullName ||
            data.name ||
            data.nome ||
            "Motorista Maylon",
          email: data.email || "",
          identification_number:
            data.identification_number || null,
        });
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  const formatarCPF = (cpf: string) => {
    const numeros = String(cpf || "").replace(/\D/g, "");

    if (numeros.length !== 11) {
      return cpf || "Não informado";
    }

    return numeros.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1.$2.$3-$4"
    );
  };

  useEffect(() => {
    if (!selectedYear) {
      setDadosInforme(null);
      setErroInforme(null);
      return;
    }

    const carregarInforme = async () => {
      try {
        setLoadingInforme(true);
        setErroInforme(null);
        setDadosInforme(null);

        const res = await fetch(
          `/api/informe-rendimentos?ano=${encodeURIComponent(selectedYear)}`,
          {
            credentials: "include",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const texto = await res.text();

        let data: any = null;

        try {
          data = texto ? JSON.parse(texto) : null;
        } catch {
          console.error("Resposta da API não é JSON:", texto);
          throw new Error("A API retornou uma resposta inválida.");
        }

        if (!res.ok) {
          throw new Error(
            data?.message ||
            data?.error ||
            `Erro HTTP ${res.status}`
          );
        }

        const mensal: MesRendimento[] = Array.isArray(data?.mensal)
          ? data.mensal.map((item: any) => ({
            mes: String(item?.mes || ""),
            valor: Number(item?.valor || 0),
          }))
          : [];

        const informe: DadosInforme = {
          motorista: {
            id: String(
              data?.motorista?.id ||
              user?.id ||
              ""
            ),
            nome:
              data?.motorista?.nome ||
              user?.full_name ||
              "Motorista Maylon",
            identification_number:
              data?.motorista?.identification_number ??
              user?.identification_number ??
              null,
            email:
              data?.motorista?.email ||
              user?.email ||
              "",
          },
          ano: Number(data?.ano || selectedYear),
          anoCalendario: Number(
            data?.anoCalendario ||
            Number(selectedYear) - 1
          ),
          corridas: Number(data?.corridas || 0),
          taxas: Number(data?.taxas || 0),
          totalBruto: Number(data?.totalBruto || 0),
          totalLiquido: Number(data?.totalLiquido || 0),
          mensal,
        };

        setDadosInforme(informe);

        setUser((usuarioAtual) => ({
          id:
            informe.motorista.id ||
            usuarioAtual?.id ||
            "",
          full_name:
            informe.motorista.nome ||
            usuarioAtual?.full_name ||
            "Motorista Maylon",
          email:
            informe.motorista.email ||
            usuarioAtual?.email ||
            "",
          identification_number:
            informe.motorista.identification_number ??
            usuarioAtual?.identification_number ??
            null,
        }));
      } catch (error) {
        console.error("Erro ao carregar informe:", error);
        setDadosInforme(null);
        setErroInforme(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o informe."
        );
      } finally {
        setLoadingInforme(false);
      }
    };

    carregarInforme();
  }, [selectedYear, user?.id]);

  const rendimentosMensais = dadosInforme?.mensal ?? [];
  const corridas = dadosInforme?.corridas ?? 0;
  const taxas = dadosInforme?.taxas ?? 0;
  const totalBruto = dadosInforme?.totalBruto ?? 0;
  const totalLiquido = dadosInforme?.totalLiquido ?? 0;

  const handlePrint = () => {
    if (!selectedYear) {
      alert("Selecione o ano antes de imprimir.");
      return;
    }

    if (!dadosInforme) {
      alert("Aguarde o carregamento dos dados do informe.");
      return;
    }

    const iframe = iframeRef.current;

    if (!iframe) {
      alert("A prévia do informe ainda não foi carregada.");
      return;
    }

    try {
      const iframeWindow = iframe.contentWindow;

      if (!iframeWindow) {
        alert("Não foi possível acessar a prévia para impressão.");
        return;
      }

      iframeWindow.focus();
      iframeWindow.print();
    } catch (error) {
      console.error("Erro ao imprimir informe:", error);
      alert("Não foi possível abrir a impressão do informe.");
    }
  };

  const gerarDocumentoHTML = () => {
    const nomeMotorista =
      dadosInforme?.motorista?.nome ||
      user?.full_name ||
      "Motorista Maylon";

    const identificationNumber =
      dadosInforme?.motorista?.identification_number ||
      user?.identification_number ||
      "Não informado";

    const anoSelecionado =
      Number(selectedYear) || currentYear;

    const anoCalendario =
      dadosInforme?.anoCalendario ||
      anoSelecionado - 1;

    const tabelaMensal = rendimentosMensais
      .map(
        (item) => `
          <tr>
            <td>${item.mes}</td>
            <td class="valor">R$ ${formatarMoeda(item.valor)}</td>
          </tr>
        `
      )
      .join("");

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Informe de Rendimentos — Maylon</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#f8fafc;color:#0f172a;font-family:Arial,Helvetica,sans-serif}
body{padding:32px}
.documento{width:100%;max-width:900px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.08)}
.cabecalho{padding:32px;background:#073f3d;color:#fff}
.titulo{margin:0;font-size:28px;line-height:1.2;font-weight:800}
.subtitulo{margin-top:5px;color:#ccfbf1;font-size:14px;line-height:1.5}
.conteudo{padding:32px}
.aviso{padding:16px 18px;text-align: justify;border:1px solid #fde68a;border-radius:12px;background:#fffbeb;color:#713f12;font-size:12px;line-height:1.6;margin-bottom:28px}
.aviso strong{display:block;margin-bottom:4px;font-size:13px}
.informacoes{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:30px}
.info-card{border:1px solid #e2e8f0;border-radius:12px;padding:16px;background:#fff}
.label{color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.value{color:#0f172a;font-size:14px;font-weight:700}
.secao{margin-top:30px}
.secao-titulo{margin:0 0 14px;font-size:17px;font-weight:800;color:#073f3d}
.tabela{width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}
.tabela th{padding:13px 14px;background:#f1f5f9;color:#475569;font-size:11px;font-weight:800;text-align:left;text-transform:uppercase;letter-spacing:.4px}
.tabela td{padding:13px 14px;border-top:1px solid #e2e8f0;font-size:13px;color:#334155}
.tabela td.valor,.tabela th.valor{text-align:right}
.tabela tr.total td{background:#f0fdfa;color:#073f3d;font-weight:800}
.resumo-final{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}
.resumo-card{padding:18px;border-radius:12px;border:1px solid #ccfbf1;background:#f0fdfa}
.resumo-card.liquido{border-color:#99f6e4;background:#ecfdf5}
.resumo-label{color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;margin-bottom:7px}
.resumo-valor{color:#073f3d;font-size:22px;font-weight:800}
.responsabilidade{margin-top:22px;padding:20px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0}
.responsabilidade h3{margin:0 0 10px;color:#0f172a;font-size:14px}
.responsabilidade p{margin:0;color:#64748b;font-size:12px;line-height:1.7}
@media(max-width:650px){
body{padding:12px}
.cabecalho,.conteudo{padding:22px}
.informacoes,.resumo-final{grid-template-columns:1fr}
.titulo{font-size:22px}
.tabela th,.tabela td{padding:10px}
}
@media print{
@page{size:A4 portrait;margin:7mm}
html,body{width:100%;min-height:0;margin:0!important;padding:0!important;background:#fff!important;color:#0f172a}
body{font-size:9px}
.documento{width:100%;max-width:none;margin:0;padding:0;border:none;border-radius:0;box-shadow:none;overflow:visible}
.cabecalho{padding:14px 18px;border-radius:14px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.titulo{font-size:20px;line-height:1.1}
.subtitulo{margin-top:3px;font-size:10px;line-height:1.2}
.conteudo{padding:12px 18px}
.aviso{display:none!important}
.informacoes{display:grid!important;grid-template-columns:repeat(3,1fr);gap:6px;margin:0 0 10px}
.info-card{padding:7px 9px;border-radius:6px;min-height:42px}
.label{font-size:7px;letter-spacing:.3px;margin-bottom:3px}
.value{font-size:9px;line-height:1.2}
.secao{margin-top:10px!important;margin-bottom:0!important}
.secao-titulo{margin:0 0 5px!important;font-size:11px;line-height:1.2}
.tabela{width:100%;margin:0!important;border-collapse:collapse;page-break-inside:avoid}
.tabela th{padding:5px 7px;font-size:7px;line-height:1.1}
.tabela td{padding:4px 7px;font-size:8px;line-height:1.15}
.tabela tr{height:auto}
.tabela tr.total td{font-weight:800}
.resumo-final{display:grid!important;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}
.resumo-card{padding:8px 10px;border-radius:6px}
.resumo-label{font-size:7px;margin-bottom:3px}
.resumo-valor{font-size:13px;line-height:1.1}
.responsabilidade{display:block!important;margin-top:8px;padding:8px 10px;border-radius:6px}
.responsabilidade h3{margin:0 0 4px;font-size:9px}
.responsabilidade p{font-size:7px;line-height:1.35}
.informacoes,.secao,.tabela,.resumo-final,.responsabilidade{break-inside:avoid;page-break-inside:avoid}
.cabecalho,.tabela th,.tabela tr.total td,.resumo-card{print-color-adjust:exact;-webkit-print-color-adjust:exact}
}
</style>
</head>
<body>
<div class="documento">
<header class="cabecalho">
<h1 class="titulo">Informe de Rendimentos</h1>
<div class="subtitulo">Motorista parceiro</div>
</header>
<main class="conteudo">
<div class="aviso">
<strong>DOCUMENTO FISCAL ONLINE</strong>
Este informe apresenta os rendimentos e demais valores registrados pela Maylon Trip Tecnologia LTDA em nome do motorista parceiro no período correspondente ao ano calendário selecionado. As informações destinam-se à conferência e ao cumprimento das obrigações tributárias, devendo o contribuinte observar a legislação vigente e utilizar os dados e documentos comprobatórios pertinentes à sua declaração.
</div>
<section class="informacoes">
<div class="info-card">
<div class="label">Ano-calendário</div>
<div class="value">${anoCalendario}</div>
</div>
<div class="info-card">
<div class="label">Exercício</div>
<div class="value">${anoSelecionado}</div>
</div>
<div class="info-card">
<div class="label">Nome do Motorista</div>
<div class="value">${nomeMotorista}</div>
</div>
<div class="info-card">
<div class="label">CPF</div>
<div class="value">${formatarCPF(identificationNumber)}</div>
</div>
<div class="info-card">
<div class="label">Empresa</div>
<div class="value">Maylon Trip Tecnologia LTDA</div>
</div>
<div class="info-card">
<div class="label">Categoria</div>
<div class="value">Motorista parceiro</div>
</div>
</section>
<section class="secao">
<h2 class="secao-titulo">Resumo de valores recebidos pela plataforma</h2>
<table class="tabela">
<thead>
<tr>
<th>Descrição</th>
<th class="valor">Valor (R$)</th>
</tr>
</thead>
<tbody>
<tr>
<td>Corridas realizadas</td>
<td class="valor">R$ ${formatarMoeda(corridas)}</td>
</tr>
<tr>
<td>Taxas/ajustes</td>
<td class="valor">R$ ${formatarMoeda(taxas)}</td>
</tr>
<tr class="total">
<td>Total bruto informado</td>
<td class="valor">R$ ${formatarMoeda(totalBruto)}</td>
</tr>
<tr class="total">
<td>Total líquido repassado</td>
<td class="valor">R$ ${formatarMoeda(totalLiquido)}</td>
</tr>
</tbody>
</table>
</section>
<section class="secao">
<h2 class="secao-titulo">Resumo mensal</h2>
<table class="tabela">
<thead>
<tr>
<th>Mês</th>
<th class="valor">Rendimentos (R$)</th>
</tr>
</thead>
<tbody>
${tabelaMensal ||
      `<tr><td colspan="2" style="text-align:center;">Nenhum rendimento registrado.</td></tr>`
      }
</tbody>
</table>
</section>
<div class="resumo-final">
<div class="resumo-card">
<div class="resumo-label">Total bruto</div>
<div class="resumo-valor">R$ ${formatarMoeda(totalBruto)}</div>
</div>
<div class="resumo-card liquido">
<div class="resumo-label">Total líquido repassado</div>
<div class="resumo-valor">R$ ${formatarMoeda(totalLiquido)}</div>
</div>
</div>
<section class="responsabilidade">
<h3>Declaração de Responsabilidade</h3>
<p>Os valores apresentados neste informe são baseados nos registros disponíveis no sistema da Maylon para o período selecionado. Antes da impressão e utilização deste documento, o contribuinte deverá conferir os dados e valores informados, observando a legislação tributária vigente, sua situação fiscal específica e os respectivos documentos comprobatórios.</p>
</section>
</main>
</div>
</body>
</html>
`;
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

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-6 w-6 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86l-8.02 14A2 2 0 004 21h16a2 2 0 001.73-3l-8.02-14a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            Acesso não autorizado
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Você precisa estar logado para acessar seu informe de rendimentos.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-8xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Imposto de Renda
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-white/50">
            Consulte e imprima seu informe de rendimentos referente ao ano selecionado.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Configurações
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Selecione o ano para visualizar seu informe de rendimentos.
              </p>
            </div>

            <div>
              <label
                htmlFor="year"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Ano de declaração
              </label>

              <div className="relative">
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                >
                  <option value="" disabled>
                    Selecione o ano
                  </option>
                  <option value={currentYear}>{currentYear}</option>
                  <option value={previousYear}>{previousYear}</option>
                </select>

                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m6 9 6 6 6-6"
                  />
                </svg>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Escolha o exercício referente ao informe que deseja consultar.
              </p>
            </div>

            {selectedYear && (
              <div className="mt-6 rounded-xl bg-teal-50 p-4">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-teal-900">
                      Ano selecionado
                    </p>
                    <p className="mt-0.5 text-xs text-teal-700">
                      Exercício {selectedYear}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </aside>

          <section className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Prévia da declaração
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {selectedYear
                      ? `Visualização referente ao exercício ${selectedYear}`
                      : "Nenhum ano selecionado"}
                  </p>
                </div>

                {selectedYear && (
                  <button
                    type="button"
                    onClick={handlePrint}
                    disabled={loadingInforme || !dadosInforme}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-teal-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingInforme ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5h-2M6 14h12v7H6v-7z"
                        />
                      </svg>
                    )}
                    {loadingInforme ? "Carregando..." : "Imprimir"}
                  </button>
                )}
              </div>

              <div className="w-full bg-white p-0">
                {!selectedYear ? (
                  <div className="flex h-[700px] items-center justify-center">
                    <div className="px-6 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                        <svg
                          className="h-7 w-7 text-slate-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7 3h7l4 4v14H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14 3v5h5M9 13h6M9 17h4"
                          />
                        </svg>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-700">
                        Nenhuma declaração selecionada
                      </h3>
                      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                        Selecione um ano no painel ao lado para visualizar o informe de rendimentos.
                      </p>
                    </div>
                  </div>
                ) : loadingInforme ? (
                  <div className="flex h-[700px] items-center justify-center">
                    <div className="flex flex-col items-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
                        <Loader2
                          size={28}
                          strokeWidth={2.5}
                          className="animate-spin text-teal-600"
                        />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-700">
                        Carregando informe
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Buscando seus rendimentos no banco de dados...
                      </p>
                    </div>
                  </div>
                ) : erroInforme ? (
                  <div className="flex h-[700px] items-center justify-center">
                    <div className="max-w-md px-6 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                        <svg
                          className="h-7 w-7 text-red-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v4m0 4h.01M10.29 3.86l-8.02 14A2 2 0 004 21h16a2 2 0 001.73-3l-8.02-14a2 2 0 00-3.42 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-700">
                        Não foi possível carregar o informe
                      </h3>
                      <p className="mt-2 text-xs leading-5 text-red-500">
                        {erroInforme}
                      </p>
                    </div>
                  </div>
                ) : !dadosInforme ? (
                  <div className="flex h-[700px] items-center justify-center">
                    <div className="px-6 text-center">
                      <h3 className="text-sm font-semibold text-slate-700">
                        Informe não encontrado
                      </h3>
                      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                        Não existem dados de rendimentos disponíveis para o exercício selecionado.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full overflow-hidden bg-white">
                    <iframe
                      ref={iframeRef}
                      title={`Informe de rendimentos de ${selectedYear}`}
                      srcDoc={gerarDocumentoHTML()}
                      className="block h-[850px] w-full border-0 bg-white"
                      style={{
                        display: "block",
                        width: "100%",
                        border: "none",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}