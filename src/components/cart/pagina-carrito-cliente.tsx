"use client";

import Link from "next/link";
import { ArrowRight, PackageCheck, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsClient } from "@/hooks/use-es-cliente";
import { CartLineItem } from "./item-carrito";
import { CartSummary } from "./resumen-carrito";
import { useCartStore } from "@/store/tienda-carrito";

// Renderiza el carrito en cliente para evitar diferencias por localStorage.
export function CartPageClient() {
  const isClient = useIsClient();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  if (!isClient) {
    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Skeleton className="h-12 w-72" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-dashed border-primary/30 bg-white p-10 text-center shadow-soft">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary">
          <ShoppingCart className="size-8 text-primary" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-bold text-dark-blue">Tu carrito está vacío</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Explora el catálogo y agrega productos para preparar tu pedido por
          transferencia bancaria.
        </p>
        <Button asChild className="mt-6" size="lg">
          <Link href="/productos">
            Ver productos
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Revisión del pedido
            </p>
            <h1 className="mt-2 text-3xl font-bold text-dark-blue">Tu carrito</h1>
            <p className="mt-2 text-muted-foreground">
              Revisa tus productos, cantidades y costos antes de generar tu pedido.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={clearCart}
            className="self-start sm:self-center"
          >
            <Trash2 aria-hidden="true" />
            Vaciar
          </Button>
        </div>

        <div className="grid gap-4">
          {items.map((item) => (
            <CartLineItem key={item.lineId ?? `${item.product.id}:base`} item={item} />
          ))}
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-lg border border-primary/15 bg-white p-4 text-sm leading-6 text-muted-foreground">
          <PackageCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <p>
            Al generar tu pedido, te guiaremos por WhatsApp para confirmar el pago por
            transferencia y coordinar la entrega.
          </p>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <CartSummary />
      </aside>
    </div>
  );
}
