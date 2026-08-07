"use client";
import { Eye, MapPin, BriefcaseBusiness, CircleDollarSign, Clock3, ArrowRight, MoreVertical, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";

type User = {
  id: number;
  full_name: string;
  email: string;
};

type Trip = {
  destination_state: string;
  destination_city: string;
  pickup_state: string;
  pickup_city: string;
  trip_request_id: number;
  pickup_address: string;
  destination_address: string;
  valor: number;
  current_status: string;
  created_at: string;
};

type Banner = {
  id: number;
  image: string;
  title?: string;
};

export default function TripsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [rows, setRows] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const hora = new Date().getHours();

  let texto = "";
  let emoji = "";

  if (hora < 12) {
    texto = "Bom dia";
    emoji = "☀️";
  } else if (hora < 18) {
    texto = "Boa tarde";
    emoji = "🌤️";
  } else {
    texto = "Boa noite";
    emoji = "🌙";
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error("Erro ao buscar usuário");
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    fetch("/api/banners")
      .then((res) => res.json())
      .then((data) => setBanners(Array.isArray(data) ? data : []))
      .catch(() => console.error("Erro ao buscar banners"));
  }, []);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch("/api/trips");
        const data = await res.json();

        const lista = Array.isArray(data) ? data : [];
        setRows(lista);
      } catch (error) {
        console.error("Erro ao buscar viagens");
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const hoje = new Date();

  const totalGastoMes = rows
    .filter((item) => {
      if (!item.created_at) return false;

      const data = new Date(item.created_at);

      return (
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear()
      );
    })

    .reduce((total, item) => total + Number(item.valor || 0), 0);

  const totalViagensMes = rows.filter((item) => {
    if (!item.created_at) return false;

    const data = new Date(item.created_at);

    return (
      data.getMonth() === hoje.getMonth() &&
      data.getFullYear() === hoje.getFullYear()
    );
  }).length;

  const traduzirStatus = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluída";
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

  const ultimasViagens = [...rows]
    .filter((item) => {
      if (!item.created_at) return false;
      const data = new Date(item.created_at);
      const hoje = new Date();
      return (
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear()
      );
    })
    .sort((a, b) => b.trip_request_id - a.trip_request_id)
    .slice(0, 5);

  const corridasMesAtual = rows.filter((item) => {
    if (!item.created_at) return false;

    const data = new Date(item.created_at);

    return (
      data.getMonth() === hoje.getMonth() &&
      data.getFullYear() === hoje.getFullYear()
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
          <span className="animate-pulse text-2xl">{emoji}</span>
          <span className="text-2xl">
            {texto},{" "}
            <span className="text-[#19C2C6]">
              {user?.full_name || "Carregando..."}
            </span>
          </span>
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#149C8B] text-white">
            <BriefcaseBusiness size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#149C8B]">
              Quantidade de Viagens
            </h3>
            <p className="mt-0 text-xl font-bold text-gray-900">
              {totalViagensMes}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#149C8B] text-white">
            <CircleDollarSign size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#149C8B]">
              Gasto Total
            </h3>
            <p className="mt-0 text-xl font-bold text-gray-900">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalGastoMes)}
            </p>
          </div>
        </div>
      </div>
      {banners.length > 0 && (
        <div className="relative w-full aspect-[18/5] rounded-2xl overflow-hidden shadow-lg">
          <Image
            src={banners[0].image}
            alt="Banner"
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50">
              <Clock3 className="text-[#149C8B]" size={15} />
            </div>
            <h2 className="text-lg font-bold text-[#149C8B]">
              Últimas Viagens
            </h2>
          </div>
          <Link
            href="/passageiro/trips"
            className="flex items-center gap-2 rounded-xl border border-[#149C8B] px-5 py-2 text-sm font-semibold text-[#149C8B] transition hover:bg-[#149C8B] hover:text-white"
          >
            Ver todas
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-gradient-to-r text-sm text-center m-auto from-[#11897D] to-[#149C8B] text-white">
                <th className="rounded-tl-xl px-6 py-4 font-semibold">
                  Data
                </th>
                <th className="px-6 py-4 font-semibold">
                  Origem
                </th>
                <th className="px-6 py-4 font-semibold">
                  Destino
                </th>
                <th className="px-6 py-4 font-semibold">
                  Valor
                </th>
                <th className="px-6 py-4 font-semibold">
                  Status
                </th>
                <th className="rounded-tr-xl px-6 py-4 text-center"></th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-500"
                  >
                    Carregando viagens...
                  </td>
                </tr>
              ) : ultimasViagens.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center bg-red-100 text-red-700 font-medium"
                  >
                    Você ainda não possui viagens recentes.
                  </td>
                </tr>
              ) : (
                ultimasViagens.map((item) => (
                  <tr
                    key={item.trip_request_id}
                    className="border-b border-gray-100 transition hover:bg-gray-50"
                  >
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
                          <CalendarDays
                            size={22}
                            className="text-[#149C8B]"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.created_at &&
                              new Date(item.created_at).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {item.created_at &&
                              new Date(item.created_at).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex gap-3">
                        <MapPin
                          size={35}
                          className="mt-1 text-[#149C8B]"
                        />
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            {item.pickup_address}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.pickup_city || "São Paulo"} -{" "}
                            {item.pickup_state || "SP"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex gap-3">
                        <MapPin
                          size={35}
                          className="mt-1 text-[#149C8B]"
                        />
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            {item.destination_address}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.destination_city || "São Paulo"} -{" "}
                            {item.destination_state || "SP"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      {item.valor === 0 ? (
                        <span className="text-gray-400">
                          Aguardando
                        </span>
                      ) : (
                        <span className="text-base font-bold text-[#149C8B]">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(item.valor)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 align-top">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${item.current_status === "completed"
                          ? "bg-green-100 text-green-700"
                          : item.current_status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : item.current_status === "in_progress"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${item.current_status === "completed"
                            ? "bg-green-600"
                            : item.current_status === "cancelled"
                              ? "bg-red-600"
                              : item.current_status === "in_progress"
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                            }`}
                        />
                        {traduzirStatus(item.current_status)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center align-top">
                      <div className="flex items-center justify-center gap-3">
                        <Link
                          href={`/passageiro/trips/${item.trip_request_id}`}
                          className="rounded-lg p-2 transition hover:bg-gray-100"
                        >
                          <Eye
                            size={18}
                            className="text-[#149C8B]"
                          />
                        </Link>
                        <button className="rounded-lg cursor-pointer p-2 transition hover:bg-gray-100">
                          <MoreVertical
                            size={18}
                            className="text-gray-500"
                          />
                        </button>
                      </div>
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