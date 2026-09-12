import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { ImportarProdutosForm } from "@/components/ImportarProdutosForm";
import { db } from "@/lib/db";

export default async function ImportarProdutosPage() {
  const session = (await getSession())!;
  const clientes = await db.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">10 · PRODUTOS</p>
        <h1 className="font-display text-2xl font-medium mt-1">Importar produtos</h1>
      </header>

      <ImportarProdutosForm clientes={clientes} />
    </AppShell>
  );
}
