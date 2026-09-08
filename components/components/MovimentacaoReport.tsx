"use client";

import { useRef } from "react";
import { RelatorioMovimentacaoCard, type LinhaTipo } from "@/components/RelatorioMovimentacaoCard";
import { DownloadPngButton } from "@/components/DownloadPngButton";

export function MovimentacaoReport({
  nomeCliente,
  dataLabel,
  totalVeiculos,
  totalNotas,
  linhas,
  nomeArquivo,
}: {
  nomeCliente: string;
  dataLabel: string;
  totalVeiculos: number;
  totalNotas: number;
  linhas: LinhaTipo[];
  nomeArquivo: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DownloadPngButton targetRef={ref} nomeArquivo={nomeArquivo} />
      </div>
      <div className="border border-ardosia-200 rounded-sm overflow-hidden inline-block">
        <RelatorioMovimentacaoCard
          innerRef={ref}
          nomeCliente={nomeCliente}
          dataLabel={dataLabel}
          totalVeiculos={totalVeiculos}
          totalNotas={totalNotas}
          linhas={linhas}
        />
      </div>
    </div>
  );
}
