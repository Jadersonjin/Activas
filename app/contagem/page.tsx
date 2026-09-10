import { logout } from "@/lib/actions/auth";
import { getSession } from "@/lib/session";
import { BrasmegLogo } from "@/components/BrasmegLogo";
import { ContagemForm } from "@/components/ContagemForm";
import { db } from "@/lib/db";
import { itensPendentes } from "@/lib/inventario-helpers";

export default async function ContagemPage({
  searchParams,
}: {
  searchParams: Promise<{ inventarioId?: string }>;
}) {
  const { inventarioId } = await searchParams;
  const session = (await getSession())!;

  const inventariosAtivos = await db.inventario.findMany({
    where: { status: "EM_CONTAGEM" },
    include: { cliente: true, rodadas: { where: { status: "ABERTA" } } },
  });

  const inventarioAtual =
    inventariosAtivos.find((i) => i.id === inventarioId) ||
    (inventariosAtivos.length === 1 ? inventariosAtivos[0] : null);

  const pendentes = inventarioAtual ? await itensPendentes(inventarioAtual.id) : [];
  const rodadaAtiva = inventarioAtual?.rodadas[0];

  return (
    <div className="min-h-screen bg-ardosia-50">
      <header className="bg-ardosia-950 px-4 py-4 flex items-center justify-between">
        <BrasmegLogo tema="escuro" />
        <div className="text-right">
          <p className="text-xs text-ardosia-300">{session.nome}</p>
          <form action={logout}>
            <button className="text-[11px] text-ardosia-500 hover:text-ambar-500">Sair</button>
          </form>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {inventariosAtivos.length === 0 && (
          <p className="text-center text-sm text-ardosia-400 py-12">
            Nenhum inventário em contagem no momento.
          </p>
        )}

        {inventariosAtivos.length > 1 && !inventarioAtual && (
          <div className="space-y-2">
            <p className="text-sm text-ardosia-600 mb-2">Escolha o inventário:</p>
            {inventariosAtivos.map((inv) => (
              <a
                key={inv.id}
                href={`/contagem?inventarioId=${inv.id}`}
                className="block border border-ardosia-200 rounded-sm px-4 py-3 bg-white hover:border-ambar-500 transition-colors"
              >
                <p className="text-sm font-medium">{inv.nome}</p>
                <p className="text-xs text-ardosia-500">{inv.cliente.nome}</p>
              </a>
            ))}
          </div>
        )}

        {inventarioAtual && rodadaAtiva && (
          <>
            <div className="mb-4">
              <p className="font-display text-lg font-medium">{inventarioAtual.nome}</p>
              <p className="text-xs text-ardosia-500">
                {inventarioAtual.cliente.nome} · Rodada {rodadaAtiva.numero} · {pendentes.length} pendente(s)
              </p>
              {inventariosAtivos.length > 1 && (
                <a href="/contagem" className="text-[11px] text-ardosia-400 hover:text-ambar-600">
                  ← trocar inventário
                </a>
              )}
            </div>
            <ContagemForm
              rodadaId={rodadaAtiva.id}
              itens={pendentes.map((p) => ({
                id: p.id,
                descricao: p.descricao,
                lote: p.lote,
                quantidadeEsperada: p.quantidadeEsperada.toString(),
              }))}
            />
          </>
        )}
      </main>
    </div>
  );
}
