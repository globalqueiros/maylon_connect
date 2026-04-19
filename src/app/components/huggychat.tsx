"use client";
import { useEffect } from "react";

export default function HuggyChat() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).Huggy) return;
    if (document.getElementById("huggy-script")) return;
    (window as any).$_Huggy = {
      defaultCountry: "+55",
      uuid: "2899aa9e-fddf-44cf-9bc1-0c66f858da06",
      company: "349867",
    };
    const script = document.createElement("script");
    script.src = "https://js.huggy.chat/widget.min.js";
    script.async = true;
    script.id = "huggy-script";
    (window as any).pwz = {
      context: { id: "92a95f06b713c4d664238eaabe87870f" },
    };
    document.body.appendChild(script);
  }, []);
  return null;
}