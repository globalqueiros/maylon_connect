"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPage() {
  const params = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");

  const handleReset = async () => {
    await fetch("/api/auth/reset", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });

    alert("Senha alterada!");
  };

  return (
    <div className="p-5">
      <input
        type="password"
        placeholder="Nova senha"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleReset}>Salvar</button>
    </div>
  );
}