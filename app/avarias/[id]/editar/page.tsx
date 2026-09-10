import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { atualizarAvaria } from "@/lib/actions/avarias";

export default async function EditarAvariaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await getSession())!;
  const [avaria, clientes] = await Promise.all([
    db.avaria.findUnique({ where: { id } }),
    db.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);
  if (!avaria) notFound();

  const acao = atualizarAvaria.bind(null, avaria.id);

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">04 · AVARIAS</p>
        <h1 className="font-display text-2xl font-medium mt-1">Editar avaria</h1>
      </header>

      <form action={acao} className="max-w-xl border border-ardosia-200 rounded-sm bg-white p-6 space-y-4">
        <div>
          <label className="block text-xs text-ardosia-600 mb-1">Tipo</label>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="origem"
                value="ORIGEM"
                defaultChecked={avaria.origem !== "RADAR"}
                className="accent-ambar-500"
              />
              Avaria de origem
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="origem"
                value="RADAR"
                defaultChecked={avaria.origem === "RADAR"}
                className="accent-ambar-500"
              />
              Radar
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs text-ardosia-600 mb-1">Cliente</label>
          <select
            name="clienteId"
            defaultValue={avaria.clienteId}
            required
            className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
          >
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
              defaultValue={avaria.codigoProduto}
              required
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Lote</label>
            <input
              name="lote"
              defaultValue={avaria.lote || ""}
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-ardosia-600 mb-1">Descrição do produto</label>
          <input
            name="descricao"
            defaultValue={avaria.descricao}
            required
            className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Nº da nota</label>
            <input
              name="numeroNota"
              defaultValue={avaria.numeroNota || ""}
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Peso da avaria (kg)</label>
            <input
              name="pesoAvaria"
              type="number"
              step="0.01"
              defaultValue={avaria.pesoAvaria.toString()}
              required
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-ardosia-600 mb-1">Localização/endereço</label>
          <input
            name="localizacao"
            defaultValue={avaria.localizacao || ""}
            className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
          />
        </div>

        <div>
          <input
            type="checkbox"
            id="varredura-check"
            name="varredura"
            defaultChecked={avaria.varredura}
            className="peer accent-ambar-500 align-middle"
          />
          <label htmlFor="varredura-check" className="ml-2 text-sm text-ardosia-700 align-middle cursor-pointer">
            Identificada em varredura
          </label>
          <div className="hidden peer-checked:block mt-3">
            <label className="block text-xs text-ardosia-600 mb-1">Quantidade de varredura (kg)</label>
            <input
              name="quantidadeVarreduraKg"
              type="number"
              step="0.01"
              defaultValue={avaria.quantidadeVarreduraKg?.toString() || ""}
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-ardosia-600 mb-1">Observação (opcional)</label>
          <input
            name="observacao"
            defaultValue={avaria.observacao || ""}
            className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-ardosia-950 hover:bg-ardosia-900 text-ardosia-50 text-sm rounded-sm py-2 transition-colors"
        >
          Salvar alterações
        </button>
      </form>
    </AppShell>
  );
}
