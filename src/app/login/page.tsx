import type { Metadata } from "next";
import { Waves } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { LoginPanel } from "@/components/shared/login-panel";

export const metadata: Metadata = {
  title: "Login administrativo",
  description:
    "Pantalla visual de acceso administrativo preparada para Supabase Auth en Pesca Con Fe.",
};

export default function LoginPage() {
  return (
    <PublicShell>
      <section className="bg-secondary py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <div className="flex size-14 items-center justify-center rounded-lg bg-dark-blue text-gold">
              <Waves className="size-7" aria-hidden="true" />
            </div>
            <h1 className="mt-6 text-4xl font-black text-dark-blue">
              Acceso administrativo
            </h1>
            <p className="mt-4 text-muted-foreground">
              Interfaz visual preparada para autenticación real. Por ahora,
              cualquier envío simula el ingreso al panel.
            </p>
          </div>

          <LoginPanel />
        </div>
      </section>
    </PublicShell>
  );
}
