"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function SuccessPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const messages = [
    "Verificando token...",
    "Autenticando usuário...",
    "Carregando perfil...",
    "Redirecionando...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < messages.length - 1 ? prev + 1 : prev));
    }, 900);

    const load = async () => {
      try {
        const res = await fetch("/api/me", {
          cache: "no-store",
        });

        if (!res.ok) {
          router.replace("/?error=session");
          return;
        }

        const user = await res.json();

        setTimeout(() => {
          const userType = String(user.user_type || "").toLowerCase();
          if (userType === "driver" || userType === "motorista") {
            router.replace("/motorista");
          } else if (
            userType === "customer" ||
            userType === "passageiro" ||
            userType === "passenger"
          ) {
            router.replace("/passageiro");
          } else {
            router.replace("/passageiro");
          }
        }, 800);

      } catch {
        router.replace("/?error=server");
      }
    };

    load();
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white shadow-2xl rounded-2xl p-10 flex flex-col items-center gap-6 w-[340px]"
      >
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
          <motion.div
            className="w-16 h-16 border-4 border-black border-t-transparent rounded-full absolute top-0 left-0"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
        </div>

        <div className="text-center h-[24px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={messages[step]}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-gray-600 font-medium"
            >
              {messages[step]}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}