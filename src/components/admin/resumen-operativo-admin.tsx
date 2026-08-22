import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Product } from "@/types/producto";
import type { Order } from "@/types/pedido";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/insignia-estado";
import { formatCurrency, formatDate } from "@/lib/utilidades";

interface AdminOperationalSummaryProps {
  orders: Order[];
  lowStockProducts: Product[];
}

// Resumen accionable: cada aviso conduce directamente a su gestión detallada.
export function AdminOperationalSummary({
  orders,
  lowStockProducts,
}: AdminOperationalSummaryProps) {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[1.35fr_0.65fr]">
      <RecentOrdersCard orders={orders} />
      <LowStockCard products={lowStockProducts} />
    </div>
  );
}

function RecentOrdersCard({ orders }: { orders: Order[] }) {
  return (
    <Card className="min-w-0">
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-lg">Pedidos recientes</CardTitle>
        <p className="text-xs text-muted-foreground">
          {orders.length} pedido(s) registrado(s) hoy. Selecciona uno para abrir su ficha.
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {orders.length ? (
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={{ pathname: "/admin/pedidos", query: { pedido: order.id } }}
                className="group block rounded-lg border border-border bg-secondary/45 p-2.5 transition hover:border-primary/40 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Abrir la ficha del pedido ${order.code}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold leading-5 text-dark-blue">{order.code}</p>
                    <p className="truncate text-xs text-muted-foreground">{order.customer.fullName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StatusBadge status={order.status} />
                    <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{formatDate(order.createdAt)}</span>
                  <span className="font-bold text-dark-blue">{formatCurrency(order.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState text="No hay pedidos registrados hoy." />
        )}
      </CardContent>
    </Card>
  );
}

function LowStockCard({ products }: { products: Product[] }) {
  return (
    <Card className="min-w-0">
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-lg">Productos con bajo stock</CardTitle>
        <p className="text-xs text-muted-foreground">
          {products.length} producto(s) con 1 o 2 unidades. Selecciona uno para editarlo.
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {products.length ? (
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/admin/productos/${product.id}/editar`}
                className="group flex items-center justify-between gap-3 rounded-lg bg-secondary p-2.5 transition hover:bg-secondary/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Editar ${product.name}, stock ${product.stock}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-5 text-dark-blue">{product.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{product.category}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="flex size-8 items-center justify-center rounded-full bg-white text-sm font-black text-primary shadow-sm">
                    {product.stock}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState text="No hay productos con bajo stock." />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg bg-secondary p-3 text-center text-sm text-muted-foreground">{text}</p>;
}
