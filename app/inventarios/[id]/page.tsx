import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { InventarioResumoReport } from "@/components/InventarioResumoReport";
import { Cronometro } from "@/components/Cronometro";
import { db } from "@/lib/db";
import { fmtData, fmtDataHora } from "@/lib/br-date";
import { calcularGrupos } from "@/lib/inventario-helpers";
import {
  atualizarObservacaoItem,
  liberarInventario,
  fecharRodada,
  liberarProximaRodada,
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

  const [contagens, grupos] = await Promise.all([
    db.inventarioContagem.findMany({
      where: { itemEsperado: { inventarioId: id } },
      orderBy: { criadoEm: "desc" },
    }),
    calcularGrupos(id),
  ]);

  const contagensPorItem = new Map<string, typeof contagens>();
  for (const c of contagens) {
    if (!contagensPorItem.has(c.itemEsperadoId)) contagensPorItem.set(c.itemEsperadoId, []);
    contagensPorItem.get(c.itemEsperadoId)!.push(c);
  }

  const statusPorItem = new Map<string, "OK" | "DIVERGENTE" | "PENDENTE">();
  for (const g of grupos) {
    for (const d of g.itensDetalhe) statusPorItem.set(d.item.id, g.status);
  }

  const rodadaAtiva = inventario.rodadas.find((r) => r.status === "ABERTA");

  const totalItens = inventario.itens.length;
  const totalGrupos = grupos.length;
  const gruposOk = grupos.filter((g) => g.status === "OK").length;
  const gruposDivergente = grupos.filter((g) => g.status === "DIVERGENTE").length;
  const gruposPendente = grupos.filter((g) => g.status === "PENDENTE").length;
  const avulsoCount = inventario.itens.filter((i) => i.avulso).length;
  const percentual = totalGrupos > 0 ? Math.round((gruposOk / totalGrupos) * 100) : 0;
  const totalPendentes = grupos.filter((g) => g.status !== "OK").reduce((soma, g) => {
    return soma + (g.status === "DIVERGENTE" ? g.itensDetalhe.length : g.itensDetalhe.filter((d) => !d.ultimaContagem).length);
  }, 0);

  return (
    <AppShell session={session}>
      <header className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-xs text-ardosia-600">07 · INVENTÁRIO</p>
          <h1 className="font-display text-2xl font-medium mt-1">{inventario.nome}</h1>
          <p className="text-sm text-ardosia-500 mt-1">
            {inventario.cliente.nome} · {totalGrupos} lote(s) · {totalItens} posição(ões) ·{" "}
            {inventario.status === "PREPARANDO"
              ? "Preparando"
              : inventario.status === "EM_CONTAGEM"
              ? `Em contagem (rodada ${rodadaAtiva?.numero})`
              : inventario.status === "AGUARDANDO_LIBERACAO"
              ? "Aguardando liberação da recontagem"
              : "Finalizado"}
            {inventario.status !== "PREPARANDO" ? ` · ${percentual}% conferido` : ""}
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
                Concluir rodada {rodadaAtiva.numero} {totalPendentes > 0 ? `(${totalPendentes} posições)` : "(finalizar)"}
              </button>
            </form>
          )}

          {inventario.status === "AGUARDANDO_LIBERACAO" && (
            <form action={liberarProximaRodada.bind(null, inventario.id)}>
              <button className="bg-ambar-500 hover:bg-ambar-600 text-ardosia-950 font-medium text-sm rounded-sm px-4 py-2 transition-colors whitespace-nowrap">
                Liberar recontagem — rodada {(inventario.rodadas[inventario.rodadas.length - 1]?.numero || 0) + 1} ({totalPendentes} posições)
              </button>
            </form>
          )}
        </div>
      </header>

      {inventario.status === "AGUARDANDO_LIBERACAO" && (
        <div className="mb-6 border border-ambar-500/40 bg-ambar-500/10 rounded-sm px-4 py-3 text-sm text-ardosia-700">
          A contagem foi concluída. {gruposDivergente} lote(s) divergente(s) e {gruposPendente} pendente(s) estão
          na tabela abaixo. A recontagem só abre pro conferente quando você clicar em{" "}
          <strong>Liberar recontagem</strong>.
        </div>
      )}

      {inventario.status !== "PREPARANDO" && (
        <div className="mb-8 border border-ardosia-200 rounded-sm bg-white p-4">
          <div className="flex items-end justify-between mb-1">
            <p className="text-xs text-ardosia-500">Progresso da contagem (por lote)</p>
            <p className="font-display text-xl font-bold">{percentual}%</p>
          </div>
          <div className="w-full h-2.5 bg-ardosia-100 rounded-full overflow-hidden">
            <div className="h-full bg-verde-500" style={{ width: `${percentual}%` }} />
          </div>
          <p className="text-xs text-ardosia-500 mt-2">
            {gruposOk} lotes conferidos · {gruposDivergente} divergentes · {gruposPendente} pendentes de{" "}
            {totalGrupos} lotes
            {avulsoCount > 0 ? ` · ${avulsoCount} posição(ões) avulsa(s)` : ""}
          </p>
        </div>
      )}

      {inventario.rodadas.length > 0 && (
        <div className="mb-8 border border-ardosia-200 rounded-sm bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-ardosia-500">Tempo total do inventário</p>
            <p className="font-display text-lg font-bold">
              <Cronometro
                inicio={inventario.rodadas[0].criadoEm.toISOString()}
                fim={inventario.finalizadoEm?.toISOString() || null}
              />
            </p>
          </div>
          <div className="space-y-1.5">
            {inventario.rodadas.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs text-ardosia-600">
                <span>
                  Rodada {r.numero} — início {fmtDataHora(r.criadoEm)}
                  {r.fechadaEm ? ` · fim ${fmtDataHora(r.fechadaEm)}` : " · em andamento"}
                </span>
                <Cronometro
                  inicio={r.criadoEm.toISOString()}
                  fim={r.fechadaEm?.toISOString() || null}
                  className="font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumo por lote — é isso que decide se bateu ou não (soma de todas as posições) */}
      <div className="border border-ardosia-200 rounded-sm bg-white overflow-x-auto mb-8">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="bg-ardosia-100 text-left text-xs text-ardosia-600 uppercase tracking-wide">
              <th className="px-4 py-2 font-normal">Código</th>
              <th className="px-4 py-2 font-normal">Descrição</th>
              <th className="px-4 py-2 font-normal">Lote</th>
              <th className="px-4 py-2 font-normal">Posições</th>
              <th className="px-4 py-2 font-normal">Esperado (total)</th>
              <th className="px-4 py-2 font-normal">Contado (total)</th>
              <th className="px-4 py-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => (
              <tr
                key={g.chave}
                className={
                  g.status === "OK"
                    ? "border-t border-ardosia-100 bg-verde-500/5"
                    : g.status === "DIVERGENTE"
                    ? "border-t border-ardosia-100 bg-vermelho-500/5"
                    : "border-t border-ardosia-100"
                }
              >
                <td className="px-4 py-2 font-mono text-xs">{g.codigoProduto || "—"}</td>
                <td className="px-4 py-2">{g.descricao}</td>
                <td className="px-4 py-2 font-mono text-xs">{g.lote}</td>
                <td className="px-4 py-2 font-mono text-xs">{g.itensDetalhe.length}</td>
                <td className="px-4 py-2 font-mono">{g.esperadoTotal}</td>
                <td className="px-4 py-2 font-mono">{g.todosContados ? g.contadoTotal : "—"}</td>
                <td className="px-4 py-2">
                  <span
                    className={
                      g.status === "OK"
                        ? "text-xs font-medium text-verde-500"
                        : g.status === "DIVERGENTE"
                        ? "text-xs font-medium text-vermelho-500"
                        : "text-xs text-ardosia-400"
                    }
                  >
                    {g.status === "OK" ? "✓ OK" : g.status === "DIVERGENTE" ? "✕ Divergente" : "Pendente"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detalhe por posição — informativo, pra localizar onde cada quantidade foi contada */}
      <details className="border border-ardosia-200 rounded-sm bg-white">
        <summary className="px-4 py-3 font-display text-sm font-medium cursor-pointer">
          Detalhe por posição
        </summary>
        <div className="overflow-x-auto border-t border-ardosia-100">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="bg-ardosia-100 text-left text-xs text-ardosia-600 uppercase tracking-wide">
                <th className="px-4 py-2 font-normal">Armazém</th>
                <th className="px-4 py-2 font-normal">Posição</th>
                <th className="px-4 py-2 font-normal">Código</th>
                <th className="px-4 py-2 font-normal">Descrição</th>
                <th className="px-4 py-2 font-normal">Lote</th>
                <th className="px-4 py-2 font-normal">Esperado</th>
                <th className="px-4 py-2 font-normal">Contado</th>
                <th className="px-4 py-2 font-normal">Localização</th>
                <th className="px-4 py-2 font-normal">Lote (status)</th>
                <th className="px-4 py-2 font-normal">Observação (Radar)</th>
              </tr>
            </thead>
            <tbody>
              {inventario.itens.map((item) => {
                const lista = contagensPorItem.get(item.id) || [];
                const ultima = lista[0];
                const statusLote = statusPorItem.get(item.id) || "PENDENTE";
                const acaoObs = atualizarObservacaoItem.bind(null, item.id);
                return (
                  <tr key={item.id} className="border-t border-ardosia-100">
                    <td className="px-4 py-2 text-xs">{item.armazem || "—"}</td>
                    <td className="px-4 py-2 text-xs font-medium">{item.posicao || "—"}</td>
                    <td className="px-4 py-2 font-mono text-xs">{item.codigoProduto || "—"}</td>
                    <td className="px-4 py-2">
                      {item.descricao}
                      {item.avulso && (
                        <span className="ml-2 text-[10px] text-ambar-600 bg-ambar-500/10 px-1.5 py-0.5 rounded-sm">
                          avulso
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{item.lote}</td>
                    <td className="px-4 py-2 font-mono">{item.quantidadeEsperada.toString()}</td>
                    <td className="px-4 py-2 font-mono">{ultima ? ultima.quantidadeContada.toString() : "—"}</td>
                    <td className="px-4 py-2 text-xs">{ultima?.localizacao || "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          statusLote === "OK"
                            ? "text-[11px] text-verde-500"
                            : statusLote === "DIVERGENTE"
                            ? "text-[11px] text-vermelho-500"
                            : "text-[11px] text-ardosia-400"
                        }
                      >
                        {statusLote === "OK" ? "lote OK" : statusLote === "DIVERGENTE" ? "lote divergente" : "lote pendente"}
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
      </details>

      {inventario.status !== "PREPARANDO" && (
        <details className="mt-8 border border-ardosia-200 rounded-sm bg-white p-5">
          <summary className="font-display text-sm font-medium cursor-pointer">
            Resumo pra enviar ao gerente
          </summary>
          <div className="mt-4">
            <InventarioResumoReport
              nomeInventario={inventario.nome}
              nomeCliente={inventario.cliente.nome}
              total={totalGrupos}
              ok={gruposOk}
              divergente={gruposDivergente}
              pendente={gruposPendente}
              avulso={avulsoCount}
              percentual={percentual}
              geradoEm={fmtDataHora(new Date())}
              nomeArquivo={`inventario-${inventario.nome.toLowerCase().replace(/\s+/g, "-")}-resumo.pdf`}
            />
          </div>
        </details>
      )}

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
                      {item?.descricao} ({item?.lote}
                      {item?.posicao ? ` · ${item.posicao}` : ""})
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
