"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const TIPO_MAP: Record<string, string> = {
  carga: "CARGA",
  descarga: "DESCARGA",
  entrega: "ENTREGA",
};

function normalizar(v: unknown) {
  return String(v ?? "").trim();
}

function mapTipoOperacao(valor: string) {
  const chave = valor.toLowerCase().trim();
  return TIPO_MAP[chave] || valor.toUpperCase() || "OUTRO";
}

function mapStatus(valor: string) {
  const v = valor.toLowerCase();
  if (v.includes("final")) return "FINALIZADO";
  if (v.includes("cancel")) return "CANCELADO";
  return "EM_ANDAMENTO";
}

function parseHora(dataBase: Date, hora: string): Date | null {
  const h = hora.trim();
  if (!h) return null;
  const partes = h.split(":").map((p) => Number(p));
  if (partes.some((p) => Number.isNaN(p))) return null;
  const d = new Date(dataBase);
  d.setHours(partes[0] || 0, partes[1] || 0, 0, 0);
  return d;
}

function parseServicosAdicionais(texto: string) {
  if (!texto.trim()) return [] as { tipoServico: string; quantidade: number; observacao: string | null }[];
  return texto
    .split(";")
    .map((parte) => parte.trim())
    .filter(Boolean)
    .map((parte) => {
      const match = parte.match(/^(.*?)\(([\d.,]+)\)\s*$/);
      const nome = (match ? match[1] : parte).trim();
      const quantidade = match ? Number(match[2].replace(",", ".")) || 1 : 1;
      const nomeLower = nome.toLowerCase();
      let tipoServico = "OUTRO";
      if (nomeLower.includes("stretch")) tipoServico = "STRETCH";
      else if (nomeLower.includes("pallet")) tipoServico = "PALLET";
      return { tipoServico, quantidade, observacao: tipoServico === "OUTRO" ? nome : null };
    });
}

export type ResultadoImportacao = {
  erro?: string;
  resumo?: {
    linhasLidas: number;
    importados: number;
    ignorados: number;
    clientesCriados: string[];
    porTipo: Record<string, number>;
    totalNotas: number;
  };
};

