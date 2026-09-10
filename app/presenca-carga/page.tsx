import Link from "next/link";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { FilterBar } from "@/components/FilterBar";
import { Pagination } from "@/components/Pagination";
import { PresencaCargaForm } from "@/components/PresencaCargaForm";
import { PresencaCargaReport } from "@/components/PresencaCargaReport";
import { StatusProcessoToggle } from "@/components/StatusProcessoToggle";
import { db } from "@/lib/db";
import { rangeDia } from "@/lib/date-range";
import { fmtData, fmtDataHora } from "@/lib/br-date";
import { paginar, totalPaginas as calcTotalPaginas, TAMANHO_PAGINA } from "@/lib/pagination";

export default async function PresencaCargaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; de?: string; ate?: string; pagina?: string }>;
}) {
  const { q, de, ate, pagina } = await searchParams;
  const session = (await getSession())!;
  const { skip, take, paginaAtual } = paginar(pagina);

  const where = {
    dataChegada: rangeDia(de, ate),
    ...(q
      ? {
          OR: [
            { fornecedor: { contains: q, mode: "insensitive" as const } },
            { numeroNota: { contains: q, mode: "insensitive" as const } },
            { cliente: { nome: { contains: q, mode: "insensitive" as const } } },
            { itens: { some: { codigoProduto: { contains: q, mode: "insensitive" as const } } } },
            { itens: { some: { descricao: { contains: q, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };

  const [registros, total, clientes, registrosRelatorio] = await Promise.all([
    db.presencaCarga.findMany({
      where,
      orderBy: { dataChegada: "desc" },
      skip,
      take,
      include: { cliente: true, itens: true },
    }),
    db.presencaCarga.count({ where }),
    db.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    // Sem paginação — usado pra gerar o relatório (PDF/Excel) com TUDO que bate no filtro, não só a página atual
    db.presencaCarga.findMany({
      where,
      orderBy: { dataChegada: "desc" },
      take: 500,
      include: { cliente: true, itens: true },
    }),
  ]);

  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (de) exportParams.set("de", de);
  if (ate) exportParams.set("ate", ate);
  const exportHref = `/api/presenca-carga/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  const notasParaRelatorio = registrosRelatorio.map((r) => ({
    id: r.id,
    cliente: r.cliente.nome,
    fornecedor: r.fornecedor,
    numeroNota: r.numeroNota,
    dataChegada: fmtData(r.dataChegada),
    observacao: r.observacao,
    statusProcesso: r.statusProcesso as "PENDENTE" | "CLASSIFICADO",
    itens: r.itens.map((item) => ({
      codigoProduto: item.codigoProduto,
      descricao: item.descricao,
      quantidade: item.quantidade.toString(),
      unidade: item.unidade,
    })),
  }));
  const geradoEm = fmtDataHora(new Date());

  return (
    <AppShell session={session}>
      <header className="mb-8 flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-ardosia-600">06 · PRESENÇA DE CARGA</p>
          <h1 className="font-display text-2xl font-medium mt-1">Presença de carga</h1>
          <p className="text-sm text-ardosia-500 mt-1">
            Formalização da chegada de material antes do recebimento físico.
          </p>
        </div>
        <a
          href={exportHref}
          className="text-sm border border-ardosia-300 rounded-sm px-4 py-2 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white whitespace-nowrap"
        >
          ⬇ Baixar Excel
        </a>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div>
          <FilterBar action="/presenca-carga" q={q} de={de} ate={ate} placeholder="Fornecedor, nota, produto, cliente..." />
          <div className="border border-ardosia-200 rounded-sm bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ardosia-100 text-left text-xs text-ardosia-600 uppercase tracking-wide">
                  <th className="px-4 py-2 font-normal">Chegada</th>
                  <th className="px-4 py-2 font-normal">Cliente</th>
                  <th className="px-4 py-2 font-normal">Fornecedor</th>
                  <th className="px-4 py-2 font-normal">Nota</th>
                  <th className="px-4 py-2 font-normal">Produtos</th>
                  <th className="px-4 py-2 font-normal">Processo</th>
                  <th className="px-4 py-2 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id} className="border-t border-ardosia-100 align-top">
                    <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">
                      {fmtData(r.dataChegada)}
                    </td>
                    <td className="px-4 py-2">{r.cliente.nome}</td>
                    <td className="px-4 py-2">{r.fornecedor}</td>
                    <td className="px-4 py-2 font-mono text-xs">{r.numeroNota}</td>
                    <td className="px-4 py-2">
                      {r.itens.map((item) => (
                        <div key={item.id} className="mb-1 last:mb-0">
                          <span className="font-mono text-xs">{item.codigoProduto}</span>{" "}
                          <span className="text-xs text-ardosia-500">
                            {item.descricao} — {item.quantidade.toString()} {item.unidade}
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-2">
                      <StatusProcessoToggle id={r.id} status={r.statusProcesso as "PENDENTE" | "CLASSIFICADO"} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/presenca-carga/${r.id}/editar`} className="text-xs text-ardosia-500 hover:text-ambar-600">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
                {registros.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-ardosia-400 text-sm">
                      Nenhuma presença de carga encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            action="/presenca-carga"
            paginaAtual={paginaAtual}
            totalPaginas={calcTotalPaginas(total, TAMANHO_PAGINA)}
            paramsAtuais={{ q, de, ate }}
          />
        </div>

        <PresencaCargaForm clientes={clientes} />
      </section>

      <details className="mt-8 border border-ardosia-200 rounded-sm bg-white p-5">
        <summary className="font-display text-sm font-medium cursor-pointer">
          Gerar relatório para enviar ao cliente
        </summary>
        <p className="text-xs text-ardosia-500 mt-2 mb-4">
          Usa o mesmo filtro de busca e datas aplicado na lista acima (não a paginação — pega tudo que
          bate no filtro, até 500 registros). Cada nota mostra se o processo já foi classificado no
          sistema ou está pendente.
        </p>
        <PresencaCargaReport
          notas={notasParaRelatorio}
          geradoEm={geradoEm}
          nomeArquivo={`presenca-carga-${new Date().toISOString().slice(0, 10)}.pdf`}
        />
      </details>
    </AppShell>
  );
}
