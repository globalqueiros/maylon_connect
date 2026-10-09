"use client";

import { useEffect } from "react";

const NVOIP_SCRIPT_ID = "nvoip-init-widget";

export default function NvoipWidget() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const existingScript = document.getElementById(NVOIP_SCRIPT_ID);

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");

    script.id = NVOIP_SCRIPT_ID;
    script.src =
      "https://content.nvoip.com.br/widget/nvoip-widget-loader.js?public-token=693d7e052a1559c662e39588732dc5150de0e30e";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      const loadedScript = document.getElementById(NVOIP_SCRIPT_ID);

      if (loadedScript) {
        loadedScript.remove();
      }
    };
  }, []);

  return null;
}