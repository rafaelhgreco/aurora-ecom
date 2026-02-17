export default function HelloWorldPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Hello, World!</h1>
        <p className="text-gray-600 mb-6">
          Bem-vindo à página de exemplo para administradores.
        </p>
        <p className="text-gray-600 mb-6">
          Esta página é protegida e só pode ser acessada por usuários com as
          permissões adequadas.
        </p>
      </div>
    </div>
  );
}
