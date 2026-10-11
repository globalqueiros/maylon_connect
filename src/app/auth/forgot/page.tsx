"use client";
import { useState } from "react";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const handleSend = async () => {
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    if (res.ok) setMsg("Email enviado!");
    else setMsg("Erro ao enviar");
  };

  return (
    <div className="p-5">
      <input
        type="email"
        placeholder="Seu email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleSend}>Enviar</button>
      <p>{msg}</p>
    </div>
  );
}