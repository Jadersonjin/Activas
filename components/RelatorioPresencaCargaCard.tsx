import type { Ref } from "react";

export type NotaPresenca = {
  id: string;
  cliente: string;
  fornecedor: string;
  numeroNota: string;
  dataChegada: string; // já formatada
  observacao: string | null;
  statusProcesso: "PENDENTE" | "CLASSIFICADO";
  itens: { codigoProduto: string; descricao: string; quantidade: string; unidade: string }[];
};

export function RelatorioPresencaCargaCard({
  notas,
  geradoEm,
  innerRef,
}: {
  notas: NotaPresenca[];
  geradoEm: string;
  innerRef: Ref<HTMLDivElement>;
}) {
  return (
    <div ref={innerRef} className="w-[760px] bg-white">
      <div className="bg-ambar-500 text-center py-3">
        <p className="font-display font-bold text-white text-lg tracking-wide uppercase">Presença de Carga</p>
      </div>

      <div className="flex items-center justify-between px-8 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-brasmeg.png" alt="Brasmeg" width={110} height={88} className="object-contain" />
        <div className="text-right">
          <p className="text-xs text-ardosia-500">Emitido em</p>
          <p className="font-display text-sm font-medium text-ardosia-950">{geradoEm}</p>
        </div>
      </div>

      <div className="px-8 pb-6 space-y-6">
        {notas.map((n) => (
          <div key={n.id} className="border border-ardosia-200 rounded-sm overflow-hidden">
            <div className="bg-ardosia-800 px-4 py-2 flex flex-wrap justify-between items-center gap-x-6 gap-y-1">
              <p className="text-white text-xs">
                <span className="text-ardosia-400">Cliente:</span> {n.cliente}
              </p>
              <p className="text-white text-xs">
                <span className="text-ardosia-400">Fornecedor:</span> {n.fornecedor}
              </p>
              <p className="text-white text-xs">
                <span className="text-ardosia-400">NF:</span> {n.numeroNota}
              </p>
              <p className="text-white text-xs">
                <span className="text-ardosia-400">Chegada:</span> {n.dataChegada}
              </p>
              <span
                className={
                  n.statusProcesso === "CLASSIFICADO"
                    ? "text-[11px] font-medium text-verde-500 bg-white px-2 py-0.5 rounded-sm"
                    : "text-[11px] font-medium text-white bg-vermelho-500 px-2 py-0.5 rounded-sm"
                }
              >
                {n.statusProcesso === "CLASSIFICADO" ? "✓ Processo classificado" : "⏳ Processo pendente"}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ardosia-50 text-left text-[11px] text-ardosia-600 uppercase tracking-wide">
                  <th className="px-4 py-1.5 font-medium">Código</th>
                  <th className="px-4 py-1.5 font-medium">Descrição</th>
                  <th className="px-4 py-1.5 font-medium text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {n.itens.map((item, i) => (
                  <tr key={i} className="border-t border-ardosia-100">
                    <td className="px-4 py-1.5 font-mono text-xs">{item.codigoProduto}</td>
                    <td className="px-4 py-1.5 text-xs">{item.descricao}</td>
                    <td className="px-4 py-1.5 text-xs text-right font-mono">
                      {item.quantidade} {item.unidade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {n.observacao && (
              <p className="px-4 py-2 text-[11px] text-ardosia-500 border-t border-ardosia-100">Obs: {n.observacao}</p>
            )}
          </div>
        ))}
        {notas.length === 0 && (
          <p className="text-center text-sm text-ardosia-400 py-6">Nenhum registro no filtro selecionado.</p>
        )}
      </div>

      <div className="py-3 text-center border-t border-ardosia-100">
        <p className="text-[10px] text-ardosia-400">Brasmeg Transporte e Armazém Geral — relatório gerado automaticamente</p>
      </div>
    </div>
  );
}
