import { redirect } from "next/navigation";

// Redirige ventas hacia pedidos mientras no hay modulo separado.
export default function AdminSalesRedirectPage() {
  redirect("/admin/pedidos");
}
