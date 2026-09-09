import Link from "next/link";

export default function AcessoNegadoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6"></div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>

        <p className="text-gray-600 mb-6">
          Você não tem permissão para acessar esta página. Entre em contato com
          o administrador se acredita que isso é um erro.
        </p>

        <div className="space-y-3">
          <Link
            href="/admin"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Voltar ao Dashboard
          </Link>

          <Link
            href="/"
            className="block w-full bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition"
          >
            Ir para Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
