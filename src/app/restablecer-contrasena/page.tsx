import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { PasswordResetForm } from "@/components/shared/formulario-restablecer-contrasena";

export const metadata: Metadata = {
  title: "Restablecer contraseña",
  description: "Crea una contraseña nueva para tu cuenta de Pesca Con Fe.",
};

export default function PasswordResetPage() {
  return (
    <PublicShell>
      <section className="bg-secondary py-12 sm:py-16">
        <div className="mx-auto flex max-w-6xl justify-center px-4 sm:px-6 lg:px-8">
          <PasswordResetForm />
        </div>
      </section>
    </PublicShell>
  );
}
