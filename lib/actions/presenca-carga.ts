"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function registrarPresencaCarga(formData: FormData) {
  const clienteId = String(formData.get("clienteId") || "");
  const fornecedor = String(formData.get("fornecedor") || "").trim();
  const numeroNota = String(formData.get("numeroNota") || "").trim();
  const codigoProduto = String(formData.get("codigoProduto") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();
  const quantidade = Number(formData.get("quantidade") || 0);
  const unidade = String(formData.get("unidade") || "UN");
  const dataChegadaRaw = String(formData.get("dataChegada") || "");
  const observacao = String(formData.get("observacao") || "").trim() || null;

  if (!clienteId || !fornecedor || !numeroNota || !codigoProduto || !descricao || !quantidade) return;

  await db.presencaCarga.create({
    data: {
      clienteId,
      fornecedor,
      numeroNota,
      codigoProduto,
      descricao,
      quantidade,
      unidade,
      dataChegada: dataChegadaRaw ? new Date(dataChegadaRaw) : new Date(),
      observacao,
    },
  });

  revalidatePath("/presenca-carga");
}
