import Link from "next/link";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { hojeBR, inicioDiaBR, fimDiaBR } from "@/lib/br-date";

function primeiroDiaMes(mes: string) {
  return `${mes}-01`;
}
function ultimoDiaMes(mes: string) {
  const [ano, mesNum] = mes.split("-").map(Number);
  const ultimo = new Date(ano, mesNum, 0).getDate();
  return `${mes}-${String(ultimo).padStart(2, "0")}`;
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const session = (await getSession())!;
  const mesSelecionado = mes || hojeBR().slice(0, 7);

  const inicio = inicioDiaBR(primeiroDiaMes(mesSelecionado));
  const fim = fimDiaBR(ultimoDiaMes(mesSelecionado));

  const [totalNotas, totalItens, clientesAtendidos] = await Promise.all([
    db.presencaCarga.count({ where: { dataChegada: { gte: inicio, lte: fim } } }),
    db.presencaCargaItem.count({
      where: { presencaCarga: { dataChegada: { gte: inicio, lte: fim } } },
    }),
    db.presencaCarga.findMany({
      where: { dataChegada: { gte: inicio, lte: fim } },
      distinct: ["clienteId"],
      select: { clienteId: true },
    }),
  ]);

  const linkRelatorioMes = `/presenca-carga?de=${primeiroDiaMes(mesSelecionado)}&ate=${ultimoDiaMes(mesSelecionado)}`;

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">08 · RELATÓRIOS</p>
        <h1 className="font-display text-2xl font-medium mt-1">Relatórios</h1>
        <p className="text-sm text-ardosia-500 mt-1">Relatório mensal de presença de carga.</p>
      </header>

      <section className="border border-ardosia-200 rounded-sm bg-white p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-display text-sm font-medium">Resumo do mês</h2>
          <form action="/relatorios" className="flex items-center gap-2">
            <input
              type="month"
              name="mes"
              defaultValue={mesSelecionado}
              className="border border-ardosia-200 rounded-sm px-3 py-1.5 text-sm outline-none focus:border-ambar-500"
            />
            <button className="text-sm border border-ardosia-300 rounded-sm px-3 py-1.5 hover:border-ambar-500 hover:text-ambar-600 transition-colors">
              Ver mês
            </button>
          </form>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-xs text-ardosia-500 mb-1">Presenças de carga</p>
            <p className="font-display text-2xl">{totalNotas}</p>
          </div>
          <div>
            <p className="text-xs text-ardosia-500 mb-1">Itens recebidos</p>
            <p className="font-display text-2xl">{totalItens}</p>
          </div>
          <div>
            <p className="text-xs text-ardosia-500 mb-1">Clientes atendidos</p>
            <p className="font-display text-2xl">{clientesAtendidos.length}</p>
          </div>
        </div>

        <Link
          href={linkRelatorioMes}
          className="inline-block bg-ardosia-950 hover:bg-ardosia-900 text-ardosia-50 text-sm rounded-sm px-4 py-2 transition-colors"
        >
          Ver presenças de carga do mês (Excel / PDF)
        </Link>
        <p className="text-xs text-ardosia-500 mt-2">
          Abre a tela de Presença de Carga já filtrada por esse mês inteiro — de lá dá pra baixar em
          Excel ou gerar o relatório em PDF pra enviar ao cliente.
        </p>
      </section>
    </AppShell>
  );
}
