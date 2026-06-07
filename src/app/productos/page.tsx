import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { ProductCatalog } from "@/components/products/product-catalog";
import { SectionHeading } from "@/components/shared/section-heading";
import { getBrands, getCategories, getProducts } from "@/lib/supabase/data";

export const metadata: Metadata = {
  title: "Catálogo de productos",
  description:
    "Catálogo de cañas, carretes, señuelos e indumentaria de Pesca Con Fe con filtros por categoría, marca, precio y disponibilidad.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const params = await searchParams;
  const [products, categories, brands] = await Promise.all([
    getProducts(),
    getCategories(),
    getBrands(),
  ]);

  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-dark-blue bg-[linear-gradient(90deg,rgb(5_44_101_/_0.86),rgb(5_44_101_/_0.62),rgb(5_44_101_/_0.28)),url('/images/banners/banner-1.webp')] bg-cover bg-center py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Productos de pesca para cada aventura"
            description="Productos elegidos por su calidad, utilidad y desempeño para quienes viven la pesca con pasión."
            className="[&_h2]:text-white [&_p]:text-white/82"
          />
        </div>
      </section>
      <section className="py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ProductCatalog
            products={products.filter((product) => product.isActive)}
            categories={categories}
            brands={brands.map((brand) => brand.nombre)}
            initialCategory={params.categoria}
          />
        </div>
      </section>
    </PublicShell>
  );
}
