import Link from "next/link";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const session = (await getSession())!;

  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);

  const [processosHoje, emAndamento, avariasHoje, presencasHoje] = await Promise.all([
    db.processo.count({ where: { criadoEm: { gte: inicioHoje } } }),
    db.processo.count({ where: { status: "EM_ANDAMENTO" } }),
    db.avaria.count({ where: { data: { gte: inicioHoje } } }),
    db.presencaCarga.count({ where: { dataChegada: { gte: inicioHoje } } }),
  ]);

  const cards = [
    { label: "Processos hoje", valor: processosHoje, href: "/processos" },
    { label: "Em andamento", valor: emAndamento, href: "/processos" },
    { label: "Avarias hoje", valor: avariasHoje, href: "/avarias" },
    { label: "Presenças de carga hoje", valor: presencasHoje, href: "/presenca-carga" },
  ];

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">01 · VISÃO GERAL</p>
        <h1 className="font-display text-2xl font-medium mt-1">
          Olá, {session.nome.split(" ")[0]}
        </h1>
        <p className="text-sm text-ardosia-500 mt-1">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="border border-ardosia-200 bg-white rounded-sm p-5 hover:border-ambar-500 transition-colors"
          >
            <p className="text-xs text-ardosia-500 mb-2">{c.label}</p>
            <p className="font-display text-3xl">{c.valor}</p>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/processos/novo"
          className="border border-ardosia-200 bg-white rounded-sm p-5 hover:border-ambar-500 transition-colors"
        >
          <p className="font-display text-sm font-medium mb-1">+ Novo processo</p>
          <p className="text-xs text-ardosia-500">Registrar chegada de um veículo</p>
        </Link>
        <Link
          href="/presenca-carga"
          className="border border-ardosia-200 bg-white rounded-sm p-5 hover:border-ambar-500 transition-colors"
        >
          <p className="font-display text-sm font-medium mb-1">+ Presença de carga</p>
          <p className="text-xs text-ardosia-500">Formalizar chegada de material</p>
        </Link>
      </section>
    </AppShell>
  );
}
