import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { atualizarCliente } from "@/lib/actions/clientes";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await getSession())!;
  const cliente = await db.cliente.findUnique({ where: { id } });
  if (!cliente) notFound();

  const acao = atualizarCliente.bind(null, cliente.id);

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">02 · CLIENTES</p>
        <h1 className="font-display text-2xl font-medium mt-1">Editar cliente</h1>
      </header>

      <form action={acao} className="max-w-md border border-ardosia-200 rounded-sm bg-white p-6 space-y-4">
        <div>
          <label className="block text-xs text-ardosia-600 mb-1">Nome</label>
          <input
            name="nome"
            defaultValue={cliente.nome}
            required
            className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
          />
        </div>
        <div>
          <label className="block text-xs text-ardosia-600 mb-1">CNPJ (opcional)</label>
          <input
            name="cnpj"
            defaultValue={cliente.cnpj || ""}
            className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ardosia-700">
          <input type="checkbox" name="usaPalletProprio" defaultChecked={cliente.usaPalletProprio} className="accent-ambar-500" />
          Cliente trabalha com pallets próprios
        </label>
        <label className="flex items-center gap-2 text-sm text-ardosia-700">
          <input type="checkbox" name="ativo" defaultChecked={cliente.ativo} className="accent-ambar-500" />
          Cliente ativo
        </label>
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
