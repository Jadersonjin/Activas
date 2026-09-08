import Image from "next/image";

export function BrasmegLogo({ tema = "escuro" }: { tema?: "escuro" | "claro" }) {
  const corTexto = tema === "escuro" ? "text-ardosia-50" : "text-ardosia-950";
  const corSub = tema === "escuro" ? "text-ardosia-400" : "text-ardosia-500";

  return (
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 shrink-0 rounded-sm bg-white p-1 flex items-center justify-center">
        <Image
          src="/logo-brasmeg.png"
          alt="Brasmeg"
          width={166}
          height={133}
          className="object-contain w-full h-full"
          priority
        />
      </div>
      <div>
        <p className={`font-display text-base font-medium leading-tight tracking-tight ${corTexto}`}>
          Brasmeg
        </p>
        <p className={`text-[11px] leading-tight ${corSub}`}>Transporte e Armazém Geral</p>
      </div>
    </div>
  );
}
