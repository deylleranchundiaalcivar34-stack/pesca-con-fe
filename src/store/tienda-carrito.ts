"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/producto";
import { calculateShipping } from "@/lib/envio";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.product.id === product.id,
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? {
                      ...item,
                      quantity: Math.min(item.quantity + quantity, product.stock),
                    }
                  : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { product, quantity: Math.min(quantity, product.stock) },
            ],
          };
        });
      },
      // Quita un producto completo del carrito.
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },
      // Cambia la cantidad de una linea respetando minimo y stock.
      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items
            .map((item) =>
              item.product.id === productId
                ? {
                    ...item,
                    quantity: Math.max(
                      1,
                      Math.min(quantity, item.product.stock || 1),
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
          (sum, item) => sum + item.product.price * item.quantity,
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
