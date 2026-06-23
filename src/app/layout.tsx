import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FiscalZim - Planejamento Tributário",
  description: "Sistema inteligente para redução legal de impostos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-[var(--border)] flex flex-col">
      <div className="p-6 border-b border-[var(--border)]">
        <h1 className="text-xl font-bold text-[var(--primary)]">
          FiscalZim
        </h1>
        <p className="text-xs text-[var(--muted)] mt-1">Planejamento Tributário</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        <NavItem href="/" icon="📊" label="Dashboard" />
        <NavItem href="/importar" icon="📤" label="Importar XML" />
        <NavItem href="/analise-ncm" icon="🔍" label="Analise NCM" />
        <NavItem href="/produtos" icon="📦" label="Produtos" />
        <NavItem href="/simulador" icon="🧮" label="Simulador" />
        <NavItem href="/relatorios" icon="📈" label="Relatorios" />
      </nav>
      <div className="p-4 border-t border-[var(--border)]">
        <div className="text-xs text-[var(--muted)]">
          Plano: <span className="font-semibold text-[var(--primary)]">Starter</span>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 text-sm transition-colors"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </a>
  );
}
