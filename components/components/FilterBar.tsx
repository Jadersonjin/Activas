export function FilterBar({
  action,
  q,
  de,
  ate,
  placeholder = "Buscar...",
}: {
  action: string;
  q?: string;
  de?: string;
  ate?: string;
  placeholder?: string;
}) {
  const temFiltro = Boolean(q || de || ate);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2 mb-4">
      <div>
        <label className="block text-[11px] text-ardosia-500 mb-1">Buscar</label>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          className="w-full max-w-xs border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500 bg-white"
        />
      </div>
      <div>
        <label className="block text-[11px] text-ardosia-500 mb-1">De</label>
        <input
          type="date"
          name="de"
          defaultValue={de}
          className="border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500 bg-white"
        />
      </div>
      <div>
        <label className="block text-[11px] text-ardosia-500 mb-1">Até</label>
        <input
          type="date"
          name="ate"
          defaultValue={ate}
          className="border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500 bg-white"
        />
      </div>
      <button
        type="submit"
        className="text-sm border border-ardosia-300 rounded-sm px-4 py-2 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white"
      >
        Filtrar
      </button>
      {temFiltro && (
        <a href={action} className="text-sm text-ardosia-500 hover:text-ardosia-700 py-2">
          Limpar
        </a>
      )}
    </form>
  );
}
