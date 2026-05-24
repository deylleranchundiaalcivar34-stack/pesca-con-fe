"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsClient } from "@/hooks/use-is-client";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

interface CartSummaryProps {
  showCheckoutButton?: boolean;
  checkoutHref?: string;
  checkoutLabel?: string;
}

export function CartSummary({
  showCheckoutButton = true,
  checkoutHref = "/checkout",
  checkoutLabel = "Continuar al checkout",
}: CartSummaryProps) {
  const isClient = useIsClient();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal());
  const itemCount = isClient
    ? items.reduce((totalItems, item) => totalItems + item.quantity, 0)
    : 0;

  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Revision
          </p>
          <h2 className="mt-1 text-2xl font-bold text-dark-blue">Resumen</h2>
        </div>
        <div className="rounded-md bg-secondary px-3 py-2 text-sm font-bold text-dark-blue">
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4 text-lg font-bold text-dark-blue">
          <span>Subtotal</span>
          <span>{formatCurrency(isClient ? subtotal : 0)}</span>
        </div>
      </div>

      {showCheckoutButton ? (
        <Button asChild className="mt-5 w-full" size="lg" disabled={!isClient || !items.length}>
          <Link href={checkoutHref}>
            {checkoutLabel}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      ) : null}

      <p className="mt-3 flex gap-2 text-xs leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        Elige envio por Servientrega o retiro gratis en local durante el checkout.
      </p>
    </div>
  );
}
