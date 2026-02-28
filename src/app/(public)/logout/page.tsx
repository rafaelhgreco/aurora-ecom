import { logoutAction } from "@/app/actions/auth";

export default function LogoutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">Fazer Logout?</h1>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded bg-red-500 px-6 py-2 text-white hover:bg-red-600"
          >
            Confirmar Logout
          </button>
        </form>
      </div>
    </div>
  );
}
