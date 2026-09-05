import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { ImportarProcessosForm } from "@/components/ImportarProcessosForm";

export default async function ImportarProcessosPage() {
  const session = (await getSession())!;

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">03 · PROCESSOS</p>
        <h1 className="font-display text-2xl font-medium mt-1">Importar Painel do Dia</h1>
        <p className="text-sm text-ardosia-500 mt-1">
          Suba o arquivo .xlsx que você já usa e o sistema cria os processos, aponta os
          serviços (pallet/stretch) e abate do saldo de pallet dos clientes que usam pallet
          próprio, automaticamente.
        </p>
      </header>

      <ImportarProcessosForm />
    </AppShell>
  );
}
