"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/tienda-carrito";

// El carrito PayPhone se limpia únicamente después de la confirmación aprobada.
export function ClearPaidCart() {
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
