"use client";

import { useEffect, useRef, useState } from "react";

type ProdutoResultado = { codigo: string; descricao: string };

export function ProdutoAutocomplete({
  clienteId,
  nomeCodigo,
  nomeDescricao,
  codigoInicial = "",
  descricaoInicial = "",
  className = "",
  onCodigoAlterado,
}: {
  clienteId: string;
  nomeCodigo: string;
  nomeDescricao: string;
  codigoInicial?: string;
  descricaoInicial?: string;
  className?: string;
  onCodigoAlterado?: (codigo: string) => void;
}) {
  const [codigo, setCodigo] = useState(codigoInicial);
  const [descricao, setDescricao] = useState(descricaoInicial);
  const [resultados, setResultados] = useState<ProdutoResultado[]>([]);
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clienteId) {
      setResultados([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const resp = await fetch(
          `/api/produtos/buscar?clienteId=${encodeURIComponent(clienteId)}&q=${encodeURIComponent(codigo)}`
        );
        const data = await resp.json();
        setResultados(data.produtos || []);
      } catch {
        // silencioso — autocomplete é só uma ajuda, não trava o preenchimento manual
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [codigo, clienteId]);

  useEffect(() => {
    function fecharSeClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", fecharSeClicarFora);
    return () => document.removeEventListener("mousedown", fecharSeClicarFora);
  }, []);

  function selecionar(p: ProdutoResultado) {
    setCodigo(p.codigo);
    setDescricao(p.descricao);
    setAberto(false);
    onCodigoAlterado?.(p.codigo);
  }

  return (
    <div ref={containerRef} className={`space-y-2 ${className}`}>
      <div className="relative">
        <input
          name={nomeCodigo}
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => onCodigoAlterado?.(codigo)}
          placeholder={clienteId ? "Código do produto (busca)" : "Selecione o cliente primeiro"}
          disabled={!clienteId}
          required
          autoComplete="off"
          className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500 disabled:bg-ardosia-50"
        />
        {aberto && resultados.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto border border-ardosia-200 rounded-sm bg-white shadow-lg">
            {resultados.map((p) => (
              <button
                key={p.codigo}
                type="button"
                onClick={() => selecionar(p)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-ardosia-50 border-b border-ardosia-100 last:border-0"
              >
                <span className="font-mono text-xs text-ardosia-600">{p.codigo}</span>{" "}
                <span className="text-ardosia-800">{p.descricao}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        name={nomeDescricao}
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Descrição"
        required
        className="w-full border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500"
      />
    </div>
  );
}
