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
  Car
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
  { name: "Imposto de Renda", icon: Percent , href: "/motorista/impostos" },
  { name: "Sair", icon: LogOut, href: "/saindo" },
];

const menuPassageiro = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/passageiro" },
  { name: "Relatório", icon: FilePenLine, href: "/passageiro/relatorio" },
  { name: "Benefícios", icon: HandCoins, href: "/passageiro/beneficios" },
  { name: "Sair", icon: LogOut, href: "/saindo" },
];

const supportItems = [
  { name: "Central de Ajuda", icon: Headset, href: "/central_ajuda" },
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
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Erro ao buscar usuário");
      }
    };

    fetchUser();
  }, []);
  if (!user) return null;
  const isDriver = user.user_type === "driver";
  const menuItems = isDriver ? menuMotorista : menuPassageiro;
  return (
    <div
      className={`h-screen bg-white border-r border-gray-300 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex items-center justify-center p-4">
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
        {menuItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition
                ${
                  isActive
                    ? "bg-teal-500 text-white shadow-md"
                    : "hover:bg-gray-100 text-gray-700"
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
        {supportItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition
                ${
                  isActive
                    ? "bg-teal-500 text-white shadow-md"
                    : "hover:bg-gray-100 text-gray-700"
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
    </div>
  );
}