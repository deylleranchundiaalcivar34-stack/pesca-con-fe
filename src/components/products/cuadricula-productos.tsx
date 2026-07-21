import type { Product } from "@/types/producto";
import { ProductCard } from "./tarjeta-producto";

interface ProductGridProps {
  products: Product[];
  variant?: "default" | "catalog" | "home" | "wishlist";
  compactPrice?: boolean;
}

// Organiza una lista de productos en una cuadricula responsive.
export function ProductGrid({
  products,
  variant = "default",
  compactPrice = false,
}: ProductGridProps) {
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
    <div
      className={
        variant === "catalog"
          ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          : variant === "home"
            ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            : variant === "wishlist"
              ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
              : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      }
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < (variant === "home" ? 4 : 3)}
          compactPrice={compactPrice}
        />
      ))}
    </div>
  );
}
