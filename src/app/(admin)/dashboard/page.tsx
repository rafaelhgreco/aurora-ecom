import { logoutAction } from "@/actions/auth";

export default function DashboardPage() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Bem-vindo ao Dashboard!</h1>
      <p className="mt-4">
        Se você está vendo isso, o Middleware deixou você passar.
      </p>

      <form action={logoutAction} className="mt-8">
        <button type="submit">Sair do Sistema</button>
      </form>
    </div>
  );
}
