// src/app/login/page.tsx
"use client"; // Necessário para interatividade (botões, inputs)

import { useState } from "react";
import { useFormStatus } from "react-dom"; // Hook para estado de loading
import { loginAction } from "@/actions/auth";

// Pequeno componente para o botão mostrar "Carregando..."
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition disabled:bg-blue-300"
    >
      {pending ? "Entrando..." : "Acessar Conta"}
    </button>
  );
}

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Wrapper para capturar erros da Server Action
  async function handleSubmit(formData: FormData) {
    const result = await loginAction(formData);

    // Se a action retornar algo, é erro (pois o sucesso faz redirect)
    if (result?.error) {
      setErrorMessage(result.error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Login do Sistema
        </h1>

        {errorMessage && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
            {errorMessage}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="admin@exemplo.com"
              required
              className="mt-1 block w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Dica: use "admin@" para testar acesso total.
            </p>
          </div>
          <div>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="******"
              required
              className="mt-1 block w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <SubmitButton />
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Esqueceu a senha? Contate o suporte.</p>
        </div>
      </div>
    </div>
  );
}
