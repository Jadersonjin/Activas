"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function criarCliente(formData: FormData) {
  const nome = String(formData.get("nome") || "").trim();
  const cnpj = String(formData.get("cnpj") || "").trim() || null;
  const usaPalletProprio = formData.get("usaPalletProprio") === "on";

  if (!nome) return;

  await db.cliente.create({
    data: { nome, cnpj, usaPalletProprio },
  });

  revalidatePath("/clientes");
}

export async function alternarClienteAtivo(id: string, ativo: boolean) {
  await db.cliente.update({ where: { id }, data: { ativo } });
  revalidatePath("/clientes");
}
