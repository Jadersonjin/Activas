import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/lib/actions/auth";
import { BrasmegLogo } from "@/components/BrasmegLogo";
import type { SessionPayload } from "@/lib/session";

const NAV = [
  { href: "/dashboard", label: "Visão geral", cod: "01" },
  { href: "/clientes", label: "Clientes", cod: "02" },
  { href: "/pallets", label: "Saldo de pallets", cod: "03" },
  { href: "/avarias", label: "Avarias", cod: "04" },
  { href: "/presenca-carga", label: "Presença de carga", cod: "05" },
  { href: "/inventarios", label: "Inventários", cod: "06" },
  { href: "/relatorios", label: "Relatórios", cod: "07" },
  { href: "/historico", label: "Histórico", cod: "08" },
];

const NAV_ADMIN = [{ href: "/usuarios", label: "Usuários", cod: "09" }];

export function AppShell({
  session,
  children,
}: {
  session: SessionPayload;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 bg-ardosia-950 text-ardosia-100 flex flex-col">
        <div className="px-6 py-6 border-b border-ardosia-800">
          <BrasmegLogo tema="escuro" />
          <p className="text-xs text-ardosia-400 mt-2">Controle operacional</p>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-6 py-2.5 text-sm text-ardosia-200 hover:bg-ardosia-900 hover:text-ardosia-50 transition-colors"
            >
              <span className="font-mono text-[11px] text-ardosia-600">{item.cod}</span>
              {item.label}
            </Link>
          ))}
          {session.papel === "ADMIN" &&
            NAV_ADMIN.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-6 py-2.5 text-sm text-ardosia-200 hover:bg-ardosia-900 hover:text-ardosia-50 transition-colors"
              >
                <span className="font-mono text-[11px] text-ardosia-600">{item.cod}</span>
                {item.label}
              </Link>
            ))}
        </nav>
        <div className="px-6 py-4 border-t border-ardosia-800">
          <p className="text-sm text-ardosia-100">{session.nome}</p>
          <p className="text-xs text-ardosia-400 mb-3">
            {session.papel === "ADMIN" ? "Administrador" : "Operador"}
          </p>
          <form action={logout}>
            <button className="text-xs text-ardosia-400 hover:text-ambar-500 transition-colors">
              Sair
            </button>
          </form>
          <Link href="/perfil" className="block text-xs text-ardosia-400 hover:text-ambar-500 transition-colors mt-1">
            Meu perfil
          </Link>
        </div>
      </aside>
      <main className="flex-1 bg-ardosia-50">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
