import "../globals.css";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import LayoutContainer from "./dashboard-layout";

async function verificarPassageiro() {
  const cookieStore = await cookies();

  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/me`, {
      method: "GET",
      headers: {
        Cookie: `access_token=${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      redirect("/");
    }

    const data = await response.json();

    const user =
      data?.user ||
      data?.usuario ||
      data?.data ||
      data;

    const userType = String(user?.user_type || "")
      .trim()
      .toLowerCase();

    const isCustomer =
      userType === "customer" ||
      userType === "passageiro" ||
      userType === "passenger";

    if (!isCustomer) {
      redirect("/motorista");
    }
  } catch (error) {
    console.error(
      "Erro ao verificar passageiro:",
      error
    );

    redirect("/");
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