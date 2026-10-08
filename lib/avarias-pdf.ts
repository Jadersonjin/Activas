import { jsPDF } from "jspdf";
import { fmtKg, resumir, type DadosRelatorioAvarias, type LinhaAvaria } from "@/lib/avarias-tipos";

// Cores da identidade Brasmeg
const AZUL_ESCURO: [number, number, number] = [10, 26, 51];
const AZUL: [number, number, number] = [22, 53, 100];
const AZUL_CLARO: [number, number, number] = [226, 236, 247];
const LARANJA: [number, number, number] = [242, 129, 29];
const CINZA: [number, number, number] = [110, 120, 135];

const M = 10; // margem (mm)
const LARGURA = 297;
const ALTURA = 210;
const RODAPE = 12;

type Coluna = { titulo: string; w: number; align?: "left" | "right"; mono?: boolean };

const COLUNAS: Coluna[] = [
  { titulo: "Data", w: 18 },
  { titulo: "Cliente", w: 34 },
  { titulo: "Código", w: 24, mono: true },
  { titulo: "Descrição", w: 62 },
  { titulo: "Lote", w: 24, mono: true },
  { titulo: "Nota", w: 20, mono: true },
  { titulo: "Peso (kg)", w: 22, align: "right" },
  { titulo: "Localização", w: 26 },
  { titulo: "Tipo / Identificação", w: 47 },
];

