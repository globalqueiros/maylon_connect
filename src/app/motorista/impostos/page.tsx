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

    const emailMotorista =
      dadosInforme?.motorista?.email || user?.email || "Não informado";

    const anoSelecionado =
      Number(selectedYear) || currentYear;

    const anoCalendario =
      dadosInforme?.anoCalendario ||
      anoSelecionado - 1;

    const numeroDocumento = `IR-${anoCalendario}-${String(
      dadosInforme?.motorista?.id || "000000"
    ).slice(-6).toUpperCase()}`;

    const emissao = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const tabelaMensal = rendimentosMensais
      .map(
        (item, index) => `
          <tr class="${index % 2 === 1 ? "zebra" : ""}">
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
html,body{margin:0;padding:0;background:#eef1f5;color:#111827;font-family:'Segoe UI',Arial,Helvetica,sans-serif}
body{padding:32px}
.documento{width:100%;max-width:920px;margin:0 auto;background:#fff;border:1px solid #dbe1e8;border-radius:10px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,.10)}

.cabecalho{padding:0;background:#0b3b38;color:#fff;position:relative}
.cabecalho-topo{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:24px 32px 18px;border-bottom:1px solid rgba(255,255,255,.14)}
.marca{display:flex;align-items:center;gap:12px}
.marca-selo{width:38px;height:38px;border-radius:9px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;letter-spacing:.5px;flex-shrink:0}
.marca-nome{font-size:13px;font-weight:700;letter-spacing:.3px}
.marca-sub{font-size:10.5px;color:#9fd8cb;margin-top:1px}
.doc-meta{text-align:right;font-size:10.5px;color:#bfe6dc;line-height:1.6}
.doc-meta strong{display:block;color:#fff;font-size:12px}
.cabecalho-titulo{padding:22px 32px 26px}
.titulo{margin:0;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-.2px}
.subtitulo{margin-top:6px;color:#bfe6dc;font-size:13px;line-height:1.5}

.conteudo{padding:32px}
.aviso{padding:14px 16px;text-align:justify;border-left:3px solid #d6a531;border-radius:6px;background:#fbf6e8;color:#6b5010;font-size:11.5px;line-height:1.65;margin-bottom:28px}
.aviso strong{display:block;margin-bottom:4px;font-size:12px;color:#4a3907}

.informacoes{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-bottom:30px;border:1px solid #e4e9ef;border-radius:10px;overflow:hidden}
.info-card{padding:14px 16px;background:#fff;border-right:1px solid #e4e9ef;border-bottom:1px solid #e4e9ef}
.info-card:nth-child(3n){border-right:none}
.label{color:#8a94a3;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
.value{color:#111827;font-size:13px;font-weight:700;word-break:break-word}

.secao{margin-top:28px}
.secao-cabecalho{display:flex;align-items:center;gap:8px;margin:0 0 14px}
.secao-numero{width:20px;height:20px;border-radius:5px;background:#0b3b38;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.secao-titulo{margin:0;font-size:14.5px;font-weight:800;color:#0b3b38;letter-spacing:.1px}

.tabela-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid #e4e9ef;border-radius:10px}
.tabela{width:100%;min-width:320px;border-collapse:collapse}
.tabela th{padding:11px 16px;background:#f4f6f8;color:#5b6472;font-size:10.5px;font-weight:800;text-align:left;text-transform:uppercase;letter-spacing:.4px;white-space:nowrap;border-bottom:1px solid #e4e9ef}
.tabela td{padding:11px 16px;border-top:1px solid #edf0f3;font-size:12.5px;color:#374151}
.tabela tr.zebra td{background:#fafbfc}
.tabela td.valor,.tabela th.valor{text-align:right;font-variant-numeric:tabular-nums}
.tabela tr.total td{background:#eaf6f3;color:#0b3b38;font-weight:800;border-top:1px solid #cfe8e1}

.resumo-final{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px}
.resumo-card{padding:16px 18px;border-radius:10px;border:1px solid #e4e9ef;background:#f8fafb;min-width:0}
.resumo-card.liquido{border-color:#bfe6dc;background:#eefaf6}
.resumo-label{color:#8a94a3;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px}
.resumo-valor{color:#0b3b38;font-size:20px;font-weight:800;font-variant-numeric:tabular-nums;word-break:break-word}

.responsabilidade{margin-top:24px;padding:18px 20px;border-radius:10px;background:#f8fafb;border:1px solid #e4e9ef}
.responsabilidade h3{margin:0 0 8px;color:#111827;font-size:12.5px;font-weight:800}
.responsabilidade p{text-align:justify;margin:0;color:#6b7280;font-size:11px;line-height:1.7}

.rodape{margin-top:26px;padding-top:16px;border-top:1px solid #e4e9ef;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:9.5px;color:#9aa3b0}

@media(max-width:650px){
body{padding:12px}
.cabecalho-topo{flex-direction:column;align-items:flex-start;gap:10px;padding:18px 20px}
.doc-meta{text-align:left}
.cabecalho-titulo,.conteudo{padding:20px}
.informacoes{grid-template-columns:1fr}
.info-card{border-right:none}
.resumo-final{grid-template-columns:1fr}
.titulo{font-size:20px}
.tabela th,.tabela td{padding:9px 12px}
}
@media(max-width:420px){
body{padding:8px}
.cabecalho-topo,.cabecalho-titulo,.conteudo{padding:16px}
.titulo{font-size:18px}
.subtitulo{font-size:11.5px}
.resumo-valor{font-size:17px}
}
@media print{
@page{size:A4 portrait;margin:7mm}
html,body{width:100%;min-height:0;margin:0!important;padding:0!important;background:#fff!important;color:#111827}
body{font-size:9px}
.documento{width:100%;max-width:none;margin:0;padding:0;border:none;border-radius:0;box-shadow:none;overflow:visible}
.cabecalho-topo{padding:10px 16px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.cabecalho-titulo{padding:10px 16px 14px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.marca-selo{width:26px;height:26px;font-size:10px}
.marca-nome{font-size:10px}
.marca-sub,.doc-meta{font-size:8px}
.titulo{font-size:17px;line-height:1.1}
.subtitulo{margin-top:3px;font-size:9px;line-height:1.2}
.conteudo{padding:12px 16px}
.aviso{display:none!important}
.informacoes{display:grid!important;grid-template-columns:repeat(3,1fr);gap:0;margin:0 0 10px}
.info-card{padding:6px 8px;min-height:38px}
.label{font-size:6.5px;letter-spacing:.3px;margin-bottom:2px}
.value{font-size:8.5px;line-height:1.2}
.secao{margin-top:9px!important;margin-bottom:0!important}
.secao-cabecalho{margin:0 0 5px!important}
.secao-numero{width:14px;height:14px;font-size:8px}
.secao-titulo{font-size:10px;line-height:1.2}
.tabela{width:100%;margin:0!important;border-collapse:collapse;page-break-inside:avoid}
.tabela th{padding:4px 6px;font-size:6.5px;line-height:1.1}
.tabela td{padding:4px 6px;font-size:7.5px;line-height:1.15}
.tabela tr{height:auto}
.tabela tr.total td{font-weight:800}
.resumo-final{display:grid!important;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}
.resumo-card{padding:7px 9px;border-radius:6px}
.resumo-label{font-size:6.5px;margin-bottom:2px}
.resumo-valor{font-size:12px;line-height:1.1}
.responsabilidade{margin-top:7px;padding:7px 9px;border-radius:6px}
.responsabilidade h3{margin:0 0 3px;font-size:8.5px}
.responsabilidade p{font-size:6.5px;line-height:1.35}
.rodape{margin-top:8px;padding-top:6px;font-size:7px}
.informacoes,.secao,.tabela,.resumo-final,.responsabilidade{break-inside:avoid;page-break-inside:avoid}
}
</style>
</head>
<body>
<div class="documento">
<header class="cabecalho">
<div class="cabecalho-topo">
<div class="marca">
<div class="marca-selo">MT</div>
<div>
<div class="marca-nome">Maylon Trip Tecnologia LTDA</div>
<div class="marca-sub">Plataforma de mobilidade</div>
</div>
</div>
<div class="doc-meta">
<strong>${numeroDocumento}</strong>
Emitido em ${emissao}
</div>
</div>
<div class="cabecalho-titulo">
<h1 class="titulo">Informe de Rendimentos</h1>
<div class="subtitulo">Ano-calendário ${anoCalendario} · Motorista parceiro</div>
</div>
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
<div class="label">Nº do documento</div>
<div class="value">${numeroDocumento}</div>
</div>
<div class="info-card">
<div class="label">Nome do motorista</div>
<div class="value">${nomeMotorista}</div>
</div>
<div class="info-card">
<div class="label">CPF</div>
<div class="value">${formatarCPF(identificationNumber)}</div>
</div>
<div class="info-card">
<div class="label">E-mail</div>
<div class="value">${emailMotorista}</div>
</div>
</section>
<section class="secao">
<div class="secao-cabecalho">
<span class="secao-numero">1</span>
<h2 class="secao-titulo">Resumo de valores recebidos pela plataforma</h2>
</div>
<div class="tabela-wrap">
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
<tr class="zebra">
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
</div>
</section>
<section class="secao">
<div class="secao-cabecalho">
<span class="secao-numero">2</span>
<h2 class="secao-titulo">Resumo mensal</h2>
</div>
<div class="tabela-wrap">
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
</div>
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
<h3>Declaração de responsabilidade</h3>
<p>Os valores apresentados neste informe são baseados nos registros disponíveis no sistema da Maylon para o período selecionado. Antes da impressão e utilização deste documento, o contribuinte deverá conferir os dados e valores informados, observando a legislação tributária vigente, sua situação fiscal específica e os respectivos documentos comprobatórios.</p>
</section>
<div class="rodape">
<span>${numeroDocumento}</span>
<span>Maylon Trip Tecnologia LTDA</span>
<span>Documento gerado eletronicamente</span>
</div>
</main>
</div>
</body>
</html>
`;
  };

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent px-4">
        <div className="flex w-full max-w-[340px] flex-col items-center rounded-2xl bg-white p-10 text-center shadow-xl ring-1 ring-black/5">
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
    <main className="min-h-screen px-1 py-3 sm:px-3 lg:px-8">
      <div className="mx-auto w-full max-w-8xl">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15 sm:h-12 sm:w-12">
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
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
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
                Imposto de Renda
              </h1>
              <p className="mt-0.5 max-w-2xl text-sm text-white/50 md:text-sm lg:text-sm xl:text-sm 2xl:text-sm">
                Consulte e imprima seu informe de rendimentos referente ao ano selecionado.
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-5 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Configurações
                  </h2>
                  <p className="text-xs leading-5 text-slate-500">
                    Selecione o exercício desejado.
                  </p>
                </div>
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

            {selectedYear && dadosInforme && !loadingInforme && !erroInforme && (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Total bruto
                  </p>
                  <p className="mt-1.5 text-lg font-bold text-slate-900 sm:text-xl">
                    R$ {formatarMoeda(totalBruto)}
                  </p>
                </div>
                <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700/70">
                    Total líquido
                  </p>
                  <p className="mt-1.5 text-lg font-bold text-teal-800 sm:text-xl">
                    R$ {formatarMoeda(totalLiquido)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <section className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
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
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-teal-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
                  <div className="flex h-[420px] items-center justify-center sm:h-[550px] lg:h-[700px]">
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
                  <div className="flex h-[420px] items-center justify-center sm:h-[550px] lg:h-[700px]">
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
                  <div className="flex h-[420px] items-center justify-center sm:h-[550px] lg:h-[700px]">
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
                  <div className="flex h-[420px] items-center justify-center sm:h-[550px] lg:h-[700px]">
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
                      className="block h-[70vh] w-full border-0 bg-white sm:h-[750px] lg:h-[850px]"
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