import "../globals.css";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import LayoutContainer from "./dashboard-layout";
import { verificarTokenAcesso } from "../lib/tokenAcesso";

// Lê o token direto, sem chamar o /api/me pelo NEXT_PUBLIC_APP_URL.
async function verificarPassageiro() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const { valido, tipo } = await verificarTokenAcesso(token);

  if (!valido) {
    redirect("/");
  }

  if (tipo !== "passageiro") {
    redirect(tipo === "motorista" ? "/motorista" : "/");
  }
}

export default async function PassageiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await verificarPassageiro();

  return (
    <div className="dashboard-layout">
      <LayoutContainer>
        {children}
      </LayoutContainer>
    </div>
  );
}