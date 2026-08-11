"use client";

import {
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { fetchTripsSafe } from "../lib/authFetch";
import TripsTable, { type TripRow } from "../components/TripsTable";

type User = {
  id: number;
  full_name: string;
  email: string;
};

type Banner = {
  id: number;
  image: string;
  title?: string;
};

function isSameMonth(dateValue: string | null | undefined, ref: Date) {
  if (!dateValue) return false;
  const data = new Date(dateValue);
  if (Number.isNaN(data.getTime())) return false;
  return (
    data.getMonth() === ref.getMonth() && data.getFullYear() === ref.getFullYear()
  );
}

export default function PassageiroDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [rows, setRows] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const hora = new Date().getHours();

  const texto = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const emoji = hora < 12 ? "☀️" : hora < 18 ? "🌤️" : "🌙";

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const { user: me, trips } = await fetchTripsSafe();
        if (me?.id) setUser(me);
        setRows(Array.isArray(trips) ? trips : []);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    void loadDashboard();
  }, []);

  useEffect(() => {
    fetch("/api/banners", { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setBanners(
          list.filter(
            (b: Banner) =>
              typeof b?.image === "string" && b.image.trim().length > 0
          )
        );
      })
      .catch(() => console.error("Erro ao buscar banners"));
  }, []);

  const hoje = useMemo(() => new Date(), []);

  const viagensMes = useMemo(
    () => rows.filter((item) => isSameMonth(item.created_at, hoje)),
    [rows, hoje]
  );

  const totalGastoMes = useMemo(
    () =>
      viagensMes.reduce((total, item) => total + Number(item.valor || 0), 0),
    [viagensMes]
  );

  const totalViagensMes = viagensMes.length;

  const ultimasViagens = useMemo(
    () =>
      [...viagensMes]
        .sort(
          (a, b) => Number(b.trip_request_id) - Number(a.trip_request_id)
        )
        .slice(0, 5),
    [viagensMes]
  );

  return (
    <div className="space-y-6 p-6">
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#149C8B] text-white">
            <BriefcaseBusiness size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#149C8B]">
              Quantidade de Viagens
            </h3>
            <p className="mt-0 text-xl font-bold text-gray-900">
              {loading ? "—" : totalViagensMes}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#149C8B] text-white">
            <CircleDollarSign size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#149C8B]">Gasto Total</h3>
            <p className="mt-0 text-xl font-bold text-gray-900">
              {loading
                ? "—"
                : new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalGastoMes)}
            </p>
          </div>
        </div>
      </div>

      {banners[0]?.image ? (
        <div className="relative aspect-[18/5] w-full overflow-hidden rounded-2xl shadow-lg">
          <Image
            src={banners[0].image}
            alt={banners[0].title || "Banner"}
            fill
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50">
              <Clock3 className="text-[#149C8B]" size={15} />
            </div>
            <h2 className="text-lg font-bold text-[#149C8B]">Últimas Viagens</h2>
          </div>
          <Link
            href="/passageiro/viagens"
            className="flex items-center gap-2 rounded-xl border border-[#149C8B] px-5 py-2 text-sm font-semibold text-[#149C8B] transition hover:bg-[#149C8B] hover:text-white"
          >
            Ver todas
            <ArrowRight size={18} />
          </Link>
        </div>

        <TripsTable
          trips={ultimasViagens}
          loading={loading}
          emptyMessage="Você ainda não possui viagens recentes."
          headerTone="teal"
        />
      </div>
    </div>
  );
}
