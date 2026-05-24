import type { Product } from "@/types/product";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-white p-10 text-center">
        <p className="text-lg font-semibold text-dark-blue">
          No encontramos productos con esos filtros.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Prueba cambiando la búsqueda, categoría o rango de precio.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
