import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { PasswordRecoveryRequestForm } from "@/components/shared/formulario-recuperar-contrasena";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Solicita un enlace para recuperar el acceso a tu cuenta de Pesca Con Fe.",
};

export default function PasswordRecoveryPage() {
  return (
    <PublicShell>
      <section className="bg-secondary py-12 sm:py-16">
        <div className="mx-auto flex max-w-6xl justify-center px-4 sm:px-6 lg:px-8">
          <PasswordRecoveryRequestForm />
        </div>
      </section>
    </PublicShell>
  );
}
