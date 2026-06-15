"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CartLineItem } from "./item-carrito";
import { CartSummary } from "./resumen-carrito";
import { useIsClient } from "@/hooks/use-es-cliente";
import { useCartStore } from "@/store/tienda-carrito";

interface CartDrawerProps {
  children: ReactNode;
}

// Abre el carrito como panel lateral desde cualquier boton del sitio.
export function CartDrawer({ children }: CartDrawerProps) {
  const isClient = useIsClient();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Carrito de compras</SheetTitle>
          <SheetDescription>
            Revisa cantidades antes de generar tu pedido.
          </SheetDescription>
        </SheetHeader>

        {!isClient || !items.length ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
            <ShoppingBag className="size-10 text-primary" aria-hidden="true" />
            <p className="mt-4 font-semibold text-dark-blue">Tu carrito está vacío</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Agrega cañas, carretes, señuelos o indumentaria para iniciar.
            </p>
            <Button asChild className="mt-5">
              <Link href="/productos">Ver productos</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-3">
              {items.map((item) => (
                <CartLineItem key={item.product.id} item={item} compact />
              ))}
            </div>
            <div className="mt-5">
              <CartSummary checkoutHref="/carrito" checkoutLabel="Ver carrito" />
            </div>
            <Button
              type="button"
              variant="ghost"
              className="mt-2"
              onClick={clearCart}
            >
              Vaciar carrito
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
