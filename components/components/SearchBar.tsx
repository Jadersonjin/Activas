export function SearchBar({
  action,
  defaultValue,
  placeholder = "Buscar...",
}: {
  action: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <form action={action} className="flex gap-2 mb-4">
      <input
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full max-w-xs border border-ardosia-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-ambar-500 bg-white"
      />
      <button
        type="submit"
        className="text-sm border border-ardosia-300 rounded-sm px-4 py-2 hover:border-ambar-500 hover:text-ambar-600 transition-colors bg-white"
      >
        Buscar
      </button>
      {defaultValue && (
        <a
          href={action}
          className="text-sm text-ardosia-500 hover:text-ardosia-700 self-center"
        >
          Limpar
        </a>
      )}
    </form>
  );
}
