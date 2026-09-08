"use client";

import { useRef } from "react";
import { RelatorioPresencaCargaCard, type NotaPresenca } from "@/components/RelatorioPresencaCargaCard";
import { DownloadPngButton } from "@/components/DownloadPngButton";

export function PresencaCargaReport({
  notas,
  geradoEm,
  nomeArquivo,
}: {
  notas: NotaPresenca[];
  geradoEm: string;
  nomeArquivo: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3">
      <DownloadPngButton targetRef={ref} nomeArquivo={nomeArquivo}>
        ⬇ Baixar relatório para envio (PNG)
      </DownloadPngButton>
      <div className="border border-ardosia-200 rounded-sm inline-block max-h-[70vh] overflow-y-auto">
        <RelatorioPresencaCargaCard innerRef={ref} notas={notas} geradoEm={geradoEm} />
      </div>
    </div>
  );
}
