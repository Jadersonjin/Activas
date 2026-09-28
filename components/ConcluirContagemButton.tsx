"use client";

import { useState, useTransition } from "react";
import { fecharRodada } from "@/lib/actions/inventarios";

export function ConcluirContagemButton({ rodadaId }: { rodadaId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);

  function concluir() {
    startTransition(() => {
      fecharRodada(rodadaId);
    });
  }

  if (confirmando) {
    return (
      <div className="border border-ardosia-300 rounded-sm p-4 bg-white space-y-3">
        <p className="text-sm text-ardosia-700">
          Confirma que terminou de contar tudo que conseguiu nesta rodada? O administrativo vai
          analisar o resultado e liberar uma recontagem se for necessário.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={concluir}
            disabled={pending}
            className="flex-1 bg-ardosia-950 hover:bg-ardosia-900 disabled:opacity-60 text-ardosia-50 text-sm font-medium rounded-sm py-2.5 transition-colors"
          >
            {pending ? "Concluindo..." : "Sim, concluir"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            disabled={pending}
            className="flex-1 border border-ardosia-300 text-ardosia-600 text-sm rounded-sm py-2.5 hover:border-ambar-500 hover:text-ambar-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      className="w-full border border-ardosia-300 text-ardosia-700 text-sm font-medium rounded-sm py-2.5 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white"
    >
      ✓ Concluir contagem
    </button>
  );
}
