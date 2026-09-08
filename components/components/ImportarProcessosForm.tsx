"use client";

import { useActionState } from "react";
import { importarPainelDia } from "@/lib/actions/importar-processos";
import { labelTipoOperacao } from "@/lib/labels";

export function ImportarProcessosForm() {
  const [state, formAction, pending] = useActionState(importarPainelDia, undefined);

  return (
    <div className="max-w-xl space-y-6">
      <form action={formAction} className="border border-ardosia-200 rounded-sm bg-white p-6 space-y-4">
        <div>
          <label className="block text-xs text-ardosia-600 mb-1">Arquivo do Painel do Dia (.xlsx)</label>
          <input
            type="file"
            name="arquivo"
            accept=".xlsx"
            required
            className="w-full text-sm border border-ardosia-200 rounded-sm px-3 py-2 outline-none focus:border-ambar-500 bg-ardosia-50"
          />
        </div>
        <p className="text-xs text-ardosia-500">
          Clientes citados na planilha que ainda não existem no sistema são criados automaticamente.
          Linhas já importadas antes (mesmo cliente + placa + NF + dia) são ignoradas, então pode
          reimportar o mesmo arquivo sem duplicar.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-ardosia-950 hover:bg-ardosia-900 disabled:opacity-60 text-ardosia-50 text-sm rounded-sm py-2 transition-colors"
        >
          {pending ? "Importando..." : "Importar planilha"}
        </button>
      </form>

      {state?.erro && (
        <div className="border border-vermelho-500/40 bg-white rounded-sm p-4 text-sm text-vermelho-500">
          {state.erro}
        </div>
      )}

      {state?.resumo && (
        <div className="border border-ardosia-200 rounded-sm bg-white p-5 space-y-3">
          <h2 className="font-display text-sm font-medium">Resultado da importação</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-ardosia-500">Linhas lidas</p>
              <p className="font-display text-xl">{state.resumo.linhasLidas}</p>
            </div>
            <div>
              <p className="text-xs text-ardosia-500">Processos importados</p>
              <p className="font-display text-xl">{state.resumo.importados}</p>
            </div>
            <div>
              <p className="text-xs text-ardosia-500">Ignoradas (duplicadas/incompletas)</p>
              <p className="font-display text-xl">{state.resumo.ignorados}</p>
            </div>
            <div>
              <p className="text-xs text-ardosia-500">Total de notas</p>
              <p className="font-display text-xl">{state.resumo.totalNotas}</p>
            </div>
          </div>
          {Object.keys(state.resumo.porTipo).length > 0 && (
            <div>
              <p className="text-xs text-ardosia-500 mb-1">Por tipo de operação</p>
              <ul className="text-sm space-y-0.5">
                {Object.entries(state.resumo.porTipo).map(([tipo, qtd]) => (
                  <li key={tipo}>
                    {labelTipoOperacao(tipo)}: <span className="font-mono">{qtd}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {state.resumo.clientesCriados.length > 0 && (
            <div>
              <p className="text-xs text-ardosia-500 mb-1">Clientes criados automaticamente</p>
              <p className="text-sm">{state.resumo.clientesCriados.join(", ")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
