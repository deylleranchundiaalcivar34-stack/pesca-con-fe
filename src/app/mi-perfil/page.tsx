import { redirect } from "next/navigation";

// Redirige la ruta antigua de perfil hacia Mi cuenta.
export default function MyProfileRedirectPage() {
  redirect("/mi-cuenta?seccion=perfil");
}
