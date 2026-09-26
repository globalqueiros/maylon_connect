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
    <main className="flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-xs flex-col items-center sm:max-w-sm md:max-w-md 2xl:max-w-lg">
        <div className="w-full rounded-2xl bg-white px-6 py-8 text-center shadow-xl sm:rounded-3xl sm:px-8 sm:py-10 lg:px-10 2xl:px-12 2xl:py-14">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#d8f7eb] p-3.5 shadow-sm sm:h-28 sm:w-28 sm:p-4 2xl:h-32 2xl:w-32 2xl:p-5">
            <Image
              src="/favicon.ico"
              alt="Logo"
              width={90}
              height={90}
              priority
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="mt-5 text-lg font-bold text-[#102a43] sm:mt-6 sm:text-xl lg:text-2xl 2xl:text-3xl">
            Saindo da sua conta
          </h1>
          <p className="mt-2 text-xs leading-5 text-[#607d94] sm:text-sm sm:leading-6 2xl:text-base 2xl:leading-7">
            Estamos encerrando sua sessão.
            <br />
            Aguarde um instante...
          </p>
          <div className="mt-6 flex flex-col items-center sm:mt-7 2xl:mt-9">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d8f7eb] border-t-[#00a99d] sm:h-9 sm:w-9 2xl:h-11 2xl:w-11" />
            <span className="mt-3 text-xs font-semibold text-[#00a99d] sm:mt-4 2xl:text-sm">
              Saindo...
            </span>
          </div>
        </div>
        <p className="mt-4 text-xs font-medium text-white/80 sm:mt-5 sm:text-sm 2xl:text-base">
          Até logo! 👋
        </p>
      </div>
    </main>
  );
}