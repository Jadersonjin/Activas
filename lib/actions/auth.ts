"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSessionCookie, clearSessionCookie, getSession } from "@/lib/session";
import { registrarLog } from "@/lib/log";

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

export async function trocarSenha(
  _prevState: { erro?: string; sucesso?: boolean } | undefined,
  formData: FormData
) {
  const session = await getSession();
  if (!session) return { erro: "Sessão expirada, faça login novamente." };

  const senhaAtual = String(formData.get("senhaAtual") || "");
  const novaSenha = String(formData.get("novaSenha") || "");
  const confirmarSenha = String(formData.get("confirmarSenha") || "");

  if (!senhaAtual || !novaSenha || !confirmarSenha) {
    return { erro: "Preencha todos os campos." };
  }
  if (novaSenha.length < 6) {
    return { erro: "A nova senha precisa ter pelo menos 6 caracteres." };
  }
  if (novaSenha !== confirmarSenha) {
    return { erro: "A confirmação não bate com a nova senha." };
  }

  const usuario = await db.usuario.findUnique({ where: { id: session.userId } });
  if (!usuario) return { erro: "Usuário não encontrado." };

  const ok = await bcrypt.compare(senhaAtual, usuario.senhaHash);
  if (!ok) return { erro: "Senha atual incorreta." };

  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await db.usuario.update({ where: { id: usuario.id }, data: { senhaHash } });

  await registrarLog("Usuario", usuario.id, "EDITAR", `${usuario.nome} trocou a própria senha`);

  return { sucesso: true };
}
