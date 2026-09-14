import "../globals.css";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import LayoutContainer from "./dashboard-layout";

async function verificarMotorista() {
  const cookieStore = await cookies();

  const token = cookieStore.get("access_token")?.value;

  // Sem token -> login
  if (!token) {
    redirect("/login");
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  let response: Response;

  // O try/catch deve envolver somente o fetch.
  // NÃO coloque redirect() dentro do try/catch.
  try {
    response = await fetch(`${baseUrl}/api/me`, {
      method: "GET",
      headers: {
        Cookie: `access_token=${token}`,
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error(
      "Erro de conexão ao verificar motorista:",
      error
    );

    redirect("/");
  }

  // /api/me retornou erro
  if (!response.ok) {
    console.error(
      `GET /api/me retornou ${response.status}`
    );

    redirect("/");
  }

  let data: any;

  try {
    data = await response.json();
  } catch (error) {
    console.error(
      "Resposta inválida do /api/me:",
      error
    );

    redirect("/");
  }

  /*
   * Seu /api/me retorna atualmente:
   *
   * {
   *   success: true,
   *   id: 123,
   *   user_type: "motorista",
   *   ...
   * }
   *
   * Mas mantemos compatibilidade caso algum endpoint
   * retorne o usuário dentro de user/usuario/data.
   */
  const user =
    data?.user ||
    data?.usuario ||
    data?.data ||
    data;

  const userType = String(
    user?.user_type || ""
  )
    .trim()
    .toLowerCase();

  const isDriver =
    userType === "driver" ||
    userType === "motorista";

  // Usuário autenticado, mas não é motorista
  if (!isDriver) {
    redirect("/passageiro");
  }

  return user;
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
