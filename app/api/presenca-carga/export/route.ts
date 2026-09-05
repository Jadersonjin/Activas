import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || undefined;

  const registros = await db.presencaCarga.findMany({
    where: q
      ? {
          OR: [
            { fornecedor: { contains: q, mode: "insensitive" } },
            { numeroNota: { contains: q, mode: "insensitive" } },
            { cliente: { nome: { contains: q, mode: "insensitive" } } },
            { itens: { some: { codigoProduto: { contains: q, mode: "insensitive" } } } },
            { itens: { some: { descricao: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : undefined,
    orderBy: { dataChegada: "desc" },
    include: { cliente: true, itens: true },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Presença de carga");

  sheet.columns = [
    { header: "Data de chegada", key: "dataChegada", width: 16 },
    { header: "Cliente", key: "cliente", width: 24 },
    { header: "Fornecedor", key: "fornecedor", width: 24 },
    { header: "Nº da nota", key: "numeroNota", width: 14 },
    { header: "Código do produto", key: "codigoProduto", width: 18 },
    { header: "Descrição", key: "descricao", width: 32 },
    { header: "Quantidade", key: "quantidade", width: 12 },
    { header: "Unidade", key: "unidade", width: 10 },
    { header: "Observação", key: "observacao", width: 28 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const registro of registros) {
    if (registro.itens.length === 0) {
      sheet.addRow({
        dataChegada: registro.dataChegada.toLocaleDateString("pt-BR"),
        cliente: registro.cliente.nome,
        fornecedor: registro.fornecedor,
        numeroNota: registro.numeroNota,
        observacao: registro.observacao || "",
      });
      continue;
    }
    for (const item of registro.itens) {
      sheet.addRow({
        dataChegada: registro.dataChegada.toLocaleDateString("pt-BR"),
        cliente: registro.cliente.nome,
        fornecedor: registro.fornecedor,
        numeroNota: registro.numeroNota,
        codigoProduto: item.codigoProduto,
        descricao: item.descricao,
        quantidade: item.quantidade.toString(),
        unidade: item.unidade,
        observacao: registro.observacao || "",
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const dataArquivo = new Date().toISOString().slice(0, 10);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="presenca-carga-${dataArquivo}.xlsx"`,
    },
  });
}
