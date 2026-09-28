"use client";

import { useEffect, useState } from "react";

function formatarDuracao(ms: number) {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000));
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  if (horas > 0) return `${horas}h ${String(minutos).padStart(2, "0")}min`;
  if (minutos > 0) return `${minutos}min ${String(segundos).padStart(2, "0")}s`;
  return `${segundos}s`;
}

export function Cronometro({ inicio, fim, className = "" }: { inicio: string; fim?: string | null; className?: string }) {
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    if (fim) return;
    setAgora(new Date());
    const t = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(t);
  }, [fim]);

  const referencia = fim ? new Date(fim) : agora;
  if (!referencia) return <span className={className}>—</span>;

  const ms = referencia.getTime() - new Date(inicio).getTime();

  return (
    <span className={className}>
      {formatarDuracao(ms)}
      {!fim && <span className="text-ambar-500"> ⏱</span>}
    </span>
  );
}
