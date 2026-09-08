import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { MovimentacaoReport } from "@/components/MovimentacaoReport";
import { db } from "@/lib/db";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function MovimentacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string; dia?: string; mes?: string }>;
}) {
  const { clienteId, dia, mes } = await searchParams;
  const session = (await getSession())!;
  const clientes = await db.cliente.findMany({ orderBy: { nome: "asc" } });

  const usaMes = Boolean(mes);
  const diaSelecionado = dia || hojeISO();

  let inicio: Date;
  let fim: Date;
  let dataLabel: string;

  if (usaMes) {
    const [ano, mesNum] = (mes as string).split("-").map(Number);
    inicio = new Date(ano, mesNum - 1, 1);
    fim = new Date(ano, mesNum, 0, 23, 59, 59, 999);
    dataLabel = inicio.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  } else {
    inicio = new Date(`${diaSelecionado}T00:00:00`);
    fim = new Date(`${diaSelecionado}T23:59:59.999`);
    dataLabel = inicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  const where = {
    data: { gte: inicio, lte: fim },
    ...(clienteId ? { clienteId } : {}),
  };

  const [porTipo, agregado] = await Promise.all([
    db.processo.groupBy({
      by: ["tipoOperacao"],
      where,
      _count: { _all: true },
      _sum: { quantidadeNotas: true },
    }),
    db.processo.aggregate({
      where,
      _count: { _all: true },
      _sum: { quantidadeNotas: true },
    }),
  ]);

  const linhas = ["CARGA", "DESCARGA", "ENTREGA"].map((tipo) => {
    const item = porTipo.find((p) => p.tipoOperacao === tipo);
    return {
      tipo,
      veiculos: item?._count._all || 0,
      notas: item?._sum.quantidadeNotas || 0,
    };
  });

  const clienteSelecionado = clienteId ? clientes.find((c) => c.id === clienteId) : null;
  const nomeCliente = clienteSelecionado ? clienteSelecionado.nome : "Todos os Clientes";
  const sufixoArquivo = usaMes ? mes : diaSelecionado;

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">07 · RELATÓRIOS</p>
        <h1 className="font-display text-2xl font-medium mt-1">Relatório de movimentação</h1>
      </header>

      <form action="/relatorios/movimentacao" className="flex flex-wrap items-end gap-3 mb-8 border border-ardosia-200 bg-white rounded-sm p-4">
        <div>
          <label className="block text-[11px] text-ardosia-500 mb-1">Cliente</label>
          <select
            name="clienteId"
            defaultValue={clienteId || ""}
            className="border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500 min-w-[200px]"
          >
            <option value="">Todos os clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-ardosia-500 mb-1">Dia</label>
          <input
            type="date"
            name="dia"
            defaultValue={!usaMes ? diaSelecionado : ""}
            className="border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
          />
        </div>
        <span className="text-xs text-ardosia-400 pb-2">ou</span>
        <div>
          <label className="block text-[11px] text-ardosia-500 mb-1">Mês</label>
          <input
            type="month"
            name="mes"
            defaultValue={usaMes ? mes : ""}
            className="border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
          />
        </div>
        <button className="text-sm border border-ardosia-300 rounded-sm px-4 py-2 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white">
          Gerar relatório
        </button>
      </form>

      <MovimentacaoReport
        nomeCliente={nomeCliente}
        dataLabel={dataLabel}
        totalVeiculos={agregado._count._all}
        totalNotas={agregado._sum.quantidadeNotas || 0}
        linhas={linhas}
        nomeArquivo={`movimentacao-${nomeCliente.toLowerCase().replace(/\s+/g, "-")}-${sufixoArquivo}.png`}
      />
    </AppShell>
  );
}
