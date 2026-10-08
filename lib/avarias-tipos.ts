// Tipos e funções puras do relatório de avarias (sem acesso a banco — fácil de testar)
export type LinhaAvaria = {
  data: string;
  cliente: string;
  codigoProduto: string;
  descricao: string;
  lote: string;
  numeroNota: string;
  pesoKg: number;
  localizacao: string;
  tipo: string; // "Avaria de origem" | "Radar"
  identificacao: string; // "Varredura · 12,50 kg" | "Apontamento direto"
  situacao: string; // só Radar: "Em aberto" | "Sanada em dd/mm/aaaa"
  observacao: string;
};

export type DadosRelatorioAvarias = {
  linhas: LinhaAvaria[];
  filtros: string[]; // textos descritivos dos filtros aplicados
  geradoEm: string;
  truncado: boolean;
};

export const LIMITE_RELATORIO = 5000;

export function fmtKg(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDataStr(s: string) {
  const [a, m, d] = s.split("-");
  return `${d}/${m}/${a}`;
}

export function resumir(linhas: LinhaAvaria[]) {
  const porCliente = new Map<string, { qtde: number; peso: number }>();
  const porTipo = new Map<string, { qtde: number; peso: number }>();
  let pesoTotal = 0;
  let varreduras = 0;
  for (const l of linhas) {
    pesoTotal += l.pesoKg;
    if (l.identificacao.startsWith("Varredura")) varreduras++;
    for (const [mapa, chave] of [
      [porCliente, l.cliente],
      [porTipo, l.tipo],
    ] as const) {
      const atual = mapa.get(chave) || { qtde: 0, peso: 0 };
      atual.qtde++;
      atual.peso += l.pesoKg;
      mapa.set(chave, atual);
    }
  }
  const ordenar = (m: Map<string, { qtde: number; peso: number }>) =>
    Array.from(m.entries())
      .map(([nome, v]) => ({ nome, qtde: v.qtde, peso: Math.round(v.peso * 100) / 100 }))
      .sort((a, b) => b.peso - a.peso);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return { total: linhas.length, pesoTotal: r2(pesoTotal), varreduras, porCliente: ordenar(porCliente), porTipo: ordenar(porTipo) };
}

export function nomeArquivoAvarias(ext: "xlsx" | "pdf") {
  return `avarias-${new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })}.${ext}`;
}
