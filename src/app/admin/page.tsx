import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { AdminOperationalSummary } from "@/components/admin/resumen-operativo-admin";
import { AdminSalesSummary } from "@/components/admin/resumen-ventas-admin";
import { Button } from "@/components/ui/button";
import { getAdminOrders, getAdminProducts } from "@/lib/supabase/data";

// Dashboard operativo: ventas filtrables, pedidos recientes e inventario a vigilar.
export default async function AdminDashboardPage() {
  const [orders, products] = await Promise.all([getAdminOrders(), getAdminProducts()]);
  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 4,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-dark-blue sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Controla ventas, pagos e inventario desde un solo lugar.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/productos/nuevo">
            <PackagePlus aria-hidden="true" />
            Crear producto
          </Link>
        </Button>
      </div>

      <AdminSalesSummary orders={orders} />

      <AdminOperationalSummary orders={orders} lowStockProducts={lowStockProducts} />
    </div>
  );
}
