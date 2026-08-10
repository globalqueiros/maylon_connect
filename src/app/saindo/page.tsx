"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
      } catch {
        // ignore
      }

      try {
        localStorage.removeItem("token");
        sessionStorage.clear();
      } catch {
        // ignore
      }

      router.replace("/?logout=success");
    };

    void logout();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <p className="animate-pulse text-lg text-gray-600">Saindo...</p>
      </div>
    </div>
  );
}
