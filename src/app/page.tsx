import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { HeroSection } from "@/components/home/seccion-principal";
import { CategoryCard } from "@/components/home/tarjeta-categoria";
import { BrandStrip } from "@/components/home/franja-marcas";
import { BenefitsSection } from "@/components/home/seccion-beneficios";
import { InstagramNewsSection } from "@/components/home/seccion-noticias-instagram";
import { MotionReveal } from "@/components/shared/revelar-con-movimiento";
import { SectionHeading } from "@/components/shared/encabezado-seccion";
import { BackToTopButton } from "@/components/shared/boton-volver-arriba";
import { ProductGrid } from "@/components/products/cuadricula-productos";
import { Button } from "@/components/ui/button";
import { getCategories, getProducts } from "@/lib/supabase/data";

const categoryOrder = ["canas", "carrete", "senuelos", "indumentaria"];

// Ordena categorias de inicio en el orden comercial deseado.
function getCategoryPosition(slug: string) {
  const position = categoryOrder.indexOf(slug);
  return position === -1 ? categoryOrder.length : position;
}

// Pagina principal: carga categorias y productos destacados.
export default async function HomePage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const homeCategories = [...categories].sort(
    (first, second) => getCategoryPosition(first.slug) - getCategoryPosition(second.slug),
  );
  const featuredProducts = products
    .filter((product) => product.isFeatured && product.isActive)
    .slice(0, 6);

  return (
    <PublicShell>
      <HeroSection />

      <section className="bg-white py-10 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionReveal>
            <SectionHeading
              title="Equípate para cada jornada"
              description="Todo lo que necesitas para pescar con más confianza, comodidad y preparación."
              align="center"
            />
          </MotionReveal>
          <div className="mt-8 grid gap-5 sm:mt-10 sm:gap-6 lg:grid-cols-2">
            {homeCategories.map((category) => (
              <MotionReveal key={category.slug}>
                <CategoryCard category={category} />
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BrandStrip />
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              title="Recomendados para pescadores"
              description="Una selección de productos confiables para quienes buscan buen desempeño en cada salida."
            />
            <Button asChild variant="outline">
              <Link href="/productos">
                Ver catálogo
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <ProductGrid products={featuredProducts} />
        </div>
      </section>

      <InstagramNewsSection />
      <BenefitsSection />
      <BackToTopButton />
    </PublicShell>
  );
}
