"use client";

import { useState, type RefObject, type ReactNode } from "react";

export function DownloadPngButton({
  targetRef,
  nomeArquivo,
  formato = "png",
  children,
}: {
  targetRef: RefObject<HTMLElement | null>;
  nomeArquivo: string;
  formato?: "png" | "pdf";
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

      if (formato === "pdf") {
        const { jsPDF } = await import("jspdf");
        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        const pdf = new jsPDF({
          orientation: img.width > img.height ? "landscape" : "portrait",
          unit: "px",
          format: [img.width, img.height],
        });
        pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
        pdf.save(nomeArquivo);
      } else {
        const link = document.createElement("a");
        link.download = nomeArquivo;
        link.href = dataUrl;
        link.click();
      }
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
      {gerando
        ? formato === "pdf"
          ? "Gerando PDF..."
          : "Gerando imagem..."
        : children || (formato === "pdf" ? "⬇ Baixar PDF" : "⬇ Baixar imagem (PNG)")}
    </button>
  );
}
