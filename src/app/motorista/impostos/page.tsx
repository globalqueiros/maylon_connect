"use client";
import { useEffect, useState, useRef } from "react";

type User = {
  id: number;
  full_name: string;
  email: string;
};

export default function Preview() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-gray-400 p-8 rounded-2xl shadow-lg flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-700 font-medium">
            Aguarde, carregando página...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500 font-semibold">
          Você precisa estar logado para acessar esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Imposto de renda</h1>
      <p className="text-sm text-black mb-6">
        Aqui você pode baixar uma declaração referente a suas despesas com saúde no ano selecionado.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="max-w-md">
          <label className="block text-sm font-semibold text-black mb-2">
            Ano de declaração
          </label>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full appearance-none bg-teal-500 cursor-pointer border border-teal-500/40 text-white text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Selecione o ano</option>
              <option value={currentYear}>{currentYear}</option>
              <option value={previousYear}>{previousYear}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-300">
              ▼
            </div>
          </div>
          <p className="text-xs text-black mt-2">
            Informe o ano de consulta do imposto de renda.
          </p>
        </div>
        <div className="w-full">
          <div className="bg-white border rounded-2xl shadow-lg p-4 h-[500px] flex flex-col items-center justify-center gap-4">
            {!selectedYear && (
              <p className="text-gray-400 text-sm">
                Selecione um ano para visualizar a prévia
              </p>
            )}
            {selectedYear && (
              <>
                <iframe
                  ref={iframeRef}
                  src={`/api/imposto-preview?year=${selectedYear}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-full rounded-md border"
                />
                <button
                  onClick={handlePrint}
                  className="bg-teal-500 text-sm text-white px-4 py-2 rounded-md hover:bg-teal-600 cursor-pointer"
                >
                  🖨️ Imprimir declaração
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}