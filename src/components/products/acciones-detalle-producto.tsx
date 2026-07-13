"use client";

import { useState } from "react";
import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types/producto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/tienda-carrito";
import { useWishlistStore } from "@/store/tienda-lista-deseos";
import { formatCurrency } from "@/lib/utilidades";
import { useWishlistHydrated } from "@/hooks/use-lista-deseos-hidratada";

interface ProductDetailActionsProps {
  product: Product;
}

// Controla cantidad y agregado al carrito desde la pagina de detalle.
export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? "");
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId);
  const currentPrice = selectedVariant?.price ?? product.price;
  const currentStock = selectedVariant?.stock ?? product.stock;
  const [quantity, setQuantity] = useState(currentStock > 0 ? 1 : 0);
  const addItem = useCartStore((state) => state.addItem);
  const wishlistedProductIds = useWishlistStore((state) => state.productIds);
  const toggleWishlist = useWishlistStore((state) => state.toggleProduct);
  const wishlistHydrated = useWishlistHydrated();
  const isWishlisted = wishlistHydrated && wishlistedProductIds.includes(product.id);
  const outOfStock = currentStock === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-4xl font-black text-dark-blue">{formatCurrency(currentPrice)}</p>
        <Badge variant={outOfStock ? "destructive" : "success"}>
          {outOfStock ? "Agotado" : `${currentStock} disponibles`}
        </Badge>
      </div>

      {product.variants.length ? (
        <div className="rounded-lg border border-border bg-secondary/25 p-4">
          <label htmlFor="product-option" className="text-sm font-bold text-dark-blue">
            Selecciona una opción
          </label>
          <select
            id="product-option"
            value={selectedVariantId}
            onChange={(event) => {
              const nextVariant = product.variants.find(
                (variant) => variant.id === event.target.value,
              );
              setSelectedVariantId(event.target.value);
              setQuantity(nextVariant && nextVariant.stock > 0 ? 1 : 0);
            }}
            className="mt-2 h-11 w-full rounded-md border border-input bg-white px-3 text-sm font-semibold text-dark-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {product.variants.map((variant) => (
              <option key={variant.id} value={variant.id} disabled={variant.stock === 0}>
                {variant.name} · {formatCurrency(variant.price)}
                {variant.stock === 0 ? " · Agotado" : ""}
              </option>
            ))}
          </select>
          {selectedVariant?.description ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {selectedVariant.description}
            </p>
          ) : null}
          {selectedVariant?.sku ? (
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              SKU de la opción: {selectedVariant.sku}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-dark-blue">Cantidad</span>
        <div className="flex h-11 items-center rounded-md border border-border bg-white">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={quantity <= 1}
            onClick={() => setQuantity((current) => Math.max(current - 1, 1))}
            aria-label="Disminuir cantidad"
          >
            <Minus aria-hidden="true" />
          </Button>
          <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={quantity >= currentStock}
            onClick={() =>
              setQuantity((current) => Math.min(current + 1, currentStock))
            }
            aria-label="Aumentar cantidad"
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Button
          size="lg"
          className="w-full"
          disabled={outOfStock}
          onClick={() => {
            addItem(product, quantity, selectedVariant);
            toast.success(`${quantity} producto(s) agregado(s) al carrito`);
          }}
        >
          <ShoppingCart aria-hidden="true" />
          Agregar al carrito
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={!wishlistHydrated}
          onClick={() => {
            toggleWishlist(product.id);
            toast.success(
              isWishlisted ? "Producto eliminado de tu lista de deseos" : "Producto agregado a tu lista de deseos",
            );
          }}
          aria-label={isWishlisted ? "Quitar de lista de deseos" : "Agregar a lista de deseos"}
          aria-pressed={isWishlisted}
          className={isWishlisted ? "border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600" : ""}
        >
          <Heart className={isWishlisted ? "fill-current" : ""} aria-hidden="true" />
          <span className="sm:sr-only">{isWishlisted ? "Quitar de deseos" : "Guardar en deseos"}</span>
        </Button>
      </div>
    </div>
  );
}
