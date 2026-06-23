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
        <Sidebar />
        <main className="ml-56 min-h-screen bg-[#f8fafc] p-6">
          {children}
        </main>
      </body>
    </html>
  );
}

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 flex flex-col z-50">
      <div className="px-6 py-5">
        <h1 className="text-lg font-bold text-blue-600">FiscalZim</h1>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        <NavItem href="/" label="Dashboard" />
        <NavItem href="/importar" label="Importar XML" />
        <NavItem href="/analise-ncm" label="Analise NCM" />
        <NavItem href="/analise-tributaria" label="Analise Tributaria" />
        <NavItem href="/produtos" label="Produtos" />
        <NavItem href="/simulador" label="Simulador" />
      </nav>

      <div className="px-6 py-4 border-t border-gray-100">
        <span className="text-xs text-gray-400">v1.0</span>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
    >
      {label}
    </a>
  );
}
