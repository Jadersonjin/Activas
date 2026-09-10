"use client";

import { useActionState } from "react";
import { criarInventario } from "@/lib/actions/inventarios";

type Cliente = { id: string; nome: string };

export function NovoInventarioForm({ clientes }: { clientes: Cliente[] }) {
  const [state, formAction, pending] = useActionState(criarInventario, undefined);

  return (
    <form action={formAction} className="max-w-lg border border-ardosia-200 rounded-sm bg-white p-6 space-y-4">
      <div>
        <label className="block text-xs text-ardosia-600 mb-1">Nome do inventário</label>
        <input
          name="nome"
          placeholder="Ex: Inventário Setembro/2026"
          required
          className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
        />
      </div>
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
        <label className="block text-xs text-ardosia-600 mb-1">Planilha com o saldo esperado (.xlsx)</label>
        <input
          type="file"
          name="arquivo"
          accept=".xlsx"
          required
          className="w-full text-sm border border-ardosia-200 rounded-sm px-3 py-2 outline-none focus:border-ambar-500 bg-ardosia-50"
        />
        <p className="text-[11px] text-ardosia-500 mt-1">
          A planilha precisa ter as colunas <strong>Descrição</strong>, <strong>Lote</strong> e{" "}
          <strong>Quantidade</strong> (nessa ordem ou não, o sistema encontra pelos nomes).
        </p>
      </div>
      {state?.erro && <p className="text-sm text-vermelho-500">{state.erro}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ardosia-950 hover:bg-ardosia-900 disabled:opacity-60 text-ardosia-50 text-sm rounded-sm py-2 transition-colors"
      >
        {pending ? "Enviando..." : "Criar inventário"}
      </button>
    </form>
  );
}
