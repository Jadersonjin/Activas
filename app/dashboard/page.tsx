import Link from "next/link";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { fmtDataLonga, hojeBR, inicioDiaBR } from "@/lib/br-date";

export default async function DashboardPage() {
  const session = (await getSession())!;

  const inicioHoje = inicioDiaBR(hojeBR());

  const [avariasHoje, presencasHoje, radarAbertos] = await Promise.all([
    db.avaria.count({ where: { data: { gte: inicioHoje } } }),
    db.presencaCarga.count({ where: { dataChegada: { gte: inicioHoje } } }),
    db.avaria.count({ where: { origem: "RADAR" } }),
  ]);

  const cards = [
    { label: "Avarias hoje", valor: avariasHoje, href: "/avarias" },
    { label: "Presenças de carga hoje", valor: presencasHoje, href: "/presenca-carga" },
    { label: "Itens no Radar", valor: radarAbertos, href: "/avarias/radar" },
  ];

  return (
    <AppShell session={session}>
      <header className="mb-8">
        <p className="font-mono text-xs text-ardosia-600">01 · VISÃO GERAL</p>
        <h1 className="font-display text-2xl font-medium mt-1">
          Olá, {session.nome.split(" ")[0]}
        </h1>
        <p className="text-sm text-ardosia-500 mt-1">
          {fmtDataLonga(new Date())}
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
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

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/presenca-carga"
          className="border border-ardosia-200 bg-white rounded-sm p-5 hover:border-ambar-500 transition-colors"
        >
          <p className="font-display text-sm font-medium mb-1">+ Presença de carga</p>
          <p className="text-xs text-ardosia-500">Formalizar chegada de material</p>
        </Link>
        <Link
          href="/avarias"
          className="border border-ardosia-200 bg-white rounded-sm p-5 hover:border-ambar-500 transition-colors"
        >
          <p className="font-display text-sm font-medium mb-1">+ Registrar avaria</p>
          <p className="text-xs text-ardosia-500">Origem ou Radar</p>
        </Link>
        <Link
          href="/relatorios"
          className="border border-ardosia-200 bg-white rounded-sm p-5 hover:border-ambar-500 transition-colors"
        >
          <p className="font-display text-sm font-medium mb-1">📊 Relatórios</p>
          <p className="text-xs text-ardosia-500">Relatório mensal de presença de carga</p>
        </Link>
      </section>
    </AppShell>
  );
}
