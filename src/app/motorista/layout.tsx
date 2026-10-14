import "../globals.css";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import LayoutContainer from "./dashboard-layout";
import { verificarTokenAcesso } from "../lib/tokenAcesso";
import SessaoEncerradaWatcher from "../components/SessaoEncerradaWatcher";

// Lê o token direto, sem chamar o /api/me pelo NEXT_PUBLIC_APP_URL.
async function verificarMotorista() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const { valido, tipo, indisponivel } = await verificarTokenAcesso(token);

  // Banco fora do ar: mostra erro (503) em vez de mandar para o login.
  if (indisponivel) {
    throw new Error("Serviço temporariamente indisponível.");
  }

  if (!valido) {
    redirect("/");
  }

  if (tipo !== "motorista") {
    redirect(tipo === "passageiro" ? "/passageiro" : "/");
  }
}

export default async function MotoristaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await verificarMotorista();

  return (
    <div className="dashboard-layout">
      <SessaoEncerradaWatcher />
      <LayoutContainer>
        {children}
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Portal Connect. Todos os direitos reservados. • Maylon v0.1.0
        </p>
      </LayoutContainer>
    </div>
  );
}
