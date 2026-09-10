"use client";

import { useTransition } from "react";
import { atualizarStatusProcesso } from "@/lib/actions/presenca-carga";

export function StatusProcessoToggle({
  id,
  status,
}: {
  id: string;
  status: "PENDENTE" | "CLASSIFICADO";
}) {
  const [pending, startTransition] = useTransition();
  const classificado = status === "CLASSIFICADO";

  function alternar() {
    startTransition(() => {
      atualizarStatusProcesso(id, classificado ? "PENDENTE" : "CLASSIFICADO");
    });
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={pending}
      className={
        classificado
          ? "text-xs font-medium text-verde-500 bg-verde-500/10 px-2 py-1 rounded-sm hover:opacity-80 disabled:opacity-50"
          : "text-xs font-medium text-vermelho-500 bg-vermelho-500/10 px-2 py-1 rounded-sm hover:opacity-80 disabled:opacity-50"
      }
      title="Clique pra alternar"
    >
      {classificado ? "✓ Classificado" : "⏳ Pendente"}
    </button>
  );
}
