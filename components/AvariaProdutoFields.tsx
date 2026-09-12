"use client";

import { useState } from "react";
import { ProdutoAutocomplete } from "@/components/ProdutoAutocomplete";

type Cliente = { id: string; nome: string };

export function AvariaProdutoFields({
  clientes,
  clienteIdInicial = "",
  codigoInicial = "",
  descricaoInicial = "",
}: {
  clientes: Cliente[];
  clienteIdInicial?: string;
  codigoInicial?: string;
  descricaoInicial?: string;
}) {
  const [clienteId, setClienteId] = useState(clienteIdInicial);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-ardosia-600 mb-1">Cliente</label>
        <select
          name="clienteId"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
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

      <ProdutoAutocomplete
        clienteId={clienteId}
        nomeCodigo="codigoProduto"
        nomeDescricao="descricao"
        codigoInicial={codigoInicial}
        descricaoInicial={descricaoInicial}
      />
    </div>
  );
}
