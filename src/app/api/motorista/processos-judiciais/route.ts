import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { usuarioDoToken } from "../../../lib/diditServer";
import { consultarProcessos } from "../../../lib/juditServer";
import { salvarConsulta, obterConsulta } from "../../../lib/lawsuitDb";
import { validarCpf } from "../../../lib/cpf";
import type { ProcessosJudiciaisStatus } from "../../../lib/judit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const { id: userId, tipo } = await usuarioDoToken();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Não autenticado." },
        { status: 401 }
      );
    }

    if (tipo !== "driver") {
      return NextResponse.json(
        { success: false, message: "Acesso restrito a motoristas." },
        { status: 403 }
      );
    }

    const existente = await obterConsulta(userId);

    if (
      existente &&
      (existente.status === "aprovado" || existente.status === "reprovado")
    ) {
      return NextResponse.json({
        success: true,
        status: existente.status,
        total: existente.total,
        alreadyDone: true,
      });
    }

    let cpf: string | null = null;
    let tipoDocumento: string | null = null;

    try {
      const [rows] = (await db.query(
        "SELECT identification_number, identification_type FROM users WHERE id = ? LIMIT 1",
        [userId]
      )) as unknown as [
        Array<{
          identification_number?: string | null;
          identification_type?: string | null;
        }>
      ];

      cpf = rows[0]?.identification_number ?? null;
      tipoDocumento = rows[0]?.identification_type ?? null;
    } catch (dbError) {
      console.error(
        "POST /api/motorista/processos-judiciais: erro ao buscar CPF:",
        dbError
      );
      return NextResponse.json(
        { success: false, message: "Erro ao consultar o CPF." },
        { status: 500 }
      );
    }

    if (!cpf) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_document",
          message: "Consulta disponível apenas para CPF válido.",
        },
        { status: 422 }
      );
    }

    const tipoNormalizado = String(tipoDocumento ?? "")
      .trim()
      .toLowerCase();

    if (tipoNormalizado !== "cpf" || !validarCpf(cpf)) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_document",
          message: "Consulta disponível apenas para CPF válido.",
        },
        { status: 422 }
      );
    }

    const resultado = await consultarProcessos(cpf);

    if (!resultado.ok) {
      const message =
        resultado.error === "not_configured"
          ? "Consulta de processos não configurada."
          : "Não foi possível consultar os processos judiciais.";

      return NextResponse.json(
        { success: false, error: resultado.error, message },
        { status: resultado.error === "not_configured" ? 500 : 502 }
      );
    }

    const status: ProcessosJudiciaisStatus = resultado.hasLawsuits
      ? "reprovado"
      : "aprovado";

    try {
      await salvarConsulta(userId, {
        status,
        total: resultado.total,
        result: resultado.data,
      });
    } catch (dbError) {
      console.error(
        "POST /api/motorista/processos-judiciais: erro ao salvar consulta:",
        dbError
      );
    }

    return NextResponse.json({
      success: true,
      status,
      total: resultado.total,
    });
  } catch (error) {
    console.error(
      "POST /api/motorista/processos-judiciais - ERRO INTERNO:",
      error
    );
    return NextResponse.json(
      { success: false, message: "Erro interno." },
      { status: 500 }
    );
  }
}
