"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function registrarCompraPallet(formData: FormData) {
  const clienteId = String(formData.get("clienteId") || "");
  const quantidade = Number(formData.get("quantidade") || 0);
  const referencia = String(formData.get("referencia") || "").trim() || null;
  const observacao = String(formData.get("observacao") || "").trim() || null;

  if (!clienteId || !quantidade) return;

  await db.movimentoPallet.create({
    data: {
      clienteId,
      tipo: "ENTRADA_COMPRA",
      quantidade,
      referencia,
      observacao,
    },
  });

  revalidatePath("/pallets");
}

export async function registrarAjustePallet(formData: FormData) {
  const clienteId = String(formData.get("clienteId") || "");
  const quantidade = Number(formData.get("quantidade") || 0);
  const observacao = String(formData.get("observacao") || "").trim() || null;

  if (!clienteId || !quantidade) return;

  await db.movimentoPallet.create({
    data: {
      clienteId,
      tipo: "AJUSTE",
      quantidade,
      observacao,
    },
  });

  revalidatePath("/pallets");
}
