"use client"; // Garante que este componente seja tratado no cliente
import React from "react";

export default function Page() {
  return (
    <div className="flex items-center justify-center h-screen text-white">
      <h1 className="text-2xl font-bold">✅ O layout está funcionando corretamente!</h1>
      <p className="text-gray-400">Se isso sumir, há um problema no carregamento do Next.js.</p>
    </div>
  );
}
