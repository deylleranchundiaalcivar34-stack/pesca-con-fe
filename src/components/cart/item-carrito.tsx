"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/store/tienda-carrito";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utilidades";
import { useCartStore } from "@/store/tienda-carrito";
import { getEffectivePrice, hasActiveOffer } from "@/lib/precios-producto";

interface CartLineItemProps {
  item: CartItem;
  compact?: boolean;
}

// Muestra una linea del carrito y permite ajustar cantidad o quitarla.
export function CartLineItem({ item, compact = false }: CartLineItemProps) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const priceSource = item.variant ?? item.product;
  const effectivePrice = getEffectivePrice(priceSource);

  return (
    <div className="grid grid-cols-[80px_1fr] gap-4 rounded-lg border border-border bg-white p-3">
      <div className="relative aspect-square overflow-hidden rounded-md bg-secondary">
        <Image
          src={item.variant?.image ?? item.product.mainImage}
          alt={item.product.imageAlt}
          fill
          priority
          sizes="96px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/producto/${item.product.slug}`}
              className="line-clamp-2 font-semibold text-dark-blue hover:text-primary"
            >
              {item.product.name}
            </Link>
            {item.variant ? (
              <p className="mt-1 text-sm font-semibold text-primary">Opción: {item.variant.name}</p>
            ) : null}
            <p className="mt-1 text-sm text-muted-foreground">
              {hasActiveOffer(priceSource) ? (
                <span className="mr-1 line-through">{formatCurrency(priceSource.price)}</span>
              ) : null}
              {formatCurrency(effectivePrice)} · {item.product.brand}
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => removeItem(item.lineId ?? `${item.product.id}:base`)}
            aria-label={`Eliminar ${item.product.name}`}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex h-9 items-center rounded-md border border-border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9"
              disabled={item.quantity <= 1}
              onClick={() =>
                updateQuantity(item.lineId ?? `${item.product.id}:base`, item.quantity - 1)
              }
              aria-label="Disminuir cantidad"
            >
              <Minus aria-hidden="true" />
            </Button>
            <span className="w-8 text-center text-sm font-semibold">
              {item.quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9"
              disabled={item.quantity >= (item.variant?.stock ?? item.product.stock)}
              onClick={() =>
                updateQuantity(item.lineId ?? `${item.product.id}:base`, item.quantity + 1)
              }
              aria-label="Aumentar cantidad"
            >
              <Plus aria-hidden="true" />
            </Button>
          </div>

          {!compact ? (
            <p className="text-right font-bold text-dark-blue">
              {formatCurrency(effectivePrice * item.quantity)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
