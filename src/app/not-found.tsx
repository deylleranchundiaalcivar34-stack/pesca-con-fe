import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <PublicShell>
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Página no encontrada
          </p>
          <h1 className="mt-3 text-4xl font-black text-dark-blue">
            No encontramos esta ruta
          </h1>
          <p className="mt-4 text-muted-foreground">
            Puede que el producto ya no esté disponible o que el enlace haya cambiado.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/productos">Ver productos</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
