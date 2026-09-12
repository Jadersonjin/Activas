"use client";

import { useState } from "react";
import { ProdutoAutocomplete } from "@/components/ProdutoAutocomplete";

type Cliente = { id: string; nome: string };
type ItemExistente = { codigoProduto: string; descricao: string; quantidade: string; unidade: string };

export function EditarPresencaCargaForm({
  clientes,
  acao,
  clienteId: clienteIdInicial,
  fornecedor,
  numeroNota,
  dataChegada,
  observacao,
  itensIniciais,
}: {
  clientes: Cliente[];
  acao: (formData: FormData) => void;
  clienteId: string;
  fornecedor: string;
  numeroNota: string;
  dataChegada: string;
  observacao: string;
  itensIniciais: ItemExistente[];
}) {
  const [clienteId, setClienteId] = useState(clienteIdInicial);
  const [itens, setItens] = useState<ItemExistente[]>(
    itensIniciais.length > 0 ? itensIniciais : [{ codigoProduto: "", descricao: "", quantidade: "", unidade: "UN" }]
  );

  function adicionarLinha() {
    setItens((prev) => [...prev, { codigoProduto: "", descricao: "", quantidade: "", unidade: "UN" }]);
  }

  function removerLinha(idx: number) {
    setItens((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }

  return (
    <form action={acao} className="max-w-xl border border-ardosia-200 rounded-sm bg-white p-6 space-y-4">
      <div>
        <label className="block text-xs text-ardosia-600 mb-1">Cliente</label>
        <select
          name="clienteId"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          required
          className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
        >
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
            defaultValue={fornecedor}
            required
            className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
          />
        </div>
        <div>
          <label className="block text-xs text-ardosia-600 mb-1">Nº da nota</label>
          <input
            name="numeroNota"
            defaultValue={numeroNota}
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
          defaultValue={dataChegada}
          className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
        />
      </div>

      <div className="border-t border-ardosia-100 pt-3">
        <p className="text-xs font-medium text-ardosia-700 mb-2">Produtos desta nota</p>
        <div className="space-y-3">
          {itens.map((item, idx) => (
            <div key={idx} className="border border-ardosia-100 rounded-sm p-3 space-y-2 relative">
              {itens.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerLinha(idx)}
                  className="absolute top-2 right-2 text-xs text-ardosia-400 hover:text-vermelho-500"
                >
                  remover
                </button>
              )}
              <p className="text-[11px] text-ardosia-400">Produto {idx + 1}</p>
              <ProdutoAutocomplete
                clienteId={clienteId}
                nomeCodigo="itemCodigoProduto"
                nomeDescricao="itemDescricao"
                codigoInicial={item.codigoProduto}
                descricaoInicial={item.descricao}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="itemQuantidade"
                  type="number"
                  step="0.01"
                  placeholder="Quantidade"
                  defaultValue={item.quantidade}
                  required
                  className="w-full border border-ardosia-200 rounded-sm px-3 py-1.5 text-sm outline-none focus:border-ambar-500"
                />
                <input
                  name="itemUnidade"
                  placeholder="Unidade"
                  defaultValue={item.unidade}
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
          defaultValue={observacao}
          className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-ardosia-950 hover:bg-ardosia-900 text-ardosia-50 text-sm rounded-sm py-2 transition-colors"
      >
        Salvar alterações
      </button>
    </form>
  );
}
