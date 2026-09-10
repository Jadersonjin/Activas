import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { fmtData } from "@/lib/br-date";

const LABEL_OBSERVACAO: Record<string, string> = {
  JA_TRATADO: "Já tratado em inventário anterior",
  TRATATIVA_ADMINISTRATIVA: "Tratativa administrativa",
  OUTRO: "Outro",
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const inventario = await db.inventario.findUniqueOrThrow({
    where: { id },
    include: { cliente: true, itens: { orderBy: { descricao: "asc" } } },
  });

  const contagens = await db.inventarioContagem.findMany({
    where: { itemEsperado: { inventarioId: id } },
    orderBy: { criadoEm: "desc" },
  });

  const contagensPorItem = new Map<string, typeof contagens>();
  for (const c of contagens) {
    if (!contagensPorItem.has(c.itemEsperadoId)) contagensPorItem.set(c.itemEsperadoId, []);
    contagensPorItem.get(c.itemEsperadoId)!.push(c);
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Inventário");

  sheet.columns = [
    { header: "Descrição", key: "descricao", width: 32 },
    { header: "Lote", key: "lote", width: 16 },
    { header: "Esperado", key: "esperado", width: 12 },
    { header: "Contado (final)", key: "contado", width: 14 },
    { header: "Diferença", key: "diferenca", width: 12 },
    { header: "Localização", key: "localizacao", width: 16 },
    { header: "Status", key: "status", width: 14 },
    { header: "Observação", key: "observacao", width: 32 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const item of inventario.itens) {
    const lista = contagensPorItem.get(item.id) || [];
    const esperado = Number(item.quantidadeEsperada);
    const bateu = lista.find((c) => Number(c.quantidadeContada) === esperado);
    const ultima = bateu || lista[0];
    const contado = ultima ? Number(ultima.quantidadeContada) : null;

    sheet.addRow({
      descricao: item.descricao,
      lote: item.lote,
      esperado,
      contado: contado ?? "",
      diferenca: contado !== null ? contado - esperado : "",
      localizacao: ultima?.localizacao || "",
      status: !ultima ? "Pendente" : bateu ? "OK" : "Divergente",
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
