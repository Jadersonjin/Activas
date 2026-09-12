"use client";

import { useActionState } from "react";
import { importarProdutos } from "@/lib/actions/produtos";

type Cliente = { id: string; nome: string };

export function ImportarProdutosForm({ clientes }: { clientes: Cliente[] }) {
  const [state, formAction, pending] = useActionState(importarProdutos, undefined);

  return (
    <div className="max-w-lg space-y-6">
      <form action={formAction} className="border border-ardosia-200 rounded-sm bg-white p-6 space-y-4">
        <div>
          <label className="block text-xs text-ardosia-600 mb-1">Cliente</label>
          <select
            name="clienteId"
            required
            className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
          >
            <option value="">Selecione...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ardosia-600 mb-1">Planilha (.xlsx)</label>
          <input
            type="file"
            name="arquivo"
            accept=".xlsx"
            required
            className="w-full text-sm border border-ardosia-200 rounded-sm px-3 py-2 outline-none focus:border-ambar-500 bg-ardosia-50"
          />
          <p className="text-[11px] text-ardosia-500 mt-1">
            Colunas esperadas: <strong>Produto</strong> (ou Código) e <strong>Descrição</strong>. Se um
            código já existir, a descrição é atualizada em vez de duplicar.
          </p>
        </div>
        {state?.erro && <p className="text-sm text-vermelho-500">{state.erro}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-ardosia-950 hover:bg-ardosia-900 disabled:opacity-60 text-ardosia-50 text-sm rounded-sm py-2 transition-colors"
        >
          {pending ? "Importando..." : "Importar planilha"}
        </button>
      </form>

      {state?.resumo && (
        <div className="border border-ardosia-200 rounded-sm bg-white p-5">
          <h2 className="font-display text-sm font-medium mb-3">Resultado</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-ardosia-500">Linhas lidas</p>
              <p className="font-display text-xl">{state.resumo.linhasLidas}</p>
            </div>
            <div>
              <p className="text-xs text-ardosia-500">Importados</p>
              <p className="font-display text-xl">{state.resumo.importados}</p>
            </div>
            <div>
              <p className="text-xs text-ardosia-500">Ignorados</p>
              <p className="font-display text-xl">{state.resumo.ignorados}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
