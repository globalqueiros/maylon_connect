"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    document.cookie = "token=; path=/; max-age=0";

    const timer = setTimeout(() => {
      router.replace("/?logout=success");
    }, 1200);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F766E] px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#14B8A6]/30 blur-3xl sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[#0D9488]/40 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2DD4BF]/10 blur-3xl" />

      <div className="relative z-10 flex w-full max-w-xs flex-col items-center sm:max-w-sm md:max-w-md 2xl:max-w-lg">
        <div className="w-full rounded-2xl bg-white px-6 py-8 text-center shadow-2xl shadow-black/20 sm:rounded-3xl sm:px-8 sm:py-10 lg:px-10 2xl:px-12 2xl:py-14">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#D8F7EB] p-3.5 shadow-sm sm:h-28 sm:w-28 sm:p-4 2xl:h-32 2xl:w-32 2xl:p-5">
            <Image
              src="/favicon.ico"
              alt="Logo"
              width={90}
              height={90}
              priority
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="mt-5 text-lg font-bold text-[#102A43] sm:mt-6 sm:text-xl lg:text-2xl 2xl:text-3xl">
            Saindo da sua conta
          </h1>

          <p className="mt-2 text-xs leading-5 text-[#607D94] sm:text-sm sm:leading-6 2xl:text-base 2xl:leading-7">
            Estamos encerrando sua sessão.
            <br />
            Aguarde um instante...
          </p>

          <div className="mt-6 flex flex-col items-center sm:mt-7 2xl:mt-9">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D8F7EB] border-t-[#00A99D] sm:h-9 sm:w-9 2xl:h-11 2xl:w-11" />
            <span className="mt-3 text-xs font-semibold text-[#00A99D] sm:mt-4 2xl:text-sm">
              Saindo...
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs font-medium text-white/90 sm:mt-5 sm:text-sm 2xl:text-base">
          Até logo! 👋
        </p>
      </div>
    </main>
  );
}
