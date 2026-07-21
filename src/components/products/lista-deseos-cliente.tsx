"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronUp, Heart, LoaderCircle, RotateCcw } from "lucide-react";
import type { Product } from "@/types/producto";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/store/tienda-lista-deseos";
import { useWishlistHydrated } from "@/hooks/use-lista-deseos-hidratada";
import { ProductGrid } from "./cuadricula-productos";

const productsPerPage = 12;

export function WishlistContent() {
  const productIds = useWishlistStore((state) => state.productIds);
  const hydrated = useWishlistHydrated();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedPage, setSelectedPage] = useState(1);

  useEffect(() => {
    if (!hydrated || !productIds.length) return;

    const controller = new AbortController();

    async function loadProducts() {
      setIsLoading(true);
      setLoadError(false);

      try {
        const response = await fetch("/api/productos/favoritos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: productIds }),
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("No se pudieron cargar los favoritos.");

        const payload = (await response.json()) as { products?: Product[] };
        setProducts(payload.products ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(true);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadProducts();
    return () => controller.abort();
  }, [hydrated, productIds, reloadToken]);

  const wishlistedProducts = products.filter((product) => productIds.includes(product.id));
  const totalPages = Math.max(1, Math.ceil(wishlistedProducts.length / productsPerPage));
  const currentPage = Math.min(selectedPage, totalPages);
  const paginatedProducts = wishlistedProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage,
  );

  const changePage = (page: number) => {
    setSelectedPage(Math.min(Math.max(page, 1), totalPages));
    window.requestAnimationFrame(() => {
      document.getElementById("lista-de-deseos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (!hydrated) return <div className="min-h-[45vh]" aria-busy="true" />;

  if (isLoading && productIds.length) {
    return (
      <section className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <LoaderCircle className="size-9 animate-spin text-primary" aria-hidden="true" />
        <p className="mt-4 font-semibold text-dark-blue">Cargando tus favoritos...</p>
      </section>
    );
  }

  if (loadError && productIds.length) {
    return (
      <section className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-black text-dark-blue">No pudimos cargar tu lista</h1>
        <p className="mt-3 text-muted-foreground">Puede ser un problema temporal de conexión.</p>
        <Button className="mt-6" onClick={() => setReloadToken((value) => value + 1)}>
          <RotateCcw aria-hidden="true" />
          Intentar nuevamente
        </Button>
      </section>
    );
  }

  if (!wishlistedProducts.length) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
          <Heart className="size-8" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-black text-dark-blue">Lista de deseos</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Guarda productos con el {"corazón"} para encontrarlos {"rápidamente"}{" "}
          {"aquí"}.
        </p>
        <Button asChild className="mt-7">
          <Link href="/productos">Explorar productos</Link>
        </Button>
      </section>
    );
  }

  return (
    <>
      <nav className="border-b border-border bg-white py-2" aria-label="Navegación de lista de deseos">
        <div className="mx-auto flex max-w-7xl px-4 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm">
            <Link href="/productos">
              <ArrowLeft aria-hidden="true" />
              Volver a productos
            </Link>
          </Button>
        </div>
      </nav>
      <section id="lista-de-deseos" className="mx-auto max-w-7xl scroll-mt-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
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
          <ProductGrid products={paginatedProducts} variant="wishlist" />
        </div>
        {totalPages > 1 ? (
          <nav className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Paginación de lista de deseos">
            <Button type="button" variant="outline" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>
              Anterior
            </Button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <Button key={page} type="button" variant={page === currentPage ? "default" : "outline"} aria-current={page === currentPage ? "page" : undefined} onClick={() => changePage(page)}>
                {page}
              </Button>
            ))}
            <Button type="button" variant="outline" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>
              Siguiente
            </Button>
          </nav>
        ) : null}
        <div className="mt-10 flex justify-center">
          <Button type="button" variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <ChevronUp aria-hidden="true" />
            Volver arriba
          </Button>
        </div>
      </section>
    </>
  );
}
