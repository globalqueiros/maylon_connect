"use client";
import { useState, useEffect } from "react";
import Sidebar from "../passageiro/trips/[id]/components/sidebar";
import Header from "../passageiro/trips/[id]/components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar");
    if (saved) setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar", String(collapsed));
  }, [collapsed]);

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1">
        <Header toggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="p-6 bg-gray-50 min-h-screen">
          <h1>Olá, configurações</h1>
        </main>
      </div>
    </div>
  );
}