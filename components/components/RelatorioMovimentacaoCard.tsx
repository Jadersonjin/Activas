import type { Ref } from "react";
import { labelTipoOperacao } from "@/lib/labels";

export type LinhaTipo = { tipo: string; veiculos: number; notas: number };

export function RelatorioMovimentacaoCard({
  nomeCliente,
  dataLabel,
  totalVeiculos,
  totalNotas,
  linhas,
  innerRef,
}: {
  nomeCliente: string;
  dataLabel: string;
  totalVeiculos: number;
  totalNotas: number;
  linhas: LinhaTipo[];
  innerRef: Ref<HTMLDivElement>;
}) {
  return (
    <div ref={innerRef} className="w-[720px] bg-white font-body" style={{ fontFamily: "var(--font-body)" }}>
      <div className="bg-ambar-500 text-center py-3">
        <p className="font-display font-bold text-white text-lg tracking-wide uppercase">
          Movimentação {nomeCliente}
        </p>
      </div>

      <div className="flex items-center justify-between px-8 py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-brasmeg.png" alt="Brasmeg" width={130} height={104} className="object-contain" />
        <p className="font-display text-xl font-medium text-ardosia-950">{dataLabel}</p>
      </div>

      <div className="grid grid-cols-2">
        <div className="bg-ardosia-800 text-center py-2">
          <p className="text-white text-xs font-medium uppercase tracking-wide">Total de veículos atendidos</p>
        </div>
        <div className="bg-ardosia-800 text-center py-2 border-l border-ardosia-950/30">
          <p className="text-white text-xs font-medium uppercase tracking-wide">Total de NF&apos;s</p>
        </div>
        <div className="text-center py-3">
          <p className="font-display text-2xl font-bold text-ardosia-950">{totalVeiculos}</p>
        </div>
        <div className="text-center py-3 border-l border-ardosia-100">
          <p className="font-display text-2xl font-bold text-ardosia-950">{totalNotas}</p>
        </div>
      </div>

      <table className="w-full text-sm mt-1">
        <thead>
          <tr className="bg-ardosia-800 text-white text-xs uppercase tracking-wide">
            <th className="py-2 px-4 text-left font-medium">Tipo de operação</th>
            <th className="py-2 px-4 text-center font-medium">Veículos atendidos</th>
            <th className="py-2 px-4 text-center font-medium">Quantidade de notas</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={l.tipo} className={i % 2 === 0 ? "bg-ardosia-50" : "bg-white"}>
              <td className="py-2 px-4 text-ardosia-700 font-medium">{labelTipoOperacao(l.tipo)}</td>
              <td className="py-2 px-4 text-center font-mono">{l.veiculos}</td>
              <td className="py-2 px-4 text-center font-mono">{l.notas}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="py-3 text-center">
        <p className="text-[10px] text-ardosia-400">Brasmeg Transporte e Armazém Geral — relatório gerado automaticamente</p>
      </div>
    </div>
  );
}
