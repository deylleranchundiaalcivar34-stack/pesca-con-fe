"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, ProductVariant } from "@/types/producto";
import { calculateShipping } from "@/lib/envio";

export interface CartItem {
  lineId: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  shipping: () => number;
  total: () => number;
  itemCount: () => number;
}

// Guarda el carrito en Zustand y lo persiste en el navegador.
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      // Agrega productos sin permitir cantidades mayores al stock.
      addItem: (product, quantity = 1, variant) => {
        set((state) => {
          const lineId = `${product.id}:${variant?.id ?? "base"}`;
          const availableStock = variant?.stock ?? product.stock;
          const existing = state.items.find(
            (item) => (item.lineId ?? `${item.product.id}:base`) === lineId,
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                (item.lineId ?? `${item.product.id}:base`) === lineId
                  ? {
                      ...item,
                      lineId,
                      quantity: Math.min(item.quantity + quantity, availableStock),
                    }
                  : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { lineId, product, variant, quantity: Math.min(quantity, availableStock) },
            ],
          };
        });
      },
      // Quita un producto completo del carrito.
      removeItem: (lineId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => (item.lineId ?? `${item.product.id}:base`) !== lineId,
          ),
        }));
      },
      // Cambia la cantidad de una linea respetando minimo y stock.
      updateQuantity: (lineId, quantity) => {
        set((state) => ({
          items: state.items
            .map((item) =>
              (item.lineId ?? `${item.product.id}:base`) === lineId
                ? {
                    ...item,
                    quantity: Math.max(
                      1,
                      Math.min(quantity, (item.variant?.stock ?? item.product.stock) || 1),
                    ),
                  }
                : item,
            )
            .filter((item) => item.quantity > 0),
        }));
      },
      // Limpia el carrito despues de una compra o accion manual.
      clearCart: () => set({ items: [] }),
      // Calcula subtotal, envio, total y contador desde el estado actual.
      subtotal: () =>
        get().items.reduce(
          (sum, item) => sum + (item.variant?.price ?? item.product.price) * item.quantity,
          0,
        ),
      shipping: () =>
        calculateShipping(
          get().items.map((item) => ({
            product: item.product,
            quantity: item.quantity,
          })),
        ),
      total: () => get().subtotal() + get().shipping(),
      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "pesca-con-fe-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
