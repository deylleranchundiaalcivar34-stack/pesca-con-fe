import { PublicShell } from "@/components/layout/contenedor-publico";
import { SectionHeading } from "@/components/shared/encabezado-seccion";

export default function ProductsLoading() {
  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-dark-blue bg-[linear-gradient(90deg,rgb(5_44_101_/_0.86),rgb(5_44_101_/_0.62),rgb(5_44_101_/_0.28)),url('/images/banners/banner-1.webp')] bg-cover bg-center py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Productos de pesca para cada aventura"
            description="Cargando catalogo..."
            className="[&_h2]:text-white [&_p]:text-white/82"
          />
        </div>
      </section>
      <section className="py-10 sm:py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
          <div className="hidden h-96 animate-pulse rounded-lg border border-border bg-secondary lg:block" />
          <div className="min-w-0 space-y-5">
            <div className="h-24 animate-pulse rounded-lg border border-border bg-secondary" />
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-lg border border-border bg-secondary"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
