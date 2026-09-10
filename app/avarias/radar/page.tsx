import Link from "next/link";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { fmtData } from "@/lib/br-date";

export default async function RadarPage() {
  const session = (await getSession())!;

  const itensRadar = await db.avaria.findMany({
    where: { origem: "RADAR" },
    orderBy: { data: "desc" },
    include: { cliente: true },
  });

  // Agrupa por cliente + código do produto, pra dar visão geral de quais itens estão sob monitoramento
  const grupos = new Map<
    string,
    { cliente: string; codigoProduto: string; descricao: string; ocorrencias: typeof itensRadar }
  >();
  for (const a of itensRadar) {
    const chave = `${a.clienteId}::${a.codigoProduto.toLowerCase()}`;
    if (!grupos.has(chave)) {
      grupos.set(chave, {
        cliente: a.cliente.nome,
        codigoProduto: a.codigoProduto,
        descricao: a.descricao,
        ocorrencias: [],
      });
    }
    grupos.get(chave)!.ocorrencias.push(a);
  }
  const listaGrupos = Array.from(grupos.values()).sort((a, b) => b.ocorrencias.length - a.ocorrencias.length);

  return (
    <AppShell session={session}>
      <header className="mb-8 flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-xs text-ardosia-600">04 · AVARIAS</p>
          <h1 className="font-display text-2xl font-medium mt-1">Painel do Radar</h1>
          <p className="text-sm text-ardosia-500 mt-1">
            Produtos com avaria interna monitorada. Aparece um aviso automático quando algum desses
            códigos entra numa nova presença de carga.
          </p>
        </div>
        <Link
          href="/avarias"
          className="text-sm border border-ardosia-300 rounded-sm px-4 py-2 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white"
        >
          ← Voltar pra Avarias
        </Link>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="border border-ardosia-200 bg-white rounded-sm p-5">
          <p className="text-xs text-ardosia-500 mb-2">Produtos monitorados</p>
          <p className="font-display text-3xl">{listaGrupos.length}</p>
        </div>
        <div className="border border-ardosia-200 bg-white rounded-sm p-5">
          <p className="text-xs text-ardosia-500 mb-2">Ocorrências no Radar</p>
          <p className="font-display text-3xl">{itensRadar.length}</p>
        </div>
        <div className="border border-ardosia-200 bg-white rounded-sm p-5">
          <p className="text-xs text-ardosia-500 mb-2">Clientes com itens no Radar</p>
          <p className="font-display text-3xl">{new Set(itensRadar.map((a) => a.clienteId)).size}</p>
        </div>
      </div>

      <div className="space-y-4">
        {listaGrupos.map((g) => (
          <div key={`${g.cliente}-${g.codigoProduto}`} className="border border-ardosia-200 rounded-sm bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-ambar-500/10 border-b border-ambar-500/30">
              <div>
                <p className="font-mono text-xs text-ardosia-700">{g.codigoProduto}</p>
                <p className="text-sm text-ardosia-800">{g.descricao}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ardosia-500">{g.cliente}</p>
                <p className="text-xs font-medium text-ambar-600">{g.ocorrencias.length} ocorrência(s)</p>
              </div>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {g.ocorrencias.map((o) => (
                  <tr key={o.id} className="border-t border-ardosia-100">
                    <td className="px-4 py-1.5 font-mono text-xs w-28">{fmtData(o.data)}</td>
                    <td className="px-4 py-1.5 text-xs text-ardosia-500">
                      {o.lote ? `Lote ${o.lote} · ` : ""}
                      {o.pesoAvaria.toString()} kg
                      {o.observacao ? ` — ${o.observacao}` : ""}
                    </td>
                    <td className="px-4 py-1.5 text-right">
                      <Link href={`/avarias/${o.id}/editar`} className="text-xs text-ardosia-500 hover:text-ambar-600">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {listaGrupos.length === 0 && (
          <p className="text-sm text-ardosia-400 text-center py-8">Nenhum item no Radar no momento.</p>
        )}
      </div>
    </AppShell>
  );
}
