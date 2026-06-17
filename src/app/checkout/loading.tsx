import { PublicShell } from "@/components/layout/contenedor-publico";
import { SectionHeading } from "@/components/shared/encabezado-seccion";

export default function CheckoutLoading() {
  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-dark-blue bg-[linear-gradient(90deg,rgb(5_44_101_/_0.86),rgb(5_44_101_/_0.62),rgb(5_44_101_/_0.28)),url('/images/banners/banner-2.webp')] bg-cover bg-center py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Genera tu pedido"
            description="Preparando formulario..."
            className="max-w-5xl [&_h2]:text-white [&_p]:text-white/82"
          />
        </div>
      </section>
      <section className="py-10 sm:py-12">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div className="h-[620px] animate-pulse rounded-lg border border-border bg-secondary" />
          <div className="h-96 animate-pulse rounded-lg border border-border bg-secondary" />
        </div>
      </section>
    </PublicShell>
  );
}
