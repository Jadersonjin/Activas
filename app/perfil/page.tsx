import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { TrocarSenhaForm } from "@/components/TrocarSenhaForm";

export default async function PerfilPage() {
  const session = (await getSession())!;

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">11 · PERFIL</p>
        <h1 className="font-display text-2xl font-medium mt-1">Meu perfil</h1>
        <p className="text-sm text-ardosia-500 mt-1">
          {session.nome} · {session.email} · {session.papel === "ADMIN" ? "Administrador" : "Operador"}
        </p>
      </header>

      <TrocarSenhaForm />
    </AppShell>
  );
}
