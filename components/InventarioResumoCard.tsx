import type { Ref } from "react";

export function InventarioResumoCard({
  nomeInventario,
  nomeCliente,
  total,
  ok,
  divergente,
  pendente,
  avulso,
  percentual,
  geradoEm,
  innerRef,
}: {
  nomeInventario: string;
  nomeCliente: string;
  total: number;
  ok: number;
  divergente: number;
  pendente: number;
  avulso: number;
  percentual: number;
  geradoEm: string;
  innerRef: Ref<HTMLDivElement>;
}) {
  return (
    <div ref={innerRef} className="w-[600px] bg-white">
      <div className="bg-ambar-500 text-center py-3">
        <p className="font-display font-bold text-white text-lg tracking-wide uppercase">Resumo do inventário</p>
      </div>

      <div className="flex items-center justify-between px-8 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-brasmeg.png" alt="Brasmeg" width={110} height={88} className="object-contain" />
        <div className="text-right">
          <p className="font-display text-base font-medium text-ardosia-950">{nomeInventario}</p>
          <p className="text-xs text-ardosia-500">{nomeCliente}</p>
        </div>
      </div>

      <div className="px-8 pb-2">
        <div className="flex items-end justify-between mb-1">
          <p className="text-xs text-ardosia-500">Progresso da contagem</p>
          <p className="font-display text-2xl font-bold text-ardosia-950">{percentual}%</p>
        </div>
        <div className="w-full h-3 bg-ardosia-100 rounded-full overflow-hidden">
          <div className="h-full bg-verde-500" style={{ width: `${percentual}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-px bg-ardosia-100 mt-5 mx-8 mb-6 border border-ardosia-100 rounded-sm overflow-hidden">
        <div className="bg-white text-center py-3">
          <p className="text-[11px] text-ardosia-500">Total</p>
          <p className="font-display text-xl">{total}</p>
        </div>
        <div className="bg-white text-center py-3">
          <p className="text-[11px] text-verde-500">Conferidos</p>
          <p className="font-display text-xl text-verde-500">{ok}</p>
        </div>
        <div className="bg-white text-center py-3">
          <p className="text-[11px] text-vermelho-500">Divergentes</p>
          <p className="font-display text-xl text-vermelho-500">{divergente}</p>
        </div>
        <div className="bg-white text-center py-3">
          <p className="text-[11px] text-ardosia-500">Pendentes</p>
          <p className="font-display text-xl text-ardosia-700">{pendente}</p>
        </div>
      </div>

      {avulso > 0 && (
        <p className="px-8 pb-4 text-xs text-ambar-600">
          + {avulso} item(ns) avulso(s) encontrado(s) que não estavam na planilha original
        </p>
      )}

      <div className="py-3 text-center border-t border-ardosia-100">
        <p className="text-[10px] text-ardosia-400">Gerado em {geradoEm} — Brasmeg Transporte e Armazém Geral</p>
      </div>
    </div>
  );
}
