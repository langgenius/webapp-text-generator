import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Menu lateral fixo */}
      <aside className="w-64 bg-gray-800 p-4 hidden md:flex flex-col border-r border-gray-700">
        <h1 className="text-xl font-semibold">Axys</h1>
        <nav className="mt-6 flex-1">
          <ul className="space-y-3">
            <li className="cursor-pointer hover:text-gray-300">Início</li>
            <li className="cursor-pointer hover:text-gray-300">Configurações</li>
            <li className="cursor-pointer hover:text-gray-300">Sobre</li>
          </ul>
        </nav>
      </aside>

      {/* Área do Chat */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-3xl bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-white text-lg mb-4">Testando Layout</h2>
          {children ? children : <p className="text-gray-400">Carregando...</p>}
        </div>
      </main>
    </div>
  );
}
