"use client";

import { useEffect } from "react";
import { useWishlistStore } from "@/store/tienda-lista-deseos";

// Retira de favoritos los productos del pedido aprobado, sin importar cuántas unidades se compraron.
export function ClearPurchasedWishlist({ productIds }: { productIds: string[] }) {
  const removeProducts = useWishlistStore((state) => state.removeProducts);

  useEffect(() => {
    if (productIds.length) removeProducts(productIds);
  }, [productIds, removeProducts]);

  return null;
}
