"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { registrarLog } from "@/lib/log";

export async function registrarAvaria(formData: FormData) {
  const clienteId = String(formData.get("clienteId") || "");
  const codigoProduto = String(formData.get("codigoProduto") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();
  const lote = String(formData.get("lote") || "").trim() || null;
  const numeroNota = String(formData.get("numeroNota") || "").trim() || null;
  const origem = String(formData.get("origem") || "ORIGEM");
  const pesoAvaria = Number(formData.get("pesoAvaria") || 0);
  const localizacao = String(formData.get("localizacao") || "").trim() || null;
  const varredura = formData.get("varredura") === "on";
  const quantidadeVarreduraKgRaw = formData.get("quantidadeVarreduraKg");
  const quantidadeVarreduraKg =
    varredura && quantidadeVarreduraKgRaw ? Number(quantidadeVarreduraKgRaw) : null;
  const observacao = String(formData.get("observacao") || "").trim() || null;

  if (!clienteId || !codigoProduto || !descricao) return;

  const avaria = await db.avaria.create({
    data: {
      clienteId,
      codigoProduto,
      descricao,
      lote,
      numeroNota,
      origem,
      pesoAvaria,
      localizacao,
      varredura,
      quantidadeVarreduraKg,
      observacao,
    },
  });

  await registrarLog(
    "Avaria",
    avaria.id,
    "CRIAR",
    `Avaria registrada — ${codigoProduto} (${origem === "RADAR" ? "Radar" : "Avaria de origem"})`
  );
  revalidatePath("/avarias");
}

export async function atualizarAvaria(id: string, formData: FormData) {
  const clienteId = String(formData.get("clienteId") || "");
  const codigoProduto = String(formData.get("codigoProduto") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();
  const lote = String(formData.get("lote") || "").trim() || null;
  const numeroNota = String(formData.get("numeroNota") || "").trim() || null;
  const origem = String(formData.get("origem") || "ORIGEM");
  const pesoAvaria = Number(formData.get("pesoAvaria") || 0);
  const localizacao = String(formData.get("localizacao") || "").trim() || null;
  const varredura = formData.get("varredura") === "on";
  const quantidadeVarreduraKgRaw = formData.get("quantidadeVarreduraKg");
  const quantidadeVarreduraKg =
    varredura && quantidadeVarreduraKgRaw ? Number(quantidadeVarreduraKgRaw) : null;
  const observacao = String(formData.get("observacao") || "").trim() || null;

  if (!clienteId || !codigoProduto || !descricao) return;

  await db.avaria.update({
    where: { id },
    data: {
      clienteId,
      codigoProduto,
      descricao,
      lote,
      numeroNota,
      origem,
      pesoAvaria,
      localizacao,
      varredura,
      quantidadeVarreduraKg,
      observacao,
    },
  });

  await registrarLog("Avaria", id, "EDITAR", `Avaria editada — ${codigoProduto}`);
  revalidatePath("/avarias");
  redirect("/avarias");
}
