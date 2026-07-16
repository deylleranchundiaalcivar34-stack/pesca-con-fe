"use client";

import Link from "next/link";
import { ArrowRight, Boxes, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/producto";
import type { Order } from "@/types/pedido";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/insignia-estado";
import { formatCurrency, formatDate } from "@/lib/utilidades";

interface AdminOperationalSummaryProps {
  orders: Order[];
  lowStockProducts: Product[];
}

// Mantiene el dashboard corto; el detalle completo se consulta en hojas superpuestas.
export function AdminOperationalSummary({
  orders,
  lowStockProducts,
}: AdminOperationalSummaryProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
      <RecentOrdersCard orders={orders} />
      <LowStockCard products={lowStockProducts} />
    </div>
  );
}

function RecentOrdersCard({ orders }: { orders: Order[] }) {
  const preview = orders.slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Pedidos recientes</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Últimos movimientos de la tienda.</p>
        </div>
        <OrdersSheet orders={orders} />
      </CardHeader>
      <CardContent className="space-y-3">
        {preview.length ? preview.map((order) => (
          <div key={order.id} className="rounded-lg border border-border bg-secondary/45 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-dark-blue">{order.code}</p>
                <p className="truncate text-sm text-muted-foreground">{order.customer.fullName}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{formatDate(order.createdAt)}</span>
              <span className="font-bold text-dark-blue">{formatCurrency(order.total)}</span>
            </div>
          </div>
        )) : <EmptyState text="Aún no hay pedidos registrados." />}
      </CardContent>
    </Card>
  );
}

function LowStockCard({ products }: { products: Product[] }) {
  const preview = products.slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Productos con bajo stock</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Hasta 4 unidades disponibles.</p>
        </div>
        <LowStockSheet products={products} />
      </CardHeader>
      <CardContent className="space-y-3">
        {preview.length ? preview.map((product) => (
          <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary p-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-dark-blue">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.category}</p>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white font-black text-primary shadow-sm">{product.stock}</span>
          </div>
        )) : <EmptyState text="No hay productos con bajo stock." />}
      </CardContent>
    </Card>
  );
}

function OrdersSheet({ orders }: { orders: Order[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Ver todos <ArrowRight aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-xl sm:p-6">
        <SheetHeader className="pr-9">
          <SheetTitle className="flex items-center gap-2"><ShoppingBag className="size-5 text-primary" />Pedidos recientes</SheetTitle>
          <SheetDescription>{orders.length} pedido(s) registrados. Esta vista no te saca del dashboard.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 grid gap-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-dark-blue">{order.code}</p><p className="text-sm text-muted-foreground">{order.customer.fullName}</p></div><StatusBadge status={order.status} /></div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm"><span className="text-muted-foreground">{formatDate(order.createdAt)}</span><span className="text-right font-bold text-dark-blue">{formatCurrency(order.total)}</span></div>
            </div>
          ))}
          {!orders.length ? <EmptyState text="Aún no hay pedidos registrados." /> : null}
        </div>
        <Button asChild variant="outline" className="mt-5 w-full"><Link href="/admin/pedidos">Abrir gestión detallada</Link></Button>
      </SheetContent>
    </Sheet>
  );
}

function LowStockSheet({ products }: { products: Product[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Ver todos <ArrowRight aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-xl sm:p-6">
        <SheetHeader className="pr-9">
          <SheetTitle className="flex items-center gap-2"><Boxes className="size-5 text-primary" />Inventario por reponer</SheetTitle>
          <SheetDescription>{products.length} producto(s) con cuatro o menos unidades.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 grid gap-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
              <div className="min-w-0"><p className="truncate font-bold text-dark-blue">{product.name}</p><p className="text-sm text-muted-foreground">{product.category}</p></div>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-black text-primary">{product.stock}</span>
            </div>
          ))}
          {!products.length ? <EmptyState text="No hay productos con bajo stock." /> : null}
        </div>
        <Button asChild variant="outline" className="mt-5 w-full"><Link href="/admin/productos">Abrir gestión de productos</Link></Button>
      </SheetContent>
    </Sheet>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg bg-secondary p-4 text-center text-sm text-muted-foreground">{text}</p>;
}
