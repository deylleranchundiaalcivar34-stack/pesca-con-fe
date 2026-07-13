"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types/producto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utilidades";
import { useCartStore } from "@/store/tienda-carrito";
import { useWishlistStore } from "@/store/tienda-lista-deseos";
import { useWishlistHydrated } from "@/hooks/use-lista-deseos-hidratada";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  compactPrice?: boolean;
}

// Tarjeta de producto para catalogo e inicio con accion de agregar al carrito.
export function ProductCard({
  product,
  priority = false,
  compactPrice = false,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const wishlistedProductIds = useWishlistStore((state) => state.productIds);
  const toggleWishlist = useWishlistStore((state) => state.toggleProduct);
  const wishlistHydrated = useWishlistHydrated();
  const isWishlisted = wishlistHydrated && wishlistedProductIds.includes(product.id);
  const outOfStock = product.stock === 0;

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]">
      <div className="relative">
        <Link
          href={`/producto/${product.slug}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          <Image
            src={product.mainImage}
            alt={product.imageAlt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.isFeatured ? (
            <Badge variant="premium" className="absolute left-3 top-3">
              Destacado
            </Badge>
          ) : null}
          </div>
        </Link>
        <button
          type="button"
          disabled={!wishlistHydrated}
          onClick={() => {
            toggleWishlist(product.id);
            toast.success(
              isWishlisted ? "Producto eliminado de tu lista de deseos" : "Producto agregado a tu lista de deseos",
            );
          }}
          className={`absolute right-3 top-3 flex size-10 items-center justify-center rounded-full border bg-white/95 shadow-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 ${
            isWishlisted
              ? "scale-100 border-red-200 text-red-500 opacity-100"
              : "border-white text-dark-blue hover:scale-110 hover:text-red-500"
          }`}
          aria-label={isWishlisted ? `Quitar ${product.name} de lista de deseos` : `Agregar ${product.name} a lista de deseos`}
          aria-pressed={isWishlisted}
        >
          <Heart className={`size-5 transition-transform duration-300 ${isWishlisted ? "scale-110 fill-current" : ""}`} aria-hidden="true" />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {product.category} · {product.subcategory}
            </p>
            <Link href={`/producto/${product.slug}`} className="mt-1 block">
              <h3 className="line-clamp-2 min-h-11 text-base font-bold leading-snug text-dark-blue hover:text-primary">
                {product.name}
              </h3>
            </Link>
          </div>
          <Badge
            variant={outOfStock ? "destructive" : product.stock <= 3 ? "warning" : "success"}
            className="shrink-0 whitespace-nowrap"
          >
            {outOfStock ? "Agotado" : `${product.stock} disp.`}
          </Badge>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{product.brand}</p>
        <div
          className={
            compactPrice
              ? "mt-4 grid grid-cols-[max-content_minmax(0,1fr)] items-center gap-2"
              : "mt-4 flex items-center justify-between gap-3"
          }
        >
          <p
            className={`min-w-0 whitespace-nowrap font-bold text-dark-blue ${
              compactPrice ? "text-xs sm:text-sm" : "text-lg sm:text-xl"
            }`}
          >
            {formatCurrency(product.price)}
          </p>
          <Button
            size="sm"
            className={`shrink-0 whitespace-nowrap ${
              compactPrice
                ? "justify-self-end gap-1 px-2 text-xs sm:px-2.5"
                : "px-2.5 sm:px-3"
            }`}
            disabled={outOfStock}
            onClick={() => {
              addItem(product, 1);
              toast.success(`${product.name} agregado al carrito`);
            }}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <ShoppingCart aria-hidden="true" />
            Agregar
          </Button>
        </div>
      </div>
    </Card>
  );
}
