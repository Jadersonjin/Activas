"use client";

import { useState } from "react";
import { registrarPresencaCarga } from "@/lib/actions/presenca-carga";

type Cliente = { id: string; nome: string };

export function PresencaCargaForm({ clientes }: { clientes: Cliente[] }) {
  const [linhas, setLinhas] = useState([0]);

  function adicionarLinha() {
    setLinhas((prev) => [...prev, (prev[prev.length - 1] ?? 0) + 1]);
  }

  function removerLinha(id: number) {
    setLinhas((prev) => (prev.length > 1 ? prev.filter((l) => l !== id) : prev));
  }

  return (
    <form action={registrarPresencaCarga} className="border border-ardosia-200 rounded-sm bg-white p-5 h-fit space-y-4">
      <h2 className="font-display text-sm font-medium">Registrar presença de carga</h2>
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ardosia-600 mb-1">Fornecedor</label>
          <input
            name="fornecedor"
            required
            className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
          />
        </div>
        <div>
          <label className="block text-xs text-ardosia-600 mb-1">Nº da nota</label>
          <input
            name="numeroNota"
            required
            className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-ardosia-600 mb-1">Data de chegada</label>
        <input
          name="dataChegada"
          type="date"
          className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
        />
      </div>

      <div className="border-t border-ardosia-100 pt-3">
        <p className="text-xs font-medium text-ardosia-700 mb-2">Produtos desta nota</p>
        <div className="space-y-3">
          {linhas.map((id, idx) => (
            <div key={id} className="border border-ardosia-100 rounded-sm p-3 space-y-2 relative">
              {linhas.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerLinha(id)}
                  className="absolute top-2 right-2 text-xs text-ardosia-400 hover:text-vermelho-500"
                  aria-label="Remover produto"
                >
                  remover
                </button>
              )}
              <p className="text-[11px] text-ardosia-400">Produto {idx + 1}</p>
              <input
                name="itemCodigoProduto"
                placeholder="Código do produto"
                required
                className="w-full border border-ardosia-200 rounded-sm px-3 py-1.5 text-sm outline-none focus:border-ambar-500"
              />
              <input
                name="itemDescricao"
                placeholder="Descrição"
                required
                className="w-full border border-ardosia-200 rounded-sm px-3 py-1.5 text-sm outline-none focus:border-ambar-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="itemQuantidade"
                  type="number"
                  step="0.01"
                  placeholder="Quantidade"
                  required
                  className="w-full border border-ardosia-200 rounded-sm px-3 py-1.5 text-sm outline-none focus:border-ambar-500"
                />
                <input
                  name="itemUnidade"
                  placeholder="Unidade"
                  defaultValue="UN"
                  className="w-full border border-ardosia-200 rounded-sm px-3 py-1.5 text-sm outline-none focus:border-ambar-500"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={adicionarLinha}
          className="mt-2 text-xs text-ambar-600 hover:text-ambar-500 font-medium"
        >
          + adicionar outro produto
        </button>
      </div>

      <div>
        <label className="block text-xs text-ardosia-600 mb-1">Observação (opcional)</label>
        <input
          name="observacao"
          className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-ardosia-950 hover:bg-ardosia-900 text-ardosia-50 text-sm rounded-sm py-2 transition-colors"
      >
        Registrar presença
      </button>
    </form>
  );
}
