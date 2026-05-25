import { redirect } from "next/navigation";

export default function MyProfileRedirectPage() {
  redirect("/mi-cuenta?seccion=perfil");
}
