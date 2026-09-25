"use client";

import { useRef } from "react";
import { InventarioResumoCard } from "@/components/InventarioResumoCard";
import { DownloadPngButton } from "@/components/DownloadPngButton";

export function InventarioResumoReport(props: {
  nomeInventario: string;
  nomeCliente: string;
  total: number;
  ok: number;
  divergente: number;
  pendente: number;
  avulso: number;
  percentual: number;
  geradoEm: string;
  nomeArquivo: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3">
      <DownloadPngButton targetRef={ref} nomeArquivo={props.nomeArquivo} formato="pdf">
        ⬇ Baixar resumo (PDF)
      </DownloadPngButton>
      <div className="border border-ardosia-200 rounded-sm inline-block">
        <InventarioResumoCard innerRef={ref} {...props} />
      </div>
    </div>
  );
}
