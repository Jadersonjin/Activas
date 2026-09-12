import Link from "next/link";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { Pagination } from "@/components/Pagination";
import { db } from "@/lib/db";
import { criarProduto, alternarProdutoAtivo } from "@/lib/actions/produtos";
import { paginar, totalPaginas as calcTotalPaginas } from "@/lib/pagination";

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; clienteId?: string; pagina?: string }>;
}) {
  const { q, clienteId, pagina } = await searchParams;
  const session = (await getSession())!;
  const { skip, take, paginaAtual } = paginar(pagina);

  const where = {
    ...(clienteId ? { clienteId } : {}),
    ...(q
      ? {
          OR: [
            { codigo: { contains: q, mode: "insensitive" as const } },
            { descricao: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [produtos, total, clientes] = await Promise.all([
    db.produto.findMany({ where, orderBy: { codigo: "asc" }, skip, take, include: { cliente: true } }),
    db.produto.count({ where }),
    db.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <AppShell session={session}>
      <header className="mb-8 flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-xs text-ardosia-600">10 · PRODUTOS</p>
          <h1 className="font-display text-2xl font-medium mt-1">Produtos</h1>
          <p className="text-sm text-ardosia-500 mt-1">Cadastro de código + descrição por cliente.</p>
        </div>
        <Link
          href="/produtos/importar"
          className="text-sm border border-ardosia-300 rounded-sm px-4 py-2 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white whitespace-nowrap"
        >
          ⬆ Importar planilha
        </Link>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <form action="/produtos" className="flex flex-wrap items-end gap-2 mb-4">
            <div>
              <label className="block text-[11px] text-ardosia-500 mb-1">Cliente</label>
              <select
                name="clienteId"
                defaultValue={clienteId || ""}
                className="border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500 bg-white min-w-[180px]"
              >
                <option value="">Todos</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-ardosia-500 mb-1">Buscar</label>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Código ou descrição..."
                className="w-full max-w-xs border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500 bg-white"
              />
            </div>
            <button className="text-sm border border-ardosia-300 rounded-sm px-4 py-2 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white">
              Filtrar
            </button>
            {(q || clienteId) && (
              <a href="/produtos" className="text-sm text-ardosia-500 hover:text-ardosia-700 py-2">
                Limpar
              </a>
            )}
          </form>

          <div className="border border-ardosia-200 rounded-sm bg-white overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-ardosia-100 text-left text-xs text-ardosia-600 uppercase tracking-wide">
                  <th className="px-4 py-2 font-normal">Código</th>
                  <th className="px-4 py-2 font-normal">Descrição</th>
                  <th className="px-4 py-2 font-normal">Cliente</th>
                  <th className="px-4 py-2 font-normal">Status</th>
                  <th className="px-4 py-2 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => {
                  const alternar = alternarProdutoAtivo.bind(null, p.id, !p.ativo);
                  return (
                    <tr key={p.id} className="border-t border-ardosia-100">
                      <td className="px-4 py-2 font-mono text-xs">{p.codigo}</td>
                      <td className="px-4 py-2">{p.descricao}</td>
                      <td className="px-4 py-2 text-xs">{p.cliente.nome}</td>
                      <td className="px-4 py-2">
                        <span className={p.ativo ? "text-verde-500 text-xs" : "text-ardosia-400 text-xs"}>
                          {p.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <form action={alternar}>
                          <button className="text-xs text-ardosia-500 hover:text-ambar-600 whitespace-nowrap">
                            {p.ativo ? "Desativar" : "Ativar"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {produtos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-ardosia-400 text-sm">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            action="/produtos"
            paginaAtual={paginaAtual}
            totalPaginas={calcTotalPaginas(total)}
            paramsAtuais={{ q, clienteId }}
          />
        </div>

        <form action={criarProduto} className="border border-ardosia-200 rounded-sm bg-white p-5 h-fit space-y-4">
          <h2 className="font-display text-sm font-medium">Novo produto</h2>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Cliente</label>
            <select
              name="clienteId"
              required
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            >
              <option value="">Selecione...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Código</label>
            <input
              name="codigo"
              required
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Descrição</label>
            <input
              name="descricao"
              required
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
          <p className="text-[11px] text-ardosia-500">
            Se o código já existir pra esse cliente, a descrição é atualizada em vez de duplicar.
          </p>
          <button
            type="submit"
            className="w-full bg-ardosia-950 hover:bg-ardosia-900 text-ardosia-50 text-sm rounded-sm py-2 transition-colors"
          >
            Cadastrar produto
          </button>
        </form>
      </section>
    </AppShell>
  );
}
