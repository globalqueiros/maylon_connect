"use client";
import Image from "next/image";
import {
  LayoutDashboard,
  FilePenLine,
  HandCoins,
  Headset,
  LogOut,
  Percent,
  ShoppingBasket,
  Car,
  CarFront,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const menuMotorista = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/motorista" },
  { name: "Relatório", icon: FilePenLine, href: "/motorista/relatorio" },
  { name: "Benefícios", icon: HandCoins, href: "/motorista/beneficios" },
  { name: "Shopping", icon: ShoppingBasket, href: "/motorista/shopping" },
  { name: "Carros", icon: Car, href: "/motorista/carros" },
  { name: "Imposto de Renda", icon: Percent, href: "/motorista/impostos" },
  { name: "Sair", icon: LogOut, href: "/saindo" },
];

const menuPassageiro = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/passageiro" },
  { name: "Viagens", icon: CarFront, href: "/passageiro/viagens" },
  { name: "Benefícios", icon: HandCoins, href: "/passageiro/beneficios" },
  { name: "Sair", icon: LogOut, href: "/saindo" },
];

type User = {
  id: number;
  full_name: string;
  user_type: "driver" | "customer";
};

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.id) setUser(data);
      } catch {
        console.error("Erro ao buscar usuário");
      }
    };

    fetchUser();
  }, []);

  // Infer menu from current route while /api/me loads (prevents empty sidebar)
  const isDriverRoute = pathname.startsWith("/motorista");
  const isDriver = user ? user.user_type === "driver" : isDriverRoute;
  const menuItems = isDriver ? menuMotorista : menuPassageiro;
  const supportHref = isDriver
    ? "/motorista/central_ajuda"
    : "/passageiro/central_ajuda";

  return (
    <div
      className={`h-screen bg-white border-r border-gray-300 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex items-center border-b h-16 mb-4 border-gray-300 justify-center p-4">
        {collapsed ? (
          <Image
            src="/favicon.webp"
            alt="Logo"
            width={40}
            height={40}
            className="rounded-xl"
          />
        ) : (
          <Image src="/logo.png" alt="Logo" width={200} height={200} />
        )}
      </div>
      <div className="px-2">
        {!collapsed && (
          <p className="text-gray-400 text-sm px-3 mb-2">
            {isDriver ? "Motorista" : "Passageiro"}
          </p>
        )}
        {menuItems.map((item) => {
          const isActive =
            item.href === "/passageiro" || item.href === "/motorista"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={item.href !== "/saindo"}
              className={`flex items-center gap-3 rounded-lg p-3 transition
                ${collapsed ? "justify-center" : "justify-start text-left"}
                ${
                  isActive
                    ? "bg-teal-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <item.icon size={20} />
              {!collapsed && (
                <span className="text-xs font-medium">{item.name}</span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="px-2 mt-6">
        {!collapsed && (
          <p className="text-gray-400 text-sm px-3 mb-2">Suporte</p>
        )}
        <Link
          href={supportHref}
          className={`flex items-center gap-3 rounded-lg p-3 transition
            ${collapsed ? "justify-center" : "justify-start text-left"}
            ${
              pathname.startsWith(supportHref)
                ? "bg-teal-500 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          <Headset size={20} />
          {!collapsed && (
            <span className="text-xs font-medium">Central de Ajuda</span>
          )}
        </Link>
      </div>
    </div>
  );
}
