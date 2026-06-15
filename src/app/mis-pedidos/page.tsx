import { redirect } from "next/navigation";

// Redirige la ruta antigua de pedidos hacia Mi cuenta.
export default function MyOrdersRedirectPage() {
  redirect("/mi-cuenta?seccion=pedidos");
}
