"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  productIds: string[];
  toggleProduct: (productId: string) => void;
  removeProducts: (productIds: string[]) => void;
  hasProduct: (productId: string) => boolean;
  itemCount: () => number;
}

// La lista de deseos se conserva en este navegador sin requerir inicio de sesión.
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggleProduct: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
      removeProducts: (productIds) =>
        set((state) => {
          const purchased = new Set(productIds);
          return { productIds: state.productIds.filter((id) => !purchased.has(id)) };
        }),
      hasProduct: (productId) => get().productIds.includes(productId),
      itemCount: () => get().productIds.length,
    }),
    {
      name: "pesca-con-fe-wishlist",
      partialize: (state) => ({ productIds: state.productIds }),
    },
  ),
);
