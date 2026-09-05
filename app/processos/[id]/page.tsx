import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import {
  registrarHorario,
  finalizarProcesso,
  adicionarServico,
} from "@/lib/actions/processos";

function fmtHora(d: Date | null) {
  if (!d) return null;
  return new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const ETAPAS = [
  { campo: "horaChegada" as const, label: "Chegada do veículo" },
  { campo: "horaLiberacao" as const, label: "Liberação" },
  { campo: "horaInicioOp" as const, label: "Início da operação" },
  { campo: "horaFimOp" as const, label: "Finalização da operação" },
];

export default async function ProcessoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await getSession())!;
  const processo = await db.processo.findUnique({
    where: { id },
    include: { cliente: true, servicos: { orderBy: { criadoEm: "desc" } } },
  });

  if (!processo) notFound();

  return (
    <AppShell session={session}>
      <header className="mb-8 flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-ardosia-600">03 · PROCESSOS</p>
          <h1 className="font-display text-2xl font-medium mt-1">
            {processo.cliente.nome} · {processo.placaVeiculo}
          </h1>
          <p className="text-sm text-ardosia-500 mt-1">
            {processo.tipoOperacao} {processo.numeroReferencia ? `· Ref. ${processo.numeroReferencia}` : ""}
          </p>
        </div>
        {processo.status !== "FINALIZADO" && (
          <form action={finalizarProcesso.bind(null, processo.id)}>
            <button className="text-sm border border-ardosia-300 rounded-sm px-4 py-2 hover:border-ambar-500 hover:text-ambar-600 transition-colors">
              Finalizar processo
            </button>
          </form>
        )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-10">
        {ETAPAS.map((etapa) => {
          const valor = processo[etapa.campo] as Date | null;
          return (
            <div key={etapa.campo} className="border border-ardosia-200 rounded-sm bg-white p-4">
              <p className="text-xs text-ardosia-500 mb-2">{etapa.label}</p>
              {valor ? (
                <p className="font-mono text-lg text-ardosia-950">{fmtHora(valor)}</p>
              ) : (
                <form action={registrarHorario.bind(null, processo.id, etapa.campo)}>
                  <button className="text-sm text-ambar-600 hover:text-ambar-500 font-medium">
                    Registrar agora
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="border border-ardosia-200 rounded-sm bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-ardosia-100">
            <h2 className="font-display text-sm font-medium">Serviços utilizados</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ardosia-100 text-left text-xs text-ardosia-600 uppercase tracking-wide">
                <th className="px-4 py-2 font-normal">Serviço</th>
                <th className="px-4 py-2 font-normal">Qtd.</th>
                <th className="px-4 py-2 font-normal">Origem</th>
                <th className="px-4 py-2 font-normal">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {processo.servicos.map((s) => (
                <tr key={s.id} className="border-t border-ardosia-100">
                  <td className="px-4 py-2">{s.tipoServico === "PALLET" ? "Pallet" : s.tipoServico === "STRETCH" ? "Stretch" : s.tipoServico}</td>
                  <td className="px-4 py-2 font-mono">{s.quantidade.toString()} {s.unidade}</td>
                  <td className="px-4 py-2 text-xs text-ardosia-500">
                    {s.palletProprioCliente ? "Saldo próprio do cliente" : "Cobrança normal"}
                  </td>
                  <td className="px-4 py-2 text-xs text-ardosia-500">{s.observacao || "—"}</td>
                </tr>
              ))}
              {processo.servicos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-ardosia-400 text-sm">
                    Nenhum serviço apontado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form
          action={adicionarServico.bind(null, processo.id)}
          className="border border-ardosia-200 rounded-sm bg-white p-5 h-fit space-y-4"
        >
          <h2 className="font-display text-sm font-medium">Apontar serviço</h2>
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Tipo</label>
            <select
              name="tipoServico"
              required
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            >
              <option value="PALLET">Pallet</option>
              <option value="STRETCH">Stretch</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Quantidade</label>
              <input
                name="quantidade"
                type="number"
                step="0.01"
                required
                className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
              />
            </div>
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Unidade</label>
              <input
                name="unidade"
                defaultValue="UN"
                className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
              />
            </div>
          </div>
          {processo.cliente.usaPalletProprio && (
            <label className="flex items-start gap-2 text-xs text-ardosia-700 bg-ardosia-50 border border-ardosia-200 rounded-sm p-3">
              <input type="checkbox" name="palletProprioCliente" className="accent-ambar-500 mt-0.5" />
              <span>
                Pallet próprio do cliente — abater do saldo comprado em vez de cobrar normalmente.
              </span>
            </label>
          )}
          <div>
            <label className="block text-xs text-ardosia-600 mb-1">Observação (opcional)</label>
            <input
              name="observacao"
              className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-ardosia-950 hover:bg-ardosia-900 text-ardosia-50 text-sm rounded-sm py-2 transition-colors"
          >
            Adicionar serviço
          </button>
        </form>
      </section>
    </AppShell>
  );
}
