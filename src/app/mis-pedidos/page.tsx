import { redirect } from "next/navigation";

export default function MyOrdersRedirectPage() {
  redirect("/mi-cuenta?seccion=pedidos");
}
