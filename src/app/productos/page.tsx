import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { ProductCatalog } from "@/components/products/catalogo-productos";
import { SectionHeading } from "@/components/shared/encabezado-seccion";
import {
  getBrands,
  getCatalogAttributes,
  getCatalogNavigation,
  getCategories,
  getProducts,
} from "@/lib/supabase/data";

export const metadata: Metadata = {
  title: "Catálogo de productos",
  description:
    "Catálogo de cañas, carretes, señuelos e indumentaria de Pesca Con Fe con filtros por categoría, marca, precio y disponibilidad.",
};

function CatalogLoadingFallback() {
  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <div className="hidden h-96 rounded-lg border border-border bg-white shadow-sm lg:block" />
      <div className="min-w-0 space-y-5">
        <div className="h-24 rounded-lg border border-border bg-white shadow-sm" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-80 rounded-lg border border-border bg-white shadow-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Pagina de catalogo con filtros iniciales desde la URL.
export default async function ProductsPage() {
  const [products, categories, brands, catalogAttributes, catalogNodes] =
    await Promise.all([
      getProducts(),
      getCategories(),
      getBrands(),
      getCatalogAttributes(),
      getCatalogNavigation(),
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
          <Suspense fallback={<CatalogLoadingFallback />}>
            <ProductCatalog
              products={products.filter((product) => product.isActive)}
              categories={categories}
              brands={brands.map((brand) => brand.nombre)}
              catalogAttributes={catalogAttributes}
              catalogNodes={catalogNodes}
            />
          </Suspense>
        </div>
      </section>
    </PublicShell>
  );
}
