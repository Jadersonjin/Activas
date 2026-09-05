import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { registrarAvaria } from "@/lib/actions/avarias";

export default async function AvariasPage() {
  const session = (await getSession())!;
  const [avarias, clientes] = await Promise.all([
    db.avaria.findMany({ orderBy: { data: "desc" }, take: 50, include: { cliente: true } }),
    db.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">05 · AVARIAS</p>
        <h1 className="font-display text-2xl font-medium mt-1">Controle de avarias</h1>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div className="border border-ardosia-200 rounded-sm bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ardosia-100 text-left text-xs text-ardosia-600 uppercase tracking-wide">
                <th className="px-4 py-2 font-normal">Data</th>
                <th className="px-4 py-2 font-normal">Cliente</th>
                <th className="px-4 py-2 font-normal">Produto</th>
                <th className="px-4 py-2 font-normal">Lote</th>
                <th className="px-4 py-2 font-normal">Peso</th>
                <th className="px-4 py-2 font-normal">Local</th>
                <th className="px-4 py-2 font-normal">Origem</th>
              </tr>
            </thead>
            <tbody>
              {avarias.map((a) => (
                <tr key={a.id} className="border-t border-ardosia-100 align-top">
                  <td className="px-4 py-2 font-mono text-xs">{new Date(a.data).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-2">{a.cliente.nome}</td>
                  <td className="px-4 py-2">
                    <p className="font-mono text-xs">{a.codigoProduto}</p>
                    <p className="text-xs text-ardosia-500">{a.descricao}</p>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{a.lote || "—"}</td>
                  <td className="px-4 py-2 font-mono">{a.pesoAvaria.toString()} kg</td>
                  <td className="px-4 py-2 text-xs">{a.localizacao || "—"}</td>
                  <td className="px-4 py-2 text-xs">{a.varredura ? "Varredura" : "Apontamento direto"}</td>
                </tr>
              ))}
              {avarias.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ardosia-400 text-sm">
                    Nenhuma avaria registrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form action={registrarAvaria} className="border border-ardosia-200 rounded-sm bg-white p-5 h-fit space-y-4">
          <h2 className="font-display text-sm font-medium">Registrar avaria</h2>
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
              <label className="block text-xs text-ardosia-600 mb-1">Código do produto</label>
              <input
                name="codigoProduto"
                required
                className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
              />
            </div>
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Lote</label>
              <input
                name="lote"
                className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Descrição do produto</label>
            <input
              name="descricao"
              required
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Localização/endereço</label>
              <input
                name="localizacao"
                className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ardosia-700">
            <input type="checkbox" name="varredura" className="accent-ambar-500" />
            Identificada em varredura
          </label>
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
