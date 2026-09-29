"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Hash,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { ChangeEvent, useRef, useState } from "react";
import {
  consultarConta,
  formatarDataConta,
  formatarValorConta,
  pagarConta,
  type ContaConsultada,
} from "../../../lib/asaas/contaCliente";

type Method = "pdf" | "codigo";

// A Asaas aceita a linha digitável/código informado.
// O envio por PDF fica desabilitado por enquanto.
const PDF_DISPONIVEL = false;

export default function PagamentoContaPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<Method>("codigo");
  const [file, setFile] = useState<File | null>(null);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [consulta, setConsulta] = useState<ContaConsultada | null>(null);
  const [pago, setPago] = useState(false);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setError("");

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setFile(null);
      setError("Envie somente arquivos em formato PDF.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setFile(null);
      setError("O arquivo deve ter no máximo 10 MB.");
      return;
    }

    setFile(selectedFile);
  }

  function removeFile() {
    setFile(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  /**
   * Aplica máscara visual ao código.
   *
   * Exemplos:
   *
   * 44 dígitos:
   * 12345678901234567890123456789012345678901234
   *
   * 47 dígitos:
   * 12345.12345 12345.123456 12345.123456 1 12345678901234
   *
   * 48 dígitos:
   * 123456.123456 123456.123456 123456.123456 123456.123456
   */
  function mascararCodigo(value: string) {
    const numbers = value.replace(/\D/g, "").slice(0, 48);

    // Linha digitável bancária - 47 dígitos
    if (numbers.length <= 47) {
      const parte1 = numbers.slice(0, 5);
      const parte2 = numbers.slice(5, 10);
      const parte3 = numbers.slice(10, 15);
      const parte4 = numbers.slice(15, 16);
      const parte5 = numbers.slice(16, 20);
      const parte6 = numbers.slice(20, 21);
      const parte7 = numbers.slice(21, 31);
      const parte8 = numbers.slice(31, 32);
      const parte9 = numbers.slice(32, 47);

      let resultado = parte1;

      if (parte2) {
        resultado += `.${parte2}`;
      }

      if (parte3) {
        resultado += ` ${parte3}`;
      }

      if (parte4) {
        resultado += `.${parte4}`;
      }

      if (parte5) {
        resultado += ` ${parte5}`;
      }

      if (parte6) {
        resultado += `.${parte6}`;
      }

      if (parte7) {
        resultado += ` ${parte7}`;
      }

      if (parte8) {
        resultado += `.${parte8}`;
      }

      if (parte9) {
        resultado += ` ${parte9}`;
      }

      return resultado;
    }

    // Linha digitável de arrecadação - 48 dígitos
    const grupos = numbers.match(/.{1,12}/g) ?? [];

    return grupos.join(" ");
  }

  function handleCodigo(value: string) {
    const numbers = value.replace(/\D/g, "").slice(0, 48);

    setCodigo(mascararCodigo(numbers));
    setError("");
    setConsulta(null);
    setPago(false);
  }

  /**
   * Retorna somente os números.
   *
   * A máscara é apenas visual.
   * A API recebe:
   *
   * 00190...
   *
   * e não:
   *
   * 00190.12345 ...
   */
  function codigoNumerico() {
    return codigo.replace(/\D/g, "");
  }

  // 1º clique consulta a conta.
  // 2º clique confirma o pagamento.
  async function continuePayment() {
    if (method === "pdf") {
      setError(
        "O envio por PDF estará disponível em breve. Use o código da conta.",
      );
      return;
    }

    const codigoLimpo = codigoNumerico();

    if (![44, 47, 48].includes(codigoLimpo.length)) {
      setError(
        "Digite um código válido com 44, 47 ou 48 números.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!consulta) {
        const resultado = await consultarConta(codigoLimpo);
        setConsulta(resultado);
      } else {
        await pagarConta(consulta.linhaDigitavel);
        setPago(true);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao processar o pagamento da conta.",
      );
    } finally {
      setLoading(false);
    }
  }

  function novaConta() {
    setCodigo("");
    setConsulta(null);
    setPago(false);
    setError("");
  }

  return (
    <main className="min-h-screen pb-10">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="pt-6 sm:pt-8">
          <div className="flex items-center gap-4">
            <Link
              href="/passageiro/servicos"
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
              aria-label="Voltar"
            >
              <ArrowLeft size={17} />
              <span>Voltar</span>
            </Link>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Pagamento de conta
              </h1>
            </div>
          </div>
        </header>

        <section className="mt-7">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#062b4f] via-[#074d68] to-[#08a89d] p-6 shadow-[0_20px_50px_rgba(6,43,79,0.18)] sm:p-8">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#5be0c8]/20 blur-3xl" />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm">
                <FileText size={25} />
              </div>

              <h2 className="mt-5 text-2xl font-black text-white sm:text-3xl">
                Como deseja pagar?
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
                Envie sua conta em PDF ou digite o código de pagamento
                manualmente.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="rounded-[28px] border border-[#e2ebee] bg-white p-5 shadow-[0_12px_40px_rgba(6,43,79,0.07)] sm:p-8">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f3f6f7] p-1.5">
              <button
                type="button"
                disabled={!PDF_DISPONIVEL}
                onClick={() => {
                  setMethod("pdf");
                  setError("");
                }}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${method === "pdf"
                    ? "bg-white text-[#08a89d] shadow-sm"
                    : "text-[#71869a] hover:text-[#062b4f]"
                  }`}
              >
                <Upload size={17} />

                {PDF_DISPONIVEL
                  ? "Enviar PDF"
                  : "Enviar PDF (em breve)"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod("codigo");
                  setError("");
                }}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold transition sm:text-sm ${method === "codigo"
                    ? "bg-white text-[#1676b7] shadow-sm"
                    : "text-[#71869a] hover:text-[#062b4f]"
                  }`}
              >
                <Hash size={17} />
                Digitar código
              </button>
            </div>

            {method === "pdf" ? (
              <div className="mt-7">
                <div>
                  <h2 className="text-lg font-black text-[#062b4f]">
                    Envie sua conta
                  </h2>

                  <p className="mt-1 text-xs text-[#71869a]">
                    Aceitamos arquivos PDF de até 10 MB.
                  </p>
                </div>

                {!file ? (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="mt-6 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cddcdf] bg-[#f9fbfc] px-5 py-10 text-center transition hover:border-[#08a89d] hover:bg-[#f3fbf9] sm:py-14"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e5f8f4] text-[#08a89d]">
                      <Upload size={28} />
                    </div>

                    <p className="mt-5 text-sm font-black text-[#062b4f] sm:text-base">
                      Selecione sua conta em PDF
                    </p>

                    <p className="mt-2 text-xs text-[#8ca0b2]">
                      Formato aceito: PDF
                    </p>

                    <span className="mt-5 rounded-xl bg-[#08a89d] px-5 py-3 text-xs font-bold text-white">
                      Selecionar PDF
                    </span>
                  </button>
                ) : (
                  <div className="mt-6 rounded-2xl border border-[#dce9e7] bg-[#f7fbfa] p-4 sm:p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e5f8f4] text-[#08a89d]">
                        <FileText size={25} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[#062b4f]">
                          {file.name}
                        </p>

                        <p className="mt-1 text-xs text-[#71869a]">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={removeFile}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#71869a] transition hover:bg-red-50 hover:text-red-500"
                        aria-label="Remover arquivo"
                      >
                        <X size={17} />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5">
                      <CheckCircle2
                        size={16}
                        className="shrink-0 text-[#08a89d]"
                      />

                      <span className="text-xs font-semibold text-[#506a82]">
                        PDF pronto para envio
                      </span>
                    </div>
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFile}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="mt-7">
                <div>
                  <h2 className="text-lg font-black text-[#062b4f]">
                    Digite o código da conta
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-[#71869a]">
                    Digite ou cole a linha digitável ou o código de barras
                    da sua conta.
                  </p>
                </div>

                <div className="mt-6">
                  <label
                    htmlFor="codigo"
                    className="text-xs font-bold text-[#506a82]"
                  >
                    Código de pagamento
                  </label>

                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center justify-center text-[#8ca0b2]">
                      <Hash size={19} />
                    </div>

                    <input
                      id="codigo"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={codigo}
                      disabled={loading || pago}
                      onChange={(event) =>
                        handleCodigo(event.target.value)
                      }
                      placeholder="Digite o código da conta"
                      maxLength={59}
                      className="h-14 w-full rounded-2xl border border-[#dce5e9] bg-[#fbfcfd] pl-12 pr-4 text-sm font-semibold tracking-wide text-[#062b4f] outline-none transition placeholder:text-[#a4b3bd] focus:border-[#08a89d] focus:bg-white focus:ring-4 focus:ring-[#08a89d]/10"
                    />
                  </div>

                  <p className="mt-2 text-[10px] text-[#8ca0b2]">
                    Você pode copiar e colar o código diretamente neste
                    campo.
                  </p>
                </div>
              </div>
            )}

            {consulta && (
              <div className="mt-6 space-y-3 rounded-2xl border border-[#dce9e7] bg-[#f7fbfa] p-4 text-xs text-[#506a82] sm:p-5">
                <div className="flex justify-between gap-3">
                  <span>Quem recebe</span>

                  <span className="text-right font-bold text-[#062b4f]">
                    {consulta.beneficiario || "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span>Vencimento</span>

                  <span className="font-bold text-[#062b4f]">
                    {formatarDataConta(consulta.vencimento)}
                    {consulta.vencida ? " (vencida)" : ""}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span>Valor</span>

                  <span className="text-base font-black text-[#08a89d]">
                    {formatarValorConta(consulta.valor)}
                  </span>
                </div>
              </div>
            )}

            {pago && (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={16} className="shrink-0" />

                Pagamento enviado! Ele aparece no seu histórico assim que
                for confirmado.
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#f5f8fa] p-4">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-[#08a89d]"
              />

              <div>
                <p className="text-xs font-bold text-[#062b4f]">
                  Seus dados estão protegidos
                </p>

                <p className="mt-1 text-[11px] leading-5 text-[#71869a]">
                  Confira os dados da conta antes de confirmar qualquer
                  pagamento.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={pago ? novaConta : continuePayment}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#08a89d] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(8,168,157,0.2)] transition hover:bg-[#078f80] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Processando..."
                : pago
                  ? "Pagar outra conta"
                  : consulta
                    ? `Confirmar pagamento de ${formatarValorConta(
                      consulta.valor,
                    )}`
                    : "Consultar conta"}

              {!loading && !pago && <ArrowRight size={17} />}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
