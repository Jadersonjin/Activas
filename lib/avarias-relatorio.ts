import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { rangeDia } from "@/lib/date-range";
import { fmtData } from "@/lib/br-date";
import {
  LIMITE_RELATORIO,
  fmtDataStr,
  fmtKg,
  type DadosRelatorioAvarias,
  type LinhaAvaria,
} from "@/lib/avarias-tipos";

export { nomeArquivoAvarias } from "@/lib/avarias-tipos";

export type FiltroAvarias = { q?: string; de?: string; ate?: string; origem?: string };

// Mesmo filtro da tela /avarias — usado pela listagem e pelos relatórios (Excel/PDF)
export function whereAvarias({ q, de, ate, origem }: FiltroAvarias): Prisma.AvariaWhereInput {
  return {
    data: rangeDia(de, ate),
    ...(origem ? { origem } : {}),
    ...(q
      ? {
          OR: [
            { codigoProduto: { contains: q, mode: "insensitive" } },
            { descricao: { contains: q, mode: "insensitive" } },
            { lote: { contains: q, mode: "insensitive" } },
            { numeroNota: { contains: q, mode: "insensitive" } },
            { localizacao: { contains: q, mode: "insensitive" } },
            { cliente: { nome: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

export async function buscarDadosRelatorioAvarias(filtro: FiltroAvarias): Promise<DadosRelatorioAvarias> {
  const registros = await db.avaria.findMany({
    where: whereAvarias(filtro),
    orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
    take: LIMITE_RELATORIO + 1,
    include: { cliente: true },
  });
  const truncado = registros.length > LIMITE_RELATORIO;

  const linhas: LinhaAvaria[] = registros.slice(0, LIMITE_RELATORIO).map((a) => ({
    data: fmtData(a.data),
    cliente: a.cliente.nome,
    codigoProduto: a.codigoProduto,
    descricao: a.descricao,
    lote: a.lote || "",
    numeroNota: a.numeroNota || "",
    pesoKg: Number(a.pesoAvaria),
    localizacao: a.localizacao || "",
    tipo: a.origem === "RADAR" ? "Radar" : "Avaria de origem",
    identificacao: a.varredura
      ? `Varredura${a.quantidadeVarreduraKg ? ` · ${fmtKg(Number(a.quantidadeVarreduraKg))} kg` : ""}`
      : "Apontamento direto",
    situacao:
      a.origem === "RADAR" ? (a.sanada ? `Sanada${a.sanadaEm ? ` em ${fmtData(a.sanadaEm)}` : ""}` : "Em aberto") : "",
    observacao: a.observacao || "",
  }));

  const filtros: string[] = [];
  if (filtro.de || filtro.ate) {
    filtros.push(
      `Período: ${filtro.de ? fmtDataStr(filtro.de) : "início"} a ${filtro.ate ? fmtDataStr(filtro.ate) : "hoje"}`
    );
  }
  if (filtro.origem) filtros.push(`Tipo: ${filtro.origem === "RADAR" ? "Radar" : "Avaria de origem"}`);
  if (filtro.q) filtros.push(`Busca: "${filtro.q}"`);

  return {
    linhas,
    filtros,
    geradoEm: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    truncado,
  };
}

