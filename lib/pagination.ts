export const TAMANHO_PAGINA = 30;

export function paginar(paginaStr: string | undefined, tamanho = TAMANHO_PAGINA) {
  const paginaAtual = Math.max(1, Number(paginaStr) || 1);
  return {
    paginaAtual,
    skip: (paginaAtual - 1) * tamanho,
    take: tamanho,
  };
}

export function totalPaginas(totalRegistros: number, tamanho = TAMANHO_PAGINA) {
  return Math.max(1, Math.ceil(totalRegistros / tamanho));
}
