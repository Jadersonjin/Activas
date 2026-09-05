"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function registrarAvaria(formData: FormData) {
  const clienteId = String(formData.get("clienteId") || "");
  const codigoProduto = String(formData.get("codigoProduto") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();
  const lote = String(formData.get("lote") || "").trim() || null;
  const numeroNota = String(formData.get("numeroNota") || "").trim() || null;
  const pesoAvaria = Number(formData.get("pesoAvaria") || 0);
  const localizacao = String(formData.get("localizacao") || "").trim() || null;
  const varredura = formData.get("varredura") === "on";
  const quantidadeVarreduraKgRaw = formData.get("quantidadeVarreduraKg");
  const quantidadeVarreduraKg =
    varredura && quantidadeVarreduraKgRaw ? Number(quantidadeVarreduraKgRaw) : null;
  const observacao = String(formData.get("observacao") || "").trim() || null;

  if (!clienteId || !codigoProduto || !descricao) return;

  await db.avaria.create({
    data: {
      clienteId,
      codigoProduto,
      descricao,
      lote,
      numeroNota,
      pesoAvaria,
      localizacao,
      varredura,
      quantidadeVarreduraKg,
      observacao,
    },
  });

  revalidatePath("/avarias");
}
