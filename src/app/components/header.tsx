"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  Settings,
  Headset,
  LogOut,
  Car,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SIDEBAR_TOGGLE_EVENT = "app:toggle-mobile-sidebar";

type UserData = {
  id: number;
  full_name: string;
  email: string;
  profile_image?: string;
  user_type: "driver" | "customer";
};

type HeaderProps = {
  toggleSidebar: () => void;
};

export default function Header({ toggleSidebar }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [imgSrc, setImgSrc] = useState("/foto_perfil.png");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isMotorista = pathname.startsWith("/motorista");
  const prefix = isMotorista ? "/motorista" : "/passageiro";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();
        setUser(data);
      } catch {}
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (user?.profile_image?.trim()) {
      setImgSrc(user.profile_image);
    } else {
      setImgSrc("/foto_perfil.png");
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const firstName = user?.full_name
    ? user.full_name.trim().split(" ")[0]
    : "Usuário";

  const hasImage = Boolean(user?.profile_image?.trim());

  const handleMenuClick = () => {
    toggleSidebar();
    window.dispatchEvent(new Event(SIDEBAR_TOGGLE_EVENT));
  };

  return (
    <header className="relative top-0 z-[60] flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-3 sm:px-4">
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleMenuClick}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 active:scale-95"
          aria-label="Abrir ou fechar menu"
        >
          <Menu size={24} strokeWidth={2} />
        </button>
      </div>

      <div className="relative flex shrink-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="Notificações"
        >
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500" />
        </button>

        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl px-1.5 py-1 hover:bg-gray-100 sm:gap-2 sm:px-2"
          >
            {hasImage ? (
              <Image
                src={imgSrc}
                onError={() => setImgSrc("/foto_perfil.png")}
                className="h-8 w-8 shrink-0 rounded-full object-cover"
                alt="Foto de perfil"
                width={32}
                height={32}
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500 text-sm font-bold text-white">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}

            <span className="hidden text-sm font-medium sm:inline">
              {firstName}
            </span>

            <ChevronDown
              size={16}
              className={`hidden transition-transform sm:block ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {open && (
            <div className="fixed inset-x-3 top-[68px] z-[100] rounded-xl border border-gray-200 bg-white p-4 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2.5 sm:w-64">
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-900">
                  {firstName}
                </p>

                <p className="mt-1 truncate text-xs text-gray-500">
                  {user?.email || "Carregando..."}
                </p>
              </div>

              <div className="my-2 border-t border-gray-100" />

              <div className="flex flex-col gap-1 text-xs">
                <Link
                  href={`${prefix}/perfil`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg p-2.5 hover:bg-gray-100"
                >
                  <User size={18} />
                  Meu Perfil
                </Link>

                <Link
                  href={`${prefix}/configuracoes`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg p-2.5 hover:bg-gray-100"
                >
                  <Settings size={18} />
                  Configurações
                </Link>

                <Link
                  href={`${prefix}/central_ajuda`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg p-2.5 hover:bg-gray-100"
                >
                  <Headset size={18} />
                  Suporte
                </Link>

                {isMotorista && (
                  <>
                    <Link
                      href="/motorista/veiculo"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-lg p-2.5 hover:bg-gray-100"
                    >
                      <Car size={18} />
                      Meu Veículo
                    </Link>

                    <Link
                      href="/motorista/viagens"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-lg p-2.5 hover:bg-gray-100"
                    >
                      <MapPin size={18} />
                      Minhas Corridas
                    </Link>
                  </>
                )}
              </div>

              <div className="my-2 border-t border-gray-100" />

              <Link
                href={`${prefix}/saindo`}
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg p-2.5 text-xs text-red-500 hover:bg-red-50"
              >
                <LogOut size={18} />
                Sair
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}