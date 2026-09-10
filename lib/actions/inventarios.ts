"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { registrarLog } from "@/lib/log";

function normalizar(v: unknown) {
  return String(v ?? "").trim();
}

export async function criarInventario(
  _prevState: { erro?: string } | undefined,
  formData: FormData
) {
  const nome = String(formData.get("nome") || "").trim();
  const clienteId = String(formData.get("clienteId") || "");
  const arquivo = formData.get("arquivo") as File | null;

  if (!nome || !clienteId) return { erro: "Preencha o nome e o cliente." };
  if (!arquivo || arquivo.size === 0) return { erro: "Selecione a planilha (.xlsx) com o saldo esperado." };

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
  const idxDescricao = cabecalho.get("descrição") || cabecalho.get("descricao");
  const idxLote = cabecalho.get("lote");
  const idxQtd = cabecalho.get("quantidade") || cabecalho.get("qtd") || cabecalho.get("saldo");

  if (!idxDescricao || !idxLote || !idxQtd) {
    return {
      erro: "A planilha precisa ter as colunas: Descrição, Lote e Quantidade (nesses nomes, em qualquer ordem).",
    };
  }

  const itens: { descricao: string; lote: string; quantidadeEsperada: number }[] = [];
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const descricao = normalizar(row.getCell(idxDescricao).value);
    const lote = normalizar(row.getCell(idxLote).value);
    const quantidadeEsperada = Number(row.getCell(idxQtd).value) || 0;
    if (!descricao || !lote) continue;
    itens.push({ descricao, lote, quantidadeEsperada });
  }

  if (itens.length === 0) return { erro: "Não encontrei nenhuma linha válida na planilha." };

  const inventario = await db.inventario.create({
    data: {
      nome,
      clienteId,
      itens: { create: itens },
    },
  });

  await registrarLog(
    "Inventario",
    inventario.id,
    "CRIAR",
    `Inventário "${nome}" criado com ${itens.length} itens esperados`
  );

  redirect(`/inventarios/${inventario.id}`);
}

export async function atualizarObservacaoItem(itemId: string, formData: FormData) {
  const tipoObservacao = String(formData.get("tipoObservacao") || "").trim() || null;
  const observacao = String(formData.get("observacao") || "").trim() || null;

  const item = await db.inventarioItemEsperado.update({
    where: { id: itemId },
    data: { tipoObservacao, observacao },
  });

  revalidatePath(`/inventarios/${item.inventarioId}`);
}

export async function liberarInventario(id: string) {
  const inventario = await db.inventario.findUniqueOrThrow({ where: { id } });
  if (inventario.status !== "PREPARANDO") return;

  await db.$transaction([
    db.inventarioRodada.create({ data: { inventarioId: id, numero: 1 } }),
    db.inventario.update({ where: { id }, data: { status: "EM_CONTAGEM" } }),
  ]);

  await registrarLog("Inventario", id, "EDITAR", `Inventário "${inventario.nome}" liberado pro conferente (1ª contagem)`);
  revalidatePath(`/inventarios/${id}`);
  revalidatePath("/contagem");
}

export async function registrarContagem(
  _prevState: { erro?: string; sucesso?: boolean; bateu?: boolean; ultimoItem?: string } | undefined,
  formData: FormData
) {
  const session = await getSession();
  const rodadaId = String(formData.get("rodadaId") || "");
  const itemEsperadoId = String(formData.get("itemEsperadoId") || "");
  const quantidadeContada = Number(formData.get("quantidadeContada") || 0);
  const localizacao = String(formData.get("localizacao") || "").trim() || null;

  if (!rodadaId || !itemEsperadoId) return { erro: "Selecione o item que você está contando." };
  if (!localizacao) return { erro: "Informe a localização onde encontrou o item." };

  const item = await db.inventarioItemEsperado.findUniqueOrThrow({ where: { id: itemEsperadoId } });

  await db.inventarioContagem.create({
    data: {
      rodadaId,
      itemEsperadoId,
      quantidadeContada,
      localizacao,
      conferenteNome: session?.nome || "Conferente",
      conferenteId: session?.userId,
    },
  });

  revalidatePath("/contagem");
  return {
    sucesso: true,
    bateu: quantidadeContada === Number(item.quantidadeEsperada),
    ultimoItem: `${item.descricao} (lote ${item.lote})`,
  };
}

export async function fecharRodada(rodadaId: string) {
  const rodada = await db.inventarioRodada.findUniqueOrThrow({
    where: { id: rodadaId },
    include: { inventario: { include: { itens: true } } },
  });
  if (rodada.status !== "ABERTA") return;

  // Item está resolvido se já existe, em QUALQUER rodada, uma contagem batendo com o esperado original
  const todasContagens = await db.inventarioContagem.findMany({
    where: { itemEsperado: { inventarioId: rodada.inventarioId } },
    include: { itemEsperado: true },
  });

  const resolvidos = new Set(
    todasContagens
      .filter((c) => Number(c.quantidadeContada) === Number(c.itemEsperado.quantidadeEsperada))
      .map((c) => c.itemEsperadoId)
  );

  const pendentes = rodada.inventario.itens.filter((item) => !resolvidos.has(item.id));

  if (pendentes.length === 0) {
    await db.$transaction([
      db.inventarioRodada.update({ where: { id: rodadaId }, data: { status: "FECHADA", fechadaEm: new Date() } }),
      db.inventario.update({ where: { id: rodada.inventarioId }, data: { status: "FINALIZADO" } }),
    ]);
    await registrarLog("Inventario", rodada.inventarioId, "EDITAR", `Inventário "${rodada.inventario.nome}" finalizado — tudo conferido`);
  } else {
    await db.$transaction([
      db.inventarioRodada.update({ where: { id: rodadaId }, data: { status: "FECHADA", fechadaEm: new Date() } }),
      db.inventarioRodada.create({ data: { inventarioId: rodada.inventarioId, numero: rodada.numero + 1 } }),
    ]);
    await registrarLog(
      "Inventario",
      rodada.inventarioId,
      "EDITAR",
      `Rodada ${rodada.numero} fechada — ${pendentes.length} item(ns) foram pra recontagem (rodada ${rodada.numero + 1})`
    );
  }

  revalidatePath(`/inventarios/${rodada.inventarioId}`);
  revalidatePath("/contagem");
}
