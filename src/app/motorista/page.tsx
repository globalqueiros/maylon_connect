"use client";
import Banner from "../components/banner"
import { Eye, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image"; // 👈 IMPORTANTE

type User = {
  id: number;
  full_name: string;
  email: string;
};

type Trip = {
  trip_request_id: number;
  pickup_address: string;
  destination_address: string;
  valor: number;
  current_status: string;
};

export default function TripsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [rows, setRows] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const hora = new Date().getHours();
  const saudacao =
    hora < 12
      ? { texto: "Bom dia", emoji: "☀️" }
      : hora < 18
      ? { texto: "Boa tarde", emoji: "🌤️" }
      : { texto: "Boa noite", emoji: "🌙" };

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setUser(data))
      .catch(() => console.error("Erro ao buscar usuário"));
  }, []);

  useEffect(() => {
    fetch("/api/trips")
      .then((res) => res.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => console.error("Erro ao buscar viagens"))
      .finally(() => setLoading(false));
  }, []);

  const totalViagens = rows.length;

  const totalGasto = rows.reduce(
    (acc, item) => acc + Number(item.valor || 0),
    0
  );

  const traduzirStatus = (status: string) => {
    switch (status) {
      case "completed":
        return "Finalizada";
      case "cancelled":
        return "Cancelada";
      case "in_progress":
        return "Em andamento";
      case "pending":
        return "Pendente";
      default:
        return status;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <span className="animate-pulse">{saudacao.emoji}</span>
        <span>
          {saudacao.texto},{" "}
          <span className="text-teal-500">
            {user?.full_name || "Carregando..."}
          </span>
        </span>
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h5 className="text-lg font-semibold">Quantidade de Viagens</h5>
          <p className="text-black text-sm">{totalViagens}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h5 className="text-lg font-semibold">Gasto Total</h5>
          <p className="text-black text-sm">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totalGasto)}
          </p>
        </div>
      </div>

      <Banner />

      <div className="bg-white rounded-2xl shadow p-6">
        <h5 className="text-lg font-semibold mb-3">Últimas Viagens</h5>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr className="text-gray-600 uppercase text-xs">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Origem x Destino</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    Carregando viagens...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    Nenhuma corrida encontrada
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.trip_request_id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">#{item.trip_request_id}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-green-500" />
                          {item.pickup_address}
                        </div>
                        <span className="text-gray-400">→</span>
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-red-500" />
                          {item.destination_address}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {item.valor === 0 ? (
                        <span className="text-gray-400">Aguardando</span>
                      ) : (
                        new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.valor)
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          item.current_status === "completed"
                            ? "bg-green-100 text-green-600"
                            : item.current_status === "cancelled"
                            ? "bg-red-100 text-red-600"
                            : item.current_status === "in_progress"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {traduzirStatus(item.current_status)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Link
                        href={`/passageiro/trips/${item.trip_request_id}`}
                        className="text-teal-500 hover:text-teal-700"
                      >
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}