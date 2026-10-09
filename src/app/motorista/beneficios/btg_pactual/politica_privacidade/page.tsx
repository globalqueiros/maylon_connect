import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Politica de Privacidade – Benefício de Previdência Privada PGBL | Maylon",
  description:
    "Politica de Privacidade do benefício de previdência privada PGBL da Maylon.",
};

export default function TermosPrevidenciaPage() {
  return (
    <>
      <div className="m-auto p-5 bg-[#35aa8a] text-white my-5 text-left rounded-2xl">
        <h1 className="text-2xl text-center font-semibold">
          TERMOS DE USO — MAYLON PASS
        </h1>

        <p className="text-left text-sm my-3">
          Última atualização:{" "}
          <strong>10 de setembro de 2026</strong>
        </p>

        <p className="text-justify text-sm leading-7">
          <strong>Bem-vindo ao Maylon Pass.</strong>
        </p>
      </div>
    </>
  );
}