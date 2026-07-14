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
import { getProductPricingSummary } from "@/lib/precios-producto";
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
  const pricing = getProductPricingSummary(product);
  const productSummary =
    product.description.trim() ||
    product.features.filter(Boolean).slice(0, 2).join(" · ") ||
    "Consulta sus características y opciones disponibles.";

  return (
    <Card
      className={`group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] ${
        pricing.hasOffer
          ? "border-red-200 shadow-[0_8px_24px_rgba(220,38,38,0.10)] hover:border-red-400"
          : "hover:border-primary/40"
      }`}
    >
      <div className="relative shrink-0">
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
          {pricing.hasOffer ? (
            <div className="absolute left-0 top-3 z-10 rounded-r-full border border-l-0 border-red-700 bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow-md">
              Oferta {pricing.hasVariants ? "hasta " : ""}-{pricing.maximumDiscountPercentage}%
            </div>
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

      <div className="flex flex-1 flex-col p-4">
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

        <p className="mt-2 min-h-5 text-sm text-muted-foreground">{product.brand}</p>
        <div className="mt-auto flex flex-col gap-3 pt-4">
          <div
            className={`flex min-h-[6.75rem] flex-col justify-end ${
              pricing.hasOffer ? "rounded-lg border border-red-100 bg-red-50 px-3 py-2" : "px-1 py-2"
            }`}
          >
            {pricing.hasOffer ? (
              <p className="text-[11px] font-black uppercase tracking-wide text-red-600">
                Precio especial
              </p>
            ) : null}
            {pricing.hasOffer ? (
              <p className="mt-0.5 text-xs text-muted-foreground line-through">
                {pricing.hasVariants ? "Antes desde " : "Antes "}
                {formatCurrency(pricing.minimumRegularPrice)}
              </p>
            ) : null}
            {!pricing.hasOffer ? (
              <div className="border-l-2 border-primary/20 pl-3">
                <p
                  title={productSummary}
                  className="line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground"
                >
                  {productSummary}
                </p>
              </div>
            ) : null}
            <p
              className={`min-w-0 whitespace-nowrap font-black ${!pricing.hasOffer ? "mt-auto" : ""} ${pricing.hasOffer ? "text-red-600" : "text-dark-blue"} ${
                compactPrice ? "text-base sm:text-lg" : "text-xl sm:text-2xl"
              }`}
            >
              {pricing.hasVariants ? "Desde " : ""}
              {formatCurrency(pricing.minimumEffectivePrice)}
            </p>
            {pricing.hasOffer ? (
              <p className="mt-0.5 text-[11px] font-bold text-red-700">
                {pricing.hasVariants
                  ? `Hasta ${pricing.maximumDiscountPercentage}% menos`
                  : `Ahorras ${formatCurrency(pricing.minimumRegularPrice - pricing.minimumEffectivePrice)}`}
              </p>
            ) : null}
          </div>
          <Button
            asChild={pricing.hasVariants}
            size="sm"
            className="w-full gap-2 font-bold shadow-sm"
            disabled={!pricing.hasVariants && outOfStock}
            onClick={pricing.hasVariants ? undefined : () => {
              addItem(product, 1);
              toast.success(`${product.name} agregado al carrito`);
            }}
            aria-label={pricing.hasVariants ? `Ver opciones de ${product.name}` : `Agregar ${product.name} al carrito`}
          >
            {pricing.hasVariants ? (
              <Link href={`/producto/${product.slug}`}>Ver opciones</Link>
            ) : (
              <>
                <ShoppingCart aria-hidden="true" />
                Agregar
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
