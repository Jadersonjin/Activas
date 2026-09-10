import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function registrarLog(
  entidade: string,
  entidadeId: string | null,
  acao: "CRIAR" | "EDITAR" | "EXCLUIR" | "RESETAR_SENHA",
  resumo: string
) {
  const session = await getSession();
  await db.logAlteracao.create({
    data: {
      usuarioId: session?.userId,
      usuarioNome: session?.nome || "Sistema",
      entidade,
      entidadeId,
      acao,
      resumo,
    },
  });
}
