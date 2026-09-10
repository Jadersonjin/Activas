"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { registrarContagem } from "@/lib/actions/inventarios";

type ItemPendente = { id: string; descricao: string; lote: string; quantidadeEsperada: string };

export function ContagemForm({ rodadaId, itens }: { rodadaId: string; itens: ItemPendente[] }) {
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<ItemPendente | null>(null);
  const [state, formAction, pending] = useActionState(registrarContagem, undefined);

  // Depois de salvar com sucesso, volta pra busca pronta pro próximo item
  useEffect(() => {
    if (state?.sucesso) {
      setSelecionado(null);
      setBusca("");
    }
  }, [state]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return itens.slice(0, 30);
    return itens
      .filter((i) => i.descricao.toLowerCase().includes(termo) || i.lote.toLowerCase().includes(termo))
      .slice(0, 30);
  }, [busca, itens]);

  return (
    <div className="space-y-3">
      {state?.sucesso && (
        <div
          className={
            state.bateu
              ? "border border-verde-500/40 bg-verde-500/10 rounded-sm px-4 py-3 text-sm text-verde-500 font-medium"
              : "border border-vermelho-500/40 bg-vermelho-500/10 rounded-sm px-4 py-3 text-sm text-vermelho-500 font-medium"
          }
        >
          {state.bateu ? "✓ Confere — " : "✕ Divergência — "}
          {state.ultimoItem}
        </div>
      )}

      {!selecionado ? (
        <>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por descrição ou lote..."
            className="w-full border border-ardosia-200 rounded-sm px-4 py-3 text-base outline-none focus:border-ambar-500"
          />
          <div className="space-y-1.5">
            {filtrados.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelecionado(item)}
                className="w-full text-left border border-ardosia-200 rounded-sm px-4 py-3 bg-white hover:border-ambar-500 transition-colors"
              >
                <p className="text-sm font-medium text-ardosia-950">{item.descricao}</p>
                <p className="text-xs text-ardosia-500">Lote {item.lote}</p>
              </button>
            ))}
            {filtrados.length === 0 && (
              <p className="text-sm text-ardosia-400 text-center py-6">
                {itens.length === 0 ? "Nenhum item pendente — tudo contado! 🎉" : "Nenhum item encontrado pra essa busca."}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="border border-ambar-500/50 bg-ambar-500/5 rounded-sm px-4 py-3">
            <p className="text-sm font-medium text-ardosia-950">{selecionado.descricao}</p>
            <p className="text-xs text-ardosia-500">Lote {selecionado.lote}</p>
            <button
              type="button"
              onClick={() => setSelecionado(null)}
              className="text-xs text-ardosia-500 hover:text-ambar-600 mt-1"
            >
              ← trocar item
            </button>
          </div>

          <form
            action={(formData) => {
              formData.set("rodadaId", rodadaId);
              formData.set("itemEsperadoId", selecionado.id);
              formAction(formData);
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Quantidade contada</label>
              <input
                name="quantidadeContada"
                type="number"
                step="0.01"
                required
                autoFocus
                className="w-full border border-ardosia-200 rounded-sm px-4 py-3 text-base outline-none focus:border-ambar-500"
              />
            </div>
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Localização (endereço no armazém)</label>
              <input
                name="localizacao"
                required
                className="w-full border border-ardosia-200 rounded-sm px-4 py-3 text-base outline-none focus:border-ambar-500"
              />
            </div>
            {state?.erro && <p className="text-sm text-vermelho-500">{state.erro}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full bg-ardosia-950 hover:bg-ardosia-900 disabled:opacity-60 text-ardosia-50 text-base font-medium rounded-sm py-3 transition-colors"
            >
              {pending ? "Salvando..." : "Confirmar contagem"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
