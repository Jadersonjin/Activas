import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { registrarCompraPallet, registrarAjustePallet } from "@/lib/actions/pallets";

export default async function PalletsPage() {
  const session = (await getSession())!;
  const clientes = await db.cliente.findMany({
    where: { usaPalletProprio: true, ativo: true },
    orderBy: { nome: "asc" },
    include: { movimentosPallet: { orderBy: { data: "desc" }, take: 15 } },
  });

  const saldos = await db.movimentoPallet.groupBy({
    by: ["clienteId", "tipo"],
    _sum: { quantidade: true },
  });

  function saldoDe(clienteId: string) {
    const registros = saldos.filter((s) => s.clienteId === clienteId);
    let total = 0;
    for (const r of registros) {
      const valor = Number(r._sum.quantidade || 0);
      total += r.tipo === "SAIDA_CONSUMO" ? -valor : valor;
    }
    return total;
  }

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">04 · PALLETS</p>
        <h1 className="font-display text-2xl font-medium mt-1">Saldo de pallets próprios</h1>
        <p className="text-sm text-ardosia-500 mt-1">
          Apenas clientes marcados como &quot;pallet próprio&quot; aparecem aqui. O consumo é abatido automaticamente ao apontar um serviço de pallet no processo.
        </p>
      </header>

      {clientes.length === 0 && (
        <p className="text-sm text-ardosia-400">
          Nenhum cliente está configurado com pallet próprio. Marque essa opção no cadastro do cliente.
        </p>
      )}

      <div className="space-y-8">
        {clientes.map((cliente) => (
          <section key={cliente.id} className="border border-ardosia-200 rounded-sm bg-white">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ardosia-100">
              <h2 className="font-display text-base font-medium">{cliente.nome}</h2>
              <p className="font-mono text-2xl">
                {saldoDe(cliente.id)} <span className="text-xs text-ardosia-500">pallets em saldo</span>
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px_280px] gap-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ardosia-100 text-left text-xs text-ardosia-600 uppercase tracking-wide">
                    <th className="px-4 py-2 font-normal">Data</th>
                    <th className="px-4 py-2 font-normal">Tipo</th>
                    <th className="px-4 py-2 font-normal">Qtd.</th>
                    <th className="px-4 py-2 font-normal">Ref./Obs.</th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.movimentosPallet.map((m) => (
                    <tr key={m.id} className="border-t border-ardosia-100">
                      <td className="px-4 py-2 font-mono text-xs">
                        {new Date(m.data).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {m.tipo === "ENTRADA_COMPRA" ? "Compra" : m.tipo === "SAIDA_CONSUMO" ? "Consumo" : "Ajuste"}
                      </td>
                      <td className="px-4 py-2 font-mono">
                        {m.tipo === "SAIDA_CONSUMO" ? "-" : "+"}
                        {m.quantidade.toString()}
                      </td>
                      <td className="px-4 py-2 text-xs text-ardosia-500">{m.referencia || m.observacao || "—"}</td>
                    </tr>
                  ))}
                  {cliente.movimentosPallet.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-ardosia-400 text-sm">
                        Sem movimentações.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <form action={registrarCompraPallet} className="p-4 border-t lg:border-t-0 lg:border-l border-ardosia-100 space-y-3">
                <input type="hidden" name="clienteId" value={cliente.id} />
                <p className="text-xs font-medium text-ardosia-700">Registrar compra</p>
                <input
                  name="quantidade"
                  type="number"
                  step="1"
                  placeholder="Quantidade"
                  required
                  className="w-full border border-ardosia-200 rounded-sm px-3 py-1.5 text-sm outline-none focus:border-ambar-500"
                />
                <input
                  name="referencia"
                  placeholder="Nº da nota (opcional)"
                  className="w-full border border-ardosia-200 rounded-sm px-3 py-1.5 text-sm outline-none focus:border-ambar-500"
                />
                <button className="w-full bg-verde-500 hover:opacity-90 text-white text-xs rounded-sm py-1.5 transition-opacity">
                  Registrar compra
                </button>
              </form>

              <form action={registrarAjustePallet} className="p-4 border-t lg:border-t-0 lg:border-l border-ardosia-100 space-y-3">
                <input type="hidden" name="clienteId" value={cliente.id} />
                <p className="text-xs font-medium text-ardosia-700">Ajuste manual</p>
                <input
                  name="quantidade"
                  type="number"
                  step="1"
                  placeholder="+ ou - quantidade"
                  required
                  className="w-full border border-ardosia-200 rounded-sm px-3 py-1.5 text-sm outline-none focus:border-ambar-500"
                />
                <input
                  name="observacao"
                  placeholder="Motivo do ajuste"
                  className="w-full border border-ardosia-200 rounded-sm px-3 py-1.5 text-sm outline-none focus:border-ambar-500"
                />
                <button className="w-full bg-ardosia-700 hover:bg-ardosia-600 text-white text-xs rounded-sm py-1.5 transition-colors">
                  Aplicar ajuste
                </button>
              </form>
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
