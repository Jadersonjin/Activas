"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

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

  await db.presencaCarga.create({
    data: {
      clienteId,
      fornecedor,
      numeroNota,
      dataChegada: dataChegadaRaw ? new Date(dataChegadaRaw) : new Date(),
      observacao,
      itens: { create: itens },
    },
  });

  revalidatePath("/presenca-carga");
}