export function gerarPdfAvarias(dados: DadosRelatorioAvarias, logoDataUrl?: string): ArrayBuffer {
  const { linhas, filtros, geradoEm, truncado } = dados;
  const resumo = resumir(linhas);
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  let y = M;

  function cabecalhoPrimeiraPagina() {
    pdf.setFillColor(...LARANJA);
    pdf.rect(0, 0, LARGURA, 12, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text("RELATÓRIO DE AVARIAS", LARGURA / 2, 8, { align: "center" });

    let xTexto = M;
    if (logoDataUrl) {
      try {
        pdf.addImage(logoDataUrl, "PNG", M, 16, 22, 17.6);
        xTexto = M + 28;
      } catch {
        /* segue sem logo */
      }
    }
    pdf.setTextColor(...AZUL_ESCURO);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Brasmeg Transporte e Armazém Geral", xTexto, 22);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...CINZA);
    pdf.text(`Filtros: ${filtros.length ? filtros.join("  ·  ") : "nenhum (todos os registros)"}`, xTexto, 28);
    pdf.text(`Emitido em ${geradoEm}`, xTexto, 33);
    y = 40;

    // Cartões de resumo
    const cartoes: [string, string][] = [
      ["Total de avarias", String(resumo.total)],
      ["Peso total", `${fmtKg(resumo.pesoTotal)} kg`],
      ["Em varredura", String(resumo.varreduras)],
      ...resumo.porTipo.map((t): [string, string] => [t.nome, `${t.qtde} · ${fmtKg(t.peso)} kg`]),
    ];
    const gap = 4;
    const wCartao = (LARGURA - 2 * M - gap * (cartoes.length - 1)) / cartoes.length;
    cartoes.forEach(([rotulo, valor], i) => {
      const x = M + i * (wCartao + gap);
      pdf.setFillColor(...AZUL_CLARO);
      pdf.roundedRect(x, y, wCartao, 15, 1, 1, "F");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...CINZA);
      pdf.text(rotulo, x + 3, y + 5);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.5);
      pdf.setTextColor(...AZUL_ESCURO);
      pdf.text(pdf.splitTextToSize(valor, wCartao - 6)[0], x + 3, y + 11.5);
    });
    y += 21;

    // Resumo por cliente (se houver mais de um)
    if (resumo.porCliente.length > 1) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...AZUL_ESCURO);
      pdf.text("Por cliente", M, y);
      y += 2;
      const wNome = 90;
      for (const c of resumo.porCliente.slice(0, 8)) {
        y += 4.6;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.text(pdf.splitTextToSize(c.nome, wNome - 2)[0], M + 2, y);
        pdf.text(`${c.qtde} ocorr.`, M + wNome + 22, y, { align: "right" });
        pdf.text(`${fmtKg(c.peso)} kg`, M + wNome + 55, y, { align: "right" });
      }
      if (resumo.porCliente.length > 8) {
        y += 4.6;
        pdf.setTextColor(...CINZA);
        pdf.text(`… e mais ${resumo.porCliente.length - 8} cliente(s) — veja o Excel para o detalhe completo.`, M + 2, y);
      }
      y += 6;
    }
    if (truncado) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...LARANJA);
      pdf.text("Atenção: limite de registros atingido — refine o filtro para ver todos.", M, y);
      y += 6;
    }
  }

  function cabecalhoTabela() {
    pdf.setFillColor(...AZUL);
    pdf.rect(M, y, LARGURA - 2 * M, 7, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    let x = M;
    for (const c of COLUNAS) {
      if (c.align === "right") pdf.text(c.titulo, x + c.w - 2, y + 4.8, { align: "right" });
      else pdf.text(c.titulo, x + 2, y + 4.8);
      x += c.w;
    }
    y += 7;
  }

  function novaPagina() {
    pdf.addPage();
    y = M;
    cabecalhoTabela();
  }

  function celulas(l: LinhaAvaria): string[][] {
    const tipoTxt = [l.tipo + (l.situacao ? ` (${l.situacao})` : ""), l.identificacao.replace(" · ", " - ")];
    return [
      [l.data],
      [l.cliente],
      [l.codigoProduto],
      [l.descricao],
      [l.lote || "—"],
      [l.numeroNota || "—"],
      [fmtKg(l.pesoKg)],
      [l.localizacao || "—"],
      tipoTxt,
    ];
  }

  cabecalhoPrimeiraPagina();
  cabecalhoTabela();

  pdf.setFontSize(8);
  linhas.forEach((l, idx) => {
    const cols = celulas(l).map((txt, i) => {
      const c = COLUNAS[i];
      pdf.setFont(c.mono ? "courier" : "helvetica", "normal");
      pdf.setFontSize(c.mono ? 7.5 : 8);
      return txt.flatMap((t) => pdf.splitTextToSize(t, c.w - 4) as string[]);
    });
    let obs: string[] = [];
    if (l.observacao) {
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(7);
      obs = pdf.splitTextToSize(`Obs: ${l.observacao}`, COLUNAS[3].w - 4) as string[];
    }
    const linhasMax = Math.max(...cols.map((c, i) => c.length + (i === 3 ? obs.length : 0)));
    const h = Math.max(6.5, linhasMax * 3.6 + 3);

    if (y + h > ALTURA - RODAPE) novaPagina();

    if (idx % 2 === 1) {
      pdf.setFillColor(245, 248, 252);
      pdf.rect(M, y, LARGURA - 2 * M, h, "F");
    }
    let x = M;
    cols.forEach((linhasCel, i) => {
      const c = COLUNAS[i];
      pdf.setFont(c.mono ? "courier" : "helvetica", i === 6 ? "bold" : "normal");
      pdf.setFontSize(c.mono ? 7.5 : 8);
      pdf.setTextColor(...AZUL_ESCURO);
      linhasCel.forEach((t, k) => {
        if (i === 8 && k >= 1) pdf.setTextColor(...CINZA);
        const ty = y + 4.5 + k * 3.6;
        if (c.align === "right") pdf.text(t, x + c.w - 2, ty, { align: "right" });
        else pdf.text(t, x + 2, ty);
      });
      if (i === 3 && obs.length) {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(7);
        pdf.setTextColor(...CINZA);
        obs.forEach((t, k) => pdf.text(t, x + 2, y + 4.5 + (linhasCel.length + k) * 3.6));
      }
      x += c.w;
    });
    pdf.setDrawColor(...AZUL_CLARO);
    pdf.line(M, y + h, LARGURA - M, y + h);
    y += h;
  });

  if (linhas.length === 0) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...CINZA);
    pdf.text("Nenhuma avaria encontrada no filtro selecionado.", LARGURA / 2, y + 12, { align: "center" });
  } else {
    // Linha de total
    if (y + 8 > ALTURA - RODAPE) novaPagina();
    pdf.setFillColor(...AZUL_CLARO);
    pdf.rect(M, y, LARGURA - 2 * M, 7, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...AZUL_ESCURO);
    const xPeso = M + COLUNAS.slice(0, 6).reduce((s, c) => s + c.w, 0);
    pdf.text(`TOTAL (${resumo.total} avarias)`, M + 2, y + 4.8);
    pdf.text(fmtKg(resumo.pesoTotal), xPeso + COLUNAS[6].w - 2, y + 4.8, { align: "right" });
  }

  // Rodapé com paginação em todas as páginas
  const total = pdf.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    pdf.setPage(p);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...CINZA);
    pdf.text("Brasmeg Transporte e Armazém Geral — relatório gerado automaticamente", M, ALTURA - 6);
    pdf.text(`Página ${p} de ${total}`, LARGURA - M, ALTURA - 6, { align: "right" });
  }

  return pdf.output("arraybuffer");
}
