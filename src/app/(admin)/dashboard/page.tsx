import { redirect } from "next/navigation";

/** Compat: redireciona para o painel principal de produtos */
export default function DashboardPage() {
  redirect("/admin-produtos");
}
