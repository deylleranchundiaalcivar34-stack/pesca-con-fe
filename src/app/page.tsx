import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { HeroSection } from "@/components/home/hero-section";
import { CategoryCard } from "@/components/home/category-card";
import { BrandStrip } from "@/components/home/brand-strip";
import { BenefitsSection } from "@/components/home/benefits-section";
import { LocationSection } from "@/components/home/location-section";
import { MotionReveal } from "@/components/shared/motion-reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { BackToTopButton } from "@/components/shared/back-to-top-button";
import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";
import { getCategories, getProducts } from "@/lib/supabase/data";

const categoryOrder = ["canas", "carrete", "senuelos", "indumentaria"];

function getCategoryPosition(slug: string) {
  const position = categoryOrder.indexOf(slug);
  return position === -1 ? categoryOrder.length : position;
}

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

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionReveal>
            <SectionHeading
              title={"Compra seg\u00fan tu estilo de pesca"}
              description={"Encuentra carretes, ca\u00f1as, indumentaria y se\u00f1uelos para r\u00edo, mar y aventura."}
              align="center"
            />
          </MotionReveal>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {homeCategories.map((category) => (
              <MotionReveal key={category.slug}>
                <CategoryCard category={category} />
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BrandStrip />
        </div>
      </section>

      <section className="bg-secondary py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              title={"Equipos listos para tu pr\u00f3xima salida"}
              description="Productos seleccionados por disponibilidad, calidad y utilidad para pescadores de Ecuador."
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

      <BenefitsSection />
      <LocationSection />
      <BackToTopButton />
    </PublicShell>
  );
}