export async function importarPainelDia(
  _prevState: ResultadoImportacao | undefined,
  formData: FormData
): Promise<ResultadoImportacao> {
  const session = await getSession();
  const arquivo = formData.get("arquivo") as File | null;

  if (!arquivo || arquivo.size === 0) {
    return { erro: "Selecione um arquivo .xlsx antes de importar." };
  }

  let workbook: ExcelJS.Workbook;
  try {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);
  } catch {
    return { erro: "Não consegui ler esse arquivo. Confirme se é um .xlsx válido." };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { erro: "A planilha não tem nenhuma aba." };
  }

  // Mapeia cabeçalho -> índice da coluna (não depende da ordem exata)
  const cabecalho = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, colNumber) => {
    cabecalho.set(normalizar(cell.value).toLowerCase(), colNumber);
  });

  function col(nome: string) {
    return cabecalho.get(nome.toLowerCase());
  }

  const idxData = col("Data");
  const idxCliente = col("Cliente");
  const idxTipo = col("Tipo");
  const idxNF = col("NF");
  const idxQtdeNF = col("Qtde NF");
  const idxPlaca = col("Placa");
  const idxTransportadora = col("Transportadora");
  const idxChegada = col("Chegada");
  const idxLiberacao = col("Liberação");
  const idxInicio = col("Início Operação");
  const idxSaida = col("Saída");
  const idxStatus = col("Status");
  const idxServicos = col("Serviços Adicionais");

  if (!idxData || !idxCliente || !idxTipo || !idxPlaca) {
    return {
      erro:
        "Não encontrei as colunas esperadas (Data, Cliente, Tipo, Placa). Confirma se é o mesmo formato do Painel do Dia.",
    };
  }

  const clienteCache = new Map<string, string>(); // nome normalizado (minúsculo) -> id
  const clientesCriados: string[] = [];
  const porTipo: Record<string, number> = {};
  let importados = 0;
  let ignorados = 0;
  let totalNotas = 0;
  let linhasLidas = 0;

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const dataStr = normalizar(row.getCell(idxData).value);
    if (!dataStr) continue; // linha vazia
    linhasLidas++;

    const nomeCliente = normalizar(row.getCell(idxCliente).value);
    const tipoRaw = normalizar(row.getCell(idxTipo).value);
    const placa = normalizar(row.getCell(idxPlaca).value);

    if (!nomeCliente || !tipoRaw || !placa) {
      ignorados++;
      continue;
    }

    const dataBase = new Date(dataStr);
    if (Number.isNaN(dataBase.getTime())) {
      ignorados++;
      continue;
    }

    // Busca ou cria o cliente pelo nome (case-insensitive)
    const chaveCliente = nomeCliente.toLowerCase();
    let clienteId = clienteCache.get(chaveCliente);
    if (!clienteId) {
      const existente = await db.cliente.findFirst({
        where: { nome: { equals: nomeCliente, mode: "insensitive" } },
      });
      if (existente) {
        clienteId = existente.id;
      } else {
        const novo = await db.cliente.create({ data: { nome: nomeCliente } });
        clienteId = novo.id;
        clientesCriados.push(nomeCliente);
      }
      clienteCache.set(chaveCliente, clienteId);
    }

    const tipoOperacao = mapTipoOperacao(tipoRaw);
    const numeroReferencia = idxNF ? normalizar(row.getCell(idxNF).value) || null : null;
    const quantidadeNotas = idxQtdeNF ? Number(row.getCell(idxQtdeNF).value) || 1 : 1;
    const transportadora = idxTransportadora ? normalizar(row.getCell(idxTransportadora).value) || null : null;
    const statusRaw = idxStatus ? normalizar(row.getCell(idxStatus).value) : "";
    const status = statusRaw ? mapStatus(statusRaw) : "EM_ANDAMENTO";

    const horaChegada = idxChegada ? parseHora(dataBase, normalizar(row.getCell(idxChegada).value)) : null;
    const horaLiberacao = idxLiberacao ? parseHora(dataBase, normalizar(row.getCell(idxLiberacao).value)) : null;
    const horaInicioOp = idxInicio ? parseHora(dataBase, normalizar(row.getCell(idxInicio).value)) : null;
    const horaFimOp = idxSaida ? parseHora(dataBase, normalizar(row.getCell(idxSaida).value)) : null;

    // Evita duplicar se essa linha já foi importada antes
    const jaExiste = await db.processo.findFirst({
      where: {
        clienteId,
        placaVeiculo: placa,
        numeroReferencia,
        data: {
          gte: new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate()),
          lt: new Date(dataBase.getFullYear(), dataBase.getMonth(), dataBase.getDate() + 1),
        },
      },
    });
    if (jaExiste) {
      ignorados++;
      continue;
    }

    const cliente = await db.cliente.findUniqueOrThrow({ where: { id: clienteId } });

    const servicos = idxServicos ? parseServicosAdicionais(normalizar(row.getCell(idxServicos).value)) : [];

    await db.processo.create({
      data: {
        clienteId,
        data: dataBase,
        placaVeiculo: placa,
        transportadora,
        tipoOperacao,
        numeroReferencia,
        quantidadeNotas,
        status,
        horaChegada,
        horaLiberacao,
        horaInicioOp,
        horaFimOp,
        criadoPorId: session?.userId,
        servicos: {
          create: servicos.map((s) => ({
            tipoServico: s.tipoServico,
            quantidade: s.quantidade,
            unidade: s.tipoServico === "STRETCH" ? "ROLO" : "UN",
            palletProprioCliente: s.tipoServico === "PALLET" && cliente.usaPalletProprio,
            observacao: s.observacao,
          })),
        },
      },
    });

    // Abate do saldo de pallets próprios, se for o caso
    for (const s of servicos) {
      if (s.tipoServico === "PALLET" && cliente.usaPalletProprio) {
        await db.movimentoPallet.create({
          data: {
            clienteId,
            tipo: "SAIDA_CONSUMO",
            quantidade: s.quantidade,
            referencia: numeroReferencia
              ? `NF ${numeroReferencia} · Importação (${dataStr})`
              : `Placa ${placa} · Importação (${dataStr})`,
          },
        });
      }
    }

    importados++;
    totalNotas += quantidadeNotas;
    porTipo[tipoOperacao] = (porTipo[tipoOperacao] || 0) + 1;
  }

  revalidatePath("/processos");
  revalidatePath("/pallets");
  revalidatePath("/dashboard");

  return {
    resumo: { linhasLidas, importados, ignorados, clientesCriados, porTipo, totalNotas },
  };
}
