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
import { getProductPricingSummary } from "@/lib/precios-producto";
import { getCategories, getHomeProducts } from "@/lib/supabase/data";

const categoryOrder = ["canas", "carretes", "senuelos", "indumentaria"];

// Ordena categorias de inicio en el orden comercial deseado.
function getCategoryPosition(slug: string) {
  const position = categoryOrder.indexOf(slug);
  return position === -1 ? categoryOrder.length : position;
}

// Pagina principal: prioriza ofertas y usa destacados cuando no existen promociones.
export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getHomeProducts(),
  ]);
  const homeCategories = [...categories].sort(
    (first, second) => getCategoryPosition(first.slug) - getCategoryPosition(second.slug),
  );
  const saleProducts = products
    .filter((product) => product.isActive && getProductPricingSummary(product).hasOffer)
    .sort((first, second) => {
      const discountDifference =
        getProductPricingSummary(second).maximumDiscountPercentage -
        getProductPricingSummary(first).maximumDiscountPercentage;

      return discountDifference || first.name.localeCompare(second.name, "es");
    })
    .slice(0, 8);
  const featuredProducts = products
    .filter((product) => product.isFeatured && product.isActive)
    .slice(0, 8);
  const hasSaleProducts = saleProducts.length > 0;
  const homeProducts = hasSaleProducts ? saleProducts : featuredProducts;

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
          <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {homeCategories.map((category, index) => (
              <MotionReveal key={category.slug}>
                <CategoryCard category={category} eager={index === 0} />
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-dark-blue bg-[linear-gradient(rgb(5_44_101_/_0.78),rgb(5_44_101_/_0.78)),url('/images/banners/banner-3.webp')] bg-cover bg-center py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BrandStrip />
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              title={hasSaleProducts ? "Productos en oferta" : "Recomendados para pescadores"}
              description={
                hasSaleProducts
                  ? "Aprovecha precios especiales en productos seleccionados para tu próxima jornada."
                  : "Una selección de productos confiables para quienes buscan buen desempeño en cada salida."
              }
            />
            <Button asChild variant="outline">
              <Link href={hasSaleProducts ? "/productos?oferta=1" : "/productos"}>
                {hasSaleProducts ? "Ver todas las ofertas" : "Ver catálogo"}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <ProductGrid products={homeProducts} variant="home" />
        </div>
      </section>

      <InstagramNewsSection />
      <BenefitsSection />
      <BackToTopButton />
    </PublicShell>
  );
}
