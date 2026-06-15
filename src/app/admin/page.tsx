import Link from "next/link";
import { AlertTriangle, Boxes, DollarSign, PackagePlus, ShoppingBag } from "lucide-react";
import { AdminMetricCard } from "@/components/admin/tarjeta-metrica-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/insignia-estado";
import { getAdminOrders, getAdminProducts } from "@/lib/supabase/data";
import { formatCurrency, formatDate } from "@/lib/utilidades";

// Dashboard admin con metricas, pedidos recientes y bajo stock.
export default async function AdminDashboardPage() {
  const [orders, products] = await Promise.all([getAdminOrders(), getAdminProducts()]);
  const confirmedOrders = orders.filter(
    (order) => order.status === "pagado_confirmado" || order.status === "enviado",
  );
  const pendingOrders = orders.filter((order) => order.status === "pendiente_pago");
  const activeProducts = products.filter((product) => product.isActive);
  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 4,
  );
  const salesTotal = confirmedOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-dark-blue sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Resumen visual de ventas, pedidos pendientes e inventario.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/productos/nuevo">
            <PackagePlus aria-hidden="true" />
            Crear producto
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          title="Ventas del día"
          value={formatCurrency(salesTotal)}
          helper="Total confirmado"
          icon={DollarSign}
        />
        <AdminMetricCard
          title="Pedidos pendientes"
          value={String(pendingOrders.length)}
          helper="Esperan comprobante o confirmación"
          icon={ShoppingBag}
        />
        <AdminMetricCard
          title="Productos activos"
          value={String(activeProducts.length)}
          helper="Visibles en catálogo"
          icon={Boxes}
        />
        <AdminMetricCard
          title="Bajo stock"
          value={String(lowStockProducts.length)}
          helper="Igual o menor a 4 unidades"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:hidden">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-dark-blue">{order.code}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer.fullName}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{formatDate(order.createdAt)}</span>
                    <span className="font-bold text-dark-blue">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
            <Table className="hidden sm:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 5).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-semibold text-dark-blue">{order.code}</TableCell>
                    <TableCell>{order.customer.fullName}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos con bajo stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-md bg-secondary p-3"
              >
                <div>
                  <p className="font-semibold text-dark-blue">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                </div>
                <span className="font-bold text-primary">{product.stock}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
