"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { registrarLog } from "@/lib/log";

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

  await registrarLog("MovimentoPallet", clienteId, "CRIAR", `Compra de ${quantidade} pallets registrada`);
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

  await registrarLog("MovimentoPallet", clienteId, "CRIAR", `Ajuste manual de ${quantidade} pallets registrado`);
  revalidatePath("/pallets");
}

export async function registrarUtilizacaoPallet(formData: FormData) {
  const clienteId = String(formData.get("clienteId") || "");
  const quantidade = Number(formData.get("quantidade") || 0);
  const notaSaida = String(formData.get("notaSaida") || "").trim();
  const notaPallet = String(formData.get("notaPallet") || "").trim();
  const observacao = String(formData.get("observacao") || "").trim() || null;

  if (!clienteId || !quantidade) return;

  const partesReferencia = [
    notaSaida ? `NF saída ${notaSaida}` : null,
    notaPallet ? `NF pallet ${notaPallet}` : null,
  ].filter(Boolean);
  const referencia = partesReferencia.length > 0 ? partesReferencia.join(" · ") : null;

  await db.movimentoPallet.create({
    data: {
      clienteId,
      tipo: "SAIDA_CONSUMO",
      quantidade,
      referencia,
      observacao,
    },
  });

  await registrarLog(
    "MovimentoPallet",
    clienteId,
    "CRIAR",
    `Utilização de ${quantidade} pallets registrada${referencia ? ` (${referencia})` : ""}`
  );
  revalidatePath("/pallets");
}
