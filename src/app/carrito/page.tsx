import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/contenedor-publico";
import { CartPageClient } from "@/components/cart/pagina-carrito-cliente";

export const metadata: Metadata = {
  title: "Carrito",
  description:
    "Revisa tu carrito de Pesca Con Fe, modifica cantidades y genera tu pedido por transferencia bancaria.",
};

// Pagina contenedora del carrito del cliente.
export default function CartPage() {
  return (
    <PublicShell>
      <section className="bg-secondary/60 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CartPageClient />
        </div>
      </section>
    </PublicShell>
  );
}
