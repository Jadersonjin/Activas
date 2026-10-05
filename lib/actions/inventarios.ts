"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { registrarLog } from "@/lib/log";
import { itensNaoResolvidos } from "@/lib/inventario-helpers";

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
  const idxArmazem = cabecalho.get("armazém") || cabecalho.get("armazem");
  const idxPosicao = cabecalho.get("posição") || cabecalho.get("posicao") || cabecalho.get("rua") || cabecalho.get("endereço") || cabecalho.get("endereco");
  const idxCodigo = cabecalho.get("produto") || cabecalho.get("código") || cabecalho.get("codigo");
  const idxDescricao = cabecalho.get("descrição") || cabecalho.get("descricao");
  const idxLote = cabecalho.get("lote");
  const idxQtd = cabecalho.get("quantidade") || cabecalho.get("qtd") || cabecalho.get("saldo");

  if (!idxCodigo || !idxDescricao || !idxLote || !idxQtd) {
    return {
      erro:
        "A planilha precisa ter as colunas: Armazém, Produto, Descrição, Lote e Quantidade (nesses nomes, em qualquer ordem — Armazém e Posição são opcionais).",
    };
  }

  const itens: {
    armazem: string | null;
    posicao: string | null;
    codigoProduto: string;
    descricao: string;
    lote: string;
    quantidadeEsperada: number;
  }[] = [];
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const armazem = idxArmazem ? normalizar(row.getCell(idxArmazem).value) || null : null;
    const posicao = idxPosicao ? normalizar(row.getCell(idxPosicao).value) || null : null;
    const codigoProduto = normalizar(row.getCell(idxCodigo).value);
    const descricao = normalizar(row.getCell(idxDescricao).value);
    const lote = normalizar(row.getCell(idxLote).value);
    const quantidadeEsperada = Number(row.getCell(idxQtd).value) || 0;
    if (!descricao || !lote) continue;
    itens.push({ armazem, posicao, codigoProduto, descricao, lote, quantidadeEsperada });
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
    ultimoItem: `${item.descricao} (lote ${item.lote}${item.posicao ? ` · ${item.posicao}` : ""})`,
  };
}

// Item que o conferente encontrou fisicamente mas que não estava na planilha original
export async function registrarItemAvulso(
  _prevState: { erro?: string; sucesso?: boolean; ultimoItem?: string } | undefined,
  formData: FormData
) {
  const session = await getSession();
  const rodadaId = String(formData.get("rodadaId") || "");
  const inventarioId = String(formData.get("inventarioId") || "");
  const armazem = String(formData.get("armazem") || "").trim() || null;
  const posicao = String(formData.get("posicao") || "").trim() || null;
  const codigoProduto = String(formData.get("codigoProduto") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();
  const lote = String(formData.get("lote") || "").trim();
  const quantidade = Number(formData.get("quantidade") || 0);
  const localizacao = String(formData.get("localizacao") || "").trim() || null;

  if (!rodadaId || !inventarioId) return { erro: "Inventário/rodada inválidos." };
  if (!descricao || !lote || !quantidade) return { erro: "Preencha descrição, lote e quantidade." };
  if (!localizacao) return { erro: "Informe a localização onde encontrou o item." };

  const item = await db.inventarioItemEsperado.create({
    data: {
      inventarioId,
      armazem,
      posicao,
      codigoProduto,
      descricao,
      lote,
      quantidadeEsperada: quantidade,
      avulso: true,
    },
  });

  await db.inventarioContagem.create({
    data: {
      rodadaId,
      itemEsperadoId: item.id,
      quantidadeContada: quantidade,
      localizacao,
      conferenteNome: session?.nome || "Conferente",
      conferenteId: session?.userId,
    },
  });

  await registrarLog(
    "Inventario",
    inventarioId,
    "CRIAR",
    `Item avulso encontrado — ${descricao} (lote ${lote}), não estava na planilha original`
  );

  revalidatePath("/contagem");
  return { sucesso: true, ultimoItem: `${descricao} (lote ${lote}) — item avulso registrado` };
}

export async function fecharRodada(rodadaId: string) {
  const rodada = await db.inventarioRodada.findUniqueOrThrow({
    where: { id: rodadaId },
    include: { inventario: { include: { itens: true } } },
  });
  if (rodada.status !== "ABERTA") return;

  // O saldo é avaliado por lote (soma de todas as posições), não posição a posição
  const pendentes = await itensNaoResolvidos(rodada.inventarioId);

  if (pendentes.length === 0) {
    await db.$transaction([
      db.inventarioRodada.update({ where: { id: rodadaId }, data: { status: "FECHADA", fechadaEm: new Date() } }),
      db.inventario.update({ where: { id: rodada.inventarioId }, data: { status: "FINALIZADO", finalizadoEm: new Date() } }),
    ]);
    await registrarLog("Inventario", rodada.inventarioId, "EDITAR", `Inventário "${rodada.inventario.nome}" finalizado — tudo conferido`);
  } else {
    // A próxima rodada NÃO abre sozinha: o administrativo investiga as divergências
    // e libera a recontagem manualmente (liberarProximaRodada)
    await db.$transaction([
      db.inventarioRodada.update({ where: { id: rodadaId }, data: { status: "FECHADA", fechadaEm: new Date() } }),
      db.inventario.update({ where: { id: rodada.inventarioId }, data: { status: "AGUARDANDO_LIBERACAO" } }),
    ]);
    await registrarLog(
      "Inventario",
      rodada.inventarioId,
      "EDITAR",
      `Rodada ${rodada.numero} concluída — ${pendentes.length} item(ns) divergente(s)/pendente(s) aguardando liberação da recontagem`
    );
  }

  revalidatePath(`/inventarios/${rodada.inventarioId}`);
  revalidatePath("/contagem");
}

export async function liberarProximaRodada(inventarioId: string) {
  const inventario = await db.inventario.findUniqueOrThrow({
    where: { id: inventarioId },
    include: { rodadas: { orderBy: { numero: "desc" }, take: 1 } },
  });
  if (inventario.status !== "AGUARDANDO_LIBERACAO") return;

  const proximoNumero = (inventario.rodadas[0]?.numero || 0) + 1;

  await db.$transaction([
    db.inventarioRodada.create({ data: { inventarioId, numero: proximoNumero } }),
    db.inventario.update({ where: { id: inventarioId }, data: { status: "EM_CONTAGEM" } }),
  ]);

  await registrarLog(
    "Inventario",
    inventarioId,
    "EDITAR",
    `Recontagem liberada manualmente — rodada ${proximoNumero} aberta pro conferente`
  );
  revalidatePath(`/inventarios/${inventarioId}`);
  revalidatePath("/contagem");
}
