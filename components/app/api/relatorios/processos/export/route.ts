import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { labelTipoOperacao } from "@/lib/labels";

function fmtHora(d: Date | null) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export async function GET(req: NextRequest) {
  const dia = req.nextUrl.searchParams.get("dia") || undefined;
  const mes = req.nextUrl.searchParams.get("mes") || undefined;

  let inicio: Date;
  let fim: Date;
  let sufixo: string;

  if (mes) {
    const [ano, mesNum] = mes.split("-").map(Number);
    inicio = new Date(ano, mesNum - 1, 1);
    fim = new Date(ano, mesNum, 0, 23, 59, 59, 999);
    sufixo = mes;
  } else {
    const d = dia || new Date().toISOString().slice(0, 10);
    inicio = new Date(`${d}T00:00:00`);
    fim = new Date(`${d}T23:59:59.999`);
    sufixo = d;
  }

  const processos = await db.processo.findMany({
    where: { data: { gte: inicio, lte: fim } },
    orderBy: { data: "asc" },
    include: { cliente: true },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Processos");

  sheet.columns = [
    { header: "Data", key: "data", width: 12 },
    { header: "Cliente", key: "cliente", width: 22 },
    { header: "Tipo", key: "tipo", width: 14 },
    { header: "Placa", key: "placa", width: 16 },
    { header: "Transportadora", key: "transportadora", width: 18 },
    { header: "NF", key: "nf", width: 20 },
    { header: "Qtde NF", key: "qtdeNf", width: 10 },
    { header: "Chegada", key: "chegada", width: 10 },
    { header: "Liberação", key: "liberacao", width: 10 },
    { header: "Início Operação", key: "inicio", width: 14 },
    { header: "Saída", key: "saida", width: 10 },
    { header: "Status", key: "status", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const p of processos) {
    sheet.addRow({
      data: new Date(p.data).toLocaleDateString("pt-BR"),
      cliente: p.cliente.nome,
      tipo: labelTipoOperacao(p.tipoOperacao),
      placa: p.placaVeiculo,
      transportadora: p.transportadora || "",
      nf: p.numeroReferencia || "",
      qtdeNf: p.quantidadeNotas || 1,
      chegada: fmtHora(p.horaChegada),
      liberacao: fmtHora(p.horaLiberacao),
      inicio: fmtHora(p.horaInicioOp),
      saida: fmtHora(p.horaFimOp),
      status: p.status === "FINALIZADO" ? "Finalizado" : p.status === "CANCELADO" ? "Cancelado" : "Em andamento",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="processos-${sufixo}.xlsx"`,
    },
  });
}
