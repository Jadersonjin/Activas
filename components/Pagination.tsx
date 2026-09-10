export function Pagination({
  action,
  paginaAtual,
  totalPaginas,
  paramsAtuais,
}: {
  action: string;
  paginaAtual: number;
  totalPaginas: number;
  paramsAtuais: Record<string, string | undefined>;
}) {
  if (totalPaginas <= 1) return null;

  function hrefPagina(pagina: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(paramsAtuais)) {
      if (v) params.set(k, v);
    }
    params.set("pagina", String(pagina));
    return `${action}?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <a
        href={paginaAtual > 1 ? hrefPagina(paginaAtual - 1) : undefined}
        className={
          paginaAtual > 1
            ? "text-ardosia-700 hover:text-ambar-600"
            : "text-ardosia-300 pointer-events-none"
        }
      >
        ← Anterior
      </a>
      <span className="text-ardosia-500 text-xs">
        Página {paginaAtual} de {totalPaginas}
      </span>
      <a
        href={paginaAtual < totalPaginas ? hrefPagina(paginaAtual + 1) : undefined}
        className={
          paginaAtual < totalPaginas
            ? "text-ardosia-700 hover:text-ambar-600"
            : "text-ardosia-300 pointer-events-none"
        }
      >
        Próxima →
      </a>
    </div>
  );
}
