"use client";

import { useState, type RefObject, type ReactNode } from "react";

export function DownloadPngButton({
  targetRef,
  nomeArquivo,
  children = "⬇ Baixar imagem (PNG)",
}: {
  targetRef: RefObject<HTMLElement | null>;
  nomeArquivo: string;
  children?: ReactNode;
}) {
  const [gerando, setGerando] = useState(false);

  async function baixar() {
    if (!targetRef.current) return;
    setGerando(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(targetRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = nomeArquivo;
      link.href = dataUrl;
      link.click();
    } finally {
      setGerando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={baixar}
      disabled={gerando}
      className="text-sm border border-ardosia-300 rounded-sm px-4 py-2 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white disabled:opacity-60 whitespace-nowrap"
    >
      {gerando ? "Gerando imagem..." : children}
    </button>
  );
}
