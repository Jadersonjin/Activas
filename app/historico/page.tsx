import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { Pagination } from "@/components/Pagination";
import { db } from "@/lib/db";
import { fmtDataHora } from "@/lib/br-date";
import { paginar, totalPaginas as calcTotalPaginas } from "@/lib/pagination";

const ENTIDADES = [
  { value: "", label: "Todas" },
  { value: "Cliente", label: "Clientes" },
  { value: "Avaria", label: "Avarias" },
  { value: "PresencaCarga", label: "Presença de carga" },
  { value: "MovimentoPallet", label: "Pallets" },
  { value: "Usuario", label: "Usuários" },
];

function labelAcao(acao: string) {
  if (acao === "CRIAR") return "Criou";
  if (acao === "EDITAR") return "Editou";
  if (acao === "EXCLUIR") return "Excluiu";
  if (acao === "RESETAR_SENHA") return "Resetou senha";
  return acao;
}

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ entidade?: string; pagina?: string }>;
}) {
  const { entidade, pagina } = await searchParams;
  const session = (await getSession())!;
  const { skip, take, paginaAtual } = paginar(pagina);

  const where = entidade ? { entidade } : {};

  const [logs, total] = await Promise.all([
    db.logAlteracao.findMany({ where, orderBy: { criadoEm: "desc" }, skip, take }),
    db.logAlteracao.count({ where }),
  ]);

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">09 · HISTÓRICO</p>
        <h1 className="font-display text-2xl font-medium mt-1">Histórico de alterações</h1>
      </header>

      <form action="/historico" className="flex items-end gap-2 mb-4">
        <div>
          <label className="block text-[11px] text-ardosia-500 mb-1">Área</label>
          <select
            name="entidade"
            defaultValue={entidade || ""}
            className="border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500 bg-white min-w-[180px]"
          >
            {ENTIDADES.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
        <button className="text-sm border border-ardosia-300 rounded-sm px-4 py-2 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white">
          Filtrar
        </button>
      </form>

      <div className="border border-ardosia-200 rounded-sm bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ardosia-100 text-left text-xs text-ardosia-600 uppercase tracking-wide">
              <th className="px-4 py-2 font-normal">Quando</th>
              <th className="px-4 py-2 font-normal">Usuário</th>
              <th className="px-4 py-2 font-normal">Ação</th>
              <th className="px-4 py-2 font-normal">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-ardosia-100">
                <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{fmtDataHora(l.criadoEm)}</td>
                <td className="px-4 py-2 text-xs">{l.usuarioNome}</td>
                <td className="px-4 py-2 text-xs">{labelAcao(l.acao)}</td>
                <td className="px-4 py-2 text-xs text-ardosia-600">{l.resumo}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ardosia-400 text-sm">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        action="/historico"
        paginaAtual={paginaAtual}
        totalPaginas={calcTotalPaginas(total)}
        paramsAtuais={{ entidade }}
      />
    </AppShell>
  );
}
