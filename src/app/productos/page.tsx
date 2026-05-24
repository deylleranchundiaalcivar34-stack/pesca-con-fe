import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { ProductCatalog } from "@/components/products/product-catalog";
import { SectionHeading } from "@/components/shared/section-heading";
import { mockProducts } from "@/data/mock-products";

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

  return (
    <PublicShell>
      <section className="bg-secondary py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Catálogo"
            title="Productos de pesca para cada aventura"
            description="Busca, filtra y agrega al carrito. Compra fácil, paga por transferencia y confirma por WhatsApp."
          />
        </div>
      </section>
      <section className="py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ProductCatalog
            products={mockProducts.filter((product) => product.isActive)}
            initialCategory={params.categoria}
          />
        </div>
      </section>
    </PublicShell>
  );
}
