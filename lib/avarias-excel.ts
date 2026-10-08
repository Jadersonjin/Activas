import ExcelJS from "exceljs";
import { resumir, type DadosRelatorioAvarias } from "@/lib/avarias-tipos";

const AZUL = "FF163564";
const LARANJA = "FFF2811D";
const CINZA = "FFE2ECF7";

function estilizarCabecalho(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.alignment = { vertical: "middle" };
  row.height = 22;
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL } };
  });
}

export async function gerarExcelAvarias(dados: DadosRelatorioAvarias) {
  const { linhas, filtros, geradoEm, truncado } = dados;
  const resumo = resumir(linhas);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Brasmeg — Controle Operacional";

  // ── Aba 1: Resumo ─────────────────────────────────────────────
  const sr = workbook.addWorksheet("Resumo");
  sr.columns = [{ width: 34 }, { width: 14 }, { width: 18 }];

  sr.mergeCells("A1:C1");
  sr.getCell("A1").value = "Relatório de Avarias — Brasmeg";
  sr.getCell("A1").font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  sr.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: LARANJA } };
  sr.getRow(1).height = 26;
  sr.getCell("A1").alignment = { vertical: "middle" };

  sr.addRow(["Emitido em", geradoEm]);
  sr.addRow(["Filtros", filtros.length ? filtros.join(" · ") : "Nenhum (todos os registros)"]);
  if (truncado) sr.addRow(["Atenção", "Limite de registros atingido — refine o filtro para ver todos."]);
  sr.addRow([]);

  sr.addRow(["Total de avarias", resumo.total]);
  sr.addRow(["Peso total (kg)", resumo.pesoTotal]).getCell(2).numFmt = "#,##0.00";
  sr.addRow(["Identificadas em varredura", resumo.varreduras]);
  sr.addRow([]);

  const blocos: [string, { nome: string; qtde: number; peso: number }[]][] = [
    ["Por cliente", resumo.porCliente],
    ["Por tipo", resumo.porTipo],
  ];
  for (const [titulo, itens] of blocos) {
    estilizarCabecalho(sr.addRow([titulo, "Ocorrências", "Peso (kg)"]));
    for (const it of itens) {
      const r = sr.addRow([it.nome, it.qtde, it.peso]);
      r.getCell(3).numFmt = "#,##0.00";
    }
    sr.addRow([]);
  }

  // ── Aba 2: Detalhe ───────────────────────────────────────────
  const sd = workbook.addWorksheet("Avarias");
  sd.columns = [
    { header: "Data", key: "data", width: 12 },
    { header: "Cliente", key: "cliente", width: 26 },
    { header: "Código", key: "codigoProduto", width: 16 },
    { header: "Descrição", key: "descricao", width: 38 },
    { header: "Lote", key: "lote", width: 14 },
    { header: "Nota", key: "numeroNota", width: 14 },
    { header: "Peso (kg)", key: "pesoKg", width: 12 },
    { header: "Localização", key: "localizacao", width: 18 },
    { header: "Tipo", key: "tipo", width: 18 },
    { header: "Identificação", key: "identificacao", width: 22 },
    { header: "Situação (Radar)", key: "situacao", width: 22 },
    { header: "Observação", key: "observacao", width: 36 },
  ];
  estilizarCabecalho(sd.getRow(1));
  sd.views = [{ state: "frozen", ySplit: 1 }];

  for (const l of linhas) sd.addRow(l);
  sd.getColumn("pesoKg").numFmt = "#,##0.00";

  const ultima = linhas.length + 1;
  sd.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(ultima, 1), column: 12 } };

  // Total — SUBTOTAL respeita o filtro aplicado no Excel
  const total = sd.addRow({ descricao: "TOTAL", pesoKg: { formula: `SUBTOTAL(109,G2:G${Math.max(ultima, 2)})`, result: resumo.pesoTotal } });
  total.font = { bold: true };
  total.getCell("pesoKg").numFmt = "#,##0.00";
  total.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CINZA } };
  });

  return workbook.xlsx.writeBuffer();
}
