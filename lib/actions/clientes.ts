"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { registrarLog } from "@/lib/log";

export async function criarCliente(formData: FormData) {
  const nome = String(formData.get("nome") || "").trim();
  const cnpj = String(formData.get("cnpj") || "").trim() || null;
  const usaPalletProprio = formData.get("usaPalletProprio") === "on";

  if (!nome) return;

  const cliente = await db.cliente.create({
    data: { nome, cnpj, usaPalletProprio },
  });

  await registrarLog("Cliente", cliente.id, "CRIAR", `Cliente "${nome}" cadastrado`);
  revalidatePath("/clientes");
}

export async function alternarClienteAtivo(id: string, ativo: boolean) {
  const cliente = await db.cliente.update({ where: { id }, data: { ativo } });
  await registrarLog(
    "Cliente",
    id,
    "EDITAR",
    `Cliente "${cliente.nome}" marcado como ${ativo ? "ativo" : "inativo"}`
  );
  revalidatePath("/clientes");
}

export async function atualizarCliente(id: string, formData: FormData) {
  const nome = String(formData.get("nome") || "").trim();
  const cnpj = String(formData.get("cnpj") || "").trim() || null;
  const usaPalletProprio = formData.get("usaPalletProprio") === "on";
  const ativo = formData.get("ativo") === "on";

  if (!nome) return;

  await db.cliente.update({
    where: { id },
    data: { nome, cnpj, usaPalletProprio, ativo },
  });

  await registrarLog("Cliente", id, "EDITAR", `Cliente "${nome}" editado`);
  revalidatePath("/clientes");
  redirect("/clientes");
}
