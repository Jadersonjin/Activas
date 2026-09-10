import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { criarUsuario, alternarUsuarioAtivo, resetarSenhaUsuario } from "@/lib/actions/usuarios";

export default async function UsuariosPage() {
  const session = (await getSession())!;
  if (session.papel !== "ADMIN") {
    redirect("/dashboard");
  }

  const usuarios = await db.usuario.findMany({ orderBy: { criadoEm: "asc" } });

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">09 · USUÁRIOS</p>
        <h1 className="font-display text-2xl font-medium mt-1">Usuários da equipe</h1>
        <p className="text-sm text-ardosia-500 mt-1">
          Só administradores acessam essa tela. Esqueceu a senha? Um admin reseta aqui.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="border border-ardosia-200 rounded-sm bg-white overflow-x-auto">
  <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-ardosia-100 text-left text-xs text-ardosia-600 uppercase tracking-wide">
                <th className="px-4 py-3 font-normal">Nome</th>
                <th className="px-4 py-3 font-normal">E-mail</th>
                <th className="px-4 py-3 font-normal">Papel</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">Resetar senha</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const alternar = alternarUsuarioAtivo.bind(null, u.id, !u.ativo);
                const resetar = resetarSenhaUsuario.bind(null, u.id);
                return (
                  <tr key={u.id} className="border-t border-ardosia-100 align-top">
                    <td className="px-4 py-3">{u.nome}</td>
                    <td className="px-4 py-3 text-ardosia-600">{u.email}</td>
                    <td className="px-4 py-3 text-xs">
                      {u.papel === "ADMIN" ? "Administrador" : u.papel === "CONFERENTE" ? "Conferente" : "Operador"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={u.ativo ? "text-verde-500 text-xs" : "text-ardosia-400 text-xs"}>
                        {u.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <form action={resetar} className="flex gap-1.5">
                        <input
                          name="novaSenha"
                          type="text"
                          placeholder="Nova senha"
                          minLength={6}
                          required
                          className="w-28 border border-ardosia-200 rounded-sm px-2 py-1 text-xs outline-none focus:border-ambar-500"
                        />
                        <button className="text-xs border border-ardosia-300 rounded-sm px-2 py-1 hover:border-ambar-500 hover:text-ambar-600 transition-colors whitespace-nowrap">
                          Resetar
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={alternar}>
                        <button className="text-xs text-ardosia-500 hover:text-ambar-600 whitespace-nowrap">
                          {u.ativo ? "Desativar" : "Ativar"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <form action={criarUsuario} className="border border-ardosia-200 rounded-sm bg-white p-5 h-fit space-y-4">
          <h2 className="font-display text-sm font-medium">Novo usuário</h2>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Nome</label>
            <input
              name="nome"
              required
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">E-mail</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Senha inicial</label>
            <input
              name="senha"
              type="text"
              minLength={6}
              required
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Papel</label>
            <select
              name="papel"
              defaultValue="OPERADOR"
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            >
              <option value="OPERADOR">Operador</option>
              <option value="CONFERENTE">Conferente (só a tela de contagem)</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-ardosia-950 hover:bg-ardosia-900 text-ardosia-50 text-sm rounded-sm py-2 transition-colors"
          >
            Criar usuário
          </button>
        </form>
      </section>
    </AppShell>
  );
}
