import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { NovoInventarioForm } from "@/components/NovoInventarioForm";
import { db } from "@/lib/db";

export default async function NovoInventarioPage() {
  const session = (await getSession())!;
  const clientes = await db.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">09 · INVENTÁRIO</p>
        <h1 className="font-display text-2xl font-medium mt-1">Novo inventário</h1>
      </header>

      <NovoInventarioForm clientes={clientes} />
    </AppShell>
  );
}
