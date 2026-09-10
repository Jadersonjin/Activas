import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { EditarPresencaCargaForm } from "@/components/EditarPresencaCargaForm";
import { db } from "@/lib/db";
import { atualizarPresencaCarga } from "@/lib/actions/presenca-carga";

export default async function EditarPresencaCargaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await getSession())!;
  const [registro, clientes] = await Promise.all([
    db.presencaCarga.findUnique({ where: { id }, include: { itens: true } }),
    db.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);
  if (!registro) notFound();

  const acao = atualizarPresencaCarga.bind(null, registro.id);
  const dataChegadaISO = new Date(registro.dataChegada).toISOString().slice(0, 10);

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">05 · PRESENÇA DE CARGA</p>
        <h1 className="font-display text-2xl font-medium mt-1">Editar presença de carga</h1>
      </header>

      <EditarPresencaCargaForm
        clientes={clientes}
        acao={acao}
        clienteId={registro.clienteId}
        fornecedor={registro.fornecedor}
        numeroNota={registro.numeroNota}
        dataChegada={dataChegadaISO}
        observacao={registro.observacao || ""}
        itensIniciais={registro.itens.map((i) => ({
          codigoProduto: i.codigoProduto,
          descricao: i.descricao,
          quantidade: i.quantidade.toString(),
          unidade: i.unidade,
        }))}
      />
    </AppShell>
  );
}
