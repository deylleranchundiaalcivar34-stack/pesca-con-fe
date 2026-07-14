"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/types/producto";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/store/tienda-lista-deseos";
import { useWishlistHydrated } from "@/hooks/use-lista-deseos-hidratada";
import { ProductGrid } from "./cuadricula-productos";

export function WishlistContent({ products }: { products: Product[] }) {
  const productIds = useWishlistStore((state) => state.productIds);
  const hydrated = useWishlistHydrated();
  const wishlistedProducts = products.filter((product) => productIds.includes(product.id));

  if (!hydrated) return <div className="min-h-[45vh]" aria-busy="true" />;

  if (!wishlistedProducts.length) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
          <Heart className="size-8" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-black text-dark-blue">Lista de deseos</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Guarda productos con el {"coraz\u00f3n"} para encontrarlos {"r\u00e1pidamente"}{" "}
          {"aqu\u00ed"}.
        </p>
        <Button asChild className="mt-7">
          <Link href="/productos">Explorar productos</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 text-primary">
          <Heart className="size-7 fill-current" aria-hidden="true" />
          <p className="text-sm font-bold uppercase tracking-[0.14em]">Tus favoritos</p>
        </div>
        <h1 className="mt-3 text-3xl font-black text-dark-blue sm:text-4xl">Lista de deseos</h1>
        <p className="mt-3 text-muted-foreground">
          {wishlistedProducts.length} producto{wishlistedProducts.length === 1 ? "" : "s"} guardado{wishlistedProducts.length === 1 ? "" : "s"}.
        </p>
      </div>
      <div className="mt-8">
        <ProductGrid products={wishlistedProducts} />
      </div>
    </section>
  );
}
