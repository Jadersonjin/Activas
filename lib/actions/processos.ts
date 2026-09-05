"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function criarProcesso(formData: FormData) {
  const session = await getSession();
  const clienteId = String(formData.get("clienteId") || "");
  const placaVeiculo = String(formData.get("placaVeiculo") || "").trim();
  const motorista = String(formData.get("motorista") || "").trim() || null;
  const tipoOperacao = String(formData.get("tipoOperacao") || "");
  const numeroReferencia = String(formData.get("numeroReferencia") || "").trim() || null;

  if (!clienteId || !placaVeiculo || !tipoOperacao) return;

  const processo = await db.processo.create({
    data: {
      clienteId,
      placaVeiculo,
      motorista,
      tipoOperacao,
      numeroReferencia,
      criadoPorId: session?.userId,
    },
  });

  revalidatePath("/processos");
  redirect(`/processos/${processo.id}`);
}

const CAMPOS_HORA = ["horaChegada", "horaLiberacao", "horaInicioOp", "horaFimOp"] as const;
type CampoHora = (typeof CAMPOS_HORA)[number];

export async function registrarHorario(processoId: string, campo: CampoHora) {
  if (!CAMPOS_HORA.includes(campo)) return;
  await db.processo.update({
    where: { id: processoId },
    data: { [campo]: new Date() },
  });
  revalidatePath(`/processos/${processoId}`);
}

export async function finalizarProcesso(processoId: string) {
  await db.processo.update({
    where: { id: processoId },
    data: { status: "FINALIZADO", horaFimOp: new Date() },
  });
  revalidatePath(`/processos/${processoId}`);
  revalidatePath("/processos");
}

export async function adicionarServico(processoId: string, formData: FormData) {
  const tipoServico = String(formData.get("tipoServico") || "");
  const quantidade = Number(formData.get("quantidade") || 0);
  const unidade = String(formData.get("unidade") || "UN");
  const palletProprioCliente = formData.get("palletProprioCliente") === "on";
  const observacao = String(formData.get("observacao") || "").trim() || null;

  if (!tipoServico || !quantidade) return;

  const processo = await db.processo.findUniqueOrThrow({ where: { id: processoId } });

  await db.servicoUtilizado.create({
    data: {
      processoId,
      tipoServico,
      quantidade,
      unidade,
      palletProprioCliente,
      observacao,
    },
  });

  // se for pallet próprio do cliente, abate automaticamente do saldo
  if (tipoServico === "PALLET" && palletProprioCliente) {
    await db.movimentoPallet.create({
      data: {
        clienteId: processo.clienteId,
        tipo: "SAIDA_CONSUMO",
        quantidade,
        referencia: `Processo ${processoId}`,
      },
    });
  }

  revalidatePath(`/processos/${processoId}`);
  revalidatePath("/pallets");
}
