"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { registrarLog } from "@/lib/log";

async function exigirAdmin() {
  const session = await getSession();
  if (!session || session.papel !== "ADMIN") {
    throw new Error("Apenas administradores podem gerenciar usuários.");
  }
  return session;
}

export async function criarUsuario(formData: FormData) {
  await exigirAdmin();

  const nome = String(formData.get("nome") || "").trim();
  const login = String(formData.get("login") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");
  const papelRaw = String(formData.get("papel") || "OPERADOR");
  const papel: "ADMIN" | "OPERADOR" | "CONFERENTE" = ["ADMIN", "CONFERENTE"].includes(papelRaw)
    ? (papelRaw as "ADMIN" | "CONFERENTE")
    : "OPERADOR";

  if (!nome || !login || senha.length < 6) return;

  const existente = await db.usuario.findUnique({ where: { login } });
  if (existente) return;

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await db.usuario.create({
    data: { nome, login, senhaHash, papel },
  });

  const labelPapel = papel === "ADMIN" ? "Administrador" : papel === "CONFERENTE" ? "Conferente" : "Operador";
  await registrarLog("Usuario", usuario.id, "CRIAR", `Usuário "${nome}" (login: ${login}) criado como ${labelPapel}`);
  revalidatePath("/usuarios");
}

export async function resetarSenhaUsuario(id: string, formData: FormData) {
  await exigirAdmin();

  const novaSenha = String(formData.get("novaSenha") || "");
  if (novaSenha.length < 6) return;

  const usuario = await db.usuario.findUnique({ where: { id } });
  if (!usuario) return;

  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await db.usuario.update({ where: { id }, data: { senhaHash } });

  await registrarLog("Usuario", id, "RESETAR_SENHA", `Senha de "${usuario.nome}" foi resetada por um administrador`);
  revalidatePath("/usuarios");
}

export async function alternarUsuarioAtivo(id: string, ativo: boolean) {
  await exigirAdmin();
  const usuario = await db.usuario.update({ where: { id }, data: { ativo } });
  await registrarLog("Usuario", id, "EDITAR", `Usuário "${usuario.nome}" marcado como ${ativo ? "ativo" : "inativo"}`);
  revalidatePath("/usuarios");
}
