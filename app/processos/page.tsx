import Link from "next/link";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";

function fmtHora(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default async function ProcessosPage() {
  const session = (await getSession())!;
  const processos = await db.processo.findMany({
    orderBy: { criadoEm: "desc" },
    take: 50,
    include: { cliente: true },
  });

  return (
    <AppShell session={session}>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-ardosia-600">03 · PROCESSOS</p>
          <h1 className="font-display text-2xl font-medium mt-1">Processos diários</h1>
        </div>
        <Link
          href="/processos/novo"
          className="bg-ardosia-950 hover:bg-ardosia-900 text-ardosia-50 text-sm rounded-sm px-4 py-2 transition-colors"
        >
          + Novo processo
        </Link>
      </header>

      <div className="border border-ardosia-200 rounded-sm bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ardosia-100 text-left text-xs text-ardosia-600 uppercase tracking-wide">
              <th className="px-4 py-3 font-normal">Cliente</th>
              <th className="px-4 py-3 font-normal">Veículo</th>
              <th className="px-4 py-3 font-normal">Operação</th>
              <th className="px-4 py-3 font-normal">Chegada</th>
              <th className="px-4 py-3 font-normal">Liberação</th>
              <th className="px-4 py-3 font-normal">Início</th>
              <th className="px-4 py-3 font-normal">Fim</th>
              <th className="px-4 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {processos.map((p) => (
              <tr key={p.id} className="border-t border-ardosia-100 hover:bg-ardosia-50">
                <td className="px-4 py-3">
                  <Link href={`/processos/${p.id}`} className="hover:text-ambar-600">
                    {p.cliente.nome}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono">{p.placaVeiculo}</td>
                <td className="px-4 py-3">{p.tipoOperacao}</td>
                <td className="px-4 py-3 font-mono">{fmtHora(p.horaChegada)}</td>
                <td className="px-4 py-3 font-mono">{fmtHora(p.horaLiberacao)}</td>
                <td className="px-4 py-3 font-mono">{fmtHora(p.horaInicioOp)}</td>
                <td className="px-4 py-3 font-mono">{fmtHora(p.horaFimOp)}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      p.status === "FINALIZADO"
                        ? "text-verde-500 text-xs"
                        : p.status === "CANCELADO"
                        ? "text-vermelho-500 text-xs"
                        : "text-ambar-600 text-xs"
                    }
                  >
                    {p.status === "EM_ANDAMENTO" ? "Em andamento" : p.status === "FINALIZADO" ? "Finalizado" : "Cancelado"}
                  </span>
                </td>
              </tr>
            ))}
            {processos.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-ardosia-400 text-sm">
                  Nenhum processo registrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
