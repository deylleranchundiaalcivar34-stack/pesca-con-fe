"use client";

import { useSyncExternalStore } from "react";
import { useWishlistStore } from "@/store/tienda-lista-deseos";

// Mantiene identico el primer render del servidor y del navegador antes de leer localStorage.
export function useWishlistHydrated() {
  return useSyncExternalStore(
    (callback) => useWishlistStore.persist.onFinishHydration(callback),
    () => useWishlistStore.persist.hasHydrated(),
    () => false,
  );
}
