import { redirect } from "next/navigation";

// Redirige ventas manuales hacia la gestion de pedidos.
export default function NewManualSalePage() {
  redirect("/admin/pedidos");
}
