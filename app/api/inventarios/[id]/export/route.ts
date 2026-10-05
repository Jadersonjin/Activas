import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { fmtData } from "@/lib/br-date";
import { calcularGrupos } from "@/lib/inventario-helpers";

const LABEL_OBSERVACAO: Record<string, string> = {
  JA_TRATADO: "Já tratado em inventário anterior",
  TRATATIVA_ADMINISTRATIVA: "Tratativa administrativa",
  OUTRO: "Outro",
};

const LABEL_STATUS: Record<string, string> = {
  OK: "OK",
  DIVERGENTE: "Divergente",
  PENDENTE: "Pendente",
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const inventario = await db.inventario.findUniqueOrThrow({
    where: { id },
    include: { cliente: true, itens: { orderBy: { descricao: "asc" } } },
  });

  const [contagens, grupos] = await Promise.all([
    db.inventarioContagem.findMany({
      where: { itemEsperado: { inventarioId: id } },
      orderBy: { criadoEm: "desc" },
    }),
    calcularGrupos(id),
  ]);

  const contagensPorItem = new Map<string, typeof contagens>();
  for (const c of contagens) {
    if (!contagensPorItem.has(c.itemEsperadoId)) contagensPorItem.set(c.itemEsperadoId, []);
    contagensPorItem.get(c.itemEsperadoId)!.push(c);
  }
  const statusPorItem = new Map<string, string>();
  for (const g of grupos) {
    for (const d of g.itensDetalhe) statusPorItem.set(d.item.id, g.status);
  }

  const workbook = new ExcelJS.Workbook();

  // Aba 1: resumo por lote — é o que decide se bateu ou não (soma de todas as posições)
  const sheetLotes = workbook.addWorksheet("Resumo por lote");
  sheetLotes.columns = [
    { header: "Código", key: "codigo", width: 14 },
    { header: "Descrição", key: "descricao", width: 32 },
    { header: "Lote", key: "lote", width: 16 },
    { header: "Posições", key: "posicoes", width: 10 },
    { header: "Esperado (total)", key: "esperado", width: 16 },
    { header: "Contado (total)", key: "contado", width: 16 },
    { header: "Diferença", key: "diferenca", width: 12 },
    { header: "Status", key: "status", width: 14 },
  ];
  sheetLotes.getRow(1).font = { bold: true };
  for (const g of grupos) {
    sheetLotes.addRow({
      codigo: g.codigoProduto || "",
      descricao: g.descricao,
      lote: g.lote,
      posicoes: g.itensDetalhe.length,
      esperado: g.esperadoTotal,
      contado: g.todosContados ? g.contadoTotal : "",
      diferenca: g.todosContados ? g.contadoTotal - g.esperadoTotal : "",
      status: LABEL_STATUS[g.status],
    });
  }

  // Aba 2: detalhe por posição — informativo, pra localizar o material
  const sheetPosicoes = workbook.addWorksheet("Detalhe por posição");
  sheetPosicoes.columns = [
    { header: "Armazém", key: "armazem", width: 14 },
    { header: "Posição", key: "posicao", width: 14 },
    { header: "Código", key: "codigo", width: 14 },
    { header: "Descrição", key: "descricao", width: 32 },
    { header: "Lote", key: "lote", width: 16 },
    { header: "Esperado (posição)", key: "esperado", width: 16 },
    { header: "Contado (posição)", key: "contado", width: 16 },
    { header: "Localização", key: "localizacao", width: 16 },
    { header: "Status do lote", key: "statusLote", width: 14 },
    { header: "Avulso", key: "avulso", width: 10 },
    { header: "Observação", key: "observacao", width: 32 },
  ];
  sheetPosicoes.getRow(1).font = { bold: true };

  for (const item of inventario.itens) {
    const lista = contagensPorItem.get(item.id) || [];
    const ultima = lista[0];

    sheetPosicoes.addRow({
      armazem: item.armazem || "",
      posicao: item.posicao || "",
      codigo: item.codigoProduto || "",
      descricao: item.descricao,
      lote: item.lote,
      esperado: Number(item.quantidadeEsperada),
      contado: ultima ? Number(ultima.quantidadeContada) : "",
      localizacao: ultima?.localizacao || "",
      statusLote: LABEL_STATUS[statusPorItem.get(item.id) || "PENDENTE"],
      avulso: item.avulso ? "Sim" : "",
      observacao: item.tipoObservacao
        ? `${LABEL_OBSERVACAO[item.tipoObservacao] || item.tipoObservacao}${item.observacao ? ` — ${item.observacao}` : ""}`
        : item.observacao || "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="inventario-${inventario.cliente.nome.replace(/\s+/g, "-")}-${fmtData(new Date())}.xlsx"`,
    },
  });
}
