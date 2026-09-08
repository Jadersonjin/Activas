import Link from "next/link";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { labelTipoOperacao } from "@/lib/labels";

function inicioDoDia(dataStr: string) {
  return new Date(`${dataStr}T00:00:00`);
}
function fimDoDia(dataStr: string) {
  return new Date(`${dataStr}T23:59:59.999`);
}
function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}
function mesAtual() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

async function resumoPeriodo(inicio: Date, fim: Date) {
  const [porTipo, somaNotas, totalProcessos] = await Promise.all([
    db.processo.groupBy({
      by: ["tipoOperacao"],
      where: { data: { gte: inicio, lte: fim } },
      _count: { _all: true },
    }),
    db.processo.aggregate({
      where: { data: { gte: inicio, lte: fim } },
      _sum: { quantidadeNotas: true },
    }),
    db.processo.count({ where: { data: { gte: inicio, lte: fim } } }),
  ]);
  return { porTipo, totalNotas: somaNotas._sum.quantidadeNotas || 0, totalProcessos };
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string; mes?: string }>;
}) {
  const { dia, mes } = await searchParams;
  const session = (await getSession())!;

  const diaSelecionado = dia || hojeISO();
  const mesSelecionado = mes || mesAtual();

  const [ano, mesNum] = mesSelecionado.split("-").map(Number);
  const inicioMes = new Date(ano, (mesNum || 1) - 1, 1);
  const fimMes = new Date(ano, mesNum || 1, 0, 23, 59, 59, 999);

  const [resumoDia, resumoMes] = await Promise.all([
    resumoPeriodo(inicioDoDia(diaSelecionado), fimDoDia(diaSelecionado)),
    resumoPeriodo(inicioMes, fimMes),
  ]);

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">07 · RELATÓRIOS</p>
        <h1 className="font-display text-2xl font-medium mt-1">Resumo de operações</h1>
      </header>

      <section className="border border-ardosia-200 rounded-sm bg-white p-5 mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-display text-sm font-medium">Resumo diário</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <form action="/relatorios" className="flex items-center gap-2">
              <input type="hidden" name="mes" value={mesSelecionado} />
              <input
                type="date"
                name="dia"
                defaultValue={diaSelecionado}
                className="border border-ardosia-200 rounded-sm px-3 py-1.5 text-sm outline-none focus:border-ambar-500"
              />
              <button className="text-sm border border-ardosia-300 rounded-sm px-3 py-1.5 hover:border-ambar-500 hover:text-ambar-600 transition-colors">
                Ver dia
              </button>
            </form>
            <a
              href={`/api/relatorios/processos/export?dia=${diaSelecionado}`}
              className="text-sm border border-ardosia-300 rounded-sm px-3 py-1.5 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white whitespace-nowrap"
            >
              ⬇ Excel
            </a>
            <Link
              href={`/relatorios/movimentacao?dia=${diaSelecionado}`}
              className="text-sm border border-ardosia-300 rounded-sm px-3 py-1.5 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white whitespace-nowrap"
            >
              🖼 Imagem
            </Link>
          </div>
        </div>
        <ResumoGrid resumo={resumoDia} />
      </section>

      <section className="border border-ardosia-200 rounded-sm bg-white p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-display text-sm font-medium">Resumo mensal</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <form action="/relatorios" className="flex items-center gap-2">
              <input type="hidden" name="dia" value={diaSelecionado} />
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
            <a
              href={`/api/relatorios/processos/export?mes=${mesSelecionado}`}
              className="text-sm border border-ardosia-300 rounded-sm px-3 py-1.5 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white whitespace-nowrap"
            >
              ⬇ Excel
            </a>
            <Link
              href={`/relatorios/movimentacao?mes=${mesSelecionado}`}
              className="text-sm border border-ardosia-300 rounded-sm px-3 py-1.5 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white whitespace-nowrap"
            >
              🖼 Imagem
            </Link>
          </div>
        </div>
        <ResumoGrid resumo={resumoMes} />
      </section>
    </AppShell>
  );
}

function ResumoGrid({
  resumo,
}: {
  resumo: { porTipo: { tipoOperacao: string; _count: { _all: number } }[]; totalNotas: number; totalProcessos: number };
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      {["CARGA", "DESCARGA", "ENTREGA"].map((tipo) => {
        const item = resumo.porTipo.find((p) => p.tipoOperacao === tipo);
        return (
          <div key={tipo}>
            <p className="text-xs text-ardosia-500 mb-1">{labelTipoOperacao(tipo)}</p>
            <p className="font-display text-2xl">{item?._count._all || 0}</p>
          </div>
        );
      })}
      <div>
        <p className="text-xs text-ardosia-500 mb-1">Total de processos</p>
        <p className="font-display text-2xl">{resumo.totalProcessos}</p>
      </div>
      <div>
        <p className="text-xs text-ardosia-500 mb-1">Total de notas</p>
        <p className="font-display text-2xl">{resumo.totalNotas}</p>
      </div>
    </div>
  );
}
