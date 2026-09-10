"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { inicioDiaBR } from "@/lib/br-date";
import { registrarLog } from "@/lib/log";

export async function registrarPresencaCarga(formData: FormData) {
  const clienteId = String(formData.get("clienteId") || "");
  const fornecedor = String(formData.get("fornecedor") || "").trim();
  const numeroNota = String(formData.get("numeroNota") || "").trim();
  const dataChegadaRaw = String(formData.get("dataChegada") || "");
  const observacao = String(formData.get("observacao") || "").trim() || null;

  const codigos = formData.getAll("itemCodigoProduto").map((v) => String(v).trim());
  const descricoes = formData.getAll("itemDescricao").map((v) => String(v).trim());
  const quantidades = formData.getAll("itemQuantidade").map((v) => Number(v || 0));
  const unidades = formData.getAll("itemUnidade").map((v) => String(v || "UN").trim() || "UN");

  if (!clienteId || !fornecedor || !numeroNota) return;

  const itens = codigos
    .map((codigoProduto, i) => ({
      codigoProduto,
      descricao: descricoes[i] || "",
      quantidade: quantidades[i] || 0,
      unidade: unidades[i] || "UN",
    }))
    .filter((item) => item.codigoProduto && item.quantidade > 0);

  if (itens.length === 0) return;

  const registro = await db.presencaCarga.create({
    data: {
      clienteId,
      fornecedor,
      numeroNota,
      dataChegada: dataChegadaRaw ? inicioDiaBR(dataChegadaRaw) : new Date(),
      observacao,
      itens: { create: itens },
    },
  });

  await registrarLog(
    "PresencaCarga",
    registro.id,
    "CRIAR",
    `Presença de carga registrada — NF ${numeroNota} (${fornecedor}), ${itens.length} produto(s)`
  );
  revalidatePath("/presenca-carga");
}

export async function atualizarPresencaCarga(id: string, formData: FormData) {
  const clienteId = String(formData.get("clienteId") || "");
  const fornecedor = String(formData.get("fornecedor") || "").trim();
  const numeroNota = String(formData.get("numeroNota") || "").trim();
  const dataChegadaRaw = String(formData.get("dataChegada") || "");
  const observacao = String(formData.get("observacao") || "").trim() || null;

  const codigos = formData.getAll("itemCodigoProduto").map((v) => String(v).trim());
  const descricoes = formData.getAll("itemDescricao").map((v) => String(v).trim());
  const quantidades = formData.getAll("itemQuantidade").map((v) => Number(v || 0));
  const unidades = formData.getAll("itemUnidade").map((v) => String(v || "UN").trim() || "UN");

  if (!clienteId || !fornecedor || !numeroNota) return;

  const itens = codigos
    .map((codigoProduto, i) => ({
      codigoProduto,
      descricao: descricoes[i] || "",
      quantidade: quantidades[i] || 0,
      unidade: unidades[i] || "UN",
    }))
    .filter((item) => item.codigoProduto && item.quantidade > 0);

  if (itens.length === 0) return;

  await db.$transaction([
    db.presencaCargaItem.deleteMany({ where: { presencaCargaId: id } }),
    db.presencaCarga.update({
      where: { id },
      data: {
        clienteId,
        fornecedor,
        numeroNota,
        dataChegada: dataChegadaRaw ? inicioDiaBR(dataChegadaRaw) : undefined,
        observacao,
        itens: { create: itens },
      },
    }),
  ]);

  await registrarLog("PresencaCarga", id, "EDITAR", `Presença de carga editada — NF ${numeroNota}`);
  revalidatePath("/presenca-carga");
  redirect("/presenca-carga");
}

export async function atualizarStatusProcesso(id: string, statusProcesso: "PENDENTE" | "CLASSIFICADO") {
  const registro = await db.presencaCarga.update({
    where: { id },
    data: { statusProcesso },
  });
  await registrarLog(
    "PresencaCarga",
    id,
    "EDITAR",
    `NF ${registro.numeroNota} marcada como ${statusProcesso === "CLASSIFICADO" ? "Classificado" : "Pendente"}`
  );
  revalidatePath("/presenca-carga");
}
