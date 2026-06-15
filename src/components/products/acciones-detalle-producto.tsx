"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types/producto";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/tienda-carrito";

interface ProductDetailActionsProps {
  product: Product;
}

// Controla cantidad y agregado al carrito desde la pagina de detalle.
export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const [quantity, setQuantity] = useState(product.stock > 0 ? 1 : 0);
  const addItem = useCartStore((state) => state.addItem);
  const outOfStock = product.stock === 0;

  return (
    <div className="space-y-4">
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
            disabled={quantity >= product.stock}
            onClick={() =>
              setQuantity((current) => Math.min(current + 1, product.stock))
            }
            aria-label="Aumentar cantidad"
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div>
        <Button
          size="lg"
          className="w-full"
          disabled={outOfStock}
          onClick={() => {
            addItem(product, quantity);
            toast.success(`${quantity} producto(s) agregado(s) al carrito`);
          }}
        >
          <ShoppingCart aria-hidden="true" />
          Agregar al carrito
        </Button>
      </div>
    </div>
  );
}
