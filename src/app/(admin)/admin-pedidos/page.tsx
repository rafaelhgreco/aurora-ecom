import { redirect } from "next/navigation";

/** Redireciona para admin-produtos com view=pedidos */
export default function AdminPedidosPage() {
  redirect("/admin-produtos?view=pedidos");
}
