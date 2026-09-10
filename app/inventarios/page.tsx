import Link from "next/link";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { fmtData } from "@/lib/br-date";

function labelStatus(s: string) {
  if (s === "PREPARANDO") return { texto: "Preparando", cor: "text-ardosia-500" };
  if (s === "EM_CONTAGEM") return { texto: "Em contagem", cor: "text-ambar-600" };
  return { texto: "Finalizado", cor: "text-verde-500" };
}

export default async function InventariosPage() {
  const session = (await getSession())!;
  const inventarios = await db.inventario.findMany({
    orderBy: { criadoEm: "desc" },
    include: { cliente: true, itens: true, rodadas: { orderBy: { numero: "desc" }, take: 1 } },
  });

  return (
    <AppShell session={session}>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-ardosia-600">09 · INVENTÁRIO</p>
          <h1 className="font-display text-2xl font-medium mt-1">Inventários</h1>
        </div>
        <Link
          href="/inventarios/novo"
          className="bg-ardosia-950 hover:bg-ardosia-900 text-ardosia-50 text-sm rounded-sm px-4 py-2 transition-colors"
        >
          + Novo inventário
        </Link>
      </header>

      <div className="border border-ardosia-200 rounded-sm bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ardosia-100 text-left text-xs text-ardosia-600 uppercase tracking-wide">
              <th className="px-4 py-3 font-normal">Nome</th>
              <th className="px-4 py-3 font-normal">Cliente</th>
              <th className="px-4 py-3 font-normal">Itens</th>
              <th className="px-4 py-3 font-normal">Rodada atual</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {inventarios.map((inv) => {
              const status = labelStatus(inv.status);
              return (
                <tr key={inv.id} className="border-t border-ardosia-100 hover:bg-ardosia-50">
                  <td className="px-4 py-3">
                    <Link href={`/inventarios/${inv.id}`} className="hover:text-ambar-600">
                      {inv.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{inv.cliente.nome}</td>
                  <td className="px-4 py-3 font-mono">{inv.itens.length}</td>
                  <td className="px-4 py-3 font-mono">{inv.rodadas[0]?.numero || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${status.cor}`}>{status.texto}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{fmtData(inv.criadoEm)}</td>
                </tr>
              );
            })}
            {inventarios.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ardosia-400 text-sm">
                  Nenhum inventário criado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
