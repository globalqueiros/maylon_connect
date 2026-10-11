"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const savedSidebar = localStorage.getItem("sidebar");
    if (savedSidebar !== null) {
      setCollapsed(savedSidebar === "true");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("sidebar", String(collapsed));
    }
  }, [collapsed, mounted]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1">
        <Header
          toggleSidebar={() =>
            setCollapsed((prev) => !prev)
          }
        />
        <main className="p-4 min-h-screen bg-gradient-to-b from-[#0B6F68] via-[#35A78D] via-40% to-white">
          {children}
        </main>
      </div>
    </div>
  );
}