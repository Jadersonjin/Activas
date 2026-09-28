"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { registrarContagem, registrarItemAvulso } from "@/lib/actions/inventarios";

type ItemPendente = {
  id: string;
  descricao: string;
  lote: string;
  quantidadeEsperada: string;
  armazem?: string | null;
  posicao?: string | null;
  codigoProduto?: string | null;
};

export function ContagemForm({
  rodadaId,
  inventarioId,
  itens,
}: {
  rodadaId: string;
  inventarioId: string;
  itens: ItemPendente[];
}) {
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<ItemPendente | null>(null);
  const [modoAvulso, setModoAvulso] = useState(false);
  const [state, formAction, pending] = useActionState(registrarContagem, undefined);
  const [stateAvulso, formActionAvulso, pendingAvulso] = useActionState(registrarItemAvulso, undefined);

  // Depois de salvar com sucesso, volta pra busca pronta pro próximo item
  useEffect(() => {
    if (state?.sucesso) {
      setSelecionado(null);
      setBusca("");
    }
  }, [state]);

  useEffect(() => {
    if (stateAvulso?.sucesso) {
      setModoAvulso(false);
      setBusca("");
    }
  }, [stateAvulso]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return itens.slice(0, 30);
    return itens
      .filter(
        (i) =>
          i.descricao.toLowerCase().includes(termo) ||
          i.lote.toLowerCase().includes(termo) ||
          (i.codigoProduto || "").toLowerCase().includes(termo) ||
          (i.posicao || "").toLowerCase().includes(termo)
      )
      .slice(0, 30);
  }, [busca, itens]);

  const ultimoItemContado = state?.sucesso ? state.ultimoItem : stateAvulso?.sucesso ? stateAvulso.ultimoItem : null;

  return (
    <div className="space-y-3">
      {ultimoItemContado && (
        <div className="border border-ardosia-200 bg-ardosia-50 rounded-sm px-4 py-3 text-sm text-ardosia-700 font-medium">
          ✓ Registrado — {ultimoItemContado}
        </div>
      )}

      {modoAvulso ? (
        <div className="space-y-3">
          <div className="border border-ambar-500/50 bg-ambar-500/5 rounded-sm px-4 py-3">
            <p className="text-sm font-medium text-ardosia-950">Item avulso — não estava na planilha</p>
            <button
              type="button"
              onClick={() => setModoAvulso(false)}
              className="text-xs text-ardosia-500 hover:text-ambar-600 mt-1"
            >
              ← voltar pra busca
            </button>
          </div>
          <form
            action={(formData) => {
              formData.set("rodadaId", rodadaId);
              formData.set("inventarioId", inventarioId);
              formActionAvulso(formData);
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Armazém (opcional)</label>
              <input
                name="armazem"
                className="w-full border border-ardosia-200 rounded-sm px-4 py-3 text-base outline-none focus:border-ambar-500"
              />
            </div>
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Código do produto (opcional)</label>
              <input
                name="codigoProduto"
                className="w-full border border-ardosia-200 rounded-sm px-4 py-3 text-base outline-none focus:border-ambar-500"
              />
            </div>
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Posição/rua (opcional)</label>
              <input
                name="posicao"
                className="w-full border border-ardosia-200 rounded-sm px-4 py-3 text-base outline-none focus:border-ambar-500"
              />
            </div>
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Descrição</label>
              <input
                name="descricao"
                required
                autoFocus
                className="w-full border border-ardosia-200 rounded-sm px-4 py-3 text-base outline-none focus:border-ambar-500"
              />
            </div>
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Lote</label>
              <input
                name="lote"
                required
                className="w-full border border-ardosia-200 rounded-sm px-4 py-3 text-base outline-none focus:border-ambar-500"
              />
            </div>
            <div>
              <label className="block text-xs text-ardosia-600 mb-1">Quantidade encontrada</label>
              <input
                name="quantidade"
                type="number"
                step="0.01"
                required
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
            {stateAvulso?.erro && <p className="text-sm text-vermelho-500">{stateAvulso.erro}</p>}
            <button
              type="submit"
              disabled={pendingAvulso}
              className="w-full bg-ambar-500 hover:bg-ambar-600 disabled:opacity-60 text-ardosia-950 text-base font-medium rounded-sm py-3 transition-colors"
            >
              {pendingAvulso ? "Salvando..." : "Registrar item avulso"}
            </button>
          </form>
        </div>
      ) : !selecionado ? (
        <>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por código, descrição ou lote..."
            className="w-full border border-ardosia-200 rounded-sm px-4 py-3 text-base outline-none focus:border-ambar-500"
          />
          <div className="space-y-1.5">
            {filtrados.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelecionado(item)}
                className="w-full text-left border border-ardosia-200 rounded-sm px-4 py-3 bg-white hover:border-ambar-500 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-ardosia-950">{item.descricao}</p>
                  <p className="text-xs text-ardosia-500">
                    Lote {item.lote}
                    {item.codigoProduto ? ` · Cód. ${item.codigoProduto}` : ""}
                    {item.armazem ? ` · ${item.armazem}` : ""}
                  </p>
                </div>
                {item.posicao && (
                  <span className="shrink-0 text-xs font-bold text-ardosia-950 bg-ambar-500/20 border border-ambar-500/40 px-2 py-1 rounded-sm">
                    {item.posicao}
                  </span>
                )}
              </button>
            ))}
            {filtrados.length === 0 && (
              <p className="text-sm text-ardosia-400 text-center py-6">
                {itens.length === 0 ? "Nenhum item pendente — tudo contado! 🎉" : "Nenhum item encontrado pra essa busca."}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setModoAvulso(true)}
            className="w-full text-center text-sm text-ambar-600 hover:text-ambar-500 font-medium py-2"
          >
            + Não achei na lista — item novo (avulso)
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <div className="border border-ambar-500/50 bg-ambar-500/5 rounded-sm px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ardosia-950">{selecionado.descricao}</p>
              {selecionado.posicao && (
                <span className="shrink-0 text-xs font-bold text-ardosia-950 bg-ambar-500/20 border border-ambar-500/40 px-2 py-1 rounded-sm">
                  {selecionado.posicao}
                </span>
              )}
            </div>
            <p className="text-xs text-ardosia-500">
              Lote {selecionado.lote}
              {selecionado.codigoProduto ? ` · Cód. ${selecionado.codigoProduto}` : ""}
            </p>
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
                defaultValue={selecionado.posicao || ""}
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
