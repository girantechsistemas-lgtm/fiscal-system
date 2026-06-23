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
          <main className="flex-1 ml-56 p-8 bg-[#f8fafc]">
            <div className="max-w-6xl mx-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5">
        <h1 className="text-lg font-bold text-blue-600">FiscalZim</h1>
      </div>

      <nav className="flex-1 px-3 py-2">
        <NavItem href="/" label="Dashboard" active />
        <NavItem href="/importar" label="Importar XML" />
        <NavItem href="/analise-ncm" label="Analise NCM" />
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
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
        active
          ? "text-blue-600 bg-blue-50 border-l-2 border-blue-600 -ml-0.5"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      <span>{label}</span>
      <svg
        className={`w-4 h-4 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 ${
          active ? "text-blue-600" : "text-gray-400"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
