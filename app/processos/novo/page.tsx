import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { criarProcesso } from "@/lib/actions/processos";

export default async function NovoProcessoPage() {
  const session = (await getSession())!;
  const clientes = await db.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">03 · PROCESSOS</p>
        <h1 className="font-display text-2xl font-medium mt-1">Novo processo</h1>
      </header>

      <form action={criarProcesso} className="max-w-xl border border-ardosia-200 rounded-sm bg-white p-6 space-y-4">
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Placa do veículo</label>
            <input
              name="placaVeiculo"
              required
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Motorista (opcional)</label>
            <input
              name="motorista"
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Tipo de operação</label>
            <select
              name="tipoOperacao"
              required
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            >
              <option value="">Selecione...</option>
              <option value="CARGA">Carga</option>
              <option value="DESCARGA">Descarga</option>
              <option value="ENTREGA">Entrega</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Nº referência / NF (opcional)</label>
            <input
              name="numeroReferencia"
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
        </div>

        <p className="text-xs text-ardosia-400">
          Os horários de chegada, liberação, início e fim são registrados na tela do processo, com um clique, no momento em que ocorrem.
        </p>

        <button
          type="submit"
          className="w-full bg-ardosia-950 hover:bg-ardosia-900 text-ardosia-50 text-sm rounded-sm py-2 transition-colors"
        >
          Criar processo
        </button>
      </form>
    </AppShell>
  );
}
