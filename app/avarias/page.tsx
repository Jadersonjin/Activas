import Link from "next/link";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { Pagination } from "@/components/Pagination";
import { db } from "@/lib/db";
import { registrarAvaria } from "@/lib/actions/avarias";
import { AvariaProdutoFields } from "@/components/AvariaProdutoFields";
import { rangeDia } from "@/lib/date-range";
import { fmtData } from "@/lib/br-date";
import { paginar, totalPaginas as calcTotalPaginas } from "@/lib/pagination";

function labelOrigem(v: string) {
  return v === "RADAR" ? "Radar" : "Avaria de origem";
}

export default async function AvariasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; de?: string; ate?: string; origem?: string; pagina?: string }>;
}) {
  const { q, de, ate, origem, pagina } = await searchParams;
  const session = (await getSession())!;
  const { skip, take, paginaAtual } = paginar(pagina);
  const where = {
    data: rangeDia(de, ate),
    ...(origem ? { origem } : {}),
    ...(q
      ? {
          OR: [
            { codigoProduto: { contains: q, mode: "insensitive" as const } },
            { descricao: { contains: q, mode: "insensitive" as const } },
            { lote: { contains: q, mode: "insensitive" as const } },
            { numeroNota: { contains: q, mode: "insensitive" as const } },
            { localizacao: { contains: q, mode: "insensitive" as const } },
            { cliente: { nome: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
  const [avarias, total, clientes] = await Promise.all([
    db.avaria.findMany({ where, orderBy: { data: "desc" }, skip, take, include: { cliente: true } }),
    db.avaria.count({ where }),
    db.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const temFiltro = Boolean(q || de || ate || origem);

  return (
    <AppShell session={session}>
      <header className="mb-8 flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-xs text-ardosia-600">04 · AVARIAS</p>
          <h1 className="font-display text-2xl font-medium mt-1">Controle de avarias</h1>
        </div>
        <Link
          href="/avarias/radar"
          className="text-sm border border-ambar-500/50 text-ambar-600 rounded-sm px-4 py-2 hover:bg-ambar-500/10 transition-colors bg-white"
        >
          🎯 Painel do Radar
        </Link>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div>
          <form action="/avarias" className="flex flex-wrap items-end gap-2 mb-4">
            <div>
              <label className="block text-[11px] text-ardosia-500 mb-1">Buscar</label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Produto, lote, nota, local, cliente..."
                className="w-full max-w-xs border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-ardosia-500 mb-1">Tipo</label>
              <select
                name="origem"
                defaultValue={origem || ""}
                className="border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500 bg-white"
              >
                <option value="">Todos</option>
                <option value="ORIGEM">Avaria de origem</option>
                <option value="RADAR">Radar</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-ardosia-500 mb-1">De</label>
              <input
                type="date"
                name="de"
                defaultValue={de}
                className="border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-ardosia-500 mb-1">Até</label>
              <input
                type="date"
                name="ate"
                defaultValue={ate}
                className="border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500 bg-white"
              />
            </div>
            <button className="text-sm border border-ardosia-300 rounded-sm px-4 py-2 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white">
              Filtrar
            </button>
            {temFiltro && (
              <a href="/avarias" className="text-sm text-ardosia-500 hover:text-ardosia-700 py-2">
                Limpar
              </a>
            )}
          </form>

          <div className="border border-ardosia-200 rounded-sm bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ardosia-100 text-left text-xs text-ardosia-600 uppercase tracking-wide">
                  <th className="px-4 py-2 font-normal">Data</th>
                  <th className="px-4 py-2 font-normal">Cliente</th>
                  <th className="px-4 py-2 font-normal">Produto</th>
                  <th className="px-4 py-2 font-normal">Lote / Nota</th>
                  <th className="px-4 py-2 font-normal">Peso</th>
                  <th className="px-4 py-2 font-normal">Local</th>
                  <th className="px-4 py-2 font-normal">Tipo</th>
                  <th className="px-4 py-2 font-normal">Identificação</th>
                  <th className="px-4 py-2 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {avarias.map((a) => (
                  <tr key={a.id} className="border-t border-ardosia-100 align-top">
                    <td className="px-4 py-2 font-mono text-xs">{fmtData(a.data)}</td>
                    <td className="px-4 py-2">{a.cliente.nome}</td>
                    <td className="px-4 py-2">
                      <p className="font-mono text-xs">{a.codigoProduto}</p>
                      <p className="text-xs text-ardosia-500">{a.descricao}</p>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {a.lote || "—"} {a.numeroNota ? `· NF ${a.numeroNota}` : ""}
                    </td>
                    <td className="px-4 py-2 font-mono">{a.pesoAvaria.toString()} kg</td>
                    <td className="px-4 py-2 text-xs">{a.localizacao || "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          a.origem === "RADAR"
                            ? "text-xs font-medium text-ambar-600 bg-ambar-500/10 px-2 py-0.5 rounded-sm"
                            : "text-xs text-ardosia-500"
                        }
                      >
                        {labelOrigem(a.origem)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {a.varredura
                        ? `Varredura${a.quantidadeVarreduraKg ? ` · ${a.quantidadeVarreduraKg.toString()} kg` : ""}`
                        : "Apontamento direto"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/avarias/${a.id}/editar`} className="text-xs text-ardosia-500 hover:text-ambar-600">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
                {avarias.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-ardosia-400 text-sm">
                      Nenhuma avaria encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            action="/avarias"
            paginaAtual={paginaAtual}
            totalPaginas={calcTotalPaginas(total)}
            paramsAtuais={{ q, de, ate, origem }}
          />
        </div>

        <form action={registrarAvaria} className="border border-ardosia-200 rounded-sm bg-white p-5 h-fit space-y-4">
          <h2 className="font-display text-sm font-medium">Registrar avaria</h2>

          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Tipo</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1.5">
                <input type="radio" name="origem" value="ORIGEM" defaultChecked className="accent-ambar-500" />
                Avaria de origem
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" name="origem" value="RADAR" className="accent-ambar-500" />
                Radar
              </label>
            </div>
            <p className="text-[11px] text-ardosia-500 mt-1">
              Radar = avaria interna monitorada. Produtos marcados como Radar geram aviso ao aparecerem
              de novo numa presença de carga.
            </p>
          </div>

          <AvariaProdutoFields clientes={clientes} />
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Lote</label>
            <input
              name="lote"
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Nº da nota</label>
              <input
                name="numeroNota"
                className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
              />
            </div>
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Peso da avaria (kg)</label>
              <input
                name="pesoAvaria"
                type="number"
                step="0.01"
                required
                className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Localização/endereço</label>
            <input
              name="localizacao"
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>

          {/* Truque CSS: o checkbox "peer" e o campo de KG precisam ser irmãos diretos pro seletor funcionar */}
          <div>
            <input
              type="checkbox"
              id="varredura-check"
              name="varredura"
              className="peer accent-ambar-500 align-middle"
            />
            <label htmlFor="varredura-check" className="ml-2 text-sm text-ardosia-700 align-middle cursor-pointer">
              Identificada em varredura
            </label>
            <div className="hidden peer-checked:block mt-3">
              <label className="block text-xs text-ardosia-600 mb-1">Quantidade de varredura (kg)</label>
              <input
                name="quantidadeVarreduraKg"
                type="number"
                step="0.01"
                className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Observação (opcional)</label>
            <input
              name="observacao"
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-ardosia-950 hover:bg-ardosia-900 text-ardosia-50 text-sm rounded-sm py-2 transition-colors"
          >
            Registrar avaria
          </button>
        </form>
      </section>
    </AppShell>
  );
}
