"use client";
import { useEffect, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    VLibras: any;
  }
  namespace React {
    interface HTMLAttributes<T> {
      vw?: string;
      "vw-access-button"?: string;
      "vw-plugin-wrapper"?: string;
    }
  }
}

export default function VLibras() {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !enabled) return null;

  return (
    <>
      <div vw="true" className="enabled">
        <div vw-access-button="true" className="active"></div>
        <div vw-plugin-wrapper="true">
          <div className="vw-plugin-top-wrapper"></div>
        </div>
      </div>
      <Script
        src="https://vlibras.gov.br/app/vlibras-plugin.js"
        strategy="lazyOnload"
        onLoad={() => {
          try {
            if (window.VLibras) {
              new window.VLibras.Widget("https://vlibras.gov.br/app");
            }
          } catch {
            // ignore widget init failures
          }
        }}
        onError={() => {
          // Offline / DNS failure — hide widget quietly
          setEnabled(false);
        }}
      />
    </>
  );
}
