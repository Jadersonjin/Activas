import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { registrarPresencaCarga } from "@/lib/actions/presenca-carga";

export default async function PresencaCargaPage() {
  const session = (await getSession())!;
  const [registros, clientes] = await Promise.all([
    db.presencaCarga.findMany({ orderBy: { dataChegada: "desc" }, take: 50, include: { cliente: true } }),
    db.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">06 · PRESENÇA DE CARGA</p>
        <h1 className="font-display text-2xl font-medium mt-1">Presença de carga</h1>
        <p className="text-sm text-ardosia-500 mt-1">
          Formalização da chegada de material antes do recebimento físico.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div className="border border-ardosia-200 rounded-sm bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ardosia-100 text-left text-xs text-ardosia-600 uppercase tracking-wide">
                <th className="px-4 py-2 font-normal">Chegada</th>
                <th className="px-4 py-2 font-normal">Cliente</th>
                <th className="px-4 py-2 font-normal">Fornecedor</th>
                <th className="px-4 py-2 font-normal">Nota</th>
                <th className="px-4 py-2 font-normal">Produto</th>
                <th className="px-4 py-2 font-normal">Qtd.</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} className="border-t border-ardosia-100 align-top">
                  <td className="px-4 py-2 font-mono text-xs">{new Date(r.dataChegada).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-2">{r.cliente.nome}</td>
                  <td className="px-4 py-2">{r.fornecedor}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.numeroNota}</td>
                  <td className="px-4 py-2">
                    <p className="font-mono text-xs">{r.codigoProduto}</p>
                    <p className="text-xs text-ardosia-500">{r.descricao}</p>
                  </td>
                  <td className="px-4 py-2 font-mono">
                    {r.quantidade.toString()} {r.unidade}
                  </td>
                </tr>
              ))}
              {registros.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ardosia-400 text-sm">
                    Nenhuma presença de carga registrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form action={registrarPresencaCarga} className="border border-ardosia-200 rounded-sm bg-white p-5 h-fit space-y-4">
          <h2 className="font-display text-sm font-medium">Registrar presença de carga</h2>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Fornecedor</label>
              <input
                name="fornecedor"
                required
                className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
              />
            </div>
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Nº da nota</label>
              <input
                name="numeroNota"
                required
                className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Código do produto</label>
              <input
                name="codigoProduto"
                required
                className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
              />
            </div>
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Data de chegada</label>
              <input
                name="dataChegada"
                type="date"
                className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Descrição</label>
            <input
              name="descricao"
              required
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Quantidade</label>
              <input
                name="quantidade"
                type="number"
                step="0.01"
                required
                className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
              />
            </div>
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Unidade</label>
              <input
                name="unidade"
                defaultValue="UN"
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
            Registrar presença
          </button>
        </form>
      </section>
    </AppShell>
  );
}
