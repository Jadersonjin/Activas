import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { criarCliente } from "@/lib/actions/clientes";

export default async function ClientesPage() {
  const session = (await getSession())!;
  const clientes = await db.cliente.findMany({ orderBy: { nome: "asc" } });

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">02 · CLIENTES</p>
        <h1 className="font-display text-2xl font-medium mt-1">Clientes atendidos</h1>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="border border-ardosia-200 rounded-sm bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ardosia-100 text-left text-xs text-ardosia-600 uppercase tracking-wide">
                <th className="px-4 py-3 font-normal">Nome</th>
                <th className="px-4 py-3 font-normal">CNPJ</th>
                <th className="px-4 py-3 font-normal">Pallet próprio</th>
                <th className="px-4 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-t border-ardosia-100">
                  <td className="px-4 py-3">{c.nome}</td>
                  <td className="px-4 py-3 font-mono text-ardosia-600">{c.cnpj || "—"}</td>
                  <td className="px-4 py-3">{c.usaPalletProprio ? "Sim" : "Não"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        c.ativo
                          ? "text-verde-500 text-xs"
                          : "text-ardosia-400 text-xs"
                      }
                    >
                      {c.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-ardosia-400 text-sm">
                    Nenhum cliente cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form
          action={criarCliente}
          className="border border-ardosia-200 rounded-sm bg-white p-5 h-fit space-y-4"
        >
          <h2 className="font-display text-sm font-medium">Novo cliente</h2>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Nome</label>
            <input
              name="nome"
              required
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">CNPJ (opcional)</label>
            <input
              name="cnpj"
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ardosia-700">
            <input type="checkbox" name="usaPalletProprio" className="accent-ambar-500" />
            Cliente trabalha com pallets próprios (habilita controle de saldo)
          </label>
          <button
            type="submit"
            className="w-full bg-ardosia-950 hover:bg-ardosia-900 text-ardosia-50 text-sm rounded-sm py-2 transition-colors"
          >
            Cadastrar cliente
          </button>
        </form>
      </section>
    </AppShell>
  );
}
