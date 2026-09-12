import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { fmtData, fmtDataHora } from "@/lib/br-date";
import {
  atualizarObservacaoItem,
  liberarInventario,
  fecharRodada,
} from "@/lib/actions/inventarios";

const LABEL_OBSERVACAO: Record<string, string> = {
  JA_TRATADO: "Já tratado em inventário anterior",
  TRATATIVA_ADMINISTRATIVA: "Tratativa administrativa",
  OUTRO: "Outro",
};

export default async function InventarioDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await getSession())!;

  const inventario = await db.inventario.findUnique({
    where: { id },
    include: {
      cliente: true,
      itens: { orderBy: { descricao: "asc" } },
      rodadas: { orderBy: { numero: "asc" } },
    },
  });
  if (!inventario) notFound();

  const contagens = await db.inventarioContagem.findMany({
    where: { itemEsperado: { inventarioId: id } },
    orderBy: { criadoEm: "desc" },
  });

  const contagensPorItem = new Map<string, typeof contagens>();
  for (const c of contagens) {
    if (!contagensPorItem.has(c.itemEsperadoId)) contagensPorItem.set(c.itemEsperadoId, []);
    contagensPorItem.get(c.itemEsperadoId)!.push(c);
  }

  function statusItem(itemId: string, quantidadeEsperada: number) {
    const lista = contagensPorItem.get(itemId) || [];
    if (lista.length === 0) return "PENDENTE" as const;
    const bateu = lista.some((c) => Number(c.quantidadeContada) === quantidadeEsperada);
    return bateu ? ("OK" as const) : ("DIVERGENTE" as const);
  }

  const rodadaAtiva = inventario.rodadas.find((r) => r.status === "ABERTA");
  const totalPendentes = inventario.itens.filter(
    (item) => statusItem(item.id, Number(item.quantidadeEsperada)) !== "OK"
  ).length;

  return (
    <AppShell session={session}>
      <header className="mb-8 flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-xs text-ardosia-600">07 · INVENTÁRIO</p>
          <h1 className="font-display text-2xl font-medium mt-1">{inventario.nome}</h1>
          <p className="text-sm text-ardosia-500 mt-1">
            {inventario.cliente.nome} · {inventario.itens.length} itens ·{" "}
            {inventario.status === "PREPARANDO"
              ? "Preparando"
              : inventario.status === "EM_CONTAGEM"
              ? `Em contagem (rodada ${rodadaAtiva?.numero})`
              : "Finalizado"}
          </p>
        </div>

        <div className="flex gap-2">
          <a
            href={`/api/inventarios/${inventario.id}/export`}
            className="text-sm border border-ardosia-300 rounded-sm px-4 py-2 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white whitespace-nowrap"
          >
            ⬇ Baixar Excel
          </a>

          {inventario.status === "PREPARANDO" && (
            <form action={liberarInventario.bind(null, inventario.id)}>
              <button className="bg-ambar-500 hover:bg-ambar-600 text-ardosia-950 font-medium text-sm rounded-sm px-4 py-2 transition-colors whitespace-nowrap">
                Liberar pro conferente
              </button>
            </form>
          )}

          {inventario.status === "EM_CONTAGEM" && rodadaAtiva && (
            <form action={fecharRodada.bind(null, rodadaAtiva.id)}>
              <button className="bg-ardosia-950 hover:bg-ardosia-900 text-ardosia-50 text-sm rounded-sm px-4 py-2 transition-colors whitespace-nowrap">
                Fechar rodada {rodadaAtiva.numero} {totalPendentes > 0 ? `(${totalPendentes} vão pra recontagem)` : "(finalizar)"}
              </button>
            </form>
          )}
        </div>
      </header>

      <div className="border border-ardosia-200 rounded-sm bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ardosia-100 text-left text-xs text-ardosia-600 uppercase tracking-wide">
              <th className="px-4 py-2 font-normal">Descrição</th>
              <th className="px-4 py-2 font-normal">Lote</th>
              <th className="px-4 py-2 font-normal">Esperado</th>
              <th className="px-4 py-2 font-normal">Contado</th>
              <th className="px-4 py-2 font-normal">Localização</th>
              <th className="px-4 py-2 font-normal">Status</th>
              <th className="px-4 py-2 font-normal">Observação (Radar)</th>
            </tr>
          </thead>
          <tbody>
            {inventario.itens.map((item) => {
              const lista = contagensPorItem.get(item.id) || [];
              const ultima = lista[0];
              const status = statusItem(item.id, Number(item.quantidadeEsperada));
              const acaoObs = atualizarObservacaoItem.bind(null, item.id);
              return (
                <tr
                  key={item.id}
                  className={
                    status === "OK"
                      ? "border-t border-ardosia-100 bg-verde-500/5"
                      : status === "DIVERGENTE"
                      ? "border-t border-ardosia-100 bg-vermelho-500/5"
                      : "border-t border-ardosia-100"
                  }
                >
                  <td className="px-4 py-2">{item.descricao}</td>
                  <td className="px-4 py-2 font-mono text-xs">{item.lote}</td>
                  <td className="px-4 py-2 font-mono">{item.quantidadeEsperada.toString()}</td>
                  <td className="px-4 py-2 font-mono">{ultima ? ultima.quantidadeContada.toString() : "—"}</td>
                  <td className="px-4 py-2 text-xs">{ultima?.localizacao || "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        status === "OK"
                          ? "text-xs font-medium text-verde-500"
                          : status === "DIVERGENTE"
                          ? "text-xs font-medium text-vermelho-500"
                          : "text-xs text-ardosia-400"
                      }
                    >
                      {status === "OK" ? "✓ OK" : status === "DIVERGENTE" ? "✕ Divergente" : "Pendente"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {inventario.status === "PREPARANDO" ? (
                      <form action={acaoObs} className="flex flex-wrap gap-1 items-center">
                        <select
                          name="tipoObservacao"
                          defaultValue={item.tipoObservacao || ""}
                          className="text-xs border border-ardosia-200 rounded-sm px-1.5 py-1 outline-none focus:border-ambar-500"
                        >
                          <option value="">—</option>
                          <option value="JA_TRATADO">Já tratado antes</option>
                          <option value="TRATATIVA_ADMINISTRATIVA">Tratativa administrativa</option>
                          <option value="OUTRO">Outro</option>
                        </select>
                        <input
                          name="observacao"
                          defaultValue={item.observacao || ""}
                          placeholder="Nota (opcional)"
                          className="text-xs border border-ardosia-200 rounded-sm px-1.5 py-1 outline-none focus:border-ambar-500 w-28"
                        />
                        <button className="text-[11px] text-ardosia-500 hover:text-ambar-600">salvar</button>
                      </form>
                    ) : item.tipoObservacao ? (
                      <span className="text-xs text-ambar-600 bg-ambar-500/10 px-2 py-0.5 rounded-sm">
                        {LABEL_OBSERVACAO[item.tipoObservacao] || item.tipoObservacao}
                        {item.observacao ? ` — ${item.observacao}` : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-ardosia-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {contagens.length > 0 && (
        <div className="mt-8 border border-ardosia-200 rounded-sm bg-white p-5">
          <h2 className="font-display text-sm font-medium mb-3">Histórico de apontamentos</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ardosia-600 uppercase tracking-wide">
                <th className="py-1.5 font-normal">Quando</th>
                <th className="py-1.5 font-normal">Conferente</th>
                <th className="py-1.5 font-normal">Item</th>
                <th className="py-1.5 font-normal">Quantidade</th>
                <th className="py-1.5 font-normal">Localização</th>
              </tr>
            </thead>
            <tbody>
              {contagens.slice(0, 50).map((c) => {
                const item = inventario.itens.find((i) => i.id === c.itemEsperadoId);
                return (
                  <tr key={c.id} className="border-t border-ardosia-100">
                    <td className="py-1.5 font-mono text-xs">{fmtDataHora(c.criadoEm)}</td>
                    <td className="py-1.5 text-xs">{c.conferenteNome}</td>
                    <td className="py-1.5 text-xs">
                      {item?.descricao} ({item?.lote})
                    </td>
                    <td className="py-1.5 font-mono text-xs">{c.quantidadeContada.toString()}</td>
                    <td className="py-1.5 text-xs">{c.localizacao}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
