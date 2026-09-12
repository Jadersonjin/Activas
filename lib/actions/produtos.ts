"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { registrarLog } from "@/lib/log";

function normalizar(v: unknown) {
  return String(v ?? "").trim();
}

export async function criarProduto(formData: FormData) {
  const clienteId = String(formData.get("clienteId") || "");
  const codigo = String(formData.get("codigo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();

  if (!clienteId || !codigo || !descricao) return;

  await db.produto.upsert({
    where: { clienteId_codigo: { clienteId, codigo } },
    create: { clienteId, codigo, descricao },
    update: { descricao, ativo: true },
  });

  await registrarLog("Produto", null, "CRIAR", `Produto "${codigo}" (${descricao}) cadastrado/atualizado`);
  revalidatePath("/produtos");
}

export async function atualizarProduto(id: string, formData: FormData) {
  const codigo = String(formData.get("codigo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();
  if (!codigo || !descricao) return;

  await db.produto.update({ where: { id }, data: { codigo, descricao } });
  await registrarLog("Produto", id, "EDITAR", `Produto "${codigo}" editado`);
  revalidatePath("/produtos");
}

export async function alternarProdutoAtivo(id: string, ativo: boolean) {
  const produto = await db.produto.update({ where: { id }, data: { ativo } });
  await registrarLog("Produto", id, "EDITAR", `Produto "${produto.codigo}" marcado como ${ativo ? "ativo" : "inativo"}`);
  revalidatePath("/produtos");
}

export type ResultadoImportacaoProdutos = {
  erro?: string;
  resumo?: { linhasLidas: number; importados: number; ignorados: number };
};

export async function importarProdutos(
  _prevState: ResultadoImportacaoProdutos | undefined,
  formData: FormData
): Promise<ResultadoImportacaoProdutos> {
  const clienteId = String(formData.get("clienteId") || "");
  const arquivo = formData.get("arquivo") as File | null;

  if (!clienteId) return { erro: "Selecione o cliente." };
  if (!arquivo || arquivo.size === 0) return { erro: "Selecione a planilha (.xlsx)." };

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
  if (!sheet) return { erro: "A planilha não tem nenhuma aba." };

  const cabecalho = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, colNumber) => {
    cabecalho.set(normalizar(cell.value).toLowerCase(), colNumber);
  });
  const idxCodigo = cabecalho.get("produto") || cabecalho.get("código") || cabecalho.get("codigo");
  const idxDescricao = cabecalho.get("descrição") || cabecalho.get("descricao");

  if (!idxCodigo || !idxDescricao) {
    return { erro: "A planilha precisa ter as colunas Produto (ou Código) e Descrição." };
  }

  let linhasLidas = 0;
  let importados = 0;
  let ignorados = 0;

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const codigo = normalizar(row.getCell(idxCodigo).value);
    const descricao = normalizar(row.getCell(idxDescricao).value);
    if (!codigo && !descricao) continue;
    linhasLidas++;

    if (!codigo || !descricao) {
      ignorados++;
      continue;
    }

    await db.produto.upsert({
      where: { clienteId_codigo: { clienteId, codigo } },
      create: { clienteId, codigo, descricao },
      update: { descricao, ativo: true },
    });
    importados++;
  }

  await registrarLog("Produto", clienteId, "CRIAR", `Importação de produtos — ${importados} produto(s) cadastrado(s)/atualizado(s)`);
  revalidatePath("/produtos");

  return { resumo: { linhasLidas, importados, ignorados } };
}
