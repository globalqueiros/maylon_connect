"use client";

import Image from "next/image";
import {
  LayoutDashboard,
  HandCoins,
  Headset,
  LogOut,
  Percent,
  Car,
  CarFront,
  ShoppingCart,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SIDEBAR_TOGGLE_EVENT = "app:toggle-mobile-sidebar";

const menuMotorista = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/motorista" },
  { name: "Viagens", icon: CarFront, href: "/motorista/viagens" },
  { name: "Benefícios", icon: HandCoins, href: "/motorista/beneficios" },
  { name: "Shopping", icon: ShoppingCart, href: "/motorista/shopping" },
  { name: "Carros", icon: Car, href: "/motorista/carros" },
  { name: "Imposto de Renda", icon: Percent, href: "/motorista/impostos" },
  { name: "Sair", icon: LogOut, href: "/saindo" },
];

const menuPassageiro = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/passageiro" },
  { name: "Viagens", icon: CarFront, href: "/passageiro/viagens" },
  { name: "Benefícios", icon: HandCoins, href: "/passageiro/beneficios" },
  { name: "Sair", icon: LogOut, href: "/passageiro/saindo" },
];

type User = {
  id: number;
  full_name: string;
  user_type: "driver" | "customer";
};

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();

        if (data?.id) {
          setUser(data);
        }
      } catch {}
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const handleToggle = () => {
      setMobileOpen((prev) => !prev);
    };

    window.addEventListener(SIDEBAR_TOGGLE_EVENT, handleToggle);

    return () => {
      window.removeEventListener(SIDEBAR_TOGGLE_EVENT, handleToggle);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isDriverRoute = pathname.startsWith("/motorista");
  const isDriver = user
    ? user.user_type === "driver"
    : isDriverRoute;

  const menuItems = isDriver
    ? menuMotorista
    : menuPassageiro;

  const supportHref = isDriver
    ? "/motorista/central_ajuda"
    : "/passageiro/central_ajuda";

  const renderSidebarContent = (isCollapsed: boolean) => (
    <>
      <div className="mb-4 flex h-16 items-center justify-center border-b border-gray-300 p-4">
        {isCollapsed ? (
          <Image
            src="/favicon.webp"
            alt="Logo"
            width={40}
            height={40}
            className="rounded-xl"
          />
        ) : (
          <Image
            src="/logo.png"
            alt="Logo"
            width={200}
            height={200}
            className="h-auto w-[140px] object-contain"
          />
        )}
      </div>

      <div className="px-2">
        {!isCollapsed && (
          <p className="mb-2 px-3 text-sm text-gray-400">
            {isDriver ? "Motorista" : "Passageiro"}
          </p>
        )}

        {menuItems.map((item) => {
          const isActive =
            item.href === "/passageiro" ||
            item.href === "/motorista"
              ? pathname === item.href
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={item.href !== "/saindo"}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 rounded-lg p-3
                transition
                ${isCollapsed ? "justify-center" : "justify-start text-left"}
                ${
                  isActive
                    ? "bg-teal-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <item.icon size={20} />

              {!isCollapsed && (
                <span className="text-xs font-medium">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 px-2">
        {!isCollapsed && (
          <p className="mb-2 px-3 text-sm text-gray-400">
            Suporte
          </p>
        )}

        <Link
          href={supportHref}
          onClick={() => setMobileOpen(false)}
          className={`
            flex items-center gap-3 rounded-lg p-3
            transition
            ${isCollapsed ? "justify-center" : "justify-start text-left"}
            ${
              pathname.startsWith(supportHref)
                ? "bg-teal-500 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          <Headset size={20} />

          {!isCollapsed && (
            <span className="text-xs font-medium">
              Central de Ajuda
            </span>
          )}
        </Link>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-hidden="true"
        />
      )}

      <div
        className={`
          relative hidden h-screen border-r border-gray-300
          bg-white transition-all duration-300 md:block
          ${collapsed ? "w-20" : "w-64"}
        `}
      >
        {renderSidebarContent(collapsed)}
      </div>

      <div
        className={`
          fixed inset-y-0 left-0 z-[70]
          h-screen w-72 max-w-[85vw]
          transform border-r border-gray-300
          bg-white shadow-xl
          transition-transform duration-300
          md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <X size={20} />
        </button>

        {renderSidebarContent(false)}
      </div>
    </>
  );
}