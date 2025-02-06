import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Menu lateral - Caso queira expandir no futuro */}
      <aside className="w-64 bg-gray-800 p-4 hidden md:block border-r border-gray-700">
        <h1 className="text-xl font-semibold">Axys</h1>
        <nav className="mt-6">
          <ul className="space-y-3">
            <li className="cursor-pointer hover:text-gray-300">Início</li>
            <li className="cursor-pointer hover:text-gray-300">Configurações</li>
            <li className="cursor-pointer hover:text-gray-300">Sobre</li>
          </ul>
        </nav>
      </aside>

      {/* Conteúdo principal (Chat) */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-3xl bg-gray-800 p-6 rounded-lg shadow-lg">
          {children}
        </div>
      </main>
    </div>
  );
}
