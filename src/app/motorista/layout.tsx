import "../globals.css";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import LayoutContainer from "./dashboard-layout";
import { verificarTokenAcesso } from "../lib/tokenAcesso";

// Lê o token direto, sem chamar o /api/me pelo NEXT_PUBLIC_APP_URL.
async function verificarMotorista() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const { valido, tipo } = await verificarTokenAcesso(token);

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
      <LayoutContainer>
        {children}
      </LayoutContainer>
    </div>
  );
}
