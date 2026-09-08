"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSessionCookie, clearSessionCookie } from "@/lib/session";

export async function login(_prevState: { erro?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");
  const next = String(formData.get("next") || "/dashboard");

  if (!email || !senha) {
    return { erro: "Informe e-mail e senha." };
  }

  const usuario = await db.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo) {
    return { erro: "Usuário não encontrado ou inativo." };
  }

  const ok = await bcrypt.compare(senha, usuario.senhaHash);
  if (!ok) {
    return { erro: "Senha incorreta." };
  }

  await createSessionCookie({
    userId: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
  });

  redirect(next || "/dashboard");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
