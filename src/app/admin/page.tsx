import Link from "next/link";
import { AlertTriangle, Boxes, DollarSign, PackagePlus, ShoppingBag } from "lucide-react";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
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
import { StatusBadge } from "@/components/shared/status-badge";
import { mockOrders } from "@/data/mock-orders";
import { mockProducts } from "@/data/mock-products";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  const confirmedOrders = mockOrders.filter(
    (order) => order.status === "pagado_confirmado" || order.status === "enviado",
  );
  const pendingOrders = mockOrders.filter((order) => order.status === "pendiente_pago");
  const activeProducts = mockProducts.filter((product) => product.isActive);
  const lowStockProducts = mockProducts.filter(
    (product) => product.stock > 0 && product.stock <= 4,
  );
  const salesTotal = confirmedOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-dark-blue">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Resumen visual de ventas, pedidos pendientes e inventario.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/admin/productos/nuevo">
              <PackagePlus aria-hidden="true" />
              Crear producto
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/ventas/nueva">Crear venta manual</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          title="Ventas del día"
          value={formatCurrency(salesTotal)}
          helper="Total confirmado en datos mock"
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
            <Table>
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
                {mockOrders.slice(0, 5).map((order) => (
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
